import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { KpiCard } from '../ui';
import { ResilienceScore } from '../../lib/scoring';
import { Shield, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export default function ResilienceView({ score }: { score: ResilienceScore }) {
  const radarData = [
    { subject: 'Financial Security', A: score.financialSecurity, fullMark: 100 },
    { subject: 'Income Stability', A: score.incomeStability, fullMark: 100 },
    { subject: 'Liquidity', A: score.liquidity, fullMark: 100 },
    { subject: 'Inflation Protection', A: score.inflationProtection, fullMark: 100 },
    { subject: 'Longevity Protection', A: score.longevityProtection, fullMark: 100 },
    { subject: 'Emergency Readiness', A: score.emergencyReadiness, fullMark: 100 },
    { subject: 'Legacy Potential', A: score.legacyPotential, fullMark: 100 },
  ];

  const getScoreColor = (val: number) => {
    if (val >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (val >= 75) return 'text-amber-500 dark:text-amber-400';
    return 'text-red-500 dark:text-red-400';
  };

  const getScoreText = (val: number) => {
    if (val >= 90) return 'Excellent';
    if (val >= 75) return 'Good';
    if (val >= 60) return 'Fair';
    return 'Needs Attention';
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 text-white rounded-2xl p-8 flex flex-col justify-center items-center relative overflow-hidden shadow-xl lg:col-span-1">
          <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 p-32 bg-blue-500/10 rounded-full blur-3xl"></div>
          
          <Shield className="w-12 h-12 text-slate-400 mb-4 relative z-10" />
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 relative z-10">Overall Resilience</h2>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className={`text-6xl font-bold font-mono tracking-tighter ${getScoreColor(score.overall)}`}>
              {score.overall}
            </span>
            <span className="text-xl text-slate-500 font-mono">/100</span>
          </div>
          <p className="mt-4 text-lg font-medium text-slate-300 relative z-10">{getScoreText(score.overall)}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 lg:col-span-2 shadow-sm flex flex-col items-center">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 self-start mb-4">Resilience Dimensions</h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="A" stroke="#0f172a" fill="#3b82f6" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">Detailed Breakdown</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {radarData.map(item => (
            <div key={item.subject} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
              <div className="flex items-center gap-3">
                {item.A >= 90 ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : 
                 item.A >= 75 ? <Info className="w-5 h-5 text-amber-500" /> : 
                 <AlertTriangle className="w-5 h-5 text-red-500" />}
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{item.subject}</span>
              </div>
              <div className="flex items-center gap-4 w-1/3">
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      item.A >= 90 ? 'bg-emerald-500' : item.A >= 75 ? 'bg-amber-400' : 'bg-red-500'
                    }`}
                    style={{ width: `${item.A}%` }}
                  />
                </div>
                <span className="font-mono text-sm font-bold w-8 text-right dark:text-slate-200">{item.A}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
