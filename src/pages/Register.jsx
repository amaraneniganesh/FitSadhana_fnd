import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import { useAuthStore } from '../store/useAuthStore';
import api from '../lib/axios';
import { Mail, Lock, User as UserIcon, ArrowRight, ArrowLeft } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import SEO from '../components/SEO';

const Register = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
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
      setError(err.response?.data?.message || 'Google Registration failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/register', formData);
      login(data);
      navigate('/onboarding');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <SEO 
        title="Register | FitSadhana"
        description="Join FitSadhana today and start your AI-powered fitness journey."
      />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/8 rounded-full blur-[120px] pointer-events-none" />

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
          <div className="text-sm font-medium text-violet-400 mb-2">Create account</div>
          <h2 className="text-3xl font-bold mb-1">Get Started</h2>
          <p className="text-text-secondary text-sm">Join FitnessAI and start your transformation.</p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-xl mb-6 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-text-secondary">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-5 h-5" />
              <input 
                type="text" 
                className="w-full bg-secondary border border-border rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:border-accent transition-colors"
                placeholder="johndoe"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
              />
            </div>
          </div>

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

          <Button type="submit" className="w-full mt-4">
            Sign Up <ArrowRight className="w-4 h-4 ml-2" />
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
              onError={() => setError('Google Registration Failed')}
              theme="filled_black"
              shape="pill"
            />
          </div>
        </form>

        <p className="mt-8 text-center text-text-secondary text-sm">
          Already have an account? <Link to="/login" className="text-foreground font-medium hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
