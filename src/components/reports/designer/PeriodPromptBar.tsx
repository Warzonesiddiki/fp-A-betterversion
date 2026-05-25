import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface PeriodPrompt {
  fiscalYear: string;
  quarter: string;
  month: string;
}

export interface PeriodPromptBarProps {
  value: PeriodPrompt;
  onChange: (prompt: PeriodPrompt) => void;
  className?: string;
}

const FISCAL_YEARS = ['FY 2024', 'FY 2025', 'FY 2026', 'FY 2027'];
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4', 'Full Year'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function PromptSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold whitespace-nowrap">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-slate-800 border border-slate-700 rounded-lg pl-3 pr-8 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

export function PeriodPromptBar({ value, onChange, className }: PeriodPromptBarProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 px-4 py-2 border-b border-slate-800 bg-slate-900/30',
        className
      )}
    >
      <Calendar className="h-4 w-4 text-blue-400 flex-shrink-0" />
      <PromptSelect
        label="Fiscal Year"
        value={value.fiscalYear}
        options={FISCAL_YEARS}
        onChange={(fiscalYear) => onChange({ ...value, fiscalYear })}
      />
      <PromptSelect
        label="Quarter"
        value={value.quarter}
        options={QUARTERS}
        onChange={(quarter) => onChange({ ...value, quarter })}
      />
      <PromptSelect
        label="Month"
        value={value.month}
        options={['All Months', ...MONTHS]}
        onChange={(month) => onChange({ ...value, month })}
      />
    </div>
  );
}
