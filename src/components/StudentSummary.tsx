import React from 'react';
import { Student, LogEntry, Subject } from '../types';

interface StudentSummaryProps {
  student: Student;
  logs: LogEntry[];
  isMonthly?: boolean;
}

export const StudentSummary: React.FC<StudentSummaryProps> = ({ student, logs }) => {
  const totals = { [Subject.MATH]: 0, [Subject.ENGLISH]: 0, [Subject.TASK_COMPLETION]: 0 };
  logs.forEach(l => { if(totals[l.subject] !== undefined) totals[l.subject] += l.minutes; });

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <h4 className="text-lg font-black text-slate-800 mb-4">{student.name}</h4>
      <div className="space-y-2">
        {Object.entries(totals).map(([sub, mins]) => (
          <div key={sub} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{sub}</span>
            <span className="font-black text-slate-800">{mins}m</span>
          </div>
        ))}
      </div>
    </div>
  );
};
