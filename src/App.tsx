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

// --- 2. SIMPLE UI COMPONENTS ---
const Button = ({ children, variant = 'primary', size = 'md', ...props }: any) => {
  const base = "font-bold rounded-xl transition-all flex items-center justify-center ";
  const variants: any = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md",
    outline: "bg-white text-slate-600 border border-slate-200 hover:border-slate-300",
    ghost: "text-slate-600 hover:bg-slate-100"
  };
  const sizes: any = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-6 py-3" };
  return <button className={base + variants[variant] + " " + sizes[size] + " " + props.className} {...props}>{children}</button>;
};

// --- 3. THE MAIN APP COMPONENT ---
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
    const saved = typeof window !== 'undefined' ? localStorage.getItem('iep_students') : null;
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [syncUrl, setSyncUrl] = useState<string>(() => (typeof window !== 'undefined' ? localStorage.getItem('iep_sync_url') : '') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'dashboard' | 'history'>('dashboard');
  const [activeGrade, setActiveGrade] = useState<Grade>('6th');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);

  useEffect(() => {
    const fetchCloudData = async () => {
      if (!syncUrl) {
        const saved = localStorage.getItem('iep_logs');
        if (saved) setLogs(JSON.parse(saved));
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(syncUrl);
        if (response.ok) {
          const data = await response.json();
          setLogs(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("Cloud Fetch Failed:", e);
        const saved = localStorage.getItem('iep_logs');
        if (saved) setLogs(JSON.parse(saved));
      } finally {
        setIsLoading(false);
      }
    };
    fetchCloudData();
  }, [syncUrl]);

  useEffect(() => { localStorage.setItem('iep_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('iep_students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('iep_sync_url', syncUrl); }, [syncUrl]);

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
    const totals = { [Subject.MATH]: 0, [Subject.ENGLISH]: 0, [Subject.TASK_COMPLETION]: 0 };
    filteredLogs.forEach(l => { if(totals[l.subject] !== undefined) totals[l.subject] += l.minutes; });
    return totals;
  }, [filteredLogs]);

  const chartData = Object.values(Subject).map(sub => ({ name: sub, minutes: subjectTotals[sub] }));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4">
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm">
        <h1 className="text-xl font-black text-indigo-600">IEP PRO TEAM</h1>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setView('dashboard')}>Dashboard</Button>
          <Button variant="ghost" onClick={() => setView('history')}>Logs</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
           <h2 className="text-2xl font-black mb-2">Team Metrics - {selectedMonth}</h2>
           <p className="text-slate-500 mb-6">Setup your Sync URL in the browser console to share with team.</p>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {Object.values(Subject).map(sub => (
                <div key={sub} className={`p-4 rounded-2xl border ${SUBJECT_COLORS[sub]}`}>
                  <div className="text-xs font-bold uppercase tracking-wider">{sub}</div>
                  <div className="text-3xl font-black">{subjectTotals[sub]}m</div>
                </div>
              ))}
           </div>

           <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="minutes" fill="#6366f1" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
           </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="font-bold mb-4">Sync Configuration</h3>
            <input 
              className="w-full p-3 bg-slate-100 rounded-xl border-none text-sm"
              placeholder="Paste SheetDB or Sync URL here..."
              value={syncUrl}
              onChange={(e) => setSyncUrl(e.target.value)}
            />
        </div>
      </main>
    </div>
  );
};

export default App;
