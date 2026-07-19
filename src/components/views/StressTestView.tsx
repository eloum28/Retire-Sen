import React, { useState } from 'react';
import { SimConfig } from '../../lib/types';
import { runSimulation } from '../../lib/simulation';
import { runMonteCarlo } from '../../lib/monteCarlo';
import { formatCurrency } from '../ui';
import { ShieldAlert, RefreshCcw } from 'lucide-react';

export default function StressTestView({ config }: { config: SimConfig }) {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  const baseMc = runMonteCarlo(config);

  const scenarios = [
    {
      id: 'market_crash',
      name: 'Early Market Crash (-30%)',
      desc: 'The market drops 30% in the first year of your retirement.',
      modifier: (c: SimConfig) => ({ ...c, currentPortfolio: c.currentPortfolio * 0.7 })
    },
    {
      id: 'high_inflation',
      name: 'High Inflation (6%)',
      desc: 'Sustained 6% inflation heavily increases your future expenses.',
      modifier: (c: SimConfig) => ({ ...c, inflationRate: 6.0 })
    },
    {
      id: 'ss_cuts',
      name: 'Social Security Reduced (-25%)',
      desc: 'Congress reduces Social Security benefits by 25%.',
      modifier: (c: SimConfig) => ({ ...c, primarySSAmount: c.primarySSAmount * 0.75, spouseSSAmount: c.spouseSSAmount * 0.75 })
    },
    {
      id: 'medical_shock',
      name: 'Medical Shock ($100k)',
      desc: 'A sudden $100,000 out-of-pocket medical expense at retirement.',
      modifier: (c: SimConfig) => ({ ...c, relocationExpense: c.relocationExpense + 100000 })
    }
  ];

  const getResults = () => {
    if (!activeScenario) return null;
    const scenario = scenarios.find(s => s.id === activeScenario)!;
    const modifiedConfig = scenario.modifier(config);
    const mc = runMonteCarlo(modifiedConfig);
    const sim = runSimulation(modifiedConfig);
    return { mc, sim, name: scenario.name };
  };

  const results = getResults();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-bold text-red-900 dark:text-red-400 mb-2 flex items-center gap-2">
          <ShieldAlert className="w-6 h-6" /> Stress Test Center
        </h2>
        <p className="text-red-800 dark:text-red-300 text-sm">Stress test your retirement plan against extreme events to see if your cash buffers and asset allocation can survive black swan scenarios.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {scenarios.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveScenario(s.id)}
            className={`text-left p-5 rounded-2xl border transition-all ${
              activeScenario === s.id 
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-700 dark:border-slate-600 shadow-md' 
                : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
            }`}
          >
            <h3 className="font-bold mb-2">{s.name}</h3>
            <p className={`text-xs ${activeScenario === s.id ? 'text-slate-300' : 'text-slate-500'}`}>{s.desc}</p>
          </button>
        ))}
      </div>

      {results && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm mt-4 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-700 pb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">Impact: {results.name}</h3>
            <button onClick={() => setActiveScenario(null)} className="text-sm font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1">
              <RefreshCcw className="w-4 h-4" /> Reset
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-1">Success Probability</p>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold font-mono text-slate-900 dark:text-slate-100">{results.mc.successProbability.toFixed(1)}%</span>
                <span className={`text-sm font-bold ${results.mc.successProbability < baseMc.successProbability ? 'text-red-500' : 'text-emerald-500'}`}>
                  {results.mc.successProbability < baseMc.successProbability ? '-' : '+'}{Math.abs(baseMc.successProbability - results.mc.successProbability).toFixed(1)}%
                </span>
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-1">Median Legacy (Age 80)</p>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold font-mono text-slate-900 dark:text-slate-100">{formatCurrency(results.mc.medianLegacy)}</span>
              </div>
              <p className="text-xs font-semibold text-red-500 mt-1">
                Drop of {formatCurrency(Math.max(0, baseMc.medianLegacy - results.mc.medianLegacy))}
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-1">Exhaustion Risk</p>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold font-mono text-slate-900 dark:text-slate-100">
                  {results.sim.isExhausted ? `Yes, Age ${results.sim.exhaustionAge}` : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
