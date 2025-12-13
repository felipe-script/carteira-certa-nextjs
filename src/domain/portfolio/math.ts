import type { Asset, Money } from "./types";

export function clampNumber(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function roundMoney(value: Money): Money {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function assetValue(asset: Asset): Money {
  const quantity = Number.isFinite(asset.quantity) ? asset.quantity : 0;
  const price = Number.isFinite(asset.price) ? asset.price : 0;
  return roundMoney(Math.max(0, quantity) * Math.max(0, price));
}

export function portfolioTotal(assets: Asset[]): Money {
  return roundMoney(assets.reduce((sum, a) => sum + assetValue(a), 0));
}

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

export function percentOf(part: Money, total: Money): number {
  if (total <= 0) return 0;
  return (part / total) * 100;
}
