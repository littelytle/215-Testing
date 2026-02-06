
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
  subjectGoals: Record<Subject, number>;
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
