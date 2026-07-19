import React from 'react';
import { SimulationResult, SimConfig } from '../../lib/types';
import { formatCurrency, cn } from '../ui';
import { Clock, Briefcase, Plane, ArrowDownToLine, ShieldCheck, HeartPulse } from 'lucide-react';

export default function TimelineView({ sim, config }: { sim: SimulationResult, config: SimConfig }) {
  
  const getMilestones = () => {
    const milestones = [];

    // Current State
    milestones.push({
      age: config.primaryCurrentAge,
      title: "Current Snapshot",
      description: `Working phase. Portfolio is growing.`,
      icon: Briefcase,
      color: "bg-slate-500",
      stats: `Net Worth: ${formatCurrency(config.currentPortfolio)}`
    });

    // Retirement
    const retYear = sim.data.find(d => d.primaryAge === config.targetRetirementAge);
    if (retYear) {
      milestones.push({
        age: config.targetRetirementAge,
        title: "Retirement Begins",
        description: `Transitioning to drawdown phase. Splitting portfolio into Cash and Investments.`,
        icon: Plane,
        color: "bg-blue-500",
        stats: `Initial Cash: ${formatCurrency(retYear.cashBucket)} | Invested: ${formatCurrency(retYear.investedBucket)}`
      });
    }

    // SS Start
    const ssYear = sim.data.find(d => d.primaryAge === config.primarySSAge);
    if (ssYear && config.primarySSAge > config.targetRetirementAge) {
      milestones.push({
        age: config.primarySSAge,
        title: "Social Security Begins",
        description: `Primary Social Security starts, reducing the monthly portfolio withdrawal requirement.`,
        icon: ArrowDownToLine,
        color: "bg-amber-500",
        stats: `Guaranteed Income: ${formatCurrency(ssYear.income)}/yr`
      });
    }

    // Surplus Phase
    const surplusYear = sim.data.find(d => d.phaseName.includes("Surplus"));
    if (surplusYear) {
      milestones.push({
        age: surplusYear.primaryAge,
        title: "Surplus Phase Achieved",
        description: `Guaranteed income now exceeds living expenses. Portfolio begins autonomous recovery.`,
        icon: ShieldCheck,
        color: "bg-emerald-500",
        stats: `Annual Surplus: +${formatCurrency(surplusYear.net)}`
      });
    }
    
    // Exhaustion
    if (sim.isExhausted && sim.exhaustionAge) {
      milestones.push({
        age: sim.exhaustionAge,
        title: "Portfolio Depleted",
        description: `Invested capital and cash reserves have reached zero. Dependent entirely on fixed income.`,
        icon: HeartPulse,
        color: "bg-red-500",
        stats: `Deficit: ${formatCurrency(Math.abs(sim.data.find(d => d.primaryAge === sim.exhaustionAge)?.net || 0))}/yr`
      });
    }

    // Legacy
    milestones.push({
      age: 80,
      title: "Legacy Projection",
      description: `Terminal projection at age 80 based on median life expectancy models.`,
      icon: Clock,
      color: "bg-slate-800",
      stats: `Projected Legacy: ${formatCurrency(sim.legacy)}`
    });

    return milestones.sort((a, b) => a.age - b.age);
  };

  const milestones = getMilestones();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-8">Retirement Journey Timeline</h3>
        
        <div className="relative pl-8 md:pl-10">
          <div className="absolute left-[20px] md:left-[28px] top-4 bottom-4 w-px bg-slate-200 dark:bg-slate-700" />
          
          <div className="space-y-12">
            {milestones.map((m, i) => (
              <div key={i} className="relative">
                <div className={cn("absolute -left-[32px] md:-left-[40px] w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800", m.color)}>
                  <m.icon className="w-3 h-3 md:w-4 md:h-4 text-white" />
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-5 border border-slate-200 dark:border-slate-600 shadow-sm ml-2">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Age {m.age}</span>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">{m.title}</h4>
                    </div>
                    <span className="inline-block px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      {m.stats}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{m.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
