import { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, ShieldCheck, Activity, Wifi, ShieldX, ServerCrash } from 'lucide-react';

// Use env variable or fallback to local backend for testing
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function Dashboard() {
  const [data, setData] = useState({
    stats: { total_nodes: 0, suspicious_nodes: 0, blocked_ips: 0 },
    recent_telemetry: [],
    recent_logs: []
  });

  // Polling every 2 seconds as requested
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_URL}/dashboard-data`);
        // Only set data if it has the expected shape
        if (response.data && response.data.recent_telemetry) {
          setData(response.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  // Safe fallbacks in case data gets corrupted
  const recentTelemetry = data.recent_telemetry || [];
  const recentLogs = data.recent_logs || [];
  const stats = data.stats || { total_nodes: 0, suspicious_nodes: 0, blocked_ips: 0 };

  // Format chart data (reverse so newest is on the right)
  const chartData = [...recentTelemetry].reverse().map(t => ({
    time: new Date(t.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    moisture: t.moisture,
    shake: t.shake * 10, // Scale for visibility
    risk: t.risk_score
  }));

  // Calculate overall system status
  const isUnderAttack = stats.suspicious_nodes > 0 || stats.blocked_ips > 0;
  const hasLandslideRisk = recentTelemetry.some(t => t.alert_severity === "LANDSLIDE RISK");
  
  let systemStatus = "NORMAL";
  let statusColor = "text-safe";
  let StatusIcon = ShieldCheck;

  if (isUnderAttack && hasLandslideRisk) {
    systemStatus = "CRITICAL MULTI-THREAT";
    statusColor = "text-danger";
    StatusIcon = ServerCrash;
  } else if (isUnderAttack) {
    systemStatus = "CYBER ATTACK DETECTED";
    statusColor = "text-danger";
    StatusIcon = ShieldX;
  } else if (hasLandslideRisk) {
    systemStatus = "LANDSLIDE IMMINENT";
    statusColor = "text-warning";
    StatusIcon = AlertTriangle;
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <header className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Global Command Center</h2>
          <p className="text-slate-400">Real-time IoT Landslide & Threat Monitoring</p>
        </div>
        <div className={`glass-panel px-6 py-3 flex items-center gap-4 ${isUnderAttack ? 'border-danger/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : ''}`}>
          <div className="flex flex-col text-right">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">System Status</span>
            <span className={`text-lg font-bold tracking-widest ${statusColor} animate-pulse`}>
              {systemStatus}
            </span>
          </div>
          <StatusIcon size={32} className={statusColor} />
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-slate-400 font-medium">Active Nodes</h3>
            <Wifi className="text-blue-400" size={20} />
          </div>
          <span className="text-4xl font-bold text-white">{stats.total_nodes}</span>
        </div>

        <div className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-safe/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-slate-400 font-medium">Telemetry Rate</h3>
            <Activity className="text-safe" size={20} />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-white">{(recentTelemetry.length / 10).toFixed(1)}</span>
            <span className="text-slate-500 mb-1">req/s</span>
          </div>
        </div>

        <div className={`glass-panel p-6 flex flex-col justify-between relative overflow-hidden group ${stats.suspicious_nodes > 0 ? 'border-danger/50 bg-danger/5' : ''}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-danger/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-slate-400 font-medium">Compromised Nodes</h3>
            <ShieldAlert className={stats.suspicious_nodes > 0 ? "text-danger animate-pulse" : "text-slate-500"} size={20} />
          </div>
          <span className={`text-4xl font-bold ${stats.suspicious_nodes > 0 ? 'text-danger' : 'text-white'}`}>
            {stats.suspicious_nodes}
          </span>
        </div>

        <div className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-slate-400 font-medium">Blocked IPs</h3>
            <ShieldX className="text-purple-400" size={20} />
          </div>
          <span className="text-4xl font-bold text-white">{stats.blocked_ips}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="glass-panel p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Activity size={18} className="text-primary" />
            Live Telemetry Matrix
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={12} tickMargin={10} />
                <YAxis stroke="#475569" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="risk" stroke="#ef4444" fillOpacity={1} fill="url(#colorRisk)" name="Risk Score" strokeWidth={2} />
                <Area type="monotone" dataKey="moisture" stroke="#3b82f6" fillOpacity={1} fill="url(#colorMoisture)" name="Moisture %" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Threat Logs */}
        <div className="glass-panel p-0 flex flex-col h-[400px]">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center rounded-t-xl">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 tracking-wider">
              <ShieldAlert size={16} className="text-danger" />
              CYBER THREAT LOG
            </h3>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-danger"></span>
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {recentLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <ShieldCheck size={32} className="mb-2 opacity-50" />
                <p className="text-sm">No threats detected</p>
              </div>
            ) : (
              recentLogs.map((log, idx) => (
                <div key={idx} className="bg-danger/10 border border-danger/20 rounded p-3 text-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-danger font-bold text-xs uppercase tracking-wider">{log.event_type.replace('_', ' ')}</span>
                    <span className="text-slate-500 text-xs">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-300 mb-1">{log.description}</p>
                  <div className="flex gap-2 text-xs font-mono">
                    <span className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">IP: {log.ip_address}</span>
                    {log.node_id && <span className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">Node: {log.node_id}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Sensor Data Feed */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Live Node Telemetry Feed</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs uppercase bg-slate-800/50 text-slate-300">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Timestamp</th>
                <th className="px-4 py-3">Node ID</th>
                <th className="px-4 py-3">Moisture</th>
                <th className="px-4 py-3">Shake</th>
                <th className="px-4 py-3">Tilt</th>
                <th className="px-4 py-3 text-right">Risk Score</th>
                <th className="px-4 py-3 rounded-tr-lg">Alert Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTelemetry.slice(0, 8).map((t, idx) => (
                <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{new Date(t.timestamp).toLocaleTimeString()}</td>
                  <td className="px-4 py-3 font-medium text-white">{t.node_id}</td>
                  <td className="px-4 py-3">{t.moisture}%</td>
                  <td className="px-4 py-3">{t.shake}</td>
                  <td className="px-4 py-3">{t.tilt}°</td>
                  <td className="px-4 py-3 text-right font-mono">{t.risk_score.toFixed(1)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      t.alert_severity === 'SAFE' ? 'bg-safe/20 text-safe' : 
                      t.alert_severity === 'WARNING' ? 'bg-warning/20 text-warning' : 
                      'bg-danger/20 text-danger animate-pulse'
                    }`}>
                      {t.alert_severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
