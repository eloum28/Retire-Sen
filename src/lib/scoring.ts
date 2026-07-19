import { SimConfig, SimulationResult } from './types';
import { MonteCarloResults } from './monteCarlo';

export interface ResilienceScore {
  overall: number;
  financialSecurity: number;
  incomeStability: number;
  liquidity: number;
  inflationProtection: number;
  longevityProtection: number;
  emergencyReadiness: number;
  legacyPotential: number;
}

export function calculateResilienceScore(config: SimConfig, sim: SimulationResult, mc: MonteCarloResults): ResilienceScore {
  // Financial Security (Monte Carlo Success)
  const financialSecurity = Math.min(100, Math.max(0, mc.successProbability));

  // Income Stability (Guaranteed income vs expenses in Phase 3)
  const guaranteedIncome = (config.primarySSAmount + config.spouseSSAmount) * 12;
  const targetExpenses = config.livingExpenses * 12;
  const incomeCoverage = guaranteedIncome / targetExpenses;
  const incomeStability = Math.min(100, Math.max(0, incomeCoverage * 100));

  // Liquidity (Months of expenses in cash bucket)
  const liquidity = Math.min(100, Math.max(0, (sim.monthsCovered / 36) * 100)); // 36 months is 100%

  // Inflation Protection (Growth vs Inflation)
  const realYield = config.growthRate - config.inflationRate;
  const inflationProtection = Math.min(100, Math.max(0, (realYield / 4) * 100)); // 4% real yield is 100%

  // Longevity Protection (Ending Balance vs Target)
  const legacyPotential = Math.min(100, Math.max(0, (mc.medianLegacy / (config.currentPortfolio * 2)) * 100));

  // Emergency Readiness (Emergency Fund size)
  const emergencyCoverage = config.emergencyFund / (config.livingExpenses * 12);
  const emergencyReadiness = Math.min(100, Math.max(0, (emergencyCoverage / 1) * 100)); // 1 year is 100%
  
  // Longevity Protection (Age when exhausted)
  let longevityProtection = 100;
  if (sim.isExhausted && sim.exhaustionAge) {
      longevityProtection = Math.max(0, (sim.exhaustionAge - config.targetRetirementAge) / (80 - config.targetRetirementAge) * 100);
  }

  const overall = Math.round(
    (financialSecurity * 0.3) +
    (incomeStability * 0.2) +
    (liquidity * 0.15) +
    (inflationProtection * 0.1) +
    (longevityProtection * 0.1) +
    (emergencyReadiness * 0.1) +
    (legacyPotential * 0.05)
  );

  return {
    overall,
    financialSecurity: Math.round(financialSecurity),
    incomeStability: Math.round(incomeStability),
    liquidity: Math.round(liquidity),
    inflationProtection: Math.round(inflationProtection),
    longevityProtection: Math.round(longevityProtection),
    emergencyReadiness: Math.round(emergencyReadiness),
    legacyPotential: Math.round(legacyPotential)
  };
}
