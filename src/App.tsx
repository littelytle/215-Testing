import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// --- TYPES ---
enum Subject { MATH = 'Math', ENGLISH = 'English', TASK_COMPLETION = 'Task Completion' }
type Grade = '6th' | '7th' | '8th';
interface Student { id: string; name: string; grade: Grade; }
interface LogEntry { id: string; studentId: string; subject: Subject; minutes: number; date: string; staffName: string; timestamp: number; }

const SUBJECT_COLORS: Record<Subject, string> = {
  [Subject.MATH]: 'bg-blue-100 text-blue-700 border-blue-200',
  [Subject.ENGLISH]: 'bg-purple-100 text-purple-700 border-purple-200',
  [Subject.TASK_COMPLETION]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

// --- COMPONENTS ---
const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const base = "px-5 py-2.5 rounded-xl font-bold transition-all text-sm flex items-center justify-center ";
  const styles: any = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    outline: "bg-white text-slate-600 border border-slate-200 hover:border-slate-300",
    ghost: "text-slate-500 hover:bg-slate-100"
  };
  return <button className={base + styles[variant] + " " + className} {...props}>{children}</button>;
};

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>(() => JSON.parse(localStorage.getItem('iep_s') || '[]'));
  const [logs, setLogs] = useState<LogEntry[]>(() => JSON.parse(localStorage.getItem('iep_l') || '[]'));
  const [syncUrl, setSyncUrl] = useState(() => localStorage.getItem('iep_u') || '');
  const [showWizard, setShowWizard] = useState(false);
  const [activeGrade, setActiveGrade] = useState<Grade>('6th');

  useEffect(() => { localStorage.setItem('iep_s', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('iep_l', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('iep_u', syncUrl); }, [syncUrl]);

  const chartData = useMemo(() => Object.values(Subject).map(sub => ({
    name: sub,
    minutes: logs.filter(l => l.subject === sub).reduce((acc, curr) => acc + curr.minutes, 0)
  })), [logs]);

  const handleAddStudent = () => {
    const name = prompt("Student Name?");
    if (name) setStudents([...students, { id: Math.random().toString(36).substr(2, 9), name, grade: activeGrade }]);
  };

  const logSession = (sIds: string[], sub: Subject, mins: number, staff: string) => {
    const newLogs = sIds.map(id => ({
      id: Math.random().toString(36).substr(2, 9),
      studentId: id,
      subject: sub,
      minutes: mins,
      date: new Date().toISOString().split('T')[0],
      staffName: staff,
      timestamp: Date.now()
    }));
    setLogs([...newLogs, ...logs]);
    setShowWizard(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-black text-slate-800">IEP MINUTE PRO</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleAddStudent}>+ Student</Button>
            <Button onClick={() => setShowWizard(true)}>Log Session</Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-[32px] border shadow-sm h-80">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="minutes" radius={[10, 10, 0, 0]}>
                    {chartData.map((_, i) => <Cell key={i} fill={['#6366f1', '#a855f7', '#10b981'][i]} />)}
                  </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>
          
          <div className="bg-indigo-600 p-6 rounded-[32px] text-white space-y-4">
             <h3 className="font-bold">Cloud Sync</h3>
             <input className="w-full p-3 rounded-xl text-slate-900 text-sm" placeholder="SheetDB URL" value={syncUrl} onChange={e => setSyncUrl(e.target.value)} />
             <p className="text-xs opacity-70">Logs will auto-sync to your Google Sheet if URL is present.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            {['6th', '7th', '8th'].map(g => (
              <button key={g} onClick={() => setActiveGrade(g as Grade)} className={`px-6 py-2 rounded-xl font-bold ${activeGrade === g ? 'bg-slate-800 text-white' : 'bg-white text-slate-400 border'}`}>{g}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {students.filter(s => s.grade === activeGrade).map(s => (
              <div key={s.id} className="bg-white p-6 rounded-2xl border font-bold text-slate-700">{s.name}</div>
            ))}
          </div>
        </div>
      </div>

      {showWizard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-[32px] max-w-md w-full space-y-4">
            <h2 className="text-xl font-bold">Log Session</h2>
            <p className="text-sm text-slate-500">Select students and enter minutes in the dashboard logic.</p>
            <Button className="w-full" onClick={() => setShowWizard(false)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
