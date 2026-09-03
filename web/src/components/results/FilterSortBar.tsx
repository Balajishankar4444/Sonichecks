'use client';

import React from 'react';
import { Search, SlidersHorizontal, CheckCircle2, AlertTriangle, XCircle, Layers } from 'lucide-react';
import { QCStatus } from '@/types/qc';

export type FilterStatus = 'ALL' | 'PASS' | 'WARNING' | 'FAIL' | 'ERROR';
export type SortOption = 'NAME_ASC' | 'STATUS_ISSUES' | 'DURATION_DESC' | 'LUFS_DESC' | 'PEAK_DESC';

interface FilterSortBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: FilterStatus;
  onFilterChange: (filter: FilterStatus) => void;
  activeSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  counts: {
    all: number;
    passed: number;
    warnings: number;
    failed: number;
    errors: number;
  };
}

export default function FilterSortBar({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  activeSort,
  onSortChange,
  counts
}: FilterSortBarProps) {
  const filterTabs: { id: FilterStatus; label: string; count: number; icon: React.ReactNode }[] = [
    { id: 'ALL', label: 'All', count: counts.all, icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'PASS', label: 'Passed', count: counts.passed, icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'WARNING', label: 'Warnings', count: counts.warnings, icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'FAIL', label: 'Failed', count: counts.failed, icon: <XCircle className="w-3.5 h-3.5 text-rose-400" /> },
  ];

  if (counts.errors > 0) {
    filterTabs.push({
      id: 'ERROR',
      label: 'Errors',
      count: counts.errors,
      icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />
    });
  }

  return (
    <div className="w-full bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onFilterChange(tab.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2.5 flex-1 md:flex-initial">
          {/* Search Box */}
          <div className="relative flex-1 md:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search files..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 transition-colors"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={activeSort}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
            >
              <option value="NAME_ASC">Name (A-Z)</option>
              <option value="STATUS_ISSUES">Status (Issues First)</option>
              <option value="DURATION_DESC">Duration (Longest First)</option>
              <option value="LUFS_DESC">Loudness (Loudest First)</option>
              <option value="PEAK_DESC">Peak (Highest First)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
