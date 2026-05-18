import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ShieldAlert, Activity, Globe, Lock, Shield, Server, Cpu, RefreshCw, AlertTriangle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://iot-security-068d.onrender.com';

export default function ThreatIntelligence() {
  const [threatData, setThreatData] = useState([]);
  const [recentThreats, setRecentThreats] = useState([]);
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [threatRes, nodesRes] = await Promise.all([
          axios.get(`${API_URL}/threats`),
          axios.get(`${API_URL}/nodes`)
        ]);
        if (threatRes.data) {
          setThreatData(threatRes.data.vectors || []);
          setRecentThreats(threatRes.data.recent_incidents || []);
        }
        if (nodesRes.data) {
          setNodes(nodesRes.data);
        }
      } catch (error) {
        console.error("Error fetching threat data", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const formatLocalTime = (timestamp) => {
    if (!timestamp) return "-";
    let isoStr = timestamp;
    if (!isoStr.endsWith('Z') && !isoStr.includes('+')) {
      isoStr = isoStr.replace(' ', 'T') + 'Z';
    }
    return new Date(isoStr).toLocaleString([], {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Find which specific node status is Isolated or Compromised
  const isolatedNode = nodes.find(n => n.status === 'Compromised' || n.status === 'Isolated');
  const isCurrentlyAttacked = !!isolatedNode;
  const isolatedNodeId = isolatedNode ? isolatedNode.node_id : null;

  // Dynamically find the exact IP that targeted this specific isolated node!
  const relevantLog = recentThreats.find(t => t.node_id === isolatedNodeId && t.ip_address && t.ip_address !== "internal" && !t.ip_address.includes("ADMIN"));
  const attackerIp = relevantLog ? relevantLog.ip_address : "UNKNOWN SOURCE";

  return (
    <div className="p-8 space-y-6 h-full flex flex-col">
      <header className="mb-4">
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
          <ShieldAlert className="text-danger" size={32} />
          Threat Intelligence
        </h2>
        <p className="text-slate-400">Zero-Trust logical topology and real-time attack containment analysis</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Dynamic Interactive Threat Topology Map */}
        <div className="glass-panel p-6 lg:col-span-2 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-danger/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="text-blue-400" size={20} />
            Zero-Trust Threat Topology Map
          </h3>
          
          <div className="flex-1 bg-slate-950 rounded-lg border border-slate-800 p-4 flex flex-col justify-between relative overflow-hidden min-h-[350px]">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:24px_24px] opacity-40"></div>
            
            {/* HUD Status Header */}
            <div className="flex justify-between items-center relative z-10 text-xs font-mono border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${isCurrentlyAttacked ? 'bg-danger animate-pulse' : 'bg-safe'}`}></span>
                <span className="text-slate-400">STATUS:</span>
                <span className={isCurrentlyAttacked ? 'text-danger font-bold animate-pulse' : 'text-safe font-bold'}>
                  {isCurrentlyAttacked ? 'ACTIVE ATTACK DETECTED & ISOLATED' : 'UPLINK NOMINAL / SECURE'}
                </span>
              </div>
              <div className="text-slate-500">TARGET: {isCurrentlyAttacked ? isolatedNodeId : 'GLOBAL'}</div>
            </div>

            {/* Interactive Cyber Topology Diagram */}
            <div className="flex-1 flex items-center justify-center relative min-h-[250px] z-10">
              <svg className="w-full h-full min-h-[250px]" viewBox="0 0 700 250">
                <defs>
                  {/* Glowing neon filters */}
                  <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Animated CSS block inside SVG */}
                <style>{`
                  @keyframes redLaser {
                    to { stroke-dashoffset: -20; }
                  }
                  @keyframes shieldPulse {
                    0% { r: 18; opacity: 0.2; }
                    50% { r: 28; opacity: 0.6; }
                    100% { r: 18; opacity: 0.2; }
                  }
                  .laser-active {
                    stroke-dasharray: 8, 4;
                    animation: redLaser 0.8s linear infinite;
                  }
                  .shield-pulse-active {
                    animation: shieldPulse 2s ease-in-out infinite;
                  }
                `}</style>

                {/* 1. Attacker Node (Left) */}
                <g transform="translate(100, 125)">
                  {isCurrentlyAttacked ? (
                    <>
                      <circle r="25" fill="#ef4444" opacity="0.15" className="shield-pulse-active" />
                      <rect x="-45" y="-30" width="90" height="60" rx="6" fill="#020617" stroke="#ef4444" strokeWidth="2" filter="url(#glow-red)" />
                      <text y="-8" fill="#ef4444" fontSize="9" textAnchor="middle" fontWeight="bold" fontFamily="monospace">MALICIOUS IP</text>
                      <text y="10" fill="#f8fafc" fontSize="8" textAnchor="middle" fontFamily="monospace">{attackerIp}</text>
                      <circle cx="0" cy="-20" r="3" fill="#ef4444" className="animate-ping" />
                    </>
                  ) : (
                    <>
                      <rect x="-45" y="-30" width="90" height="60" rx="6" fill="#020617" stroke="#334155" strokeWidth="1.5" />
                      <text y="-6" fill="#64748b" fontSize="9" textAnchor="middle" fontWeight="bold" fontFamily="monospace">THREAT ORIGIN</text>
                      <text y="10" fill="#22c55e" fontSize="8" textAnchor="middle" fontWeight="bold" fontFamily="monospace">CLEAN</text>
                    </>
                  )}
                </g>

                {/* 2. GAIA Secure Gateway (Middle) */}
                <g transform="translate(320, 125)">
                  <circle r="30" fill="#020617" stroke={isCurrentlyAttacked ? "#eab308" : "#22c55e"} strokeWidth="2" filter={isCurrentlyAttacked ? "url(#glow-blue)" : "url(#glow-green)"} />
                  <path d="M-8 -10 L8 -10 L10 2 C10 10 0 15 0 15 C0 15 -10 10 -10 2 Z" fill="none" stroke={isCurrentlyAttacked ? "#eab308" : "#22c55e"} strokeWidth="2" />
                  <text y="-38" fill={isCurrentlyAttacked ? "#eab308" : "#22c55e"} fontSize="9" textAnchor="middle" fontWeight="bold" fontFamily="monospace">GAIA FIREWALL</text>
                  <text y="42" fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="monospace">GATEWAY</text>
                </g>

                {/* 3. Physical Raspberry Pi Node (Right Top) */}
                <g transform="translate(540, 65)">
                  {isCurrentlyAttacked && isolatedNodeId === "pi-node-1" ? (
                    <g>
                      <circle r="20" fill="#ef4444" opacity="0.2" className="shield-pulse-active" />
                      <circle r="18" fill="#020617" stroke="#ef4444" strokeWidth="2" filter="url(#glow-red)" />
                      <text y="-26" fill="#ef4444" fontSize="9" textAnchor="middle" fontWeight="black" fontFamily="monospace">ISOLATED</text>
                    </g>
                  ) : (
                    <g>
                      <circle r="18" fill="#020617" stroke="#22c55e" strokeWidth="2" filter="url(#glow-green)" />
                      <text y="-26" fill="#22c55e" fontSize="9" textAnchor="middle" fontWeight="bold" fontFamily="monospace">TRUSTED</text>
                    </g>
                  )}
                  <text y="5" fill="#f8fafc" fontSize="8" textAnchor="middle" fontWeight="bold" fontFamily="monospace">pi-node-1</text>
                  <text y="30" fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="monospace">(Physical Pi)</text>
                </g>

                {/* 4. Simulated Node 2 (Right Middle) */}
                <g transform="translate(540, 125)">
                  {isCurrentlyAttacked && isolatedNodeId === "pi-node-2" ? (
                    <g>
                      <circle r="20" fill="#ef4444" opacity="0.2" className="shield-pulse-active" />
                      <circle r="18" fill="#020617" stroke="#ef4444" strokeWidth="2" filter="url(#glow-red)" />
                      <text y="-26" fill="#ef4444" fontSize="9" textAnchor="middle" fontWeight="black" fontFamily="monospace">ISOLATED</text>
                    </g>
                  ) : (
                    <g>
                      <circle r="18" fill="#020617" stroke="#22c55e" strokeWidth="2" />
                    </g>
                  )}
                  <text y="5" fill="#f8fafc" fontSize="8" textAnchor="middle" fontWeight="bold" fontFamily="monospace">pi-node-2</text>
                </g>

                {/* 5. Simulated Node 3 (Right Bottom) */}
                <g transform="translate(540, 185)">
                  {isCurrentlyAttacked && isolatedNodeId === "pi-node-3" ? (
                    <g>
                      <circle r="20" fill="#ef4444" opacity="0.2" className="shield-pulse-active" />
                      <circle r="18" fill="#020617" stroke="#ef4444" strokeWidth="2" filter="url(#glow-red)" />
                      <text y="-26" fill="#ef4444" fontSize="9" textAnchor="middle" fontWeight="black" fontFamily="monospace">ISOLATED</text>
                    </g>
                  ) : (
                    <g>
                      <circle r="18" fill="#020617" stroke="#22c55e" strokeWidth="2" />
                    </g>
                  )}
                  <text y="5" fill="#f8fafc" fontSize="8" textAnchor="middle" fontWeight="bold" fontFamily="monospace">pi-node-3</text>
                </g>

                {/* CONNECTIONS & LASER BEAMS */}
                
                {/* Attacker -> Gateway */}
                {isCurrentlyAttacked ? (
                  <g>
                    <path d="M 145 125 L 290 125" stroke="#ef4444" strokeWidth="3" fill="none" className="laser-active" filter="url(#glow-red)" />
                    <text x="210" y="115" fill="#ef4444" fontSize="8" textAnchor="middle" fontWeight="bold" fontFamily="monospace" className="animate-pulse">DDoS / EXPLOIT FLOOD</text>
                  </g>
                ) : (
                  <path d="M 145 125 L 290 125" stroke="#334155" strokeWidth="1" strokeDasharray="4, 4" fill="none" />
                )}

                {/* Gateway -> pi-node-1 */}
                {isCurrentlyAttacked && isolatedNodeId === "pi-node-1" ? (
                  <g>
                    <path d="M 350 125 L 522 65" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3, 3" fill="none" opacity="0.5" />
                    <circle cx="436" cy="95" r="9" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1" />
                    <text x="436" y="98" fill="#f8fafc" fontSize="8" textAnchor="middle" fontWeight="bold" fontFamily="monospace">X</text>
                    <text x="436" y="82" fill="#ef4444" fontSize="7" textAnchor="middle" fontWeight="black" fontFamily="monospace" className="animate-pulse">SEVERED BY SOAR</text>
                  </g>
                ) : (
                  <path d="M 350 125 L 522 65" stroke="#22c55e" strokeWidth="1.5" fill="none" opacity="0.8" />
                )}

                {/* Gateway -> pi-node-2 */}
                {isCurrentlyAttacked && isolatedNodeId === "pi-node-2" ? (
                  <g>
                    <path d="M 350 125 L 522 125" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3, 3" fill="none" opacity="0.5" />
                    <circle cx="436" cy="125" r="9" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1" />
                    <text x="436" y="128" fill="#f8fafc" fontSize="8" textAnchor="middle" fontWeight="bold" fontFamily="monospace">X</text>
                  </g>
                ) : (
                  <path d="M 350 125 L 522 125" stroke="#22c55e" strokeWidth="1.5" fill="none" opacity="0.8" />
                )}

                {/* Gateway -> pi-node-3 */}
                {isCurrentlyAttacked && isolatedNodeId === "pi-node-3" ? (
                  <g>
                    <path d="M 350 125 L 522 185" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3, 3" fill="none" opacity="0.5" />
                    <circle cx="436" cy="155" r="9" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1" />
                    <text x="436" y="158" fill="#f8fafc" fontSize="8" textAnchor="middle" fontWeight="bold" fontFamily="monospace">X</text>
                  </g>
                ) : (
                  <path d="M 350 125 L 522 185" stroke="#22c55e" strokeWidth="1.5" fill="none" opacity="0.8" />
                )}

              </svg>
            </div>

            {/* Micro-animations and HUD controls description */}
            <div className="text-[10px] text-slate-500 font-mono text-center border-t border-slate-900 pt-2">
              ZERO-TRUST POLICY FRAMEWORK: ISOLATING COMPROMISED HARDWARE ON ENCRYPTED PORT 8000
            </div>
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
                  <td className="px-4 py-3 font-mono text-xs">{formatLocalTime(threat.timestamp)}</td>
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
