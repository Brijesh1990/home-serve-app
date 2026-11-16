import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
  title = 'No records found',
  description = 'There are no items matching your current filter criteria.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center max-w-lg mx-auto my-6">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto mb-4">
        <Inbox className="w-7 h-7" />
      </div>
      <h4 className="text-lg font-bold text-slate-800 mb-1">{title}</h4>
      <p className="text-sm text-slate-500 mb-5">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-blue-700 transition cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
