import { useState, useEffect } from 'react';
import axios from 'axios';
import { Network, Server, Wifi, WifiOff, AlertTriangle, Search } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'https://iot-security-068d.onrender.com';

export default function NodeNetwork() {
  const formatLocalTime = (timestamp) => {
    if (!timestamp) return "-";
    let isoStr = timestamp;
    if (!isoStr.endsWith('Z') && !isoStr.includes('+')) {
      isoStr = isoStr.replace(' ', 'T') + 'Z';
    }
    return new Date(isoStr).toLocaleTimeString();
  };

  const [nodes, setNodes] = useState([]);
  const [bandwidthData, setBandwidthData] = useState([]);
  const [stats, setStats] = useState({ total: 0, online: 0, compromised: 0, offline: 0 });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Initialize bandwidth data
    setBandwidthData(Array.from({ length: 20 }, (_, i) => ({ time: i, val: 0 })));

    const fetchData = async () => {
      try {
        const [nodesRes, dashRes] = await Promise.all([
          axios.get(`${API_URL}/nodes`),
          axios.get(`${API_URL}/dashboard-data`)
        ]);

        if (nodesRes.data) {
          const liveNodes = nodesRes.data;
          setNodes(liveNodes);
          
          let online = 0, comp = 0, off = 0;
          liveNodes.forEach(n => {
            if (n.status === 'Active') online++;
            else if (n.status === 'Compromised' || n.status === 'Isolated') comp++;
            else if (n.status === 'Offline') off++;
          });
          setStats({ total: liveNodes.length, online, compromised: comp, offline: off });
        }

        if (dashRes.data && dashRes.data.recent_telemetry) {
          // Estimate bandwidth by telemetry volume
          const reqPerSec = dashRes.data.recent_telemetry.length;
          const kbps = reqPerSec * 2.5; // Roughly 2.5kb per request
          setBandwidthData(prev => {
            const next = [...prev.slice(1), { time: prev[prev.length - 1].time + 1, val: kbps }];
            return next;
          });
        }
      } catch (error) {
        console.error("Error fetching network data", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const filteredNodes = nodes.filter(n => n.node_id.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-8 space-y-6 h-full flex flex-col">
      <header className="mb-4 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
            <Network className="text-blue-400" size={32} />
            Node Topology
          </h2>
          <p className="text-slate-400">Geographic and logical status of all connected IoT sensors</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Search nodes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-sm rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500 w-64"
          />
        </div>
      </header>

      {/* Network Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <Server className="text-blue-400" size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Total Nodes</div>
          </div>
        </div>
        <div className="glass-panel p-4 flex items-center gap-4">
          <div className="p-3 bg-safe/20 rounded-lg">
            <Wifi className="text-safe" size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{stats.online}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Online</div>
          </div>
        </div>
        <div className="glass-panel p-4 flex items-center gap-4 border-warning/30">
          <div className="p-3 bg-warning/20 rounded-lg">
            <AlertTriangle className="text-warning" size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{stats.compromised}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Compromised</div>
          </div>
        </div>
        <div className="glass-panel p-4 flex items-center gap-4">
          <div className="p-3 bg-slate-800 rounded-lg">
            <WifiOff className="text-slate-500" size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{stats.offline}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Offline</div>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Node Grid */}
        <div className="lg:col-span-2 glass-panel p-6 overflow-y-auto max-h-[500px]">
          <h3 className="text-lg font-semibold text-white mb-4">Active Deployments</h3>
          {filteredNodes.length === 0 ? (
            <div className="text-center text-slate-500 py-8">No nodes found. Start the pi_node.py simulator.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNodes.map(node => (
                <div 
                  key={node.node_id} 
                  className={`p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                    node.status === 'Active' ? 'bg-slate-900/50 border-slate-700 hover:border-blue-500' :
                    node.status === 'Compromised' ? 'bg-danger/10 border-danger/50 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]' :
                    'bg-slate-900/30 border-slate-800 opacity-70'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      {node.status === 'Active' ? <Wifi size={16} className="text-safe" /> :
                      node.status === 'Compromised' ? <AlertTriangle size={16} className="text-danger" /> :
                      <WifiOff size={16} className="text-slate-500" />}
                      <span className="font-semibold text-slate-200">{node.node_id}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      node.status === 'Active' ? 'bg-safe/20 text-safe' :
                      node.status === 'Compromised' ? 'bg-danger/20 text-danger' :
                      'bg-slate-800 text-slate-400'
                    }`}>{node.status}</span>
                  </div>
                  
                  <div className="text-xs text-slate-500 mb-4">Last seen: {formatLocalTime(node.last_seen)}</div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-darker rounded py-1 border border-slate-800/50">
                      <div className="text-slate-400 mb-1">Ping</div>
                      <div className={node.status === 'Offline' ? 'text-slate-500' : 'text-slate-200 font-mono'}>{node.status === 'Offline' ? '-' : '12ms'}</div>
                    </div>
                    <div className="bg-darker rounded py-1 border border-slate-800/50">
                      <div className="text-slate-400 mb-1">Status</div>
                      <div className="text-slate-200 font-mono truncate">{node.status}</div>
                    </div>
                    <div className="bg-darker rounded py-1 border border-slate-800/50">
                      <div className="text-slate-400 mb-1">Uptime</div>
                      <div className="text-safe font-mono">{node.status === 'Offline' ? '0%' : '99.9%'}</div>
                    </div>
                  </div>
                  
                  {node.status === 'Isolated' || node.status === 'Compromised' ? (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        axios.post(`${API_URL}/nodes/${node.node_id}/recover`).then(() => {
                          alert("Node recovered successfully!");
                        });
                      }}
                      className="mt-4 w-full py-2 bg-safe/20 hover:bg-safe/40 text-safe border border-safe/30 rounded text-xs font-bold tracking-wider uppercase transition-colors"
                    >
                      RECOVER & RESET NODE
                    </button>
                  ) : (
                    node.status !== 'Offline' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if(window.confirm(`Are you sure you want to isolate node ${node.node_id}? This will trigger a physical hardware lockdown.`)) {
                            axios.post(`${API_URL}/nodes/${node.node_id}/isolate`).then(() => {
                              alert("Node isolated!");
                            });
                          }
                        }}
                        className="mt-4 w-full py-2 bg-danger/10 hover:bg-danger/30 text-danger border border-danger/30 rounded text-xs font-bold tracking-wider uppercase transition-colors"
                      >
                        KILL SWITCH: ISOLATE NODE
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Global Bandwidth Chart */}
        <div className="glass-panel p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-4">Network Throughput</h3>
          <div className="flex-1 min-h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bandwidthData}>
                <defs>
                  <linearGradient id="colorBw" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="val" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBw)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-sm">
            <span className="text-slate-500">Current Load</span>
            <span className="text-blue-400 font-mono font-bold">{bandwidthData.length > 0 ? bandwidthData[bandwidthData.length - 1].val.toFixed(1) : 0} kbps</span>
          </div>
        </div>
      </div>
    </div>
  );
}
