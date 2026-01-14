import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';

// Component Imports
import Sidebar from './components/Sidebar';

// Page Imports
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Explore from './pages/Explore';
import BarterChat from './pages/BarterChat';
import Notifications from './pages/Notifications';
import BarterRequest from './pages/BarterRequest';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import CreateListing from './pages/CreateListing';
import History from './pages/History';
import AdminDashboard from './pages/AdminDashboard';


function AppLayout() {
  const location = useLocation();
  
  // Sidebar is hidden on Login, Register, and the Root path
  const isAuthPage = ['/login', '/register', '/'].includes(location.pathname);

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-500">
      {!isAuthPage && <Sidebar />}
      
      <main className="flex-1 overflow-y-auto">
        <Routes>
          {/* Default entry point redirects to Login */}
          <Route path="/" element={<Navigate to="/login" />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected App Routes */}
          
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/messages" element={<BarterChat />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/barter-request" element={<BarterRequest />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/create" element={<CreateListing />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}