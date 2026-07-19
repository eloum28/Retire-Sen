import { SimConfig, SimulationResult } from './types';
import { runSimulation } from './simulation';

export interface MonteCarloResults {
  successProbability: number;
  medianLegacy: number;
  p10Legacy: number;
  p90Legacy: number;
  worstCaseLegacy: number;
  bestCaseLegacy: number;
  simulations: number;
  percentiles: { age: number; p10: number; p50: number; p90: number }[];
  exhaustionPaths: number;
}

export function runMonteCarlo(config: SimConfig): MonteCarloResults {
  const numSims = config.monteCarloSims || 1000;
  
  const legacies: number[] = [];
  const paths: number[][] = []; // Array of ending balances by year

  let exhaustionPaths = 0;

  for (let i = 0; i < numSims; i++) {
    const simResult = runSimulation(config, true);
    legacies.push(simResult.legacy);
    if (simResult.isExhausted) {
      exhaustionPaths++;
    }
    
    // Store path balances
    const path = simResult.data.map(d => d.endBalance);
    paths.push(path);
  }

  legacies.sort((a, b) => a - b);
  
  const p10Index = Math.floor(numSims * 0.1);
  const p50Index = Math.floor(numSims * 0.5);
  const p90Index = Math.floor(numSims * 0.9);

  const successProbability = ((numSims - exhaustionPaths) / numSims) * 100;

  // Calculate percentiles per year
  const percentiles: { age: number; p10: number; p50: number; p90: number }[] = [];
  
  // We need the ages from the base config
  const baseSim = runSimulation(config, false);
  const ages = baseSim.data.map(d => d.primaryAge);

  for (let yearIdx = 0; yearIdx < ages.length; yearIdx++) {
    const yearBalances = paths.map(p => p[yearIdx]).sort((a, b) => a - b);
    percentiles.push({
      age: ages[yearIdx],
      p10: yearBalances[p10Index],
      p50: yearBalances[p50Index],
      p90: yearBalances[p90Index],
    });
  }

  return {
    successProbability,
    medianLegacy: legacies[p50Index],
    p10Legacy: legacies[p10Index],
    p90Legacy: legacies[p90Index],
    worstCaseLegacy: legacies[0],
    bestCaseLegacy: legacies[legacies.length - 1],
    simulations: numSims,
    percentiles,
    exhaustionPaths
  };
}
