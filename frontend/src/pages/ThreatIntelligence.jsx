import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ShieldAlert, Map, AlertOctagon, Activity, Globe, Lock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://iot-security-068d.onrender.com';

export default function ThreatIntelligence() {
  const [threatData, setThreatData] = useState([]);
  const [recentThreats, setRecentThreats] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_URL}/threats`);
        if (response.data) {
          setThreatData(response.data.vectors || []);
          setRecentThreats(response.data.recent_incidents || []);
        }
      } catch (error) {
        console.error("Error fetching threat data", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 space-y-6 h-full flex flex-col">
      <header className="mb-4">
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
          <ShieldAlert className="text-danger" size={32} />
          Threat Intelligence
        </h2>
        <p className="text-slate-400">Global threat map and attack vector analysis</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
        {/* Global Threat Map Placeholder */}
        <div className="glass-panel p-6 col-span-2 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-danger/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="text-blue-400" size={20} />
            Global Threat Map
          </h3>
          <div className="flex-1 bg-slate-900/50 rounded-lg border border-slate-800 flex items-center justify-center relative overflow-hidden">
            {/* A simulated map overlay using a grid pattern and some pulsing "hotspots" */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxwYXRoIGQ9Ik0wIDIwaDIwVjBIMHoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSg1OSwgMTMwLCAyNDYsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] opacity-30"></div>
            
            <div className="absolute top-1/4 left-1/3 w-4 h-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-danger"></span>
            </div>
            
            <div className="absolute top-1/2 right-1/4 w-3 h-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-warning"></span>
            </div>

            <Map size={64} className="text-slate-700 opacity-50 absolute" />
            <span className="relative z-10 text-slate-500 font-mono text-sm tracking-widest uppercase bg-darker/80 px-4 py-2 rounded">Live Map Uplink Established</span>
          </div>
        </div>

        {/* Threat Vectors Chart */}
        <div className="glass-panel p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="text-purple-400" size={20} />
            Attack Vectors
          </h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={threatData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#475569" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#475569" fontSize={12} width={120} />
                <Tooltip 
                  cursor={{fill: '#1e293b', opacity: 0.4}}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="attacks" radius={[0, 4, 4, 0]}>
                  {threatData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Blocked Threats Table */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Lock className="text-safe" size={20} />
          Active Intercepts
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs uppercase bg-slate-800/50 text-slate-300">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Timestamp</th>
                <th className="px-4 py-3">Source IP</th>
                <th className="px-4 py-3">Node Target</th>
                <th className="px-4 py-3">Attack Type</th>
                <th className="px-4 py-3 rounded-tr-lg">Description</th>
              </tr>
            </thead>
            <tbody>
              {recentThreats.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-4">No recent threats logged.</td></tr>
              ) : recentThreats.map((threat, idx) => (
                <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{new Date(threat.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-white">{threat.ip_address}</td>
                  <td className="px-4 py-3">{threat.node_id || 'Global'}</td>
                  <td className="px-4 py-3 text-warning uppercase font-bold">{threat.event_type.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-slate-300">{threat.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
