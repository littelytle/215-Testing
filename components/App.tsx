import React, { useState, useEffect, useMemo } from 'react';
import { Subject, Student, LogEntry, Grade } from './types';
import { INITIAL_STUDENTS, SUBJECT_COLORS } from './constants';
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
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('iep_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const saved = localStorage.getItem('iep_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [syncUrl, setSyncUrl] = useState(() => localStorage.getItem('iep_sync_url') || '');
  const [view, setView] = useState<'dashboard' | 'history' | 'settings'>('dashboard');
  const [activeGrade, setActiveGrade] = useState<Grade>('6th');
  const [showWizard, setShowWizard] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  useEffect(() => { localStorage.setItem('iep_students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('iep_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('iep_sync_url', syncUrl); }, [syncUrl]);

  const weekRange = useMemo(() => getWeekRange(new Date()), []);

  const handleSaveLogs = async (newLogs: Omit<LogEntry, 'id' | 'timestamp'>[]) => {
    const formattedLogs: LogEntry[] = newLogs.map(log => ({
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    }));

    // Update locally first for speed
    setLogs(prev => [...formattedLogs, ...prev]);
    setShowWizard(false);

    // Sync to Google Sheets via SheetDB
    if (syncUrl.trim()) {
      try {
        await fetch(syncUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: formattedLogs })
        });
      } catch (e) {
        console.error("Cloud Sync Failed", e);
      }
    }
  };

  const handleAddStudent = (studentData: Omit<Student, 'id'>) => {
    const newStudent = { ...studentData, id: Math.random().toString(36).substr(2, 9) };
    setStudents(prev => [...prev, newStudent]);
    setShowAddStudent(false);
  };

  const chartData = useMemo(() => {
    return Object.values(Subject).map(sub => ({
      name: sub,
      minutes: logs.filter(l => l.subject === sub).reduce((acc, curr) => acc + curr.minutes, 0)
    }));
  }, [logs]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">I</div>
            <h1 className="font-black text-xl tracking-tight hidden sm:block">IEP TRACKER PRO</h1>
          </div>
          
          <nav className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
            <button onClick={() => setView('dashboard')} className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${view === 'dashboard' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Dashboard</button>
            <button onClick={() => setView('history')} className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${view === 'history' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>History</button>
            <button onClick={() => setView('settings')} className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${view === 'settings' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Team Setup</button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {view === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Dashboard</h2>
                <p className="text-slate-500 font-bold">{weekRange.label}</p>
              </div>
              <Button onClick={() => setShowAddStudent(true)} variant="outline" className="rounded-2xl border-2 font-bold">+ Student</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700}} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)'}} />
                    <Bar dataKey="minutes" radius={[10, 10, 10, 10]} barSize={50}>
                      {chartData.map((_, i) => <Cell key={i} fill={['#6366f1', '#a855f7', '#10b981'][i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-slate-900 rounded-[32px] p-8 text-white flex flex-col justify-center gap-6 shadow-xl">
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Progress</h3>
                 <div className="space-y-4">
                    {chartData.map(d => (
                      <div key={d.name} className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <span className="font-bold text-slate-300">{d.name}</span>
                        <span className="font-black text-xl">{d.minutes}m</span>
                      </div>
                    ))}
                 </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex bg-slate-200/50 p-1.5 rounded-2xl w-fit">
                {['6th', '7th', '8th'].map(g => (
                  <button key={g} onClick={() => setActiveGrade(g as Grade)} className={`px-8 py-2 rounded-xl font-bold text-sm transition-all ${activeGrade === g ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>{g}</button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.filter(s => s.grade === activeGrade).map(s => (
                  <StudentSummary key={s.id} student={s} logs={logs.filter(l => l.studentId === s.id)} onEdit={setEditingStudent} />
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'history' && (
           <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                   <th className="px-6 py-4">Date</th>
                   <th className="px-6 py-4">Staff</th>
                   <th className="px-6 py-4">Student</th>
                   <th className="px-6 py-4">Subject</th>
                   <th className="px-6 py-4 text-right">Minutes</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 font-bold text-sm">
                 {logs.map(l => (
                   <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                     <td className="px-6 py-4 text-slate-400 font-medium">{l.date}</td>
                     <td className="px-6 py-4 text-indigo-600 font-black">{l.staffName}</td>
                     <td className="px-6 py-4">{students.find(s => s.id === l.studentId)?.name || 'Former Student'}</td>
                     <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] uppercase border ${SUBJECT_COLORS[l.subject]}`}>{l.subject}</span>
                     </td>
                     <td className="px-6 py-4 text-right font-black text-slate-900">{l.minutes}m</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}

        {view === 'settings' && (
          <Settings 
            students={students} logs={logs} syncUrl={syncUrl} 
            onSetSyncUrl={setSyncUrl} 
            onImport={(s, l) => { setStudents(s); setLogs(l); setView('dashboard'); }}
            onClear={() => { setStudents([]); setLogs([]); }}
          />
        )}
      </main>

      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <LogWizard students={students} onCancel={() => setShowWizard(false)} onSave={handleSaveLogs} />
          </div>
        </div>
      )}

      {showAddStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-lg">
            <AddStudentModal onCancel={() => setShowAddStudent(false)} onSave={handleAddStudent} />
          </div>
        </div>
      )}

      {!showWizard && view === 'dashboard' && (
        <div className="fixed bottom-8 right-8">
          <Button onClick={() => setShowWizard(true)} className="h-16 px-10 rounded-full shadow-2xl shadow-indigo-200 text-lg font-black animate-bounce">Log Session</Button>
        </div>
      )}
    </div>
  );
};

export default App;
