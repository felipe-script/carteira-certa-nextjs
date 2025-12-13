import type { Asset, Money, SmartContributionResult } from "./types";
import { assetValue, normalizeTargets, portfolioTotal, roundMoney } from "./math";

function safeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

/**
 * Smart Contributor (aportes sem venda):
 * - Calcula o valor ideal pós-aporte: target% * (totalAtual + aporte)
 * - Compra somente ativos abaixo do ideal (deficit)
 * - Se o aporte não cobre todos déficits, distribui proporcionalmente ao déficit
 * - Se sobrar, distribui o restante proporcionalmente ao target normalizado
 * - Converte R$ em unidades inteiras (floor), gerando sobra em caixa
 */
export function calculateSmartContribution(input: {
  assets: Asset[];
  contribution: Money;
}): SmartContributionResult {
  const notes: string[] = [];

  const contribution = roundMoney(Math.max(0, input.contribution));
  const assets = input.assets
    .map((a) => ({
      ...a,
      symbol: safeSymbol(a.symbol),
      quantity: Number.isFinite(a.quantity) ? Math.max(0, a.quantity) : 0,
      price: Number.isFinite(a.price) ? Math.max(0, a.price) : 0,
      targetPct: Number.isFinite(a.targetPct) ? Math.max(0, a.targetPct) : 0,
    }))
    .filter((a) => a.symbol.length > 0);

  const totalBefore = portfolioTotal(assets);
  const totalAfterTarget = roundMoney(totalBefore + contribution);

  if (assets.length === 0) {
    return {
      contribution,
      totalBefore,
      totalAfterTarget,
      usedTotal: 0,
      leftover: contribution,
      recommendations: [],
      notes: ["Adicione ao menos 1 ativo para calcular o aporte."],
    };
  }

  const { normalized: targets, sum: targetSum } = normalizeTargets(assets);
  if (targetSum !== 100) {
    notes.push(
      targetSum <= 0
        ? "Defina porcentagens-alvo (> 0) para calcular o ideal."
        : `Os targets somam ${roundMoney(targetSum)}%. O sistema normaliza para 100% no cálculo.`
    );
  }

  const desiredById = new Map<string, Money>();
  const currentById = new Map<string, Money>();

  for (const t of targets) {
    const desired = roundMoney((t.targetPct / 100) * totalAfterTarget);
    desiredById.set(t.id, desired);
  }

  for (const a of assets) {
    currentById.set(a.id, assetValue(a));
  }

  const deficits = assets.map((a) => {
    const desired = desiredById.get(a.id) ?? 0;
    const current = currentById.get(a.id) ?? 0;
    return {
      id: a.id,
      symbol: a.symbol,
      price: a.price,
      deficit: roundMoney(Math.max(0, desired - current)),
      targetPct: (targets.find((t) => t.id === a.id)?.targetPct ?? 0),
    };
  });

  const totalDeficit = roundMoney(deficits.reduce((sum, d) => sum + d.deficit, 0));

  const planAmounts = new Map<string, Money>();

  if (totalDeficit <= 0) {
    notes.push(
      "Sua carteira já está no alvo (ou acima). O aporte será distribuído conforme o target para manter a proporção."
    );
    const totalTarget = targets.reduce((sum, t) => sum + t.targetPct, 0);
    for (const t of targets) {
      const weight = totalTarget > 0 ? t.targetPct / totalTarget : 0;
      planAmounts.set(t.id, roundMoney(contribution * weight));
    }
  } else if (contribution <= totalDeficit) {
    for (const d of deficits) {
      const weight = d.deficit / totalDeficit;
      planAmounts.set(d.id, roundMoney(contribution * weight));
    }
  } else {
    // cobre todos déficits e distribui resto por target
    for (const d of deficits) {
      planAmounts.set(d.id, d.deficit);
    }
    const remainder = roundMoney(contribution - totalDeficit);
    const totalTarget = targets.reduce((sum, t) => sum + t.targetPct, 0);
    for (const t of targets) {
      const weight = totalTarget > 0 ? t.targetPct / totalTarget : 0;
      const prev = planAmounts.get(t.id) ?? 0;
      planAmounts.set(t.id, roundMoney(prev + remainder * weight));
    }
  }

  // Converter R$ em unidades inteiras (floor)
  const recommendations = assets
    .map((a) => {
      const planned = planAmounts.get(a.id) ?? 0;
      if (a.price <= 0 || planned <= 0) {
        return {
          assetId: a.id,
          symbol: a.symbol,
          buyAmount: 0,
          buyUnits: 0,
          usedAmount: 0,
        };
      }
      const buyUnits = Math.floor(planned / a.price);
      const usedAmount = roundMoney(buyUnits * a.price);
      return {
        assetId: a.id,
        symbol: a.symbol,
        buyAmount: roundMoney(planned),
        buyUnits,
        usedAmount,
      };
    })
    .filter((r) => r.buyAmount > 0)
    .sort((a, b) => b.buyAmount - a.buyAmount);

  const usedTotal = roundMoney(recommendations.reduce((sum, r) => sum + r.usedAmount, 0));
  const leftover = roundMoney(contribution - usedTotal);

  if (recommendations.some((r) => r.buyUnits === 0 && r.buyAmount > 0)) {
    notes.push(
      "Alguns ativos receberam valor sugerido menor que 1 unidade. Ajuste preços/aporte ou compre manualmente frações (se aplicável)."
    );
  }

  if (leftover > 0) {
    notes.push("Sobrou caixa por conta do arredondamento para unidades inteiras.");
  }

  return {
    contribution,
    totalBefore,
    totalAfterTarget,
    usedTotal,
    leftover,
    recommendations,
    notes,
  };
}
