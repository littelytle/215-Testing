
import React, { useState } from 'react';
import { Subject, Student, LogEntry, Grade } from './types';
import { Button } from './Button';
import { SUBJECT_COLORS, STAFF_MEMBERS } from './constants';

interface LogWizardProps {
  students: Student[];
  onSave: (logs: Omit<LogEntry, 'id' | 'timestamp'>[]) => void;
  onCancel: () => void;
}

export const LogWizard: React.FC<LogWizardProps> = ({ students, onSave, onCancel }) => {
  const [step, setStep] = useState(1);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [minutesStr, setMinutesStr] = useState<string>('50');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [staffName, setStaffName] = useState<string>(() => localStorage.getItem('iep_staff_name') || '');

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const filteredStudents = students.filter(s => s.grade === selectedGrade);

  const handleFinish = () => {
    const mins = parseInt(minutesStr) || 0;
    if (!selectedSubject || !staffName.trim() || mins <= 0) return;
    
    localStorage.setItem('iep_staff_name', staffName);

    const newLogs = selectedStudents.map(studentId => ({
      studentId,
      subject: selectedSubject,
      minutes: mins,
      date,
      staffName,
      notes
    }));
    onSave(newLogs);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl max-w-2xl mx-auto border border-slate-100">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-slate-900">Log Service</h2>
          <span className="text-sm font-medium text-slate-500">Step {step} of 4</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all duration-300" 
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Step 1: Pick Subject</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.values(Subject).map((sub) => (
              <button
                key={sub}
                onClick={() => { setSelectedSubject(sub); handleNext(); }}
                className={`p-6 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${
                  selectedSubject === sub 
                    ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200' 
                    : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg mb-4 flex items-center justify-center ${SUBJECT_COLORS[sub]}`}>
                  {sub === Subject.MATH && 'Σ'}
                  {sub === Subject.ENGLISH && 'Aa'}
                  {sub === Subject.TASK_COMPLETION && '✓'}
                </div>
                <div className="font-bold text-lg text-slate-900">{sub}</div>
              </button>
            ))}
          </div>
          <div className="flex justify-end pt-4">
            <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Step 2: Pick Grade</div>
          <div className="grid grid-cols-1 gap-4">
            {(['6th', '7th', '8th'] as Grade[]).map((grade) => (
              <button
                key={grade}
                onClick={() => { setSelectedGrade(grade); handleNext(); }}
                className={`p-5 rounded-xl border-2 text-center transition-all ${
                  selectedGrade === grade 
                    ? 'border-indigo-600 bg-indigo-50 font-bold text-indigo-700' 
                    : 'border-slate-100 bg-white hover:border-slate-200 font-medium text-slate-600'
                }`}
              >
                {grade} Grade
              </button>
            ))}
          </div>
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleBack}>Back</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Step 3: Who did you work with? ({selectedGrade})</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
            {filteredStudents.sort((a,b) => a.name.localeCompare(b.name)).map(student => (
              <button
                key={student.id}
                onClick={() => toggleStudent(student.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedStudents.includes(student.id)
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-slate-100 bg-white hover:border-slate-200'
                }`}
              >
                <div className="font-semibold text-slate-900">{student.name}</div>
                <div className="text-xs text-slate-500">Goal: {student.subjectGoals[selectedSubject!] || 0}m {selectedSubject}</div>
              </button>
            ))}
          </div>
          {filteredStudents.length === 0 && (
            <div className="py-12 text-center text-slate-400">No students found in this grade.</div>
          )}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={handleBack}>Back</Button>
            <div className="text-sm font-medium text-slate-600">
              {selectedStudents.length} selected
            </div>
            <Button 
              disabled={selectedStudents.length === 0} 
              onClick={handleNext}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Step 4: Finalize Details</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Team Member</label>
              <select
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 focus:outline-none bg-white"
              >
                <option value="">Select Staff...</option>
                {STAFF_MEMBERS.map(staff => (
                  <option key={staff.name} value={staff.name}>{staff.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Minutes Provided</label>
              <input
                type="text"
                placeholder="0"
                value={minutesStr}
                onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d+$/.test(val)) {
                        setMinutesStr(val);
                    }
                }}
                className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Observation Notes</label>
            <textarea
              placeholder="What did you work on? Any breakthroughs?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 h-24 rounded-xl border-2 border-slate-100 focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleBack}>Back</Button>
            <Button 
              onClick={handleFinish} 
              variant="primary"
              disabled={!staffName.trim() || !minutesStr}
            >
              Submit Logs
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
