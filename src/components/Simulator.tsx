import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine } from 'recharts';
import { Activity } from 'lucide-react';
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
    growthRate: 2.0,
    cashContingency: 50000,
    emergencyFund: 25000,
    cashYield: 3.0,
    livingExpenses: 1800,
    relocationExpense: 0,
    inflationRate: 2.0,
  });

  const handleChange = (key: keyof typeof config, value: number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const data = useMemo(() => {
    let currentBalance = config.currentPortfolio;
    const result = [];
    
    let currentLivingExpenses = config.livingExpenses;
    let currentPrimarySS = config.primarySSAmount;
    let currentSpouseSS = config.spouseSSAmount;

    let cashBucket = 0;
    let investedBucket = 0;

    for (let age = config.primaryCurrentAge; age <= 80; age++) {
      const spouseAge = config.spouseCurrentAge + (age - config.primaryCurrentAge);
      const isRetired = age >= config.targetRetirementAge;
      
      const oneTime = age === config.targetRetirementAge ? config.relocationExpense : 0;
      
      const pSS = age >= config.primarySSAge ? currentPrimarySS * 12 : 0;
      const sSS = spouseAge >= config.spouseSSAge ? currentSpouseSS * 12 : 0;
      const income = isRetired ? pSS + sSS : 0;
      
      const exp = isRetired ? currentLivingExpenses * 12 : 0;
      const net = income - exp;
      
      const startBalance = currentBalance;
      let endBalance = 0;
      let growthAmount = 0;

      if (age === config.targetRetirementAge) {
        let availableAfterOneTime = startBalance - oneTime;
        let desiredCash = config.cashContingency + config.emergencyFund;
        cashBucket = Math.min(desiredCash, Math.max(0, availableAfterOneTime));
        investedBucket = Math.max(0, availableAfterOneTime - cashBucket);
      }

      if (age < config.targetRetirementAge) {
        let balanceAfterCashFlow = startBalance - oneTime + net;
        growthAmount = Math.max(0, balanceAfterCashFlow) * (config.growthRate / 100);
        endBalance = balanceAfterCashFlow + growthAmount;
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

        let cashGrowthAmount = cashBucket * (config.cashYield / 100);
        cashBucket += cashGrowthAmount;

        let investedGrowthAmount = Math.max(0, investedBucket) * (config.growthRate / 100);
        investedBucket += investedGrowthAmount;

        growthAmount = cashGrowthAmount + investedGrowthAmount;
        endBalance = cashBucket + investedBucket;
        currentBalance = endBalance;
      }

      let phaseName = 'Pre-Retirement';
      let phaseColor = 'text-slate-500 bg-slate-200/50 border-slate-300/50';
      
      if (isRetired) {
        if (income === 0) {
          phaseName = 'Phase 1: Full Bridge';
          phaseColor = 'text-amber-700 bg-amber-100 border-amber-200';
        } else if (net < 0) {
          phaseName = 'Phase 2: Partial Bridge';
          phaseColor = 'text-blue-700 bg-blue-100 border-blue-200';
        } else {
          phaseName = 'Phase 3: Surplus Era';
          phaseColor = 'text-emerald-700 bg-emerald-100 border-emerald-200';
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
    
    const drawdownPercent = atRetirement > 0 ? ((drawdown / atRetirement) * 100).toFixed(1) : '0.0';
    
    const phase1Data = data.find(d => d.phaseName.includes('Phase 1'));
    const phase2Data = data.find(d => d.phaseName.includes('Phase 2'));
    const phase3Data = data.find(d => d.phaseName.includes('Phase 3'));

    const phase1Net = phase1Data ? phase1Data.net / 12 : -config.livingExpenses;
    const phase2Net = phase2Data ? phase2Data.net / 12 : (config.primarySSAmount - config.livingExpenses);
    const phase3Net = phase3Data ? phase3Data.net / 12 : (config.primarySSAmount + config.spouseSSAmount - config.livingExpenses);

    const initialCash = config.cashContingency + config.emergencyFund;
    const monthsCovered = Math.floor(initialCash / config.livingExpenses);

    return { 
      atRetirement, 
      legacy, 
      drawdown, 
      drawdownPercent,
      phase1Net,
      phase2Net,
      phase3Net,
      initialCash,
      monthsCovered
    };
  }, [data, config]);

  const getPhaseBounds = (phaseName: string) => {
    const ages = data.filter(d => d.phaseName === phaseName).map(d => d.primaryAge);
    if (ages.length === 0) return null;
    return { start: Math.min(...ages), end: Math.max(...ages) };
  };

  const phase1 = getPhaseBounds('Phase 1: Full Bridge');
  const phase2 = getPhaseBounds('Phase 2: Partial Bridge');
  const phase3 = getPhaseBounds('Phase 3: Surplus Era');

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const row = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-xl min-w-[200px]">
          <p className="font-bold text-slate-800 text-[11px] mb-1">Ages: {row.primaryAge} / {row.spouseAge}</p>
          <p className="text-[10px] font-bold mb-3 uppercase tracking-wider" style={{
            color: row.phaseName.includes('Phase 1') ? '#b45309' : 
                   row.phaseName.includes('Phase 2') ? '#1d4ed8' : 
                   row.phaseName.includes('Phase 3') ? '#047857' : '#64748b'
          }}>{row.phaseName}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <span className="text-slate-500">Growth:</span>
            <span className="font-mono font-medium text-emerald-600 text-right">+{formatCurrency(row.growthAmount)}</span>
            
            <span className="text-slate-500">Net Flow:</span>
            <span className={`font-mono font-medium text-right ${row.net > 0 ? 'text-emerald-600' : row.net < 0 ? 'text-red-600' : 'text-slate-500'}`}>
              {row.net > 0 ? '+' : ''}{formatCurrency(row.net)}
            </span>
            
            <span className="text-slate-800 font-bold mt-1 pt-1 border-t border-slate-100">End Bal:</span>
            <span className="text-slate-900 font-mono font-bold text-right mt-1 pt-1 border-t border-slate-100">{formatCurrency(row.endBalance)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50 overflow-hidden text-slate-800 font-sans">
      {/* Sidebar Controls */}
      <aside className="w-full lg:w-[340px] bg-white border-r border-slate-200 flex flex-col lg:h-full shrink-0 shadow-sm z-20 relative">
        <div className="p-6 border-b border-slate-100 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <Activity size={20} className="text-emerald-400" />
            <span className="font-bold tracking-tight text-lg">RetirePath AI</span>
          </div>
          <p className="text-xs text-slate-400">Longevity & Phase Planner</p>
        </div>

        <div className="flex-1 p-5 space-y-6 overflow-y-auto overflow-x-hidden">
          <FormGroup title="Timeline & Ages">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Primary Age" value={config.primaryCurrentAge} onChange={(v: number) => handleChange('primaryCurrentAge', v)} />
              <Input label="Target Ret." value={config.targetRetirementAge} onChange={(v: number) => handleChange('targetRetirementAge', v)} min={50} max={70} />
            </div>
            <Input label="Spouse Age" value={config.spouseCurrentAge} onChange={(v: number) => handleChange('spouseCurrentAge', v)} />
          </FormGroup>

          <FormGroup title="Assets & Growth">
            <Input label="Current Portfolio" value={config.currentPortfolio} onChange={(v: number) => handleChange('currentPortfolio', v)} prefix="$" />
            <Input label="Annual Growth Rate" value={config.growthRate} onChange={(v: number) => handleChange('growthRate', v)} suffix="%" min={0} max={12} step={0.1} />
          </FormGroup>

          <FormGroup title="Cash Buffer & Contingency Reserves (Bucket 1)">
            <Input label="Cash Contingency Fund" value={config.cashContingency} onChange={(v: number) => handleChange('cashContingency', v)} prefix="$" min={0} max={100000} step={1000} />
            <Input label="Emergency Fund" value={config.emergencyFund} onChange={(v: number) => handleChange('emergencyFund', v)} prefix="$" min={0} max={50000} step={1000} />
            <Input label="Cash Bucket Annual Yield" value={config.cashYield} onChange={(v: number) => handleChange('cashYield', v)} suffix="%" min={0} max={6} step={0.1} />
          </FormGroup>

          <FormGroup title="Social Security">
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase">Primary Earner</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Start Age" value={config.primarySSAge} onChange={(v: number) => handleChange('primarySSAge', v)} />
                  <Input label="Monthly Amount" value={config.primarySSAmount} onChange={(v: number) => handleChange('primarySSAmount', v)} prefix="$" />
                </div>
              </div>
              <div className="space-y-3 border-t border-slate-200 pt-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase">Spouse</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Start Age" value={config.spouseSSAge} onChange={(v: number) => handleChange('spouseSSAge', v)} />
                  <Input label="Monthly Amount" value={config.spouseSSAmount} onChange={(v: number) => handleChange('spouseSSAmount', v)} prefix="$" />
                </div>
              </div>
            </div>
          </FormGroup>

          <FormGroup title="Expenses & Adjustments">
            <Input label="Living Budget / mo" value={config.livingExpenses} onChange={(v: number) => handleChange('livingExpenses', v)} prefix="$" min={1000} max={10000} step={100} />
            <Input label="Inflation & COLA" value={config.inflationRate} onChange={(v: number) => handleChange('inflationRate', v)} suffix="%" min={0} max={5} step={0.1} />
            <Input label="One-time Transition" value={config.relocationExpense} onChange={(v: number) => handleChange('relocationExpense', v)} prefix="$" />
          </FormGroup>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        <div className="p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
          {/* KPI Header Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 shrink-0">
            <KpiCard 
              title="Initial Cash Reserves Buffer" 
              value={formatCurrency(kpis.initialCash)} 
              colorClass="text-slate-900"
              subtitle={`Covers ${kpis.monthsCovered} months of net deficit`}
            />
            <KpiCard 
              title="Nest Egg at Retirement" 
              value={formatCurrency(kpis.atRetirement)} 
              colorClass="text-slate-900"
              subtitle="Projected initial balance"
            />
            <KpiCard 
              title="Transition Drawdown" 
              value={formatCurrency(kpis.drawdown)} 
              colorClass="text-slate-900"
              subtitle={
                <span className="inline-flex items-center gap-1.5 mt-1">
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-700 font-bold leading-none border border-red-200">{kpis.drawdownPercent}%</span>
                  <span className="text-[10px]">of start balance</span>
                </span>
              }
            />
            <KpiCard 
              title="Legacy Balance (Age 80)" 
              value={formatCurrency(kpis.legacy)} 
              colorClass="text-emerald-700" 
              subtitle="Terminal safety net"
            />
            
            <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                Net Monthly Cash Flow
              </p>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider bg-amber-100 text-amber-800 font-bold border border-amber-200">Phase 1</span>
                  <span className="font-mono font-medium text-slate-700">{formatCurrency(kpis.phase1Net)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider bg-blue-100 text-blue-800 font-bold border border-blue-200">Phase 2</span>
                  <span className="font-mono font-medium text-slate-700">{formatCurrency(kpis.phase2Net)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">Phase 3</span>
                  <span className="font-mono font-medium text-slate-700">{kpis.phase3Net > 0 ? '+' : ''}{formatCurrency(kpis.phase3Net)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Area */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[360px] shrink-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-sm font-bold text-slate-800">Projected Portfolio Trajectory</h2>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pre-Retirement</span>
                </div>
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
            
            <div className="flex-1 w-full bg-slate-50/50 rounded-xl relative">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 15, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="primaryAge" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={20} />
                  <YAxis tickFormatter={(v) => `$${(v/1000)}k`} tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} width={60} />
                  
                  <Tooltip content={<CustomTooltip />} />
                  
                  {phase1 && <ReferenceArea x1={phase1.start} x2={phase1.end} fill="#fef3c7" fillOpacity={0.4} />}
                  {phase2 && <ReferenceArea x1={phase2.start} x2={phase2.end} fill="#eff6ff" fillOpacity={0.4} />}
                  {phase3 && <ReferenceArea x1={phase3.start} x2={phase3.end} fill="#ecfdf5" fillOpacity={0.4} />}
                  
                  <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} opacity={0.6} />
                  
                  <Line type="monotone" dataKey="endBalance" stroke="#0f172a" strokeWidth={2.5} dot={false} activeDot={{ r: 6, fill: '#0f172a', stroke: '#fff', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-white border border-slate-200 rounded-2xl flex flex-col shrink-0 max-h-[500px] shadow-sm mb-8">
            <div className="overflow-x-auto overflow-y-auto h-full rounded-2xl">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-slate-900 text-white sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="p-4 text-[10px] uppercase tracking-wider font-bold">Ages (P/S)</th>
                    <th className="p-4 text-[10px] uppercase tracking-wider font-bold">Phase</th>
                    <th className="p-4 text-[10px] uppercase tracking-wider font-bold text-right">Start Bal</th>
                    <th className="p-4 text-[10px] uppercase tracking-wider font-bold text-right">Ann. Growth</th>
                    <th className="p-4 text-[10px] uppercase tracking-wider font-bold text-right">One-Time</th>
                    <th className="p-4 text-[10px] uppercase tracking-wider font-bold text-right">Net Flow</th>
                    <th className="p-4 text-[10px] uppercase tracking-wider font-bold text-right text-amber-300">Cash Reserves</th>
                    <th className="p-4 text-[10px] uppercase tracking-wider font-bold text-right text-blue-300">Invested Capital</th>
                    <th className="p-4 text-[10px] uppercase tracking-wider font-bold text-right">Total Net Worth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((row) => (
                    <tr key={row.primaryAge} className={cn("hover:bg-slate-50 transition-colors", 
                      row.phaseName.includes('Phase 1') ? 'bg-amber-50/20' :
                      row.phaseName.includes('Phase 2') ? 'bg-blue-50/20' :
                      row.phaseName.includes('Phase 3') ? 'bg-emerald-50/20' : '')}>
                      <td className="p-4 text-xs font-medium whitespace-nowrap text-slate-600">
                        {row.primaryAge} / {row.spouseAge}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-[9px] rounded uppercase font-bold border ${row.phaseColor}`}>
                          {row.phaseName.split(':')[0]}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-right font-mono text-slate-500">{formatCurrency(row.startBalance)}</td>
                      <td className="p-4 text-xs text-right font-mono text-emerald-600">+{formatCurrency(row.growthAmount)}</td>
                      <td className={`p-4 text-xs text-right font-mono ${row.oneTime > 0 ? 'text-red-600' : 'text-slate-400'}`}>{row.oneTime > 0 ? `-${formatCurrency(row.oneTime)}` : '-'}</td>
                      <td className={`p-4 text-xs text-right font-mono ${row.net > 0 ? 'text-emerald-600' : row.net < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                        {row.net !== 0 ? formatCurrency(row.net) : '-'}
                      </td>
                      <td className="p-4 text-xs text-right font-mono font-medium text-amber-700">{formatCurrency(row.cashBucket)}</td>
                      <td className="p-4 text-xs text-right font-mono font-medium text-blue-700">{formatCurrency(row.investedBucket)}</td>
                      <td className="p-4 text-xs text-right font-mono font-bold text-slate-800">{formatCurrency(row.endBalance)}</td>
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
    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">{title}</label>
    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4 shadow-sm">
      {children}
    </div>
  </div>
);

const Input = ({ label, value, onChange, prefix, suffix, min, max, step = 1 }: any) => (
  <div className="space-y-1.5">
    <span className="text-xs font-medium text-slate-600 block">{label}</span>
    <div className="relative">
      {prefix && <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-mono">{prefix}</span>}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          "w-full text-sm p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono font-medium text-slate-900 shadow-sm",
          prefix ? 'pl-7' : '',
          suffix ? 'pr-7' : ''
        )}
      />
      {suffix && <span className="absolute right-3 top-2.5 text-slate-400 text-sm font-mono">{suffix}</span>}
    </div>
    {min !== undefined && max !== undefined && (
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-700 hover:accent-emerald-600 transition-all mt-1"
      />
    )}
  </div>
);

const KpiCard = ({ title, value, colorClass, subtitle }: any) => (
  <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
      {title}
    </p>
    <div className={cn("text-2xl font-bold font-mono tracking-tight", colorClass || "text-slate-900")}>
      {value}
    </div>
    {subtitle && (
      <div className="text-[10px] text-slate-400 mt-2 font-medium">
        {subtitle}
      </div>
    )}
  </div>
);
