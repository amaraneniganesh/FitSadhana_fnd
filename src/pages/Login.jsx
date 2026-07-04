import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import { useAuthStore } from '../store/useAuthStore';
import api from '../lib/axios';
import { Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import SEO from '../components/SEO';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const { data } = await api.post('/auth/google', {
        googleId: decoded.sub,
        email: decoded.email,
        username: decoded.name,
      });
      login(data);
      if (data.profileCompleted) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Google Login failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', formData);
      login(data);
      if (data.profileCompleted) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <SEO 
        title="Login | FitSadhana"
        description="Login to your FitSadhana account to access your AI coach, workouts, and track your progress."
      />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/8 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong w-full max-w-md p-8 rounded-3xl z-10"
      >
        {/* Back button */}
        <Link to="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-foreground text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <div className="mb-8">
          <div className="text-sm font-medium text-accent mb-2">Welcome back</div>
          <h2 className="text-3xl font-bold mb-1">Sign in</h2>
          <p className="text-text-secondary text-sm">Enter your credentials to continue</p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-xl mb-6 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-text-secondary">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-5 h-5" />
              <input 
                type="email" 
                className="w-full bg-secondary border border-border rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:border-accent transition-colors"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-text-secondary">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-5 h-5" />
              <input 
                type="password" 
                className="w-full bg-secondary border border-border rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:border-accent transition-colors"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="flex justify-between items-center text-sm">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" className="rounded border-border text-accent focus:ring-accent bg-secondary" />
              <span className="text-text-secondary">Remember me</span>
            </label>
            <a href="#" className="-accent hover:-accent transition-colors">Forgot password?</a>
          </div>

          <Button type="submit" className="w-full mt-4">
            Sign In <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#121212] text-text-secondary">Or continue with</span>
            </div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Login Failed')}
              theme="filled_black"
              shape="pill"
            />
          </div>
        </form>

        <p className="mt-8 text-center text-text-secondary text-sm">
          Don't have an account? <Link to="/register" className="text-foreground font-medium hover:underline">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
