
import React, { useState, useEffect, useMemo } from 'react';
import { Subject, Student, LogEntry, Grade } from '../types';
import { INITIAL_STUDENTS, SUBJECT_COLORS } from '../constants';
import { LogWizard } from './LogWizard';
import { StudentSummary } from './StudentSummary';
import { Button } from './Button';
import { AddStudentModal } from './AddStudentModal';
import { Settings } from './Settings';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const getWeekRange = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d.setDate(diff));
  const end = new Date(d.setDate(diff + 6));
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
    label: `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  };
};

const App: React.FC = () => {
  // Fix: Explicitly cast JSON.parse result to Student[] to avoid 'unknown' inference
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('iep_students');
    return (saved ? JSON.parse(saved) : INITIAL_STUDENTS) as Student[];
  });
  // Fix: Explicitly cast JSON.parse result to LogEntry[] to avoid 'unknown' inference
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const saved = localStorage.getItem('iep_logs');
    return (saved ? JSON.parse(saved) : []) as LogEntry[];
  });
  const [syncUrl, setSyncUrl] = useState<string>(() => localStorage.getItem('iep_sync_url') || '');
  
  const [showWizard, setShowWizard] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [view, setView] = useState<'dashboard' | 'history' | 'settings'>('dashboard');
  const [activeGrade, setActiveGrade] = useState<Grade>('6th');

  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('iep_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('iep_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('iep_sync_url', syncUrl);
  }, [syncUrl]);

  const handleSaveLogs = async (newLogs: Omit<LogEntry, 'id' | 'timestamp'>[]) => {
    const formattedLogs: LogEntry[] = newLogs.map(log => ({
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    }));
    
    setLogs(prev => [...formattedLogs, ...prev]);
    setShowWizard(false);

    if (syncUrl.trim()) {
      try {
        await fetch(syncUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formattedLogs)
        });
      } catch (e) {
        console.error("Cloud Sync Failed:", e);
      }
    }
  };

  const handleAddStudent = (newStudentData: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...newStudentData,
      id: Math.random().toString(36).substr(2, 9),
    };
    setStudents(prev => [...prev, newStudent]);
    setShowAddStudent(false);
    setActiveGrade(newStudent.grade);
  };

  const handleUpdateStudent = (updatedStudentData: Omit<Student, 'id'>) => {
    if (!editingStudent) return;
    setStudents(prev => prev.map(s => 
      s.id === editingStudent.id ? { ...updatedStudentData, id: s.id } : s
    ));
    setEditingStudent(null);
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Staff', 'Student', 'Grade', 'Subject', 'Minutes', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => {
        const student = students.find(s => s.id === log.studentId);
        return [
          log.date,
          `"${log.staffName || 'Anonymous'}"`,
          `"${student?.name || 'Unknown'}"`,
          student?.grade || 'N/A',
          log.subject,
          log.minutes,
          `"${(log.notes || '').replace(/"/g, '""')}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `IEP_Team_Logs_${selectedMonth.replace(' ', '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fix: Explicitly type useMemo return as string[] to avoid 'unknown' key issues in map
  const monthsAvailable = useMemo<string[]>(() => {
    const months = new Set<string>();
    months.add(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));
    months.add("December 2025");
    months.add("January 2026");
    logs.forEach(log => {
      const d = new Date(log.date);
      months.add(d.toLocaleString('default', { month: 'long', year: 'numeric' }));
    });
    return Array.from(months).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [logs]);

  // Fix: Explicitly type useMemo return as [string, string][] to avoid 'unknown' destructuring errors
  const weeksInSelectedMonth = useMemo<[string, string][]>(() => {
    const weeks: Record<string, string> = {};
    logs.forEach(log => {
      const d = new Date(log.date);
      if (d.toLocaleString('default', { month: 'long', year: 'numeric' }) === selectedMonth) {
        const range = getWeekRange(d);
        weeks[range.start] = range.label;
      }
    });
    const currentViewDate = new Date(selectedMonth);
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    let currentIter = new Date(firstDayOfMonth);
    currentIter.setDate(currentIter.getDate() - ((currentIter.getDay() + 6) % 7));
    while (currentIter <= lastDayOfMonth) {
      const range = getWeekRange(new Date(currentIter));
      weeks[range.start] = range.label;
      currentIter.setDate(currentIter.getDate() + 7);
    }
    return Object.entries(weeks).sort((a, b) => a[0].localeCompare(b[0]));
  }, [logs, selectedMonth]);

  // Fix: Explicitly type useMemo return as LogEntry[]
  const filteredLogs = useMemo<LogEntry[]>(() => {
    return logs.filter(log => {
      const d = new Date(log.date);
      const logMonth = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (logMonth !== selectedMonth) return false;
      if (selectedWeek) {
        const range = getWeekRange(d);
        return range.start === selectedWeek;
      }
      return true;
    });
  }, [logs, selectedMonth, selectedWeek]);

  // Fix: Explicitly type totals and useMemo return to Record<Subject, number> to avoid index errors
  const subjectTotals = useMemo<Record<Subject, number>>(() => {
    const totals: Record<Subject, number> = { [Subject.MATH]: 0, [Subject.ENGLISH]: 0, [Subject.TASK_COMPLETION]: 0 };
    filteredLogs.forEach(l => { totals[l.subject] += l.minutes; });
    return totals;
  }, [filteredLogs]);

  // Fix: Cast Object.values to Subject[] to ensure correct indexing of subjectTotals
  const chartData = (Object.values(Subject) as Subject[]).map(sub => ({
    name: sub,
    minutes: subjectTotals[sub]
  }));

  const filteredStudents = students.filter(s => s.grade === activeGrade);

  return (
    <div className="min-h-screen pb-20 lg:pb-0 bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">I</div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">IEP MINUTE PRO</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className={view === 'dashboard' ? 'text-indigo-600 bg-indigo-50' : ''} onClick={() => setView('dashboard')}>Dashboard</Button>
            <Button variant="ghost" size="sm" className={view === 'history' ? 'text-indigo-600 bg-indigo-50' : ''} onClick={() => setView('history')}>Logs</Button>
            <Button variant="ghost" size="sm" className={view === 'settings' ? 'text-indigo-600 bg-indigo-50' : ''} onClick={() => setView('settings')}>Team Setup</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {showWizard ? (
          <LogWizard students={students} onSave={handleSaveLogs} onCancel={() => setShowWizard(false)} />
        ) : showAddStudent ? (
          <AddStudentModal onSave={handleAddStudent} onCancel={() => setShowAddStudent(false)} />
        ) : editingStudent ? (
          <AddStudentModal initialStudent={editingStudent} onSave={handleUpdateStudent} onCancel={() => setEditingStudent(null)} />
        ) : view === 'dashboard' ? (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-slate-900 leading-tight">Team Tracker</h2>
                <p className="text-slate-500 font-medium">Monitoring service delivery for {selectedMonth}.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={handleExportCSV}>Export CSV</Button>
                <Button variant="outline" size="sm" onClick={() => setShowAddStudent(true)}>Add Student</Button>
                <Button variant="primary" size="sm" onClick={() => setShowWizard(true)}>Log Session</Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <span className="text-[10px] font-black uppercase text-slate-400 mr-2 shrink-0">Months:</span>
                {monthsAvailable.map(m => (
                  <button key={m} onClick={() => { setSelectedMonth(m); setSelectedWeek(null); }} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${selectedMonth === m ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}>{m}</button>
                ))}
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <span className="text-[10px] font-black uppercase text-slate-400 mr-2 shrink-0">Weeks:</span>
                <button onClick={() => setSelectedWeek(null)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${selectedWeek === null ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}>Whole Month</button>
                {weeksInSelectedMonth.map(([start, label]) => (
                  <button key={start} onClick={() => setSelectedWeek(start)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${selectedWeek === start ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}>{label}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Object.values(Subject) as Subject[]).map((sub) => (
                <div key={sub} className="bg-white border border-slate-200 p-6 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold ${SUBJECT_COLORS[sub]}`}>
                      {sub === Subject.MATH && 'Σ'}
                      {sub === Subject.ENGLISH && 'Aa'}
                      {sub === Subject.TASK_COMPLETION && '✓'}
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{sub}</div>
                      <div className="text-2xl font-black text-slate-900">{subjectTotals[sub]}m</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Aggregate Subject Metrics</h3>
                   <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{filteredLogs.length} Sessions Logged</div>
                </div>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 500, fill: '#94a3b8' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }} 
                        itemStyle={{ fontWeight: 700, fontSize: '14px' }}
                        cursor={{ fill: '#f8fafc', radius: 8 }}
                      />
                      <Bar dataKey="minutes" radius={[8, 8, 8, 8]} barSize={60}>
                        {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={['#6366f1', '#a855f7', '#10b981'][index % 3]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-between border-b border-slate-200 pb-4">
                <h3 className="text-lg font-black text-slate-800">Individual Student Progress</h3>
                <div className="flex bg-slate-200 p-1 rounded-xl">
                  {(['6th', '7th', '8th'] as Grade[]).map((g) => (
                    <button key={g} onClick={() => setActiveGrade(g)} className={`px-8 py-2 rounded-lg font-bold transition-all text-sm ${activeGrade === g ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>{g}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStudents.length === 0 ? (
                  <div className="col-span-full py-16 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No students in {activeGrade} grade</p>
                  </div>
                ) : (
                  filteredStudents.sort((a,b) => a.name.localeCompare(b.name)).map(student => (
                    <StudentSummary 
                      key={`${student.id}-${selectedWeek || selectedMonth}`} 
                      student={student} 
                      logs={filteredLogs.filter(l => l.studentId === student.id)} 
                      isMonthly={!selectedWeek}
                      onEdit={setEditingStudent}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        ) : view === 'settings' ? (
          <Settings 
            students={students} 
            logs={logs} 
            syncUrl={syncUrl} 
            onSetSyncUrl={setSyncUrl} 
            onImport={(s, l) => { setStudents(s); setLogs(l); setView('dashboard'); }} 
            onClear={() => { setLogs([]); setStudents(INITIAL_STUDENTS); }}
          />
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black">Full Service History</h2>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>Export Filtered CSV</Button>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Date</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Staff</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Student</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Subject</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Mins</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold">No logs yet.</td></tr>
                    ) : (
                      logs.map(log => (
                        <tr key={log.id} className="text-sm hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-500">{log.date}</td>
                          <td className="px-6 py-4 font-black text-indigo-600">{log.staffName}</td>
                          <td className="px-6 py-4 font-bold text-slate-900">{students.find(s => s.id === log.studentId)?.name || 'Unknown'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border uppercase ${SUBJECT_COLORS[log.subject]}`}>
                              {log.subject}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-black text-slate-700">{log.minutes}m</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
      {!showWizard && !showAddStudent && !editingStudent && (
        <div className="fixed bottom-6 right-6">
          <Button variant="primary" size="lg" className="rounded-full shadow-2xl h-14 w-14 sm:w-auto sm:px-8 flex items-center gap-2" onClick={() => setShowWizard(true)}>
            <span className="text-2xl font-light">+</span>
            <span className="hidden sm:inline font-bold">Log Session</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default App;
