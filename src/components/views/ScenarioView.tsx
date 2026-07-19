import React, { useState } from 'react';
import { SimConfig } from '../../lib/types';
import { runSimulation } from '../../lib/simulation';
import { runMonteCarlo } from '../../lib/monteCarlo';
import { formatCurrency, cn } from '../ui';
import { Copy, Plus, Trash2, GitCompare } from 'lucide-react';

interface Scenario {
  id: string;
  name: string;
  config: SimConfig;
}

export default function ScenarioView({ currentConfig }: { currentConfig: SimConfig }) {
  const [scenarios, setScenarios] = useState<Scenario[]>([
    { id: '1', name: 'Base Plan', config: currentConfig }
  ]);

  const addScenario = () => {
    const newScen = {
      id: Math.random().toString(),
      name: `Scenario ${scenarios.length + 1}`,
      config: { ...currentConfig }
    };
    setScenarios([...scenarios, newScen]);
  };

  const removeScenario = (id: string) => {
    setScenarios(scenarios.filter(s => s.id !== id));
  };

  const updateScenarioConfig = (id: string, key: keyof SimConfig, value: number) => {
    setScenarios(scenarios.map(s => {
      if (s.id === id) {
        return { ...s, config: { ...s.config, [key]: value } };
      }
      return s;
    }));
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      <div className="flex justify-between items-end mb-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-blue-500" /> Scenario Comparison
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Compare different retirement ages, growth rates, and spending levels side-by-side.</p>
        </div>
        <button 
          onClick={addScenario}
          className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Scenario
        </button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar">
        {scenarios.map((scenario, index) => {
          const sim = runSimulation(scenario.config);
          const mc = runMonteCarlo(scenario.config);

          return (
            <div key={scenario.id} className="min-w-[300px] w-[350px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm flex flex-col overflow-hidden shrink-0">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <input 
                  type="text" 
                  value={scenario.name} 
                  onChange={(e) => setScenarios(scenarios.map(s => s.id === scenario.id ? { ...s, name: e.target.value } : s))}
                  className="bg-transparent font-bold text-slate-900 dark:text-slate-100 focus:outline-none w-full"
                />
                {index > 0 && (
                  <button onClick={() => removeScenario(scenario.id)} className="text-slate-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="p-5 flex-1 space-y-6">
                
                {/* Results Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Success Prob</span>
                    <span className={cn("font-mono font-bold text-lg", mc.successProbability >= 90 ? 'text-emerald-500' : 'text-red-500')}>
                      {mc.successProbability.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Legacy (80)</span>
                    <span className="font-mono font-bold text-lg text-slate-900 dark:text-slate-100">
                      {formatCurrency(sim.legacy)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Init Drawdown</span>
                    <span className={cn("font-mono font-bold text-lg", sim.drawdownPercent > 4 ? 'text-red-500' : 'text-emerald-500')}>
                      {sim.drawdownPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-700 w-full" />

                {/* Knobs Section */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Retirement Age</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{scenario.config.targetRetirementAge}</span>
                    </div>
                    <input type="range" min={50} max={75} value={scenario.config.targetRetirementAge} onChange={(e) => updateScenarioConfig(scenario.id, 'targetRetirementAge', Number(e.target.value))} className="w-full accent-blue-500" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Monthly Spend</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">${scenario.config.livingExpenses}</span>
                    </div>
                    <input type="range" min={1000} max={20000} step={500} value={scenario.config.livingExpenses} onChange={(e) => updateScenarioConfig(scenario.id, 'livingExpenses', Number(e.target.value))} className="w-full accent-blue-500" />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Expected Return</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{scenario.config.growthRate}%</span>
                    </div>
                    <input type="range" min={0} max={12} step={0.1} value={scenario.config.growthRate} onChange={(e) => updateScenarioConfig(scenario.id, 'growthRate', Number(e.target.value))} className="w-full accent-blue-500" />
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
