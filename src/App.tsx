import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import TeamDashboard from './pages/TeamDashboard';
import AgentDashboard from './pages/AgentDashboard';
import ModelDashboard from './pages/ModelDashboard';
import BlankPage from './pages/BlankPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="teams" element={<TeamDashboard />} />
          <Route path="models" element={<ModelDashboard />} />
          <Route path="blank" element={<BlankPage />} />
        </Route>
        {/* Agents page with its own layout */}
        <Route path="/agents" element={<AgentDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
