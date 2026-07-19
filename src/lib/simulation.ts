import { SimConfig, YearData, SimulationResult } from './types';

// Standard normal distribution generator using Box-Muller transform
function generateGaussian(mean: number, stdDev: number): number {
  let u1 = 0, u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

export function runSimulation(config: SimConfig, applyRandomness: boolean = false): SimulationResult {
  const data: YearData[] = [];
  let currentBalance = config.currentPortfolio;
  let currentLivingExpenses = config.livingExpenses * 12; // Annualize
  let currentPrimarySS = config.primarySSAmount * 12; // Annualize
  let currentSpouseSS = config.spouseSSAmount * 12; // Annualize

  let cashBucket = 0;
  let investedBucket = 0;
  let isExhausted = false;
  let exhaustionAge: number | null = null;
  
  let atRetirement = 0;

  for (let age = config.primaryCurrentAge; age <= 80; age++) {
    const spouseAge = config.spouseCurrentAge + (age - config.primaryCurrentAge);
    const isRetired = age >= config.targetRetirementAge;
    
    const primarySS = age >= config.primarySSAge ? currentPrimarySS : 0;
    const spouseSS = spouseAge >= config.spouseSSAge ? currentSpouseSS : 0;
    const income = isRetired ? (primarySS + spouseSS) : 0;
    const exp = isRetired ? currentLivingExpenses : 0;
    const oneTime = (age === config.targetRetirementAge) ? config.relocationExpense : 0;
    
    const net = income - exp;
    const startBalance = currentBalance;
    let endBalance = 0;
    let growthAmount = 0;

    let actualGrowthRate = config.growthRate;
    if (applyRandomness) {
      actualGrowthRate = generateGaussian(config.growthRate, config.stdDev);
    }

    if (age === config.targetRetirementAge) {
      let availableAfterOneTime = startBalance - oneTime;
      let desiredCash = config.cashContingency + config.emergencyFund;
      cashBucket = Math.min(desiredCash, Math.max(0, availableAfterOneTime));
      investedBucket = Math.max(0, availableAfterOneTime - cashBucket);
      atRetirement = startBalance;
    }

    if (age < config.targetRetirementAge) {
      let balanceAfterCashFlow = startBalance - oneTime + net;
      growthAmount = Math.max(0, balanceAfterCashFlow) * (actualGrowthRate / 100);
      endBalance = Math.max(0, balanceAfterCashFlow + growthAmount);
      currentBalance = endBalance;
      investedBucket = currentBalance;
      cashBucket = 0;
    } else {
      let deficitToFund = net < 0 ? Math.abs(net) : 0;
      let surplusToInvest = net > 0 ? net : 0;

      if (deficitToFund > 0) {
        let availableContingency = Math.max(0, cashBucket - config.emergencyFund);
        let actualCashWithdrawal = Math.min(deficitToFund, availableContingency);
        cashBucket -= actualCashWithdrawal;
        let remainingDeficit = deficitToFund - actualCashWithdrawal;
        if (remainingDeficit > 0) {
          investedBucket -= remainingDeficit;
          if (investedBucket < 0) investedBucket = 0;
        }
      }

      if (surplusToInvest > 0) {
        investedBucket += surplusToInvest;
      }

      // If exhausted
      if (investedBucket === 0 && cashBucket < config.emergencyFund && !isExhausted) {
         // Not completely exhausted if emergency fund is there, but practically yes.
         if (cashBucket === 0) {
           isExhausted = true;
           exhaustionAge = age;
         }
      }

      let investedGrowthAmount = investedBucket > 0 ? (investedBucket * (actualGrowthRate / 100)) : 0;
      investedBucket += investedGrowthAmount;
      if (investedBucket < 0) investedBucket = 0;

      growthAmount = investedGrowthAmount;
      endBalance = cashBucket + investedBucket;
      currentBalance = endBalance;
    }

    let phaseName = 'Pre-Retirement';
    let phaseColor = 'text-slate-700 bg-slate-200/50 border-slate-300/50 dark:text-slate-300 dark:bg-slate-700/50 dark:border-slate-600';

    if (isRetired) {
      if (primarySS === 0 && spouseSS === 0) {
        phaseName = 'Phase 1: Full Bridge';
        phaseColor = 'text-amber-800 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-900/30 dark:border-amber-800/50';
      } else if (primarySS === 0 || spouseSS === 0) {
        phaseName = 'Phase 2: Partial Bridge';
        phaseColor = 'text-blue-800 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-900/30 dark:border-blue-800/50';
      } else if (net >= 0) {
        phaseName = 'Phase 3: Surplus';
        phaseColor = 'text-emerald-800 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-800/50';
      } else {
        phaseName = 'Phase 3: Structural Deficit';
        phaseColor = 'text-red-800 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-900/30 dark:border-red-800/50';
      }
    }

    data.push({
      primaryAge: age,
      spouseAge,
      isRetired,
      expenses: exp,
      income,
      ssPrimary: primarySS,
      ssSpouse: spouseSS,
      oneTime,
      net,
      growthAmount,
      startBalance,
      cashBucket,
      investedBucket,
      endBalance,
      phaseName,
      phaseColor
    });

    if (config.inflationRate > 0) {
      const inflationFactor = 1 + (config.inflationRate / 100);
      currentLivingExpenses *= inflationFactor;
      currentPrimarySS *= inflationFactor;
      currentSpouseSS *= inflationFactor;
    }
  }

  const legacy = data[data.length - 1]?.endBalance || 0;
  if (!isExhausted && legacy === 0) {
     isExhausted = true;
     exhaustionAge = 80;
  }

  // Calculate some drawdown percent at beginning of retirement
  const firstRetirementYear = data.find(d => d.isRetired);
  const initialDeficit = firstRetirementYear ? Math.abs(firstRetirementYear.net) : 0;
  const drawdownPercent = atRetirement > 0 ? (initialDeficit / atRetirement) * 100 : 0;

  const initialCash = config.cashContingency + config.emergencyFund;
  const monthsCovered = Math.floor(initialCash / config.livingExpenses);

  return {
    data,
    atRetirement,
    legacy,
    isExhausted,
    exhaustionAge,
    drawdownPercent,
    initialCash,
    monthsCovered
  };
}
