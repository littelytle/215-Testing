
import React, { useState, useMemo } from 'react';
import { Student, LogEntry, Subject } from '../types';
import { Button } from './Button';
import { GET_STAFF_COLOR } from '../constants';

interface StudentSummaryProps {
  student: Student;
  logs: LogEntry[];
  isMonthly?: boolean;
  onEdit?: (student: Student) => void;
}

export const StudentSummary: React.FC<StudentSummaryProps> = ({ student, logs, isMonthly, onEdit }) => {
  const [activeSubject, setActiveSubject] = useState<Subject>(Subject.MATH);
  const [showNotes, setShowNotes] = useState(false);

  // Filter logs for the active subject (already filtered by period in App.tsx)
  const subjectLogs = useMemo(() => {
    return logs.filter(l => l.subject === activeSubject);
  }, [logs, activeSubject]);

  const subjectMinutes = subjectLogs.reduce((acc, curr) => acc + curr.minutes, 0);
  
  // Adjusted goal if monthly view
  const baseWeeklyGoal = student.subjectGoals[activeSubject] || 0;
  const subjectGoal = isMonthly ? baseWeeklyGoal * 4 : baseWeeklyGoal;
  
  const isGoalAccomplished = subjectGoal > 0 && subjectMinutes >= subjectGoal;

  // Group minutes by staff for the segmented progress bar
  const staffSegments = useMemo(() => {
    const staffMap: Record<string, number> = {};
    subjectLogs.forEach(log => {
      const name = log.staffName || 'Unknown';
      staffMap[name] = (staffMap[name] || 0) + log.minutes;
    });

    const uniqueStaff = Object.keys(staffMap).sort();
    return uniqueStaff.map((name) => ({
      name,
      minutes: staffMap[name],
      color: GET_STAFF_COLOR(name),
      percentage: subjectGoal > 0 ? (staffMap[name] / subjectGoal) * 100 : 0
    }));
  }, [subjectLogs, subjectGoal]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow overflow-hidden group/card relative">
      {/* Subject Switcher Header */}
      <div className="flex bg-slate-50 border-b border-slate-100 p-1">
        {Object.values(Subject).map(sub => (
          <button
            key={sub}
            onClick={() => {
              setActiveSubject(sub);
              setShowNotes(false);
            }}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
              activeSubject === sub 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {sub}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 group/title">
              <h3 className="text-xl font-black text-slate-900 leading-tight">{student.name}</h3>
              {onEdit && (
                <button 
                  onClick={() => onEdit(student)}
                  className="opacity-0 group-hover/card:opacity-100 transition-opacity p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600"
                  title="Edit Student"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                </button>
              )}
            </div>
            <p className="text-sm text-slate-500 font-medium">{activeSubject} Goal: {subjectGoal}m/{isMonthly ? 'mo' : 'wk'}</p>
          </div>
          <div className="text-right flex items-center gap-2">
            <div className="flex flex-col items-end">
              <div className="text-3xl font-black text-slate-900 leading-none">{subjectMinutes}m</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Logged</div>
            </div>
            {isGoalAccomplished && (
              <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xl shadow-lg shadow-emerald-200 shrink-0">
                ✓
              </div>
            )}
          </div>
        </div>

        {/* Segmented Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
             <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{activeSubject} Progress</div>
             <div className="text-xs font-black text-slate-900">{subjectMinutes} / {subjectGoal}m</div>
          </div>
          
          <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner border border-slate-200">
            {staffSegments.length === 0 && (
              <div className="w-full flex items-center justify-center text-[10px] text-slate-300 font-bold uppercase italic">
                No logs recorded
              </div>
            )}
            {staffSegments.map((segment, idx) => (
              <div 
                key={idx}
                className={`${segment.color} h-full transition-all duration-500 border-r border-white/20 last:border-0 relative flex items-center justify-center group/segment overflow-hidden cursor-default`}
                style={{ width: `${Math.min(100, segment.percentage)}%` }}
              >
                <span className="opacity-0 group-hover/segment:opacity-100 text-[10px] text-white font-black drop-shadow-md transition-opacity absolute inset-0 flex items-center justify-center pointer-events-none">
                  {segment.minutes}m
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {staffSegments.map((segment, idx) => (
              <div key={idx} className="flex items-center gap-1 group/legend cursor-help" title={`${segment.name}: ${segment.minutes}m`}>
                <div className={`w-2 h-2 rounded-full ${segment.color}`} />
                <span className="text-[9px] font-bold text-slate-500 truncate max-w-[120px] group-hover/legend:text-slate-900">
                  {segment.name} ({segment.minutes}m)
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            fullWidth 
            onClick={() => setShowNotes(!showNotes)}
            disabled={subjectLogs.length === 0}
          >
            {showNotes ? 'Hide Session Notes' : 'Show Session Notes'}
          </Button>

          {showNotes && (
            <div className="mt-2 space-y-2 max-h-[200px] overflow-y-auto pr-1 animate-in slide-in-from-top-2 duration-200">
              {subjectLogs.filter(l => l.notes).length === 0 ? (
                <div className="text-[10px] text-center text-slate-400 py-4 uppercase font-bold tracking-widest">No detailed notes logged</div>
              ) : (
                /* Fix: Access the .date property on both parameters (a and b) in the sort comparison to correctly create Date objects and avoid TypeScript overload errors. */
                subjectLogs.filter(l => l.notes).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-black text-indigo-500 uppercase">{log.staffName}</span>
                      <span className="text-slate-400 font-bold">{log.date} • {log.minutes}m</span>
                    </div>
                    <p className="text-xs text-slate-600 italic leading-relaxed">"{log.notes}"</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
