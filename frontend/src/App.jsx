import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ThreatIntelligence from './pages/ThreatIntelligence';
import AIDiagnostics from './pages/AIDiagnostics';
import NodeNetwork from './pages/NodeNetwork';
import DataLake from './pages/DataLake';
import SystemConfig from './pages/SystemConfig';

function App() {
  return (
    <div className="flex h-screen bg-darker overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/threats" element={<ThreatIntelligence />} />
          <Route path="/ai-logs" element={<AIDiagnostics />} />
          <Route path="/network" element={<NodeNetwork />} />
          <Route path="/data" element={<DataLake />} />
          <Route path="/settings" element={<SystemConfig />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
