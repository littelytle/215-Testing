
import React, { useState, useEffect } from 'react';
import { Grade, Student, Subject } from './types';
import { Button } from './Button';

interface AddStudentModalProps {
  onSave: (student: Omit<Student, 'id'>) => void;
  onCancel: () => void;
  initialStudent?: Student;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({ onSave, onCancel, initialStudent }) => {
  const [name, setName] = useState(initialStudent?.name || '');
  const [grade, setGrade] = useState<Grade>(initialStudent?.grade || '6th');
  // Store goals as strings to allow user to clear the input completely
  const [goals, setGoals] = useState<Record<Subject, string>>({
    [Subject.MATH]: initialStudent?.subjectGoals[Subject.MATH]?.toString() || '30',
    [Subject.ENGLISH]: initialStudent?.subjectGoals[Subject.ENGLISH]?.toString() || '30',
    [Subject.TASK_COMPLETION]: initialStudent?.subjectGoals[Subject.TASK_COMPLETION]?.toString() || '0'
  });

  const handleGoalChange = (subject: Subject, value: string) => {
    // Only allow digits or empty string
    if (value === '' || /^\d+$/.test(value)) {
      setGoals(prev => ({ ...prev, [subject]: value }));
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;

    // Convert string goals back to numbers for the actual data model
    const numericGoals: Record<Subject, number> = {
      [Subject.MATH]: parseInt(goals[Subject.MATH]) || 0,
      [Subject.ENGLISH]: parseInt(goals[Subject.ENGLISH]) || 0,
      [Subject.TASK_COMPLETION]: parseInt(goals[Subject.TASK_COMPLETION]) || 0,
    };

    onSave({ name, grade, subjectGoals: numericGoals });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 border border-slate-100 animate-in fade-in zoom-in duration-200">
        <h2 className="text-2xl font-black text-slate-900 mb-6">{initialStudent ? 'Edit Student' : 'Add New Student'}</h2>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Student Name</label>
            <input
              type="text"
              placeholder="Full Name"
              className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:outline-none font-bold text-slate-900"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Grade Level</label>
            <div className="flex gap-2">
              {(['6th', '7th', '8th'] as Grade[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGrade(g)}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                    grade === g 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Weekly Subject Goals (Minutes)</label>
            <div className="grid grid-cols-1 gap-3">
              {Object.values(Subject).map(sub => (
                <div key={sub} className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-500 w-24 uppercase pl-2">{sub}</span>
                  <input
                    type="text"
                    className="flex-1 p-3 rounded-xl border-2 border-white focus:border-indigo-500 focus:outline-none text-sm font-black text-slate-900 text-right"
                    value={goals[sub]}
                    onChange={(e) => handleGoalChange(sub, e.target.value)}
                  />
                  <span className="text-xs font-bold text-slate-400 pr-2">min</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-10">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button 
            variant="primary" 
            className="flex-1" 
            disabled={!name.trim()}
            onClick={handleSave}
          >
            {initialStudent ? 'Update Details' : 'Save Student'}
          </Button>
        </div>
      </div>
    </div>
  );
};
