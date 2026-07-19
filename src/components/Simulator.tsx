import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { Wallet, TrendingDown, Landmark, Activity, CalendarDays } from 'lucide-react';
import { cn } from '../lib/utils';

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

export default function Simulator() {
  const [config, setConfig] = useState({
    primaryCurrentAge: 57,
    targetRetirementAge: 59,
    primarySSAge: 62,
    primarySSAmount: 1600,
    spouseCurrentAge: 50,
    spouseSSAge: 62,
    spouseSSAmount: 1000,
    currentPortfolio: 220000,
    growthRate: 5.0,
    livingExpenses: 1800,
    relocationExpense: 15000,
  });

  const handleChange = (key: keyof typeof config, value: number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const data = useMemo(() => {
    let currentBalance = config.currentPortfolio;
    const result = [];

    for (let age = config.primaryCurrentAge; age <= 95; age++) {
      const spouseAge = config.spouseCurrentAge + (age - config.primaryCurrentAge);
      const isRetired = age >= config.targetRetirementAge;
      
      const oneTime = age === config.targetRetirementAge ? config.relocationExpense : 0;
      
      const pSS = age >= config.primarySSAge ? config.primarySSAmount * 12 : 0;
      const sSS = spouseAge >= config.spouseSSAge ? config.spouseSSAmount * 12 : 0;
      const income = isRetired ? pSS + sSS : 0;
      
      const exp = isRetired ? config.livingExpenses * 12 : 0;
      const net = income - exp;
      
      const startBalance = currentBalance;
      const balanceAfterCashFlow = startBalance - oneTime + net;
      let endBalance = balanceAfterCashFlow * (1 + config.growthRate / 100);
      if (endBalance < 0) endBalance = 0;

      let phaseName = 'Pre-Retirement';
      let phaseColor = 'text-slate-500 bg-slate-100 border-slate-200';
      
      if (isRetired) {
        if (income === 0) {
          phaseName = 'Phase 1: Full Bridge';
          phaseColor = 'text-amber-700 bg-amber-50 border-amber-200';
        } else if (net < 0) {
          phaseName = 'Phase 2: Partial Bridge';
          phaseColor = 'text-blue-700 bg-blue-50 border-blue-200';
        } else {
          phaseName = 'Phase 3: Surplus Era';
          phaseColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
        }
      }

      result.push({
        primaryAge: age,
        spouseAge,
        isRetired,
        oneTime,
        income,
        exp,
        net,
        startBalance,
        endBalance,
        phaseName,
        phaseColor
      });

      currentBalance = endBalance;
    }
    return result;
  }, [config]);

  const kpis = useMemo(() => {
    const atRetirement = data.find(d => d.primaryAge === config.targetRetirementAge)?.startBalance || 0;
    const legacy = data[data.length - 1]?.endBalance || 0;
    const drawdown = data.reduce((acc, curr) => {
      let loss = curr.oneTime;
      if (curr.isRetired && curr.net < 0) {
        loss += Math.abs(curr.net);
      }
      return acc + loss;
    }, 0);
    return { atRetirement, legacy, drawdown };
  }, [data, config.targetRetirementAge]);

  const getPhaseBounds = (phaseName: string) => {
    const ages = data.filter(d => d.phaseName === phaseName).map(d => d.primaryAge);
    if (ages.length === 0) return null;
    return { start: Math.min(...ages), end: Math.max(...ages) };
  };

  const phase1 = getPhaseBounds('Phase 1: Full Bridge');
  const phase2 = getPhaseBounds('Phase 2: Partial Bridge');
  const phase3 = getPhaseBounds('Phase 3: Surplus Era');

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50 overflow-hidden text-slate-800">
      {/* Sidebar Controls */}
      <aside className="w-full lg:w-72 bg-white border-r border-slate-200 flex flex-col lg:h-full shrink-0">
        <div className="p-6 border-b border-slate-100 bg-slate-900 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Activity size={20} className="text-emerald-400" />
            <span className="font-bold tracking-tight text-lg">RetirePath AI</span>
          </div>
          <p className="text-xs text-slate-400">Longevity & Phase Planner</p>
        </div>

        <div className="flex-1 p-5 space-y-6 overflow-y-auto overflow-x-hidden">
          <FormGroup title="Timeline & Ages">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Primary Current" value={config.primaryCurrentAge} onChange={(v: number) => handleChange('primaryCurrentAge', v)} />
              <Input label="Target Ret." value={config.targetRetirementAge} onChange={(v: number) => handleChange('targetRetirementAge', v)} />
            </div>
            <Input label="Spouse Current Age" value={config.spouseCurrentAge} onChange={(v: number) => handleChange('spouseCurrentAge', v)} />
          </FormGroup>

        <FormGroup title="Assets & Growth">
          <Input label="Current Portfolio" value={config.currentPortfolio} onChange={(v: number) => handleChange('currentPortfolio', v)} prefix="$" />
          <Input label="Expected Annual Growth" value={config.growthRate} onChange={(v: number) => handleChange('growthRate', v)} suffix="%" />
        </FormGroup>

        <FormGroup title="Social Security Income">
          <div className="space-y-4">
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase">Primary Earner</h4>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Start Age" value={config.primarySSAge} onChange={(v: number) => handleChange('primarySSAge', v)} />
                <Input label="Monthly Amount" value={config.primarySSAmount} onChange={(v: number) => handleChange('primarySSAmount', v)} prefix="$" />
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase">Spouse</h4>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Start Age" value={config.spouseSSAge} onChange={(v: number) => handleChange('spouseSSAge', v)} />
                <Input label="Monthly Amount" value={config.spouseSSAmount} onChange={(v: number) => handleChange('spouseSSAmount', v)} prefix="$" />
              </div>
            </div>
          </div>
        </FormGroup>

        <FormGroup title="Monthly Expenses">
          <Input label="Living Budget" value={config.livingExpenses} onChange={(v: number) => handleChange('livingExpenses', v)} prefix="$" />
          <Input label="Transition Cost (One-time)" value={config.relocationExpense} onChange={(v: number) => handleChange('relocationExpense', v)} prefix="$" />
        </FormGroup>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* KPI Header Section */}
        <div className="p-6 bg-slate-50 grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
          <KpiCard 
            title="Portfolio at Retirement" 
            value={formatCurrency(kpis.atRetirement)} 
            colorClass="text-slate-900"
            subtitle="+ Projected Growth"
          />
          <KpiCard 
            title="Transition Drawdown" 
            value={formatCurrency(kpis.drawdown)} 
            colorClass="text-slate-900"
            subtitle="Phase 1 & 2 Support"
          />
          <KpiCard 
            title="Legacy Balance (Age 95)" 
            value={formatCurrency(kpis.legacy)} 
            colorClass="text-emerald-700" 
            subtitle="Surplus Compound Enabled"
          />
        </div>

        {/* Chart Area */}
        <div className="px-6 flex-1 flex flex-col overflow-y-auto pb-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col mb-6 min-h-[300px] shrink-0">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-sm font-bold text-slate-800">Projected Portfolio Trajectory (Current Age to 95)</h2>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                  <span className="text-[11px] text-slate-500 font-medium">Bridge Gap</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                  <span className="text-[11px] text-slate-500 font-medium">Surplus Era</span>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full bg-slate-50 rounded-lg">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="primaryAge" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => `$${(v/1000)}k`} tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} width={80} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Balance']}
                  labelFormatter={(label) => `Primary Age: ${label}`}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                
                {phase1 && <ReferenceArea x1={phase1.start} x2={phase1.end} fill="#fef3c7" fillOpacity={0.4} />}
                {phase2 && <ReferenceArea x1={phase2.start} x2={phase2.end} fill="#eff6ff" fillOpacity={0.4} />}
                {phase3 && <ReferenceArea x1={phase3.start} x2={phase3.end} fill="#ecfdf5" fillOpacity={0.4} />}
                
                <Line type="monotone" dataKey="endBalance" stroke="#334155" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#0f172a' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lifecycle Phases Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 shrink-0">
          <PhaseCard title="Phase 1: Full Bridge" desc="Age 59-61. Zero external income. Full expense withdrawal." colorClass="border-amber-200 bg-amber-50" titleClass="text-amber-800" />
          <PhaseCard title="Phase 2: Partial Bridge" desc="Age 62-68. Primary Social Security starts. Net gap reduced." colorClass="border-blue-200 bg-blue-50" titleClass="text-blue-800" />
          <PhaseCard title="Phase 3: Surplus Era" desc="Age 69+. Combined SS exceeds living expenses. Portfolio compounds." colorClass="border-emerald-200 bg-emerald-50" titleClass="text-emerald-800" />
        </div>

        {/* Matrix Table */}
        <div className="bg-white border border-slate-200 rounded-t-xl overflow-hidden flex flex-col shrink-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="p-3 text-[10px] uppercase tracking-wider font-bold">Ages (P / S)</th>
                  <th className="p-3 text-[10px] uppercase tracking-wider font-bold">Phase</th>
                  <th className="p-3 text-[10px] uppercase tracking-wider font-bold text-right">Start Bal</th>
                  <th className="p-3 text-[10px] uppercase tracking-wider font-bold text-right">One-Time</th>
                  <th className="p-3 text-[10px] uppercase tracking-wider font-bold text-right">Net Cash Flow</th>
                  <th className="p-3 text-[10px] uppercase tracking-wider font-bold text-right">End Bal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((row) => (
                  <tr key={row.primaryAge} className={cn("hover:bg-slate-50 transition-colors", 
                    row.phaseName.includes('Phase 1') ? 'bg-amber-50/30' :
                    row.phaseName.includes('Phase 2') ? 'bg-blue-50/30' :
                    row.phaseName.includes('Phase 3') ? 'bg-emerald-50/30' : '')}>
                    <td className="p-3 text-xs font-medium whitespace-nowrap">
                      {row.primaryAge} / {row.spouseAge}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-[10px] rounded uppercase font-bold border ${row.phaseColor}`}>
                        {row.phaseName.split(':')[0]}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-right font-mono">{formatCurrency(row.startBalance)}</td>
                    <td className={`p-3 text-xs text-right font-mono ${row.oneTime > 0 ? 'text-red-600' : 'text-slate-400'}`}>{row.oneTime > 0 ? `-${formatCurrency(row.oneTime)}` : '-'}</td>
                    <td className={`p-3 text-xs text-right font-mono ${row.net > 0 ? 'text-emerald-600' : row.net < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                      {row.net !== 0 ? formatCurrency(row.net) : '-'}
                    </td>
                    <td className="p-3 text-xs text-right font-mono font-semibold">{formatCurrency(row.endBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}

// Mini Components

const FormGroup = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div>
    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">{title}</label>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const Input = ({ label, value, onChange, prefix, suffix, type="number" }: any) => (
  <div className="space-y-1.5">
    <span className="text-xs font-medium text-slate-600">{label}</span>
    <div className="relative">
      {prefix && <span className="absolute left-3 top-2.5 text-slate-400 text-sm">{prefix}</span>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          "w-full text-sm p-2 border border-slate-200 rounded bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium text-slate-900",
          prefix ? 'pl-7' : '',
          suffix ? 'pr-7' : ''
        )}
      />
      {suffix && <span className="absolute right-3 top-2.5 text-slate-400 text-sm">{suffix}</span>}
    </div>
  </div>
);

const KpiCard = ({ title, value, colorClass, subtitle }: any) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
      {title}
    </p>
    <div className={cn("text-2xl font-bold font-mono", colorClass || "text-slate-900")}>
      {value}
    </div>
    {subtitle && (
      <p className="text-[10px] text-slate-400 mt-2">
        {subtitle}
      </p>
    )}
  </div>
);

const PhaseCard = ({ title, desc, colorClass, titleClass }: any) => (
  <div className={`p-3 rounded-lg border ${colorClass}`}>
    <div className={`text-[10px] font-bold uppercase mb-1 ${titleClass}`}>{title}</div>
    <p className={`text-[11px] leading-tight ${titleClass}`}>{desc}</p>
  </div>
);
