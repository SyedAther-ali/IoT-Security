import { Link, useLocation } from 'react-router-dom';
import { Activity, ShieldAlert, Cpu, Network, Database, Settings } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { name: 'Command Center', path: '/', icon: Activity },
    { name: 'Threat Intelligence', path: '/threats', icon: ShieldAlert },
    { name: 'AI Diagnostics', path: '/ai-logs', icon: Cpu },
    { name: 'Node Network', path: '/network', icon: Network },
    { name: 'Data Lake', path: '/data', icon: Database },
    { name: 'System Config', path: '/settings', icon: Settings },
  ];

  return (
    <div className="w-64 h-full border-r border-slate-800 bg-darker/90 flex flex-col relative z-10">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </div>
          <h1 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
            Project GAIA
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold">Security Operations</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[inset_0_0_15px_rgba(59,130,246,0.1)]' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <item.icon size={20} className={isActive ? 'text-blue-400' : ''} />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="glass-panel p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">System Status</span>
            <span className="text-xs text-safe font-bold">ONLINE</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5">
            <div className="bg-safe h-1.5 rounded-full w-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
