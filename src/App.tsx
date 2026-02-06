import React, { useState, useEffect, useMemo } from 'react';
import { Subject, Student, LogEntry, Grade } from './types';
import { Button } from './components/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Constants used for styling the subject badges
const SUBJECT_COLORS: Record<Subject, string> = {
  [Subject.MATH]: 'bg-blue-100 text-blue-700 border-blue-200',
  [Subject.ENGLISH]: 'bg-purple-100 text-purple-700 border-purple-200',
  [Subject.TASK_COMPLETION]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

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
    return saved ? JSON.parse(saved) : [];
  });
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [syncUrl, setSyncUrl] = useState<string>(() => localStorage.getItem('iep_sync_url') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'dashboard' | 'history'>('dashboard');
  const [activeGrade, setActiveGrade] = useState<Grade>('6th');

  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);

  // Load from Cloud
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
        console.error("Fetch Error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCloudData();
  }, [syncUrl]);

  // Persist settings
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

  const chartData = Object.values(Subject).map(sub => ({
    name: sub,
    minutes: subjectTotals[sub]
  }));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-10">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">I</div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">IEP MINUTE PRO</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setView('dashboard')}>Dashboard</Button>
            <Button variant="ghost" size="sm" onClick={() => setView('history')}>Logs</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Sync Settings Card */}
        <section className="bg-indigo-900 text-white p-6 rounded-3xl shadow-xl shadow-indigo-200">
          <h2 className="text-lg font-bold mb-2">Team Cloud Sync</h2>
          <p className="text-indigo-200 text-sm mb-4">Paste your SheetDB API URL here to enable real-time team tracking.</p>
          <input 
            className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-indigo-300 outline-none focus:ring-2 focus:ring-white/50"
            placeholder="https://sheetdb.io/api/v1/your-id"
            value={syncUrl}
            onChange={(e) => setSyncUrl(e.target.value)}
          />
        </section>

        {/* Analytics Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Service Delivery Metrics</h3>
              <span className="text-xs font-bold text-slate-400">{selectedMonth}</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600}} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="minutes" radius={[6, 6, 0, 0]} barSize={50}>
                    {chartData.map((_, i) => <Cell key={i} fill={['#6366f1', '#a855f7', '#10b981'][i % 3]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4">
            {Object.values(Subject).map(sub => (
              <div key={sub} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sub}</p>
                  <p className="text-2xl font-black text-slate-800">{subjectTotals[sub]}m</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${SUBJECT_COLORS[sub]}`}>
                  {sub[0]}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* History View */}
        {view === 'history' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
             <table className="w-full text-left border-collapse">
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
                      <td className="px-6 py-4 font-bold">{log.staffName}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${SUBJECT_COLORS[log.subject]}`}>
                          {log.subject}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black">{log.minutes}m</td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
