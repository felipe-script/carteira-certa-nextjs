import type { Asset, Money } from "./types";

/**
 * Limita um número ao intervalo [min, max].
 * - Se vier NaN, assume `min`.
 */
export function clampNumber(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * Arredonda dinheiro para 2 casas.
 *
 * Este domínio usa `number` para R$; isso ajuda a reduzir ruído de ponto flutuante.
 */
export function roundMoney(value: Money): Money {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Valor atual do ativo (R$): quantidade × preço.
 *
 * Sanitiza `quantity`/`price` (NaN/Infinity) e não permite valores negativos.
 */
export function assetValue(asset: Asset): Money {
  const quantity = Number.isFinite(asset.quantity) ? asset.quantity : 0;
  const price = Number.isFinite(asset.price) ? asset.price : 0;
  return roundMoney(Math.max(0, quantity) * Math.max(0, price));
}

/**
 * Soma do valor de todos os ativos da carteira (R$).
 */
export function portfolioTotal(assets: Asset[]): Money {
  return roundMoney(assets.reduce((sum, a) => sum + assetValue(a), 0));
}

/**
 * Normaliza os targets (porcentagens-alvo) para somarem 100%.
 *
 * - Se a soma dos targets for <= 0, zera tudo e retorna a soma original.
 * - Caso contrário: targetNormalizado = (target / soma) * 100.
 */
export function normalizeTargets(assets: Asset[]): {
  normalized: Array<{ id: string; symbol: string; targetPct: number }>;
  sum: number;
} {
  const sum = assets.reduce((acc, a) => acc + (Number.isFinite(a.targetPct) ? a.targetPct : 0), 0);
  if (sum <= 0) {
    return {
      normalized: assets.map((a) => ({ id: a.id, symbol: a.symbol, targetPct: 0 })),
      sum,
    };
  }
  return {
    normalized: assets.map((a) => ({
      id: a.id,
      symbol: a.symbol,
      targetPct: (a.targetPct / sum) * 100,
    })),
    sum,
  };
}

/**
 * Calcula % (0..100) que `part` representa de `total`.
 */
export function percentOf(part: Money, total: Money): number {
  if (total <= 0) return 0;
  return (part / total) * 100;
}
