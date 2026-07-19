import React from 'react';
import { SimulationResult, SimConfig } from '../../lib/types';
import { MonteCarloResults } from '../../lib/monteCarlo';
import { Lightbulb, CheckCircle2, AlertTriangle, TrendingUp, ShieldAlert, ArrowRight } from 'lucide-react';

export default function AIAdvisorView({ config, sim, mc }: { config: SimConfig, sim: SimulationResult, mc: MonteCarloResults }) {
  
  const strengths = [];
  const concerns = [];
  const recommendations = [];

  // Logic for Advisor
  if (mc.successProbability >= 90) {
    strengths.push("High Probability of Success (90%+): Your portfolio is highly likely to survive through age 80 under historical volatility.");
  } else if (mc.successProbability < 75) {
    concerns.push("Elevated Risk of Exhaustion: Your plan has a less than 75% chance of succeeding without adjustments.");
    recommendations.push({
      action: "Reduce Planned Spending",
      why: "Lowering withdrawal demands increases portfolio longevity.",
      impact: "Even a 5-10% reduction can increase success probability significantly."
    });
  }

  if (sim.monthsCovered >= 24) {
    strengths.push(`Excellent Cash Reserves: Your initial buffer covers ${sim.monthsCovered} months of net deficit, strongly mitigating Sequence of Return Risk.`);
  } else {
    concerns.push("Cash Buffer is Low: You have less than 24 months of cash buffer.");
    recommendations.push({
      action: "Increase Cash Contingency Fund",
      why: "A larger buffer prevents you from selling equities during a market downturn early in retirement.",
      impact: "Reduces sequence of return risk and smooths out volatility."
    });
  }

  if (sim.drawdownPercent > 4) {
    concerns.push(`High Initial Withdrawal Rate (${sim.drawdownPercent.toFixed(1)}%): Exceeds the standard safe withdrawal rate of 4%.`);
    recommendations.push({
      action: "Delay Social Security",
      why: "Claiming later increases guaranteed income and reduces dependency on portfolio drawdowns.",
      impact: "Lowers your initial withdrawal rate to a safer level."
    });
  } else {
    strengths.push(`Sustainable Withdrawal Rate (${sim.drawdownPercent.toFixed(1)}%): Safely below the 4% rule of thumb.`);
  }

  const hasSurplus = sim.data.some(d => d.phaseName.includes("Surplus"));
  if (hasSurplus) {
    strengths.push("Late-Stage Cash Flow Surplus: Guaranteed income eventually exceeds living expenses, allowing your portfolio to recover.");
  }

  if (config.growthRate - config.inflationRate <= 1) {
    concerns.push("Low Real Growth Rate: Your expected return is barely outpacing inflation.");
    recommendations.push({
      action: "Increase Equity Allocation",
      why: "Your portfolio is too conservative to sustain purchasing power over 30 years.",
      impact: "Higher growth will offset inflation drag, improving long-term legacy."
    });
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 md:p-8 shadow-lg relative overflow-hidden">
        <Lightbulb className="absolute -bottom-6 -right-6 w-48 h-48 text-white/5" />
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
          <Lightbulb className="w-6 h-6 text-amber-400" />
          AI Advisory Report
        </h2>
        <p className="text-slate-300 max-w-2xl">Based on a multi-dimensional analysis of your retirement plan, cash flow projections, and 10,000 Monte Carlo paths.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-emerald-900 dark:text-emerald-300 font-bold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Plan Strengths
          </h3>
          <ul className="space-y-4">
            {strengths.map((str, i) => (
              <li key={i} className="flex gap-3 text-sm text-emerald-800 dark:text-emerald-400 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                {str}
              </li>
            ))}
            {strengths.length === 0 && <p className="text-sm text-emerald-700 opacity-70">No major strengths identified based on current parameters.</p>}
          </ul>
        </div>

        <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-red-900 dark:text-red-300 font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Areas of Concern
          </h3>
          <ul className="space-y-4">
            {concerns.map((con, i) => (
              <li key={i} className="flex gap-3 text-sm text-red-800 dark:text-red-400 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                {con}
              </li>
            ))}
            {concerns.length === 0 && <p className="text-sm text-red-700 opacity-70">No critical concerns identified. Your plan is robust.</p>}
          </ul>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" /> Actionable Recommendations
        </h3>
        
        <div className="grid grid-cols-1 gap-4">
          {recommendations.length > 0 ? recommendations.map((rec, i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 rounded-xl p-5 transition-all hover:shadow-md">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-3 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-emerald-500" />
                {rec.action}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Why</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{rec.why}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Expected Impact</span>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium leading-relaxed">{rec.impact}</p>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              Your plan is currently highly optimized. No immediate actions required.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
