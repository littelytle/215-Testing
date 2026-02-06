import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Settings as SettingsIcon, LayoutDashboard, History, Plus, FileText, Share2 } from 'lucide-react';

// --- 1. CONFIG & TYPES ---
enum Subject { MATH = 'Math', ENGLISH = 'English', TASK_COMPLETION = 'Task Completion' }
type Grade = '6th' | '7th' | '8th';
interface Student { id: string; name: string; grade: Grade; }
interface LogEntry { id: string; studentId: string; subject: Subject; minutes: number; date: string; staffName: string; timestamp: number; }

const SUBJECT_COLORS: Record<Subject, string> = {
  [Subject.MATH]: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  [Subject.ENGLISH]: 'bg-purple-100 text-purple-700 border-purple-200',
  [Subject.TASK_COMPLETION]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

// --- 2. PREMIUM UI COMPONENTS ---
const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }: any) => {
  const variants: any = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200",
    outline: "bg-white text-slate-600 border border-slate-200 hover:border-slate-300",
    ghost: "text-slate-500 hover:bg-slate-100",
    secondary: "bg-slate-900 text-white hover:bg-slate-800"
  };
  const sizes: any = { sm: "px-3 py-1.5 text-xs", md: "px-5 py-2.5 text-sm", lg: "px-8 py-4 text-base" };
  return (
    <button className={`inline-flex items-center justify-center font-bold transition-all rounded-2xl active:scale-95 disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>(() => JSON.parse(localStorage.getItem('iep_s') || '[]'));
  const [logs, setLogs] = useState<LogEntry[]>(() => JSON.parse(localStorage.getItem('iep_l') || '[]'));
  const [syncUrl, setSyncUrl] = useState(() => localStorage.getItem('iep_u') || '');
  const [activeGrade, setActiveGrade] = useState<Grade>('6th');
  const [view, setView] = useState<'dashboard' | 'history' | 'settings'>('dashboard');
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => { localStorage.setItem('iep_s', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('iep_l', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('iep_u', syncUrl); }, [syncUrl]);

  const stats = useMemo(() => Object.values(Subject).map(sub => ({
    name: sub,
    mins: logs.filter(l => l.subject === sub).reduce((a, b) => a + b.minutes, 0)
  })), [logs]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col lg:flex-row">
      {/* SIDEBAR */}
      <aside className="w-full lg:w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-200">I</div>
          <h1 className="font-black text-lg tracking-tighter">IEP PRO</h1>
        </div>
        
        <nav className="flex flex-col gap-2">
          <button onClick={() => setView('dashboard')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${view === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button onClick={() => setView('history')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${view === 'history' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <History size={20} /> History
          </button>
          <button onClick={() => setView('settings')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${view === 'settings' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <SettingsIcon size={20} /> Settings
          </button>
        </nav>

        <div className="mt-auto bg-slate-900 rounded-2xl p-4 text-white">
          <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Status</p>
          <p className="text-xs font-bold flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${syncUrl ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {syncUrl ? 'Sync Active' : 'Local Only'}
          </p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-10">
          
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight capitalize">{view}</h2>
              <p className="text-slate-500 font-medium">Manage and track service minutes across your team.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => {
                const name = prompt("Student Name?");
                if(name) setStudents([...students, { id: Math.random().toString(36).substr(2,9), name, grade: activeGrade }]);
              }}><Plus size={18} className="mr-2"/> Student</Button>
              <Button onClick={() => setShowWizard(true)}>Log Session</Button>
            </div>
          </header>

          {view === 'dashboard' && (
            <div className="space-y-10">
              {/* STAT CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((s) => (
                  <div key={s.name} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.name}</p>
                    <p className="text-3xl font-black text-slate-900">{s.mins}m</p>
                  </div>
                ))}
              </div>

              {/* CHART */}
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600}} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.05)'}} />
                    <Bar dataKey="mins" radius={[12, 12, 12, 12]} barSize={50}>
                      {stats.map((_, i) => <Cell key={i} fill={['#6366f1', '#a855f7', '#10b981'][i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* STUDENT LIST */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black">Student Progress</h3>
                  <div className="flex bg-slate-200/50 p-1.5 rounded-2xl">
                    {['6th', '7th', '8th'].map((g) => (
                      <button key={g} onClick={() => setActiveGrade(g as Grade)} className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeGrade === g ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>{g}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {students.filter(s => s.grade === activeGrade).map(s => (
                    <div key={s.id} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                      <h4 className="text-lg font-black mb-4">{s.name}</h4>
                      <div className="space-y-2">
                        {Object.values(Subject).map(sub => {
                          const m = logs.filter(l => l.studentId === s.id && l.subject === sub).reduce((a,b) => a+b.minutes, 0);
                          return (
                            <div key={sub} className="flex justify-between items-center text-sm">
                              <span className="text-slate-400 font-bold">{sub}</span>
                              <span className="font-black">{m}m</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {view === 'history' && (
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100 font-black text-[10px] uppercase text-slate-400">
                  <tr>
                    <th className="p-6">Date</th>
                    <th className="p-6">Student</th>
                    <th className="p-6">Subject</th>
                    <th className="p-6">Minutes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-bold text-sm">
                  {logs.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-6 text-slate-400">{l.date}</td>
                      <td className="p-6 text-slate-900">{students.find(s => s.id === l.studentId)?.name}</td>
                      <td className="p-6"><span className={`px-3 py-1 rounded-full text-[10px] uppercase border ${SUBJECT_COLORS[l.subject]}`}>{l.subject}</span></td>
                      <td className="p-6 text-indigo-600 font-black">{l.minutes}m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* WIZARD MODAL */}
      {showWizard && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-lg p-10 shadow-2xl space-y-8 animate-in fade-in zoom-in duration-200">
            <h2 className="text-3xl font-black tracking-tight text-slate-900">Log Service</h2>
            <div className="space-y-4">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                 <p className="text-[10px] font-black uppercase text-slate-400 mb-4">Select Student</p>
                 <div className="flex flex-wrap gap-2">
                    {students.filter(s => s.grade === activeGrade).map(s => (
                      <button key={s.id} className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm">{s.name}</button>
                    ))}
                 </div>
              </div>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowWizard(false)}>Cancel</Button>
              <Button className="flex-1" onClick={() => setShowWizard(false)}>Save Entries</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
