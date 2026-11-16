import React from 'react';
import { STATUS_COLORS } from '../../constants';

export const StatusBadge = ({ status, className = '' }) => {
  const colorClass =
    STATUS_COLORS[status] ||
    STATUS_COLORS[String(status || '').toLowerCase()] ||
    'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${colorClass} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {status || 'Unknown'}
    </span>
  );
};

export default StatusBadge;
