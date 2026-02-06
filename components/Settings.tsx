import React, { useRef } from 'react';
import { Student, LogEntry } from './types'; // Fixed: ./ instead of ../
import { Button } from './Button';

interface SettingsProps {
  students: Student[];
  logs: LogEntry[];
  syncUrl: string;
  onSetSyncUrl: (url: string) => void;
  onImport: (students: Student[], logs: LogEntry[]) => void;
  onClear: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  students, 
  logs, 
  syncUrl, 
  onSetSyncUrl, 
  onImport, 
  onClear 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = { students, logs, version: "1.0", timestamp: Date.now() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `IEP_Team_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.students && Array.isArray(data.students)) {
          if (confirm("This will overwrite your current student list and logs with the imported file. Proceed?")) {
            onImport(data.students, data.logs || []);
          }
        }
      } catch (err) {
        alert("Invalid setup file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-black text-slate-900 mb-2">Team Setup</h2>
        <p className="text-slate-500">Configure collaboration and data distribution.</p>
      </div>

      <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 text-xl">☁</div>
          <div>
            <h3 className="font-bold text-slate-900">Google Sheets Connection</h3>
            <p className="text-xs text-slate-500">Automatically push logs to your team spreadsheet.</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Apps Script Web App URL</label>
          <input 
            type="text" 
            placeholder="https://script.google.com/macros/s/..." 
            className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-indigo-500 focus:outline-none text-sm font-mono"
            value={syncUrl}
            onChange={(e) => onSetSyncUrl(e.target.value)}
          />
          <p className="text-[10px] text-slate-400 leading-relaxed italic">
            * Note: Your script must handle a POST request containing the log data. 
            Once added, every log submission will trigger a sync in the background.
          </p>
        </div>
      </section>

      <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 text-xl">📂</div>
          <div>
            <h3 className="font-bold text-slate-900">Setup Sharing</h3>
            <p className="text-xs text-slate-500">Pass the student list to your team members.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-500">Step 1: Lead Setup</h4>
            <p className="text-[11px] text-slate-600">Add all students and goals, then export this file to share with your team.</p>
            <Button variant="outline" size="sm" fullWidth onClick={handleExport}>Export Team Setup</Button>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-500">Step 2: Team Import</h4>
            <p className="text-[11px] text-slate-600">Team members click here to load the setup file shared by the team lead.</p>
            <Button variant="primary" size="sm" fullWidth onClick={() => fileInputRef.current?.click()}>Import Setup</Button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
          </div>
        </div>
      </section>

      <section className="pt-8 border-t border-slate-200 flex justify-between items-center">
        <div className="text-xs text-slate-400">
          <p>This tool is open-source and respects privacy.</p>
          <p>No data leaves this browser unless you configure a Sync URL.</p>
        </div>
        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => { if(confirm("Clear everything?")) onClear(); }}>Factory Reset App</Button>
      </section>
    </div>
  );
};
