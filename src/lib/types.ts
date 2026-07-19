export interface SimConfig {
  primaryCurrentAge: number;
  targetRetirementAge: number;
  primarySSAge: number;
  primarySSAmount: number; // Monthly
  spouseCurrentAge: number;
  spouseSSAge: number;
  spouseSSAmount: number; // Monthly
  currentPortfolio: number;
  growthRate: number; // Expected Return (%)
  stdDev: number; // Standard Deviation (%)
  monteCarloSims: number; // 5000
  cashContingency: number;
  emergencyFund: number;
  cashYield: number; // (%)
  livingExpenses: number; // Monthly
  relocationExpense: number;
  inflationRate: number; // (%)
}

export interface YearData {
  primaryAge: number;
  spouseAge: number;
  isRetired: boolean;
  expenses: number;
  income: number;
  ssPrimary: number;
  ssSpouse: number;
  oneTime: number;
  net: number;
  growthAmount: number;
  startBalance: number;
  cashBucket: number;
  investedBucket: number;
  endBalance: number;
  phaseName: string;
  phaseColor: string;
}

export interface SimulationResult {
  data: YearData[];
  atRetirement: number;
  legacy: number;
  isExhausted: boolean;
  exhaustionAge: number | null;
  drawdownPercent: number;
  initialCash: number;
  monthsCovered: number;
}
