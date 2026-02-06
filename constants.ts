
import { Student, Subject } from './types';

export const INITIAL_STUDENTS: Student[] = [
  { 
    id: '1', 
    name: 'Alex Thompson', 
    grade: '6th', 
    subjectGoals: { [Subject.MATH]: 30, [Subject.ENGLISH]: 20, [Subject.TASK_COMPLETION]: 10 } 
  },
  { 
    id: '2', 
    name: 'Maya Rodriguez', 
    grade: '7th', 
    subjectGoals: { [Subject.MATH]: 15, [Subject.ENGLISH]: 30, [Subject.TASK_COMPLETION]: 0 } 
  },
  { 
    id: '3', 
    name: 'Jordan Lee', 
    grade: '8th', 
    subjectGoals: { [Subject.MATH]: 45, [Subject.ENGLISH]: 45, [Subject.TASK_COMPLETION]: 0 } 
  },
  { 
    id: '4', 
    name: 'Sam Rivera', 
    grade: '6th', 
    subjectGoals: { [Subject.MATH]: 10, [Subject.ENGLISH]: 10, [Subject.TASK_COMPLETION]: 10 } 
  },
  { 
    id: '5', 
    name: 'Casey Smith', 
    grade: '7th', 
    subjectGoals: { [Subject.MATH]: 40, [Subject.ENGLISH]: 40, [Subject.TASK_COMPLETION]: 40 } 
  },
  { 
    id: '6', 
    name: 'Riley Vance', 
    grade: '8th', 
    subjectGoals: { [Subject.MATH]: 20, [Subject.ENGLISH]: 20, [Subject.TASK_COMPLETION]: 20 } 
  }
];

export const SUBJECT_COLORS: Record<Subject, string> = {
  [Subject.MATH]: 'bg-blue-100 text-blue-700 border-blue-200',
  [Subject.ENGLISH]: 'bg-purple-100 text-purple-700 border-purple-200',
  [Subject.TASK_COMPLETION]: 'bg-emerald-100 text-emerald-700 border-emerald-200'
};

export const STAFF_MEMBERS = [
  { name: 'Teacher Alpha', color: 'bg-indigo-500' },
  { name: 'Teacher Beta', color: 'bg-rose-500' },
  { name: 'Teacher Gamma', color: 'bg-amber-500' },
  { name: 'Teacher Delta', color: 'bg-emerald-500' },
  { name: 'Teacher Epsilon', color: 'bg-sky-500' }
];

export const GET_STAFF_COLOR = (name: string) => {
  const staff = STAFF_MEMBERS.find(s => s.name === name);
  return staff ? staff.color : 'bg-slate-400';
};
