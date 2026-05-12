import { useState, useEffect } from 'react';
import { Cpu, Terminal, CheckCircle2, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

export default function AIDiagnostics() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const mockLogs = [
      "[SYS] Initializing Sentinel-X Core...",
      "[AI_AGENT_1] Loaded Landslide Prediction Model v2.4",
      "[AI_AGENT_2] Threat Detection Model initialized (Accuracy: 99.4%)",
      "[PIPELINE] Connecting to data lake stream...",
      "[PIPELINE] Stream connected. Ingesting telemetry at 142 req/s",
      "[AI_AGENT_1] Analyzing structural integrity of Node-Alpha...",
      "[AI_AGENT_1] Risk score nominal (0.2). No action required.",
      "[AI_AGENT_2] Deep packet inspection on port 443...",
      "[AI_AGENT_2] ⚠️ Anomaly detected from IP 45.33.22.11",
      "[AI_AGENT_3] Classifying anomaly...",
      "[AI_AGENT_3] Classification complete: Brute Force Attempt (Confidence: 98%)",
      "[SYS] Triggering automated remediation protocol."
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < mockLogs.length) {
        setLogs(prev => [...prev, mockLogs[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
      }
    }, 800);

    return () => clearInterval(interval);
  }, []);

  const accuracyData = [
    { name: 'Accurate', value: 99.4, color: '#22c55e' },
    { name: 'Error Margin', value: 0.6, color: '#1e293b' }
  ];

  return (
    <div className="p-8 space-y-6 h-full flex flex-col">
      <header className="mb-4">
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
          <Cpu className="text-purple-400" size={32} />
          AI Diagnostics
        </h2>
        <p className="text-slate-400">Real-time neural network evaluation and model performance</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
        {/* Real-time AI Log Console */}
        <div className="glass-panel p-0 col-span-2 flex flex-col relative overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center gap-2">
            <Terminal size={18} className="text-slate-400" />
            <span className="text-sm font-mono text-slate-300">sentinel-x-pipeline.log</span>
            <div className="ml-auto flex gap-2">
              <span className="h-3 w-3 rounded-full bg-danger"></span>
              <span className="h-3 w-3 rounded-full bg-warning"></span>
              <span className="h-3 w-3 rounded-full bg-safe"></span>
            </div>
          </div>
          <div className="flex-1 bg-[#0a0a0a] p-4 overflow-y-auto font-mono text-sm space-y-1">
            {logs.map((log, index) => {
              let color = "text-slate-300";
              if (log.includes("[SYS]")) color = "text-blue-400 font-bold";
              if (log.includes("[AI_AGENT")) color = "text-purple-400";
              if (log.includes("⚠️")) color = "text-warning";
              
              return (
                <div key={index} className={`${color} opacity-0 animate-[fadeIn_0.3s_ease-in-out_forwards]`}>
                  <span className="text-slate-600 mr-4">{new Date().toISOString().split('T')[1].substring(0, 8)}</span>
                  {log}
                </div>
              );
            })}
            <div className="text-slate-500 animate-pulse mt-2">_</div>
          </div>
        </div>

        {/* Model Metrics */}
        <div className="space-y-6 flex flex-col">
          <div className="glass-panel p-6 flex-1 flex flex-col items-center justify-center relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-safe/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <h3 className="text-slate-400 font-medium mb-4 w-full text-left">Threat Model Accuracy</h3>
            <div className="h-40 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={accuracyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    stroke="none"
                  >
                    {accuracyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-bold text-safe">99.4%</span>
                <span className="text-xs text-slate-500">F1 Score</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 flex-1">
            <h3 className="text-slate-400 font-medium mb-4">Pipeline Status</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-safe" size={20} />
                <span className="text-sm text-slate-300">Data Ingestion</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-safe" size={20} />
                <span className="text-sm text-slate-300">Feature Extraction</span>
              </li>
              <li className="flex items-center gap-3">
                <AlertCircle className="text-warning animate-pulse" size={20} />
                <span className="text-sm text-warning">Anomaly Classification</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-safe" size={20} />
                <span className="text-sm text-slate-300">Auto-Remediation</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
