import React, { useState, useEffect, useMemo } from 'react';
import { Subject, Student, LogEntry, Grade } from './types';
import { Button } from './components/Button';
import { LogWizard } from './components/LogWizard';
import { StudentSummary } from './components/StudentSummary';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const SUBJECT_COLORS: Record<Subject, string> = {
  [Subject.MATH]: 'bg-blue-100 text-blue-700 border-blue-200',
  [Subject.ENGLISH]: 'bg-purple-100 text-purple-700 border-purple-200',
  [Subject.TASK_COMPLETION]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('iep_students');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [syncUrl, setSyncUrl] = useState<string>(() => localStorage.getItem('iep_sync_url') || '');
  const [showWizard, setShowWizard] = useState(false);
  const [activeGrade, setActiveGrade] = useState<Grade>('6th');

  // --- HANDLERS ---
  const handleAddStudent = () => {
    const name = prompt("Enter Student Name:");
    if (!name) return;
    const newStudent: Student = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      grade: activeGrade
    };
    setStudents([...students, newStudent]);
  };

  const handleSaveLogs = (newLogs: Omit<LogEntry, 'id' | 'timestamp'>[]) => {
    const formatted: LogEntry[] = newLogs.map(l => ({
      ...l,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    }));
    setLogs([...formatted, ...logs]);
    setShowWizard(false);
  };

  // --- PERSISTENCE ---
  useEffect(() => { localStorage.setItem('iep_students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('iep_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('iep_sync_url', syncUrl); }, [syncUrl]);

  const filteredLogs = logs.filter(l => students.find(s => s.id === l.studentId)?.grade === activeGrade);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black text-indigo-600 tracking-tighter">IEP MINUTE PRO</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAddStudent}>+ Add Student</Button>
          <Button onClick={() => setShowWizard(true)} disabled={students.length === 0}>Log Session</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-8">
        {/* Sync Settings */}
        <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Cloud Sync URL</h3>
          <input 
            className="w-full p-3 bg-slate-100 rounded-xl outline-none border-2 border-transparent focus:border-indigo-500"
            placeholder="Paste SheetDB URL here..."
            value={syncUrl}
            onChange={(e) => setSyncUrl(e.target.value)}
          />
        </section>

        {/* Grade Switcher */}
        <div className="flex bg-slate-200 p-1 rounded-xl w-fit">
          {(['6th', '7th', '8th'] as Grade[]).map((g) => (
            <button key={g} onClick={() => setActiveGrade(g)} className={`px-6 py-2 rounded-lg font-bold text-sm ${activeGrade === g ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'}`}>{g}</button>
          ))}
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {students.filter(s => s.grade === activeGrade).map(student => (
            <StudentSummary key={student.id} student={student} logs={logs.filter(l => l.studentId === student.id)} />
          ))}
          {students.filter(s => s.grade === activeGrade).length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-300 rounded-3xl text-slate-400 font-bold">
              No students added for {activeGrade} grade yet.
            </div>
          )}
        </div>

        {showWizard && (
          <LogWizard 
            students={students.filter(s => s.grade === activeGrade)} 
            onSave={handleSaveLogs} 
            onCancel={() => setShowWizard(false)} 
          />
        )}
      </main>
    </div>
  );
};

export default App;
