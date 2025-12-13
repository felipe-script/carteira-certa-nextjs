import type {
  AllocationClass,
  ClassContributionResult,
  ClassId,
} from "./types";

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100);
}

function fromCents(cents: number): number {
  return Math.round((cents + Number.EPSILON)) / 100;
}

function safeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function normalizeIdeals(classes: AllocationClass[]) {
  const active = classes.filter((c) => !c.ignore);
  const sumIdeal = active.reduce((sum, c) => sum + Math.max(0, safeNumber(c.idealPct)), 0);

  if (sumIdeal <= 0) {
    return {
      sumIdeal,
      normalizedIdealById: new Map<ClassId, number>(),
    };
  }

  const normalizedIdealById = new Map<ClassId, number>();
  for (const c of active) {
    normalizedIdealById.set(c.id, (Math.max(0, safeNumber(c.idealPct)) / sumIdeal) * 100);
  }

  return { sumIdeal, normalizedIdealById };
}

function allocateCentsByWeights<T extends { id: ClassId; weight: number }>(
  totalCents: number,
  items: T[]
): Map<ClassId, number> {
  const allocation = new Map<ClassId, number>();
  if (totalCents <= 0 || items.length === 0) return allocation;

  const weightSum = items.reduce((sum, i) => sum + Math.max(0, safeNumber(i.weight)), 0);
  if (weightSum <= 0) return allocation;

  const rows = items.map((i) => {
    const w = Math.max(0, safeNumber(i.weight));
    const raw = (totalCents * w) / weightSum;
    const floored = Math.floor(raw);
    return {
      id: i.id,
      raw,
      floored,
      frac: raw - floored,
    };
  });

  const sumFloors = rows.reduce((sum, r) => sum + r.floored, 0);
  let remainder = totalCents - sumFloors;

  // Distribui os centavos restantes para as maiores frações.
  rows.sort((a, b) => b.frac - a.frac);

  for (const r of rows) {
    allocation.set(r.id, r.floored);
  }

  let idx = 0;
  while (remainder > 0 && rows.length > 0) {
    const id = rows[idx % rows.length]!.id;
    allocation.set(id, (allocation.get(id) ?? 0) + 1);
    remainder -= 1;
    idx += 1;
  }

  return allocation;
}

/**
 * Modelo tipo planilha:
 * - Usuário informa total atual ("quanto tenho")
 * - Informa % atual e % ideal por classe
 * - Sistema sugere quanto aportar por classe para aproximar do ideal, sem vendas
 */
export function calculateClassContribution(input: {
  totalHave: number;
  contribution: number;
  classes: AllocationClass[];
}): ClassContributionResult {
  const notes: string[] = [];

  const totalHave = roundMoney(Math.max(0, safeNumber(input.totalHave)));
  const contribution = roundMoney(Math.max(0, safeNumber(input.contribution)));
  const totalAfter = roundMoney(totalHave + contribution);

  const totalHaveCents = toCents(totalHave);
  const contributionCents = toCents(contribution);
  const totalAfterCents = toCents(totalAfter);

  const classes = input.classes
    .map((c) => ({
      ...c,
      name: c.name.trim(),
      idealPct: Math.max(0, safeNumber(c.idealPct)),
      currentPct: Math.max(0, safeNumber(c.currentPct)),
      ignore: Boolean(c.ignore),
    }))
    .filter((c) => c.name.length > 0);

  if (classes.length === 0) {
    return {
      totalHave,
      contribution,
      totalAfter,
      usedTotal: 0,
      recommendations: [],
      notes: ["Adicione ao menos 1 classe de ativo."],
    };
  }

  const active = classes.filter((c) => !c.ignore);
  if (active.length === 0) {
    return {
      totalHave,
      contribution,
      totalAfter,
      usedTotal: 0,
      recommendations: [],
      notes: ["Todas as classes estão marcadas como 'Ignorar'."],
    };
  }

  const sumCurrent = active.reduce((sum, c) => sum + c.currentPct, 0);
  const { sumIdeal, normalizedIdealById } = normalizeIdeals(classes);

  if (sumIdeal !== 100 && sumIdeal > 0) {
    notes.push(`Os % ideais (não ignorados) somam ${roundMoney(sumIdeal)}%. O sistema normaliza para 100%.`);
  }
  if (sumCurrent !== 100 && sumCurrent > 0) {
    notes.push(`Os % atuais (não ignorados) somam ${roundMoney(sumCurrent)}%. Verifique o preenchimento.`);
  }

  const currentAmountById = new Map<ClassId, number>();
  const desiredAmountById = new Map<ClassId, number>();

  // Importante: alocar em centavos garantindo que a soma feche exatamente
  // (evita somas como 1.500,70 ao arredondar linha a linha).
  const currentAllocated = allocateCentsByWeights(
    totalHaveCents,
    active.map((c) => ({ id: c.id, weight: c.currentPct }))
  );
  const desiredAllocated = allocateCentsByWeights(
    totalAfterCents,
    active.map((c) => ({
      id: c.id,
      weight: normalizedIdealById.get(c.id) ?? 0,
    }))
  );

  for (const c of active) {
    currentAmountById.set(c.id, currentAllocated.get(c.id) ?? 0);
    desiredAmountById.set(c.id, desiredAllocated.get(c.id) ?? 0);
  }

  const deficits = active.map((c) => {
    const desired = desiredAmountById.get(c.id) ?? 0;
    const current = currentAmountById.get(c.id) ?? 0;
    return {
      id: c.id,
      name: c.name,
      deficitCents: Math.max(0, desired - current),
      idealPctNormalized: normalizedIdealById.get(c.id) ?? 0,
    };
  });

  const totalDeficitCents = deficits.reduce((sum, d) => sum + d.deficitCents, 0);
  const planAmountsCents = new Map<ClassId, number>();

  if (totalDeficitCents <= 0) {
    // Sem venda: se não existe déficit, qualquer compra empurra para longe do ideal.
    // Portanto, não aloca nada.
    notes.push(
      "Não há classes abaixo do ideal para receber aporte sem venda."
    );
  } else if (contributionCents <= totalDeficitCents) {
    // aporte não cobre todo déficit -> proporcional ao déficit
    const byDeficit = allocateCentsByWeights(contributionCents, deficits.map((d) => ({ id: d.id, weight: d.deficitCents })));
    for (const d of deficits) {
      planAmountsCents.set(d.id, byDeficit.get(d.id) ?? 0);
    }
  } else {
    // cobre o déficit e NÃO redistribui a sobra (sem venda / sem ultrapassar o ideal)
    for (const d of deficits) {
      planAmountsCents.set(d.id, d.deficitCents);
    }
    notes.push(
      "O aporte excede o déficit total. Para evitar ultrapassar o ideal sem venda, parte do aporte não é alocada."
    );
  }

  const recommendations = deficits
    .map((d) => ({
      classId: d.id,
      name: d.name,
      amount: fromCents(planAmountsCents.get(d.id) ?? 0),
    }))
    .filter((r) => r.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const usedTotalCents = recommendations.reduce((sum, r) => sum + toCents(r.amount), 0);
  const usedTotal = fromCents(usedTotalCents);

  return {
    totalHave,
    contribution,
    totalAfter,
    usedTotal,
    recommendations,
    notes,
  };
}
