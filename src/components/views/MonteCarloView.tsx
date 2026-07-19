import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { KpiCard, formatCurrency } from '../ui';
import { MonteCarloResults } from '../../lib/monteCarlo';
import { Activity, ShieldAlert, Target, Zap } from 'lucide-react';

export default function MonteCarloView({ mcResults }: { mcResults: MonteCarloResults }) {
  const isHighSuccess = mcResults.successProbability >= 90;
  const isMedSuccess = mcResults.successProbability >= 75 && mcResults.successProbability < 90;
  
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <KpiCard 
          title="Success Probability" 
          value={`${mcResults.successProbability.toFixed(1)}%`} 
          colorClass={isHighSuccess ? "text-emerald-600" : isMedSuccess ? "text-amber-500" : "text-red-500"} 
          subtitle={`${mcResults.simulations} trials run`}
          icon={Target}
        />
        <KpiCard 
          title="Median Legacy" 
          value={formatCurrency(mcResults.medianLegacy)} 
          colorClass="text-slate-900 dark:text-slate-100" 
          subtitle="50th Percentile"
          icon={Activity}
        />
        <KpiCard 
          title="10th Percentile (Poor Market)" 
          value={formatCurrency(mcResults.p10Legacy)} 
          colorClass="text-red-600 dark:text-red-400" 
          subtitle="If markets underperform"
          icon={ShieldAlert}
        />
        <KpiCard 
          title="90th Percentile (Bull Market)" 
          value={formatCurrency(mcResults.p90Legacy)} 
          colorClass="text-emerald-600 dark:text-emerald-400" 
          subtitle="If markets overperform"
          icon={Zap}
        />
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col h-[500px] shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">Monte Carlo Confidence Bands</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">10th to 90th percentile projection of your net worth over time.</p>
          </div>
          <div className="flex gap-4">
             <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">90th (Bull)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-800 dark:bg-slate-300"></span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">50th (Median)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400"></span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">10th (Bear)</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 w-full bg-slate-50/50 dark:bg-slate-900/50 rounded-xl relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mcResults.percentiles} margin={{ top: 15, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="age" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(v) => `$${(v/1000)}k`} tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `Age ${label}`}
              />
              <Area type="monotone" dataKey="p90" stroke="none" fill="#10b981" fillOpacity={0.1} />
              <Area type="monotone" dataKey="p50" stroke="none" fill="#3b82f6" fillOpacity={0.1} />
              <Area type="monotone" dataKey="p10" stroke="none" fill="#ef4444" fillOpacity={0.1} />
              
              <Line type="monotone" dataKey="p90" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="p50" stroke="#0f172a" strokeWidth={3} dot={false} className="dark:stroke-slate-200" />
              <Line type="monotone" dataKey="p10" stroke="#ef4444" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
