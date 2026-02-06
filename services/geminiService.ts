
import { GoogleGenAI } from "@google/genai";
import { LogEntry, Student } from "../types";

// Always use the process.env.API_KEY directly for initialization as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  async summarizeProgress(student: Student, logs: LogEntry[]) {
    if (!process.env.API_KEY) return "AI Summary unavailable (API Key not found).";
    
    const logsDescription = logs.map(l => 
      `- ${l.date}: ${l.minutes} mins in ${l.subject}. Note: ${l.notes || 'No notes'}`
    ).join('\n');

    // Fix: Access student goals via the subjectGoals record instead of the non-existent weeklyGoalMinutes property.
    const goalsDescription = Object.entries(student.subjectGoals)
      .filter(([_, goal]) => (goal as number) > 0)
      .map(([subject, goal]) => `${subject}: ${goal}m/week`)
      .join(', ');

    const prompt = `
      You are an expert Special Education Coordinator. 
      Analyze the following service logs for student ${student.name} (${student.grade} grade).
      Goal: Summarize the week's progress and identify any patterns or concerns.
      Keep it professional, concise, and ready for an IEP meeting report.
      
      Logs:
      ${logsDescription}
      
      Weekly Goals: ${goalsDescription}.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      // Access the .text property directly as it is a getter, not a method.
      return response.text || "Could not generate summary.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "An error occurred while generating the summary.";
    }
  },

  async transformNotesToProfessional(note: string) {
    if (!process.env.API_KEY || !note.trim()) return note;

    const prompt = `
      Transform the following raw classroom service note into professional, clinical language suitable for an IEP progress report.
      Maintain the original meaning but improve vocabulary and structure.
      
      Raw Note: "${note}"
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      // Access the .text property directly as it is a getter, not a method.
      return response.text || note;
    } catch (error) {
      return note;
    }
  }
};
