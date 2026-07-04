import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';
import { useEffect } from 'react';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Workout from './pages/Workout';
import CalendarPage from './pages/CalendarPage';
import ProfilePage from './pages/ProfilePage';
import Scanner from './pages/Scanner';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user && !user.profileCompleted && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

function App() {
  const theme = useThemeStore((state) => state.theme);
  const customAccent = useThemeStore((state) => state.customAccent);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'neon', 'midnight');
    root.classList.add(theme);
    
    // Apply custom accent if it exists, otherwise remove the inline style to fallback to theme default
    if (customAccent) {
      root.style.setProperty('--accent', customAccent);
    } else {
      root.style.removeProperty('--accent');
    }

    // document.body.className ensures the background color is applied globally
    document.body.className = 'bg-background text-foreground transition-colors duration-300';
  }, [theme, customAccent]);

  return (
    <HelmetProvider>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID"}>
        <QueryClientProvider client={queryClient}>
          <Router>
            <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/workout" element={
              <ProtectedRoute>
                <Workout />
              </ProtectedRoute>
            } />

            <Route path="/scanner" element={
              <ProtectedRoute>
                <Scanner />
              </ProtectedRoute>
            } />

            <Route path="/calendar" element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            </Routes>
          </Router>
        </QueryClientProvider>
      </GoogleOAuthProvider>
    </HelmetProvider>
  );
}

export default App;
