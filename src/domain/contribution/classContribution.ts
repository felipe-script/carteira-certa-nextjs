import type {
  AllocationClass,
  ClassContributionResult,
  ClassId,
} from "./types";

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
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
      leftover: contribution,
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
      leftover: contribution,
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

  for (const c of active) {
    const currentAmount = roundMoney(totalHave * (c.currentPct / 100));
    currentAmountById.set(c.id, currentAmount);

    const idealPctNormalized = normalizedIdealById.get(c.id) ?? 0;
    const desiredAmount = roundMoney(totalAfter * (idealPctNormalized / 100));
    desiredAmountById.set(c.id, desiredAmount);
  }

  const deficits = active.map((c) => {
    const desired = desiredAmountById.get(c.id) ?? 0;
    const current = currentAmountById.get(c.id) ?? 0;
    return {
      id: c.id,
      name: c.name,
      deficit: roundMoney(Math.max(0, desired - current)),
      idealPctNormalized: normalizedIdealById.get(c.id) ?? 0,
    };
  });

  const totalDeficit = roundMoney(deficits.reduce((sum, d) => sum + d.deficit, 0));
  const planAmounts = new Map<ClassId, number>();

  if (totalDeficit <= 0) {
    // já está no alvo (ou acima) -> distribuir conforme ideal
    for (const d of deficits) {
      planAmounts.set(d.id, roundMoney(contribution * (d.idealPctNormalized / 100)));
    }
  } else if (contribution <= totalDeficit) {
    // aporte não cobre todo déficit -> proporcional ao déficit
    for (const d of deficits) {
      const weight = d.deficit / totalDeficit;
      planAmounts.set(d.id, roundMoney(contribution * weight));
    }
  } else {
    // cobre o déficit + distribui sobra conforme ideal
    for (const d of deficits) {
      planAmounts.set(d.id, d.deficit);
    }
    const remainder = roundMoney(contribution - totalDeficit);
    for (const d of deficits) {
      const prev = planAmounts.get(d.id) ?? 0;
      planAmounts.set(d.id, roundMoney(prev + remainder * (d.idealPctNormalized / 100)));
    }
  }

  const recommendations = deficits
    .map((d) => ({
      classId: d.id,
      name: d.name,
      amount: planAmounts.get(d.id) ?? 0,
    }))
    .filter((r) => r.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const usedTotal = roundMoney(recommendations.reduce((sum, r) => sum + r.amount, 0));
  const leftover = roundMoney(contribution - usedTotal);

  return {
    totalHave,
    contribution,
    totalAfter,
    usedTotal,
    leftover,
    recommendations,
    notes,
  };
}
