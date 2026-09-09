import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, ChevronDown, Check, X } from 'lucide-react';

export const FIXED_AGE_GROUPS = ['0-5', '6-10', '11-15', '16-20'] as const;

export const OTHER_AGE_GROUPS = [
  '21-25',
  '26-30',
  '31-35',
  '36-40',
  '41-45',
  '46-50',
  '51-55',
  '56-60',
  '61-65',
  '66-70',
  '71-75',
  '76-80',
  '81-85',
  '86-90',
  '91-95',
  '96-100',
] as const;

export type FixedAgeGroup = typeof FIXED_AGE_GROUPS[number];
export type OtherAgeGroup = typeof OTHER_AGE_GROUPS[number];

interface AgeFilterControlsProps {
  ageQuery: string;
  onAgeChange: (newAge: string) => void;
  ageSort: 'none' | 'asc' | 'desc';
  onToggleSort: () => void;
  theme?: 'teal' | 'sky';
  idPrefix?: string;
}

export const AgeFilterControls: React.FC<AgeFilterControlsProps> = ({
  ageQuery,
  onAgeChange,
  ageSort,
  onToggleSort,
  theme = 'teal',
  idPrefix = 'age',
}) => {
  const [showOthers, setShowOthers] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowOthers(false);
      }
    }
    if (showOthers) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOthers]);

  const isOtherActive = (OTHER_AGE_GROUPS as readonly string[]).includes(ageQuery);

  const colors = {
    teal: {
      activeBg: 'bg-teal-600 text-white shadow-xs',
      activeBorder: 'border-teal-500 bg-teal-50/70 text-teal-900 ring-2 ring-teal-500/20',
      activeBtn: 'bg-teal-600 text-white border-teal-700 shadow-xs',
      hoverPill: 'hover:bg-teal-50 hover:text-teal-700',
      tagBg: 'bg-teal-700 text-white',
      focusRing: 'focus:ring-teal-500/20 focus:border-teal-500',
      accentText: 'text-teal-600',
    },
    sky: {
      activeBg: 'bg-sky-600 text-white shadow-xs',
      activeBorder: 'border-sky-500 bg-sky-50/70 text-sky-900 ring-2 ring-sky-500/20',
      activeBtn: 'bg-sky-600 text-white border-sky-700 shadow-xs',
      hoverPill: 'hover:bg-sky-50 hover:text-sky-700',
      tagBg: 'bg-sky-700 text-white',
      focusRing: 'focus:ring-sky-500/20 focus:border-sky-500',
      accentText: 'text-sky-600',
    },
  }[theme];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Age Input Box */}
      <div className="relative flex items-center">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs font-bold">
          Age
        </span>
        <input
          id={`${idPrefix}-input`}
          type="text"
          placeholder="e.g. 0-5"
          value={ageQuery}
          onChange={(e) => onAgeChange(e.target.value)}
          className={`pl-11 pr-7 py-2.5 w-32 sm:w-36 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
            ageQuery ? colors.activeBorder : `border-slate-200 ${colors.focusRing}`
          }`}
          title="Filter by patient age or age group (e.g. 0-5, 6-10, 11-15, 16-20, 21-25)"
        />
        {ageQuery && (
          <button
            type="button"
            onClick={() => onAgeChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
            title="Clear age filter"
          >
            ×
          </button>
        )}
      </div>

      {/* Sort Age Toggle Button */}
      <button
        id={`${idPrefix}-sort-btn`}
        type="button"
        onClick={onToggleSort}
        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
          ageSort !== 'none'
            ? colors.activeBtn
            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
        title="Toggle age sorting: Youngest first / Oldest first"
      >
        <ArrowUpDown className="w-3.5 h-3.5" />
        <span>
          {ageSort === 'asc'
            ? 'Age: Youngest ↑'
            : ageSort === 'desc'
            ? 'Age: Oldest ↓'
            : 'Sort Age'}
        </span>
      </button>

      {/* Age Group Buttons: 0-5, 6-10, 11-15, 16-20, followed by "Others" until 100 */}
      <div className="flex items-center gap-1.5">
        {/* Fixed first boxes: 0-5, 6-10, 11-15, 16-20 */}
        {FIXED_AGE_GROUPS.map((preset) => {
          const isSelected = ageQuery === preset;
          return (
            <button
              key={preset}
              id={`${idPrefix}-preset-${preset}`}
              type="button"
              onClick={() => onAgeChange(isSelected ? '' : preset)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                isSelected
                  ? colors.activeBg + ' border-transparent'
                  : `bg-slate-100 text-slate-700 border-slate-200/60 ${colors.hoverPill}`
              }`}
              title={`Filter patients aged ${preset}`}
            >
              {preset}
            </button>
          );
        })}

        {/* "Others" Option: Contains subsequent age groups up to 100 */}
        <div className="relative" ref={dropdownRef}>
          <button
            id={`${idPrefix}-others-btn`}
            type="button"
            onClick={() => setShowOthers((prev) => !prev)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
              isOtherActive
                ? colors.activeBg + ' border-transparent'
                : `bg-slate-100 text-slate-700 border-slate-200/60 ${colors.hoverPill}`
            }`}
            title="Browse more age groups from 21 up to 100"
          >
            <span>{isOtherActive ? `Others: ${ageQuery}` : 'Others'}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-150 ${
                showOthers ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Others Dropdown Menu */}
          {showOthers && (
            <div className="absolute left-0 sm:right-0 sm:left-auto mt-1.5 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Other Age Groups</h4>
                  <p className="text-[10px] text-slate-400">5-year intervals up to 100</p>
                </div>
                {isOtherActive && (
                  <button
                    type="button"
                    onClick={() => {
                      onAgeChange('');
                      setShowOthers(false);
                    }}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              {/* Grid of age groups: 21-25 up to 96-100 */}
              <div className="grid grid-cols-4 gap-1.5">
                {OTHER_AGE_GROUPS.map((group) => {
                  const isSelected = ageQuery === group;
                  return (
                    <button
                      key={group}
                      type="button"
                      onClick={() => {
                        onAgeChange(isSelected ? '' : group);
                        setShowOthers(false);
                      }}
                      className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-0.5 border ${
                        isSelected
                          ? colors.activeBg + ' border-transparent'
                          : `bg-slate-50 text-slate-700 border-slate-200/70 hover:bg-slate-100 ${colors.hoverPill}`
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 shrink-0" />}
                      <span>{group}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span>Select bracket to filter directory</span>
                <button
                  type="button"
                  onClick={() => setShowOthers(false)}
                  className="font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
