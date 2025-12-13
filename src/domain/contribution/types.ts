export type ClassId = string;

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

export type ClassContributionResult = {
  totalHave: number;
  contribution: number;
  totalAfter: number;
  usedTotal: number;
  leftover: number;
  recommendations: ClassContributionRecommendation[];
  notes: string[];
};
