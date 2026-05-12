import { useState } from 'react';
import { Settings, Sliders, Key, Shield, Zap } from 'lucide-react';

export default function SystemConfig() {
  const [sensitivity, setSensitivity] = useState(85);
  const [autoBan, setAutoBan] = useState(true);
  const [deepInspect, setDeepInspect] = useState(true);

  const apiKeys = [
    { name: 'Production Backend API', key: 'ga_prod_*********************8x2', lastUsed: '2 mins ago' },
    { name: 'Simulated Node Ingest', key: 'ga_sim_**********************9a1', lastUsed: '5 secs ago' },
    { name: 'External Data Export', key: 'ga_exp_**********************4c3', lastUsed: '1 day ago' },
  ];

  return (
    <div className="p-8 space-y-6 h-full flex flex-col">
      <header className="mb-4">
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
          <Settings className="text-slate-400" size={32} />
          System Configuration
        </h2>
        <p className="text-slate-400">Global security thresholds, AI parameters, and access management</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Security Thresholds */}
        <div className="glass-panel p-6 flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sliders size={20} className="text-blue-400" />
            Detection Thresholds
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-slate-300">Anomaly Detection Sensitivity</label>
                <span className="text-blue-400 font-mono text-sm">{sensitivity}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="100" 
                value={sensitivity} 
                onChange={(e) => setSensitivity(e.target.value)}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <p className="text-xs text-slate-500 mt-2">Higher sensitivity may result in more false positives but catches stealthier attacks.</p>
            </div>
            
            <div className="pt-4 border-t border-slate-800/50">
              <h4 className="text-sm font-medium text-slate-300 mb-4">Automated Actions</h4>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Shield size={18} className={autoBan ? "text-safe" : "text-slate-500"} />
                  <div>
                    <div className="text-sm font-medium text-white">AI Auto-Ban Protocol</div>
                    <div className="text-xs text-slate-500">Automatically isolate nodes or block IPs exhibiting critical risk.</div>
                  </div>
                </div>
                <button 
                  onClick={() => setAutoBan(!autoBan)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoBan ? 'bg-safe' : 'bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoBan ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap size={18} className={deepInspect ? "text-blue-400" : "text-slate-500"} />
                  <div>
                    <div className="text-sm font-medium text-white">Deep Packet Inspection</div>
                    <div className="text-xs text-slate-500">Enable advanced heuristic analysis on all incoming telemetry.</div>
                  </div>
                </div>
                <button 
                  onClick={() => setDeepInspect(!deepInspect)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${deepInspect ? 'bg-blue-500' : 'bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${deepInspect ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* API Key Management */}
        <div className="glass-panel p-6 flex flex-col gap-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Key size={20} className="text-purple-400" />
            API Access Management
          </h3>
          
          <div className="space-y-4 flex-1">
            {apiKeys.map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-900/50 rounded-lg border border-slate-800 flex justify-between items-center group hover:border-slate-600 transition-colors">
                <div>
                  <div className="text-sm font-medium text-white mb-1">{item.name}</div>
                  <div className="text-xs font-mono text-slate-400 bg-black/50 px-2 py-1 rounded inline-block">
                    {item.key}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2">Last used: {item.lastUsed}</div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded text-white transition-colors">
                    Rotate
                  </button>
                  <button className="px-3 py-1 bg-danger/20 hover:bg-danger/40 text-danger text-xs rounded transition-colors">
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full py-3 border border-dashed border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-slate-500 transition-colors text-sm font-medium flex items-center justify-center gap-2">
            <Key size={16} />
            Generate New API Key
          </button>
        </div>
      </div>
    </div>
  );
}
