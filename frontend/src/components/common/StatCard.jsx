import React from 'react';
import * as Icons from 'lucide-react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon = 'Activity',
  trend,
  trendUp = true,
  color = 'blue',
}) => {
  const IconComponent = Icons[icon] || Icons.Activity;

  const colorMap = {
    blue: 'bg-blue-50 text-[#2563EB] border-blue-100',
    indigo: 'bg-indigo-50 text-[#6366F1] border-indigo-100',
    emerald: 'bg-emerald-50 text-[#16A34A] border-emerald-100',
    amber: 'bg-amber-50 text-[#F59E0B] border-amber-100',
    red: 'bg-red-50 text-[#DC2626] border-red-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    cyan: 'bg-cyan-50 text-cyan-600 border-cyan-100',
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex items-start justify-between gap-4">
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
        {(subtitle || trend) && (
          <div className="flex items-center gap-2 pt-0.5">
            {trend && (
              <span
                className={`inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded ${
                  trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {trendUp ? '↑' : '↓'} {trend}
              </span>
            )}
            {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
          </div>
        )}
      </div>
      <div
        className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${
          colorMap[color] || colorMap.blue
        }`}
      >
        <IconComponent className="w-6 h-6" />
      </div>
    </div>
  );
};

export default StatCard;
