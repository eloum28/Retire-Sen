import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine } from 'recharts';
import { KpiCard, formatCurrency, cn } from '../ui';
import { SimulationResult, SimConfig } from '../../lib/types';
import { ShieldCheck, TrendingUp, Wallet, ArrowDownToLine, Clock } from 'lucide-react';

export default function DashboardView({ sim, config }: { sim: SimulationResult, config: SimConfig }) {
  const data = sim.data;
  
  const phase1 = useMemo(() => {
    const p1 = data.filter(d => d.phaseName.includes('Phase 1'));
    return p1.length > 0 ? { start: p1[0].primaryAge, end: p1[p1.length - 1].primaryAge } : null;
  }, [data]);

  const phase2 = useMemo(() => {
    const p2 = data.filter(d => d.phaseName.includes('Phase 2'));
    return p2.length > 0 ? { start: p2[0].primaryAge, end: p2[p2.length - 1].primaryAge } : null;
  }, [data]);

  const phase3 = useMemo(() => {
    const p3 = data.filter(d => d.phaseName.includes('Phase 3'));
    return p3.length > 0 ? { start: p3[0].primaryAge, end: p3[p3.length - 1].primaryAge } : null;
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const row = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-slate-700/50 text-white min-w-[240px]">
          <div className="flex justify-between items-center mb-3">
            <p className="font-bold text-sm tracking-wide">Age {label}</p>
            <span className={`px-2 py-0.5 text-[9px] rounded uppercase font-bold border ${row.phaseColor.replace('text-', 'text-').replace('bg-', 'bg-').replace('border-', 'border-')}`}>
              {row.phaseName.split(':')[0]}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Total Portfolio</span>
              <span className="font-mono font-bold text-emerald-400">{formatCurrency(row.endBalance)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Cash Reserves</span>
              <span className="font-mono font-bold text-amber-400">{formatCurrency(row.cashBucket)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Invested Capital</span>
              <span className="font-mono font-bold text-blue-400">{formatCurrency(row.investedBucket)}</span>
            </div>
            <div className="h-px bg-slate-700 my-1" />
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Net Flow</span>
              <span className={`font-mono font-bold ${row.net > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {row.net > 0 ? '+' : ''}{formatCurrency(row.net)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 shrink-0">
        <KpiCard 
          title="Initial Cash Buffer" 
          value={formatCurrency(sim.initialCash)} 
          colorClass="text-amber-600 dark:text-amber-400"
          subtitle={`Covers ${sim.monthsCovered} months of net deficit`}
          icon={Wallet}
        />
        <KpiCard 
          title="Invested Nest Egg" 
          value={formatCurrency(sim.investedAtRetirement)} 
          colorClass="text-blue-700 dark:text-blue-400" 
          subtitle={`Total $${(sim.atRetirement/1000).toFixed(0)}k - Cash Buffer`}
          icon={TrendingUp}
        />
        <KpiCard 
          title="Initial Drawdown" 
          value={`${sim.drawdownPercent.toFixed(1)}%`} 
          colorClass={sim.drawdownPercent > 4.5 ? "text-red-600" : sim.drawdownPercent > 3.5 ? "text-amber-600" : "text-emerald-600"} 
          subtitle="Year 1 Net Portfolio Withdrawal"
          icon={ArrowDownToLine}
        />
        <KpiCard 
          title="Legacy Balance (Age 80)" 
          value={formatCurrency(sim.legacy)} 
          colorClass={sim.isExhausted ? "text-red-600" : "text-emerald-700 dark:text-emerald-400"} 
          subtitle={sim.isExhausted ? `Exhausted at Age ${sim.exhaustionAge}` : "Terminal safety net"}
          icon={ShieldCheck}
        />
        <KpiCard
          title="Target Retirement"
          value={`Age ${config.targetRetirementAge}`}
          colorClass="text-slate-900 dark:text-slate-100"
          subtitle={`${Math.max(0, config.targetRetirementAge - config.primaryCurrentAge)} years to go`}
          icon={Clock}
        />
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">Algorithmic Bucket Breakdown</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Optimized split at Target Retirement Age ({config.targetRetirementAge}).
            </p>
          </div>
          {config.autoOptimize && (
            <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md">
              Advisor Managed
            </span>
          )}
        </div>
        
        <div className="flex w-full h-4 rounded-full overflow-hidden mb-6 bg-slate-100 dark:bg-slate-700">
          <div style={{ width: `${(sim.bucket1Retirement / sim.atRetirement) * 100}%` }} className="bg-amber-400"></div>
          <div style={{ width: `${(sim.bucket2Retirement / sim.atRetirement) * 100}%` }} className="bg-sky-400"></div>
          <div style={{ width: `${(sim.bucket3Retirement / sim.atRetirement) * 100}%` }} className="bg-blue-600 dark:bg-blue-500"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4">
            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest mb-1">Bucket 1</h4>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">{formatCurrency(sim.bucket1Retirement)}</div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">Paycheck Buffer (Cash/Stable)</p>
          </div>
          <div className="bg-sky-50 dark:bg-sky-900/10 border border-sky-200 dark:border-sky-900/50 rounded-xl p-4">
            <h4 className="text-xs font-bold text-sky-800 dark:text-sky-400 uppercase tracking-widest mb-1">Bucket 2</h4>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">{formatCurrency(sim.bucket2Retirement)}</div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">Emergency & Transition</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/50 rounded-xl p-4">
            <h4 className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-widest mb-1">Bucket 3</h4>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">{formatCurrency(sim.bucket3Retirement)}</div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">Longevity Growth Engine</p>
          </div>
        </div>
        
        {config.autoOptimize && (
          <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
              <strong className="text-slate-900 dark:text-slate-200">Advisor Insight:</strong> 
              {sim.bucket3Retirement === 0 ? (
                <span className="text-red-600 dark:text-red-400 ml-1">Warning: Your required cash reserves exceed your total portfolio balance at retirement. Bucket 3 is depleted.</span>
              ) : (
                <span className="ml-1">
                  Based on your <strong>{config.riskProfile}</strong> risk profile and a <strong>{sim.gapYears}-year</strong> gap until Social Security starts, 
                  we've isolated exactly {formatCurrency(sim.bucket1Retirement)} (Bucket 1) to fund your early retirement deficits completely insulated from market volatility. 
                  Bucket 2 secures your emergency floor. This allows the remaining {formatCurrency(sim.bucket3Retirement)} (Bucket 3) to remain 100% invested for long-term growth.
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col h-[400px] shadow-sm mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">Portfolio Trajectory & Phases</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Inflation-adjusted projection of your net worth across retirement phases.</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phase 1 (Full Bridge)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phase 2 (Partial)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phase 3 (Surplus)</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 w-full bg-slate-50/50 dark:bg-slate-900/50 rounded-xl relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 15, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="primaryAge" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={20} />
              <YAxis tickFormatter={(v) => `$${(v/1000)}k`} tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} width={60} />
              
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />
              
              {/* @ts-ignore */}
              {phase1 && <ReferenceArea x1={phase1.start} x2={phase1.end} fill="#fef3c7" fillOpacity={0.4} />}
              {/* @ts-ignore */}
              {phase2 && <ReferenceArea x1={phase2.start} x2={phase2.end} fill="#eff6ff" fillOpacity={0.4} />}
              {/* @ts-ignore */}
              {phase3 && <ReferenceArea x1={phase3.start} x2={phase3.end} fill="#ecfdf5" fillOpacity={0.4} />}
              
              <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} opacity={0.6} />
              
              <Line type="monotone" dataKey="endBalance" stroke="#0f172a" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#0f172a', stroke: '#fff', strokeWidth: 2 }} className="dark:stroke-slate-100" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col shrink-0 max-h-[500px] shadow-sm mb-8">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">Ledger Matrix</h3>
        </div>
        <div className="overflow-x-auto overflow-y-auto h-full rounded-b-2xl custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-slate-900 text-white sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-4 text-[10px] uppercase tracking-wider font-bold">Ages (P/S)</th>
                <th className="p-4 text-[10px] uppercase tracking-wider font-bold">Phase</th>
                <th className="p-4 text-[10px] uppercase tracking-wider font-bold text-right">Start Bal</th>
                <th className="p-4 text-[10px] uppercase tracking-wider font-bold text-right">Ann. Growth</th>
                <th className="p-4 text-[10px] uppercase tracking-wider font-bold text-right">Net Flow</th>
                <th className="p-4 text-[10px] uppercase tracking-wider font-bold text-right text-amber-300">Cash Reserves</th>
                <th className="p-4 text-[10px] uppercase tracking-wider font-bold text-right text-blue-300">Invested Capital</th>
                <th className="p-4 text-[10px] uppercase tracking-wider font-bold text-right">Total Net Worth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {data.map((row) => (
                <tr key={row.primaryAge} className={cn("hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors", 
                  row.phaseName.includes('Phase 1') ? 'bg-amber-50/20 dark:bg-amber-900/10' :
                  row.phaseName.includes('Phase 2') ? 'bg-blue-50/20 dark:bg-blue-900/10' :
                  row.phaseName.includes('Phase 3') ? 'bg-emerald-50/20 dark:bg-emerald-900/10' : 'bg-transparent')}>
                  <td className="p-4 text-xs font-medium whitespace-nowrap text-slate-800 dark:text-slate-100">
                    {row.primaryAge} / {row.spouseAge}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-[9px] rounded uppercase font-bold border ${row.phaseColor}`}>
                      {row.phaseName.split(':')[0]}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-right font-mono text-slate-700 dark:text-slate-300">{formatCurrency(row.startBalance)}</td>
                  <td className="p-4 text-xs text-right font-mono text-emerald-600 dark:text-emerald-400">+{formatCurrency(row.growthAmount)}</td>
                  <td className={`p-4 text-xs text-right font-mono ${row.net > 0 ? 'text-emerald-600 dark:text-emerald-400' : row.net < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {row.net !== 0 ? formatCurrency(row.net) : '-'}
                  </td>
                  <td className="p-4 text-xs text-right font-mono font-medium text-amber-700 dark:text-amber-400">{formatCurrency(row.cashBucket)}</td>
                  <td className="p-4 text-xs text-right font-mono font-medium text-blue-700 dark:text-blue-400">{formatCurrency(row.investedBucket)}</td>
                  <td className="p-4 text-xs text-right font-mono font-bold text-slate-900 dark:text-slate-50">{formatCurrency(row.endBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
