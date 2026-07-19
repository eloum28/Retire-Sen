import React from 'react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const FormGroup = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div>
    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">{title}</label>
    <div className="bg-slate-50/50 border border-slate-200 p-4 rounded-xl space-y-4 shadow-sm dark:bg-slate-800/50 dark:border-slate-700">
      {children}
    </div>
  </div>
);

export const Input = ({ label, value, onChange, prefix, suffix, min, max, step = 1 }: any) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center">
      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>
      <span className="text-xs font-mono font-semibold text-slate-900 dark:text-slate-100">
        {prefix}{value.toLocaleString()}{suffix}
      </span>
    </div>
    
    <div className="relative">
      {min !== undefined && max !== undefined ? (
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-700 hover:accent-emerald-600 transition-all mt-1"
        />
      ) : (
        <div className="relative mt-1">
          {prefix && <span className="absolute left-3 top-2 text-slate-400 text-sm font-mono">{prefix}</span>}
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className={cn(
              "w-full text-sm p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono font-medium text-slate-900 shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100",
              prefix ? 'pl-7' : '',
              suffix ? 'pr-7' : ''
            )}
          />
          {suffix && <span className="absolute right-3 top-2 text-slate-400 text-sm font-mono">{suffix}</span>}
        </div>
      )}
    </div>
  </div>
);

export const KpiCard = ({ title, value, colorClass, subtitle, icon: Icon }: any) => (
  <div className="bg-white dark:bg-slate-800 p-4 lg:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-2 relative z-10">
      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {title}
      </p>
      {Icon && <Icon className="w-4 h-4 text-slate-400 opacity-50" />}
    </div>
    <div className={cn("text-2xl font-bold font-mono tracking-tight relative z-10", colorClass || "text-slate-900 dark:text-slate-50")}>
      {value}
    </div>
    {subtitle && (
      <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium relative z-10">
        {subtitle}
      </div>
    )}
  </div>
);

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};
