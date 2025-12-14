export type ClassId = string;

/**
 * Linha de uma “classe de ativo” no modelo tipo planilha.
 *
 * - `idealPct`: % desejado da classe no total pós-aporte
 * - `currentPct`: % atual da classe no total atual
 * - `ignore`: se true, a classe não entra nos cálculos/recomendações
 */
export type AllocationClass = {
  id: ClassId;
  name: string;
  idealPct: number; // 0..100
  currentPct: number; // 0..100
  ignore?: boolean;
};

export type ClassContributionRecommendation = {
  classId: ClassId;
  name: string;
  amount: number; // R$
};

/**
 * Resultado do cálculo por classe.
 *
 * - `usedTotal`: soma do que foi recomendado (pode ser menor que o aporte)
 * - `notes`: avisos (ex.: normalização de %)
 */
export type ClassContributionResult = {
  totalHave: number;
  contribution: number;
  totalAfter: number;
  usedTotal: number;
  recommendations: ClassContributionRecommendation[];
  notes: string[];
};
