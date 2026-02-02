
import React from 'react';
import { TaskStatus } from '../types';

interface StatusBadgeProps {
  status: TaskStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStyles = () => {
    switch (status) {
      case TaskStatus.Draft:
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case TaskStatus.Submitted:
        return 'bg-blue-100 text-blue-600 border-blue-200';
      case TaskStatus.Approved:
        return 'bg-green-100 text-green-600 border-green-200';
      case TaskStatus.Rejected:
        return 'bg-red-100 text-red-600 border-red-200';
      case TaskStatus.Completed:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 font-bold';
      case TaskStatus.PartiallyCompleted:
        return 'bg-amber-100 text-amber-700 border-amber-200 font-semibold';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap inline-block ${getStyles()}`}>
      {status}
    </span>
  );
};
