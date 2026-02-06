import React, { useState, useEffect, useMemo } from 'react';
import { Subject, Student, LogEntry, Grade } from './types';
import { Button } from './components/Button';
import { LogWizard } from './components/LogWizard';
import { StudentSummary } from './components/StudentSummary';

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('iep_students');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [syncUrl, setSyncUrl] = useState<string>(() => localStorage.getItem('iep_sync_url') || '');
  const [showWizard, setShowWizard] = useState(false);
  const [activeGrade, setActiveGrade] = useState<Grade>('6th');
  const [isSyncing, setIsSyncing] = useState(false);

  // Triggered when you click the new "Connect" button
  const handleConnectSync = async () => {
    if (!syncUrl.includes('sheetdb.io')) {
      alert("Please enter a valid SheetDB API URL");
      return;
    }
    setIsSyncing(true);
    try {
      const response = await fetch(syncUrl);
      const data = await response.json();
      if (Array.isArray(data)) {
        setLogs(data);
        alert("Connected! Team logs have been pulled from the cloud.");
      }
    } catch (e) {
      alert("Could not connect. Check your URL.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddStudent = () => {
    const name = prompt("Enter Student Name:");
    if (!name) return;
    const newStudent: Student = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      grade: activeGrade
    };
    setStudents(prev => [...prev, newStudent]);
  };

  const handleSaveLogs = async (newLogs: Omit<LogEntry, 'id' | 'timestamp'>[]) => {
    const formatted: LogEntry[] = newLogs.map(l => ({
      ...l,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    }));
    
    const updatedLogs = [...formatted, ...logs];
    setLogs(updatedLogs);
    setShowWizard(false);

    // If sync is set up, send to Google Sheets
    if (syncUrl) {
      await fetch(syncUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(formatted)
      });
    }
  };

  useEffect(() => { localStorage.setItem('iep_students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('iep_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('iep_sync_url', syncUrl); }, [syncUrl]);

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* TOP BAR */}
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-xl font-black text-slate-800">IEP TEAM TRACKER</h1>
            <p className="text-slate-500 text-sm">Grade: {activeGrade}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleAddStudent}>+ Add Student</Button>
            <Button onClick={() => setShowWizard(true)} disabled={students.length === 0}>Log Session</Button>
          </div>
        </div>

        {/* SYNC SETUP */}
        <div className="bg-indigo-600 p-8 rounded-3xl shadow-xl text-white">
          <h2 className="text-lg font-bold mb-4">Step 1: Connect to Team Google Sheet</h2>
          <div className="flex gap-2">
            <input 
              className="flex-1 p-4 rounded-xl text-slate-900 outline-none"
              placeholder="Paste SheetDB API URL here..."
              value={syncUrl}
              onChange={(e) => setSyncUrl(e.target.value)}
            />
            <Button variant="primary" className="bg-white text-indigo-600 hover:bg-indigo-50" onClick={handleConnectSync}>
              {isSyncing ? 'Connecting...' : 'Connect & Sync'}
            </Button>
          </div>
        </div>

        {/* GRADE PICKER */}
        <div className="flex gap-2 justify-center">
          {(['6th', '7th', '8th'] as Grade[]).map(g => (
            <button key={g} onClick={() => setActiveGrade(g)} className={`px-8 py-3 rounded-2xl font-black transition-all ${activeGrade === g ? 'bg-slate-800 text-white' : 'bg-white text-slate-400'}`}>
              {g} Grade
            </button>
          ))}
        </div>

        {/* STUDENT LIST */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {students.filter(s => s.grade === activeGrade).map(student => (
            <StudentSummary key={student.id} student={student} logs={logs.filter(l => l.studentId === student.id)} />
          ))}
          {students.filter(s => s.grade === activeGrade).length === 0 && (
            <div className="col-span-full bg-white/50 border-2 border-dashed border-slate-300 rounded-3xl p-12 text-center text-slate-400 font-bold">
              No students added to {activeGrade} grade yet. Click "+ Add Student" above.
            </div>
          )}
        </div>
      </div>

      {showWizard && (
        <LogWizard 
          students={students.filter(s => s.grade === activeGrade)} 
          onSave={handleSaveLogs} 
          onCancel={() => setShowWizard(false)} 
        />
      )}
    </div>
  );
};

export default App;
