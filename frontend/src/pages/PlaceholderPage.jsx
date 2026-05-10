import { useLocation } from 'react-router-dom';
import { ShieldCheck, Activity, Cpu, Network, Database, Settings } from 'lucide-react';

export default function PlaceholderPage() {
  const location = useLocation();
  
  const getPageInfo = () => {
    switch(location.pathname) {
      case '/threats': return { title: 'Threat Intelligence', desc: 'Detailed analysis of blocked IPs, rogue nodes, and security events.', icon: ShieldCheck };
      case '/ai-logs': return { title: 'AI Diagnostics', desc: 'Real-time logs from the Landslide and Cybersecurity AI engines.', icon: Cpu };
      case '/network': return { title: 'Node Network', desc: 'Geographic and logical topology of all connected IoT sensor nodes.', icon: Network };
      case '/data': return { title: 'Data Lake', desc: 'Raw telemetry storage and historical data export options.', icon: Database };
      case '/settings': return { title: 'System Config', desc: 'Threshold configuration, API key management, and global settings.', icon: Settings };
      default: return { title: 'Module Offline', desc: 'This module is currently offline or under construction.', icon: Activity };
    }
  };

  const info = getPageInfo();
  const Icon = info.icon;

  return (
    <div className="p-8 h-full flex flex-col">
      <header className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2">{info.title}</h2>
        <p className="text-slate-400">Project-GAIA Enterprise Dashboard Module</p>
      </header>
      
      <div className="flex-1 flex flex-col items-center justify-center glass-panel opacity-80 border-dashed border-2 border-slate-700">
        <Icon size={64} className="text-slate-600 mb-6 animate-pulse" />
        <h3 className="text-2xl font-bold text-slate-300 mb-2">Module Initializing</h3>
        <p className="text-slate-500 max-w-md text-center">
          {info.desc} <br/><br/>
          This enterprise module is scheduled for Phase 2 deployment.
        </p>
      </div>
    </div>
  );
}
