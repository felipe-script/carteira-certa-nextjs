export type Plan = "free" | "pro";

export type AssetId = string;

/**
 * Modelo por ativo (ticker) — legado.
 *
 * - `quantity`: unidades (inteiro ou decimal, dependendo do ativo)
 * - `price`: preço atual em R$
 * - `targetPct`: % alvo (0..100)
 */
export type Asset = {
  id: AssetId;
  symbol: string; // e.g. "IVVB11", "HGLG11"
  quantity: number; // unidades
  price: number; // preço atual (R$)
  targetPct: number; // 0..100
};

export type PortfolioId = string;

export type Portfolio = {
  id: PortfolioId;
  name: string;
  assets: Asset[];
};

export type Money = number;

/**
 * Recomendação de compra por ativo.
 *
 * - `buyAmount`: R$ planejado para o ativo
 * - `buyUnits`: unidades inteiras compráveis (floor)
 * - `usedAmount`: R$ efetivamente usado (buyUnits * price)
 */
export type ContributionRecommendation = {
  assetId: AssetId;
  symbol: string;
  buyAmount: Money; // R$ sugerido
  buyUnits: number; // unidades (inteiro)
  usedAmount: Money; // R$ efetivamente usado (buyUnits * price)
};

/**
 * Resultado do cálculo por ativo (legado).
 *
 * - `leftover`: sobra em caixa por arredondamento de unidades
 */
export type SmartContributionResult = {
  contribution: Money;
  totalBefore: Money;
  totalAfterTarget: Money;
  usedTotal: Money;
  leftover: Money;
  recommendations: ContributionRecommendation[];
  notes: string[];
};
