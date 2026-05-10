import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import PlaceholderPage from './pages/PlaceholderPage';

function App() {
  return (
    <div className="flex h-screen bg-darker overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/threats" element={<PlaceholderPage />} />
          <Route path="/ai-logs" element={<PlaceholderPage />} />
          <Route path="/network" element={<PlaceholderPage />} />
          <Route path="/data" element={<PlaceholderPage />} />
          <Route path="/settings" element={<PlaceholderPage />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
