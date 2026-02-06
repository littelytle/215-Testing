import React, { useState } from 'react';
import { Student, Subject, LogEntry } from '../types';
import { Button } from './Button';

interface LogWizardProps {
  students: Student[];
  onSave: (logs: Omit<LogEntry, 'id' | 'timestamp'>[]) => void;
  onCancel: () => void;
}

export const LogWizard: React.FC<LogWizardProps> = ({ students, onSave, onCancel }) => {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [subject, setSubject] = useState<Subject>(Subject.MATH);
  const [minutes, setMinutes] = useState<number>(15);
  const [staffName, setStaffName] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudents.length === 0 || !staffName) {
      alert("Please select at least one student and enter your name.");
      return;
    }

    const newLogs = selectedStudents.map(studentId => ({
      studentId,
      subject,
      minutes,
      date,
      staffName,
      notes
    }));

    onSave(newLogs);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-800">Log Session</h2>
            <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600 font-bold text-xl">✕</button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Staff Name</label>
              <input type="text" value={staffName} onChange={e => setStaffName(e.target.value)} placeholder="Teacher A" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Select Students</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
              {students.map(student => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => setSelectedStudents(prev => prev.includes(student.id) ? prev.filter(id => id !== student.id) : [...prev, student.id])}
                  className={`p-2 rounded-lg text-xs font-bold border transition-all ${selectedStudents.includes(student.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                >
                  {student.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Subject</label>
              <select value={subject} onChange={e => setSubject(e.target.value as Subject)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                {Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Minutes</label>
              <input type="number" value={minutes} onChange={e => setMinutes(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Notes (Optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none h-24" />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
            <Button type="submit" className="flex-1">Save Session</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
