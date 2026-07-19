import React, { useState, useMemo } from 'react';
import { SimConfig } from '../lib/types';
import { runSimulation } from '../lib/simulation';
import { runMonteCarlo } from '../lib/monteCarlo';
import { calculateResilienceScore } from '../lib/scoring';
import { cn, FormGroup, Input } from './ui';
import DashboardView from './views/DashboardView';
import MonteCarloView from './views/MonteCarloView';
import ResilienceView from './views/ResilienceView';
import AIAdvisorView from './views/AIAdvisorView';
import TimelineView from './views/TimelineView';
import StressTestView from './views/StressTestView';
import ScenarioView from './views/ScenarioView';
import { LayoutDashboard, Target, Shield, BrainCircuit, Milestone, AlertTriangle, GitCompare } from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'montecarlo', label: 'Monte Carlo', icon: Target },
  { id: 'resilience', label: 'Resilience Score', icon: Shield },
  { id: 'aiadvisor', label: 'AI Advisor', icon: BrainCircuit },
  { id: 'timeline', label: 'Journey Timeline', icon: Milestone },
  { id: 'scenario', label: 'Scenario Compare', icon: GitCompare },
  { id: 'stresstest', label: 'Stress Tests', icon: AlertTriangle },
];

export default function Simulator() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode
  
  const [config, setConfig] = useState<SimConfig>({
    primaryCurrentAge: 57,
    targetRetirementAge: 59,
    primarySSAge: 62,
    primarySSAmount: 1800,
    spouseCurrentAge: 55,
    spouseSSAge: 62,
    spouseSSAmount: 1000,
    currentPortfolio: 220000,
    growthRate: 4.0, // adjusted to be realistic
    stdDev: 12.0,
    monteCarloSims: 2000,
    cashContingency: 50000,
    emergencyFund: 25000,
    livingExpenses: 1800,
    relocationExpense: 0,
    inflationRate: 2.0,
  });

  const handleChange = (key: keyof typeof config, value: number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const sim = useMemo(() => runSimulation(config, false), [config]);
  const mc = useMemo(() => runMonteCarlo(config), [config]);
  const score = useMemo(() => calculateResilienceScore(config, sim, mc), [config, sim, mc]);

  // Apply dark mode class to root
  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className={`flex h-screen overflow-hidden ${isDarkMode ? 'dark bg-slate-950' : 'bg-slate-100 text-slate-900'}`}>
      
      {/* Left Sidebar - Inputs */}
      <aside className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-lg z-20 shrink-0">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-900 text-white">
          <div>
            <h1 className="font-bold text-lg tracking-tight">RetirePath Pro</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Wealth Management</p>
          </div>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-md hover:bg-slate-800 transition-colors"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          
          <FormGroup title="Current Status">
            <Input label="Current Age" value={config.primaryCurrentAge} onChange={(v: number) => handleChange('primaryCurrentAge', v)} min={40} max={70} />
            <Input label="Target Retirement Age" value={config.targetRetirementAge} onChange={(v: number) => handleChange('targetRetirementAge', v)} min={config.primaryCurrentAge} max={75} />
            <Input label="Current Portfolio Balance" value={config.currentPortfolio} onChange={(v: number) => handleChange('currentPortfolio', v)} prefix="$" min={0} max={5000000} step={10000} />
          </FormGroup>

          <FormGroup title="Market Assumptions">
            <Input label="Expected Annual Return" value={config.growthRate} onChange={(v: number) => handleChange('growthRate', v)} suffix="%" min={0} max={12} step={0.1} />
            <Input label="Standard Deviation (Risk)" value={config.stdDev} onChange={(v: number) => handleChange('stdDev', v)} suffix="%" min={1} max={25} step={1} />
            <Input label="Inflation Rate" value={config.inflationRate} onChange={(v: number) => handleChange('inflationRate', v)} suffix="%" min={0} max={8} step={0.1} />
            <Input label="Monte Carlo Simulations" value={config.monteCarloSims} onChange={(v: number) => handleChange('monteCarloSims', v)} min={100} max={5000} step={100} />
          </FormGroup>

          <FormGroup title="Cash Reserves (Bucket 1)">
            <Input label="Cash Contingency Fund" value={config.cashContingency} onChange={(v: number) => handleChange('cashContingency', v)} prefix="$" min={0} max={200000} step={5000} />
            <Input label="Emergency Fund (Floor)" value={config.emergencyFund} onChange={(v: number) => handleChange('emergencyFund', v)} prefix="$" min={0} max={100000} step={5000} />
          </FormGroup>

          <FormGroup title="Living Expenses">
            <Input label="Monthly Target Spend" value={config.livingExpenses} onChange={(v: number) => handleChange('livingExpenses', v)} prefix="$" min={1000} max={20000} step={100} />
            <Input label="One-Time Relocation Cost" value={config.relocationExpense} onChange={(v: number) => handleChange('relocationExpense', v)} prefix="$" min={0} max={100000} step={1000} />
          </FormGroup>

          <FormGroup title="Social Security">
            <div className="pt-2 pb-1 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500">Primary Earner</div>
            <Input label="Start Age" value={config.primarySSAge} onChange={(v: number) => handleChange('primarySSAge', v)} min={62} max={70} />
            <Input label="Monthly Benefit" value={config.primarySSAmount} onChange={(v: number) => handleChange('primarySSAmount', v)} prefix="$" min={0} max={5000} step={100} />
            
            <div className="pt-4 pb-1 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500">Spouse</div>
            <Input label="Current Age" value={config.spouseCurrentAge} onChange={(v: number) => handleChange('spouseCurrentAge', v)} min={40} max={70} />
            <Input label="Start Age" value={config.spouseSSAge} onChange={(v: number) => handleChange('spouseSSAge', v)} min={62} max={70} />
            <Input label="Monthly Benefit" value={config.spouseSSAmount} onChange={(v: number) => handleChange('spouseSSAmount', v)} prefix="$" min={0} max={5000} step={100} />
          </FormGroup>
          
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Top Navigation */}
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-10 sticky top-0 px-6 py-4 flex gap-2 overflow-x-auto custom-scrollbar shadow-sm">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-md" 
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <DashboardView sim={sim} config={config} />}
            {activeTab === 'montecarlo' && <MonteCarloView mcResults={mc} />}
            {activeTab === 'resilience' && <ResilienceView score={score} />}
            {activeTab === 'aiadvisor' && <AIAdvisorView config={config} sim={sim} mc={mc} />}
            {activeTab === 'timeline' && <TimelineView sim={sim} config={config} />}
            {activeTab === 'scenario' && <ScenarioView currentConfig={config} />}
            {activeTab === 'stresstest' && <StressTestView config={config} />}
          </div>
        </div>
      </main>

    </div>
  );
}
