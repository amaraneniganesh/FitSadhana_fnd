import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './ui/Button';
import { differenceInDays } from 'date-fns';
import api from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';

const MonthlyCheckIn = ({ profile, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [weight, setWeight] = useState(profile?.weight || '');
  const [height, setHeight] = useState(profile?.height || '');
  const [loading, setLoading] = useState(false);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (profile && profile.updatedAt) {
      const daysSinceUpdate = differenceInDays(new Date(), new Date(profile.updatedAt));
      if (daysSinceUpdate >= 30) {
        setIsOpen(true);
      }
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/profile/onboarding', {
        ...profile, // keep other existing fields
        weight: Number(weight),
        height: Number(height)
      });
      onUpdate(data);
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      alert('Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass w-full max-w-md p-8 rounded-3xl"
          >
            <h2 className="text-2xl font-bold mb-2">Monthly Check-in 📈</h2>
            <p className="text-text-secondary mb-6">It's been a month! Let's update your stats to recalculate your BMI and calorie requirements.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-text-secondary">Current Weight (kg)</label>
                <input 
                  type="number" 
                  className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-foreground"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-text-secondary">Current Height (cm)</label>
                <input 
                  type="number" 
                  className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-foreground"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex gap-4 mt-6">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsOpen(false)}>Skip for now</Button>
                <Button type="submit" variant="gradient" className="flex-1" disabled={loading}>Update Stats</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MonthlyCheckIn;
