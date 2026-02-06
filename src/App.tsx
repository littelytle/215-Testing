import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// --- 1. TYPES & CONSTANTS ---
export enum Subject {
  MATH = 'Math',
  ENGLISH = 'English',
  TASK_COMPLETION = 'Task Completion'
}

export type Grade = '6th' | '7th' | '8th';

export interface Student {
  id: string;
  name: string;
  grade: Grade;
}

export interface LogEntry {
  id: string;
  studentId: string;
  subject: Subject;
  minutes: number;
  date: string;
  staffName: string;
  notes?: string;
  timestamp: number;
}

export const SUBJECT_COLORS: Record<Subject, string> = {
  [Subject.MATH]: 'bg-blue-100 text-blue-700 border-blue-200',
  [Subject.ENGLISH]: 'bg-purple-100 text-purple-700 border-purple-200',
  [Subject.TASK_COMPLETION]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const INITIAL_STUDENTS: Student[] = [];

// --- 2. COMPONENTS ---

const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }: any) => {
  const base = "inline-flex items-center justify-center font-bold transition-all rounded-xl disabled:opacity-50 ";
  const variants: any = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md",
    outline: "bg-white text-slate-600 border border-slate-200 hover:border-slate-300",
    ghost: "text-slate-600 hover:bg-slate-100"
  };
  const sizes: any = { sm: "px-3 py-1.5 text-xs", md: "px-5 py-2.5 text-sm", lg: "px-8 py-3.5 text-base" };
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>{children}</button>;
};

