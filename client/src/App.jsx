import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppShell from './components/AppShell';
import Dashboard from './pages/Dashboard';
import CameraCapture from './pages/CameraCapture';
import WeightTracker from './pages/WeightTracker';
import Profile from './pages/Profile';
import ActivityTracker from './pages/ActivityTracker';
import Analytics from './pages/Analytics';

import { Toaster } from 'sonner';

function App() {
  return (
    <Router>
      <AppShell>
        <Toaster position="top-center" theme="dark" richColors />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/weight" element={<WeightTracker />} />
          <Route path="/camera" element={<CameraCapture />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/activity" element={<ActivityTracker />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </AppShell>
    </Router>
  );
}

export default App;
