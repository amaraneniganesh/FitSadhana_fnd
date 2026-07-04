import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Activity, Dumbbell, Calendar, ScanLine, 
  Settings, LogOut, Zap, Palette, Check 
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';

const NavItem = ({ icon: Icon, label, to, active, onClick }) => (
  <Link to={to || '#'} onClick={onClick}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
      active ? 'bg-accent/15 text-accent' : 'text-text-secondary hover:text-foreground hover:bg-secondary'
    }`}
  >
    <Icon className="w-5 h-5 flex-shrink-0" />
    <span className="hidden md:block text-sm font-medium">{label}</span>
  </Link>
);

const Sidebar = ({ profile, streak, onScanClick }) => {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const { theme, setTheme, customAccent, setCustomAccent } = useThemeStore();
  const [tempColor, setTempColor] = useState(customAccent || '#3b82f6');

  // Sync tempColor if customAccent is reset by theme change
  useEffect(() => {
    if (!customAccent) setTempColor('#3b82f6');
  }, [customAccent]);
  
  const themes = [
    { id: 'dark', color: '#171717' },
    { id: 'light', color: '#FFFFFF' },
    { id: 'neon', color: '#00FFCC' },
    { id: 'midnight', color: '#1E293B' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-16 md:w-60 bg-background border-r border-border z-30 flex flex-col transition-colors duration-300">
      <div className="p-4 md:p-6 py-5 flex items-center justify-center md:justify-start">
        <img src="/logo.png" alt="FitSadhana" className="h-10 object-contain hidden md:block" />
        <img src="/favicon.png" alt="FS" className="h-8 object-contain md:hidden" />
      </div>

      {/* User avatar */}
      <div className="hidden md:flex items-center gap-3 px-4 mb-6">
        <div className="w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate text-foreground">{user?.username}</p>
          <p className="text-xs text-text-secondary truncate">{profile?.fitnessGoal || 'Loading...'}</p>
        </div>
      </div>

      <nav className="flex-1 px-2 md:px-3 space-y-1 overflow-y-auto">
        <NavItem icon={Activity} label="Dashboard" to="/dashboard" active={isActive('/dashboard')} />
        <NavItem icon={Dumbbell} label="Workout" to="/workout" active={isActive('/workout')} />
        <NavItem icon={Calendar} label="Calendar" to="/calendar" active={isActive('/calendar')} />
        <NavItem icon={ScanLine} label="Scan Food" to="/scanner" active={isActive('/scanner')} />
        <NavItem icon={Settings} label="Profile" to="/profile" active={isActive('/profile')} />
      </nav>

      {streak > 0 && (
        <div className="hidden md:block mx-3 mb-4 p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-semibold text-orange-400">{streak} Day Streak!</span>
          </div>
        </div>
      )}

      <div className="p-2 md:p-3 space-y-2">
        <div className="px-3 py-2 bg-secondary rounded-xl flex items-center justify-between">
          <div className="flex gap-2">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center"
                style={{ 
                  backgroundColor: t.color, 
                  borderColor: theme === t.id && !customAccent ? 'var(--accent)' : 'transparent' 
                }}
                title={`Switch to ${t.id} mode`}
              >
                {theme === t.id && !customAccent && <Check className="w-3 h-3 text-gray-500 mix-blend-difference" />}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-6 h-6 rounded-full overflow-hidden border-2 border-transparent hover:scale-110 transition-transform" title="Custom Accent Color">
              <input 
                type="color" 
                value={tempColor} 
                onChange={(e) => setTempColor(e.target.value)}
                className="absolute inset-0 w-[150%] h-[150%] -top-1 -left-1 cursor-pointer"
              />
            </div>
            {tempColor !== (customAccent || '#3b82f6') && (
              <button 
                onClick={() => setCustomAccent(tempColor)}
                className="text-xs bg-accent text-white px-2 py-1 rounded-md font-medium hover:opacity-90 active:scale-95"
              >
                Apply
              </button>
            )}
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="hidden md:block text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