const StudentSummary = ({ student, logs, onEdit }: any) => {
  const totals = { [Subject.MATH]: 0, [Subject.ENGLISH]: 0, [Subject.TASK_COMPLETION]: 0 };
  logs.forEach((l: any) => { if (totals[l.subject as Subject] !== undefined) totals[l.subject as Subject] += l.minutes; });

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative group">
      <button onClick={() => onEdit(student)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 text-xs font-bold transition-all">Edit</button>
      <h4 className="text-lg font-black text-slate-800 mb-4 tracking-tight">{student.name}</h4>
      <div className="space-y-2">
        {Object.entries(totals).map(([sub, mins]) => (
          <div key={sub} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{sub}</span>
            <span className="font-black text-slate-800">{mins}m</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const LogWizard = ({ students, onSave, onCancel }: any) => {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [subject, setSubject] = useState<Subject>(Subject.MATH);
  const [minutes, setMinutes] = useState<number>(15);
  const [staffName, setStaffName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] w-full max-w-2xl p-8 shadow-2xl space-y-6">
        <h2 className="text-2xl font-black text-slate-800">Log IEP Session</h2>
        <div className="grid grid-cols-2 gap-4">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-3 bg-slate-100 rounded-xl outline-none" />
            <input type="text" placeholder="Staff Name" value={staffName} onChange={e => setStaffName(e.target.value)} className="p-3 bg-slate-100 rounded-xl outline-none" />
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-3">Select Students</p>
          <div className="flex flex-wrap gap-2">
            {students.map((s: any) => (
              <button key={s.id} onClick={() => setSelectedStudents(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${selectedStudents.includes(s.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                {s.name}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <select value={subject} onChange={e => setSubject(e.target.value as Subject)} className="p-3 bg-slate-100 rounded-xl outline-none">
                {Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="number" value={minutes} onChange={e => setMinutes(Number(e.target.value))} className="p-3 bg-slate-100 rounded-xl outline-none" />
        </div>
        <div className="flex gap-3 pt-4">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button className="flex-1" onClick={() => onSave(selectedStudents.map(id => ({ studentId: id, subject, minutes, date, staffName })))}>Save Session</Button>
        </div>
      </div>
    </div>
  );
};

// --- 3. MAIN APP ---
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
    return (saved ? JSON.parse(saved) : INITIAL_STUDENTS) as Student[];
  });
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const saved = localStorage.getItem('iep_logs');
    return (saved ? JSON.parse(saved) : []) as LogEntry[];
  });
  const [syncUrl, setSyncUrl] = useState<string>(() => localStorage.getItem('iep_sync_url') || '');
  const [showWizard, setShowWizard] = useState(false);
  const [activeGrade, setActiveGrade] = useState<Grade>('6th');
  const [view, setView] = useState<'dashboard' | 'history'>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem('iep_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('iep_students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('iep_sync_url', syncUrl); }, [syncUrl]);

  const handleSaveLogs = async (newLogs: any[]) => {
    const formatted: LogEntry[] = newLogs.map(l => ({ ...l, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() }));
    setLogs(prev => [...formatted, ...prev]);
    setShowWizard(false);
    if (syncUrl.trim()) {
      try { await fetch(syncUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formatted) }); }
      catch (e) { console.error(e); }
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const d = new Date(log.date);
      const logMonth = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (logMonth !== selectedMonth) return false;
      if (selectedWeek) return getWeekRange(d).start === selectedWeek;
      return true;
    });
  }, [logs, selectedMonth, selectedWeek]);

  const subjectTotals = useMemo(() => {
    const totals: Record<string, number> = { [Subject.MATH]: 0, [Subject.ENGLISH]: 0, [Subject.TASK_COMPLETION]: 0 };
    filteredLogs.forEach(l => { totals[l.subject] += l.minutes; });
    return totals;
  }, [filteredLogs]);

  const chartData = Object.values(Subject).map(sub => ({ name: sub, minutes: subjectTotals[sub] }));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 h-16 flex items-center px-6 justify-between">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">I</div>
            <h1 className="text-xl font-black tracking-tight">IEP MINUTE PRO</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setView('dashboard')}>Dashboard</Button>
          <Button variant="ghost" size="sm" onClick={() => setView('history')}>Logs</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {view === 'dashboard' ? (
          <>
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black">Team Tracker</h2>
                    <p className="text-slate-500">{selectedMonth}</p>
                </div>
                <Button onClick={() => setShowWizard(true)}>Log Session</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.values(Subject).map(sub => (
                <div key={sub} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sub}</p>
                    <p className="text-2xl font-black">{subjectTotals[sub]}m</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${SUBJECT_COLORS[sub]}`}>{sub[0]}</div>
                </div>
              ))}
            </div>

            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                        <Bar dataKey="minutes" radius={[10, 10, 10, 10]} barSize={60}>
                            {chartData.map((_, i) => <Cell key={i} fill={['#6366f1', '#a855f7', '#10b981'][i]} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                    <h3 className="font-black text-lg text-slate-800">Student Progress</h3>
                    <div className="flex bg-slate-200 p-1 rounded-xl">
                        {['6th', '7th', '8th'].map(g => (
                            <button key={g} onClick={() => setActiveGrade(g as Grade)} className={`px-6 py-2 rounded-lg font-bold text-sm ${activeGrade === g ? 'bg-white text-indigo-600' : 'text-slate-500'}`}>{g}</button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {students.filter(s => s.grade === activeGrade).map(s => (
                        <StudentSummary key={s.id} student={s} logs={logs.filter(l => l.studentId === s.id)} onEdit={() => {}} />
                    ))}
                    <button onClick={() => {
                        const name = prompt("Student Name?");
                        if(name) setStudents([...students, { id: Math.random().toString(36).substr(2,9), name, grade: activeGrade }]);
                    }} className="border-2 border-dashed border-slate-300 rounded-[32px] p-8 text-slate-400 font-bold hover:bg-slate-50">+ Add Student</button>
                </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Date</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Staff</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Subject</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Mins</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(log => (
                  <tr key={log.id} className="text-sm">
                    <td className="px-6 py-4 text-slate-500">{log.date}</td>
                    <td className="px-6 py-4 font-bold text-indigo-600">{log.staffName}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded-lg text-[10px] font-black border uppercase ${SUBJECT_COLORS[log.subject]}`}>{log.subject}</span></td>
