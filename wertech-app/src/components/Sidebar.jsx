import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Compass, MessageSquare, 
  Handshake, BarChart3, Bell, UserCircle, 
  Settings, UserCog, LogOut // Added LogOut icon
} from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { name: 'Explore', icon: <Compass size={20} />, path: '/explore' },
    { name: 'Messages', icon: <MessageSquare size={20} />, path: '/messages' },
    { name: 'Requests', icon: <Handshake size={20} />, path: '/barter-request' },
    { name: 'Analytics', icon: <BarChart3 size={20} />, path: '/analytics' }, 
    { name: 'Notifications', icon: <Bell size={20} />, path: '/notifications' },
    { name: 'Profile', icon: <UserCircle size={20} />, path: '/profile' },
    { name: 'Settings', icon: <Settings size={20} />, path: '/settings' },
    { name: 'Admin', icon: <UserCog size={20} />, path: '/admin' },
  ];

  // LOGOUT FUNCTION
  const handleLogout = () => {
    // 1. Clear local storage/session
    localStorage.removeItem('isLoggedIn'); 
    localStorage.removeItem('userToken');
    
    // 2. Redirect to Login page (assuming your route is /)
    navigate('/'); 
    
    // Optional: Refresh to clear state
    window.location.reload();
  };

  return (
    <div className="w-64 bg-white border-r h-screen p-6 flex flex-col shadow-sm">
      {/* LOGO */}
      <div className="mb-10 px-4">
        <h1 className="text-2xl font-black text-[#0d9488] tracking-tighter uppercase italic">WERTECH</h1>
      </div>

      {/* MAIN NAV */}
      <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-[20px] font-bold transition-all duration-200 ${
                isActive 
                  ? 'bg-[#0d9488] text-white shadow-lg shadow-teal-100' 
                  : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              {item.icon}
              <span className="text-sm tracking-tight">{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* LOGOUT SECTION - PINNED TO BOTTOM */}
      <div className="mt-auto pt-6 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-6 py-4 rounded-[20px] font-black text-red-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <LogOut size={20} />
          <span className="text-sm uppercase tracking-widest">Logout</span>
        </button>
      </div>
    </div>
  );
}