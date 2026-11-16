import React from 'react';

export const LoadingSpinner = ({ label = 'Loading HomeServe data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-[#2563EB] rounded-full animate-spin" />
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
};

export default LoadingSpinner;
