import { useState, useEffect } from 'react';
import axios from 'axios';
import { Database, HardDrive, Download, Search, Terminal } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'https://iot-security-068d.onrender.com';

export default function DataLake() {
  const [query, setQuery] = useState('SELECT * FROM telemetry\nWHERE risk_score > 0.8\nORDER BY timestamp DESC\nLIMIT 10;');
  const [queryResults, setQueryResults] = useState(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [telemetryCount, setTelemetryCount] = useState(0);

  useEffect(() => {
    // Just fetch count for storage stats roughly
    const fetchStats = async () => {
      try {
        const dashRes = await axios.get(`${API_URL}/dashboard-data`);
        if (dashRes.data && dashRes.data.recent_telemetry) {
          // We can't get total DB size easily without a specific endpoint, so we'll mock the size based on activity
          setTelemetryCount(dashRes.data.recent_telemetry.length * 100); 
        }
      } catch (e) {
        console.error("Error fetching stats", e);
      }
    };
    fetchStats();
    const int = setInterval(fetchStats, 5000);
    return () => clearInterval(int);
  }, []);

  const handleRunQuery = async () => {
    setIsQuerying(true);
    try {
      const response = await axios.get(`${API_URL}/telemetry`);
      // Simulate applying the SQL query by just filtering risk_score > 0 if that's in the text
      let data = response.data || [];
      if (query.includes('risk_score >')) {
        data = data.filter(d => d.risk_score > 0);
      }
      setQueryResults(data.slice(0, 10)); // Limit 10
    } catch (error) {
      console.error("Query failed", error);
    } finally {
      setIsQuerying(false);
    }
  };

  const storageData = [
    { name: 'Hot Storage (NVMe)', value: 45 + (telemetryCount * 0.01), color: '#3b82f6' },
    { name: 'Warm Storage (SSD)', value: 120, color: '#f59e0b' },
    { name: 'Cold Storage (Tape)', value: 850, color: '#1e293b' },
  ];

  const recentExports = [
    { id: 'EXP-9012', user: 'admin', format: 'CSV', size: '24.5 MB', date: 'Today, 09:12 AM', status: 'Completed' },
    { id: 'EXP-9011', user: 'system', format: 'JSON', size: '1.2 GB', date: 'Yesterday, 11:00 PM', status: 'Completed' },
  ];

  return (
    <div className="p-8 space-y-6 h-full flex flex-col">
      <header className="mb-4">
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
          <Database className="text-blue-400" size={32} />
          Telemetry Data Lake
        </h2>
        <p className="text-slate-400">Raw sensor data storage, query interface, and export management</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
        {/* SQL Query Interface */}
        <div className="glass-panel p-0 col-span-2 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Terminal size={18} className="text-slate-400" />
              <span className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Athena Query Console</span>
            </div>
            <button 
              onClick={handleRunQuery}
              disabled={isQuerying}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white px-4 py-1 rounded text-sm font-medium transition-colors"
            >
              {isQuerying ? 'Executing...' : 'Run Query'}
            </button>
          </div>
          <div className="p-4 bg-[#0a0a0a] border-b border-slate-800">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-blue-400 font-mono text-sm focus:outline-none resize-none h-24"
              spellCheck="false"
            />
          </div>
          <div className="flex-1 p-0 overflow-y-auto bg-slate-900/30">
            {!queryResults ? (
              <div className="flex items-center justify-center h-full text-slate-500 flex-col gap-2 opacity-50 p-8">
                <Search size={32} />
                <p>Execute query to view results</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="text-xs uppercase bg-slate-800 text-slate-300 sticky top-0">
                  <tr>
                    <th className="px-4 py-2">Timestamp</th>
                    <th className="px-4 py-2">Node</th>
                    <th className="px-4 py-2">Risk</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {queryResults.length === 0 && <tr><td colSpan="4" className="p-4 text-center">No results found</td></tr>}
                  {queryResults.map((row, i) => (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/80">
                      <td className="px-4 py-2 font-mono text-xs">{new Date(row.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-2">{row.node_id}</td>
                      <td className="px-4 py-2 text-warning">{row.risk_score.toFixed(2)}</td>
                      <td className="px-4 py-2">{row.alert_severity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Storage Stats */}
        <div className="space-y-6 flex flex-col">
          <div className="glass-panel p-6 flex flex-col items-center justify-center relative">
            <h3 className="text-slate-400 font-medium mb-4 w-full text-left flex items-center gap-2">
              <HardDrive size={18} />
              Storage Distribution
            </h3>
            <div className="h-48 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={storageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {storageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-bold text-white">1.01</span>
                <span className="text-xs text-slate-500">Petabytes</span>
              </div>
            </div>
            
            <div className="w-full space-y-2 mt-4">
              {storageData.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-300">{item.name}</span>
                  </span>
                  <span className="text-slate-400">{item.value.toFixed(1)} TB</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 flex-1 overflow-y-auto">
            <h3 className="text-slate-400 font-medium mb-4 flex items-center gap-2">
              <Download size={18} />
              Recent Exports
            </h3>
            <div className="space-y-3">
              {recentExports.map((exp, idx) => (
                <div key={idx} className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-white font-medium text-sm">{exp.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      exp.status === 'Completed' ? 'bg-safe/20 text-safe' : 'bg-danger/20 text-danger'
                    }`}>{exp.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <div>User: <span className="text-slate-300">{exp.user}</span></div>
                    <div>Format: <span className="text-slate-300">{exp.format}</span></div>
                    <div>Size: <span className="text-slate-300">{exp.size}</span></div>
                    <div>Date: <span className="text-slate-300">{exp.date}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
