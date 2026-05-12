import { useState } from 'react';
import { Network, Server, Wifi, WifiOff, AlertTriangle, Search } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export default function NodeNetwork() {
  const [nodes] = useState([
    { id: 'Node-Alpha', region: 'Sector 7G', status: 'Active', latency: 12, bandwidth: 450, uptime: '99.9%' },
    { id: 'Node-Beta', region: 'Sector 7G', status: 'Active', latency: 15, bandwidth: 420, uptime: '99.8%' },
    { id: 'Node-Gamma', region: 'Sector 4B', status: 'Compromised', latency: 890, bandwidth: 12, uptime: '94.2%' },
    { id: 'Node-Delta', region: 'Sector 4B', status: 'Active', latency: 18, bandwidth: 390, uptime: '99.9%' },
    { id: 'Node-Epsilon', region: 'Sector 2A', status: 'Offline', latency: 0, bandwidth: 0, uptime: '82.1%' },
    { id: 'Node-Zeta', region: 'Sector 2A', status: 'Active', latency: 11, bandwidth: 510, uptime: '100%' },
  ]);

  const mockBandwidthData = Array.from({ length: 20 }, (_, i) => ({
    time: i,
    val: 400 + Math.random() * 100
  }));

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
            <div className="text-2xl font-bold text-white">1,204</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Total Nodes</div>
          </div>
        </div>
        <div className="glass-panel p-4 flex items-center gap-4">
          <div className="p-3 bg-safe/20 rounded-lg">
            <Wifi className="text-safe" size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">1,198</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Online</div>
          </div>
        </div>
        <div className="glass-panel p-4 flex items-center gap-4 border-warning/30">
          <div className="p-3 bg-warning/20 rounded-lg">
            <AlertTriangle className="text-warning" size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">2</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Compromised</div>
          </div>
        </div>
        <div className="glass-panel p-4 flex items-center gap-4">
          <div className="p-3 bg-slate-800 rounded-lg">
            <WifiOff className="text-slate-500" size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">4</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Offline</div>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Node Grid */}
        <div className="lg:col-span-2 glass-panel p-6 overflow-y-auto max-h-[500px]">
          <h3 className="text-lg font-semibold text-white mb-4">Active Deployments</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nodes.map(node => (
              <div 
                key={node.id} 
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
                    <span className="font-semibold text-slate-200">{node.id}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    node.status === 'Active' ? 'bg-safe/20 text-safe' :
                    node.status === 'Compromised' ? 'bg-danger/20 text-danger' :
                    'bg-slate-800 text-slate-400'
                  }`}>{node.status}</span>
                </div>
                
                <div className="text-xs text-slate-500 mb-4">{node.region}</div>
                
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-darker rounded py-1 border border-slate-800/50">
                    <div className="text-slate-400 mb-1">Ping</div>
                    <div className={node.latency > 100 ? 'text-warning font-mono' : 'text-slate-200 font-mono'}>{node.latency}ms</div>
                  </div>
                  <div className="bg-darker rounded py-1 border border-slate-800/50">
                    <div className="text-slate-400 mb-1">Tx/Rx</div>
                    <div className="text-slate-200 font-mono">{node.bandwidth} <span className="text-[10px]">kbps</span></div>
                  </div>
                  <div className="bg-darker rounded py-1 border border-slate-800/50">
                    <div className="text-slate-400 mb-1">Uptime</div>
                    <div className="text-safe font-mono">{node.uptime}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Bandwidth Chart */}
        <div className="glass-panel p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-4">Network Throughput</h3>
          <div className="flex-1 min-h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockBandwidthData}>
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
            <span className="text-blue-400 font-mono font-bold">4.2 GB/s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
