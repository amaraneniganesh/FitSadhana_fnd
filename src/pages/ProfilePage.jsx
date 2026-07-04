import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import api from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import { ArrowLeft, Plus, X, CheckCircle2, User2, Scale, Target, Dumbbell, Activity } from 'lucide-react';
import { format } from 'date-fns';

const GOAL_OPTIONS = ['Weight Loss', 'Aesthetic Body', 'Fit Body', 'Muscle Gain', 'Athletic Performance', 'Own Plan'];

const ALL_EXERCISES = [
  { name: 'Pushups', caloriesPerSet: 8 }, { name: 'Squats', caloriesPerSet: 10 },
  { name: 'Pull-ups', caloriesPerSet: 10 }, { name: 'Plank', caloriesPerSet: 6 },
  { name: 'Lunges', caloriesPerSet: 9 }, { name: 'Burpees', caloriesPerSet: 20 },
  { name: 'Dumbbell Curls', caloriesPerSet: 8 }, { name: 'Shoulder Press', caloriesPerSet: 12 },
  { name: 'Jumping Jacks', caloriesPerSet: 12 }, { name: 'Mountain Climbers', caloriesPerSet: 12 },
  { name: 'Tricep Dips', caloriesPerSet: 7 }, { name: 'Deadlifts', caloriesPerSet: 20 },
  { name: 'Barbell Bench Press', caloriesPerSet: 15 }, { name: 'Box Jumps', caloriesPerSet: 18 },
  { name: 'Crunches', caloriesPerSet: 5 }, { name: 'Jump Rope', caloriesPerSet: 18 },
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({});
  const [customExercises, setCustomExercises] = useState([]);
  const [exSearch, setExSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('stats');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/profile/me');
        setProfile(data);
        setFormData({
          height: data.height, weight: data.weight, age: data.age,
          gender: data.gender, activityLevel: data.activityLevel,
          fitnessGoal: data.fitnessGoal, experienceLevel: data.experienceLevel,
          workoutDays: data.workoutDays, dietPreference: data.dietPreference,
          gymAccess: data.gymAccess,
        });
        setCustomExercises(data.customExercises || []);
      } catch (err) { console.error(err); }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.post('/profile/onboarding', {
        ...formData,
        customExercises,
        height: Number(formData.height),
        weight: Number(formData.weight),
        age: Number(formData.age),
      });
      setProfile(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const addExercise = (ex) => {
    if (!customExercises.find(e => e.name === ex.name)) {
      setCustomExercises(prev => [...prev, { ...ex, sets: 3, reps: 10 }]);
    }
    setExSearch('');
  };

  const removeExercise = (name) => {
    setCustomExercises(prev => prev.filter(e => e.name !== name));
  };

  const inputCls = "w-full input-field";
  const selectCls = "w-full select-field";
  const labelCls = "block text-xs font-medium mb-1.5 text-gray-400 uppercase tracking-wide";

  const filteredEx = ALL_EXERCISES.filter(ex =>
    ex.name.toLowerCase().includes(exSearch.toLowerCase()) &&
    !customExercises.find(e => e.name === ex.name)
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 pb-20">
      <div className="fixed top-0 right-0 w-96 h-96 bg-violet-600/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-row items-center gap-4 mb-8 sticky top-4 z-50 bg-background/80 backdrop-blur-md p-2 rounded-2xl">
          <Link to="/dashboard" className="flex-shrink-0">
            <Button variant="ghost" className="w-10 h-10 p-0 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold truncate">Profile Settings</h1>
            <p className="text-text-secondary text-xs md:text-sm truncate">Update your stats, plan, and exercises</p>
          </div>
        </div>

        {/* User info */}
        <div className="glass rounded-2xl p-5 flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-accent/20">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold truncate">{user?.username}</h2>
            <p className="text-text-secondary text-sm truncate">{user?.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-secondary rounded-2xl mb-6 overflow-x-auto hide-scrollbar">
          {[
            { id: 'stats', icon: Scale, label: 'Body Stats' },
            { id: 'plan', icon: Target, label: 'Goal & Plan' },
            { id: 'history', icon: Activity, label: 'Weight History' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === t.id ? 'bg-card shadow-sm text-foreground' : 'text-text-secondary hover:text-foreground'
              }`}
            >
              <t.icon className="w-4 h-4" /> <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'stats' && formData.height && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-6 space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Height (cm)</label>
                <input type="number" className={inputCls} value={formData.height} onChange={e => setFormData({ ...formData, height: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Weight (kg)</label>
                <input type="number" className={inputCls} value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Age</label>
                <input type="number" className={inputCls} value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Gender</label>
                <select className={selectCls} value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Activity Level</label>
                <select className={selectCls} value={formData.activityLevel} onChange={e => setFormData({ ...formData, activityLevel: e.target.value })}>
                  <option>Sedentary</option><option>Lightly Active</option>
                  <option>Moderately Active</option><option>Very Active</option><option>Super Active</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Experience</label>
                <select className={selectCls} value={formData.experienceLevel} onChange={e => setFormData({ ...formData, experienceLevel: e.target.value })}>
                  <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'plan' && formData.fitnessGoal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div className="glass rounded-2xl p-6">
              <label className={labelCls}>Fitness Goal</label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {GOAL_OPTIONS.map(g => (
                  <button key={g} type="button"
                    onClick={() => setFormData({ ...formData, fitnessGoal: g })}
                    className={`py-3 px-4 rounded-xl text-sm font-medium transition-all border ${
                      formData.fitnessGoal === g
                        ? 'bg-accent/15 border-accent text-accent'
                        : 'bg-white/3 border-white/8 text-gray-400 hover:border-white/20'
                    }`}
                  >{g}</button>
                ))}
              </div>
            </div>

            {formData.fitnessGoal === 'Own Plan' && (
              <div className="glass rounded-2xl p-4 md:p-6 space-y-6">
                <label className={labelCls}>Custom Exercises</label>
                <div className="relative mb-3 mt-2">
                  <input type="text" placeholder="Search to add exercise..."
                    className={inputCls} value={exSearch}
                    onChange={e => setExSearch(e.target.value)} />
                  {exSearch && (
                    <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl max-h-40 overflow-y-auto">
                      {filteredEx.map(ex => (
                        <button key={ex.name} type="button" onClick={() => addExercise(ex)}
                          className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-sm flex justify-between">
                          {ex.name} <Plus className="w-4 h-4 text-accent" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {customExercises.map(ex => (
                    <div key={ex.name} className="flex items-center gap-2 bg-white/4 rounded-xl p-2.5">
                      <span className="flex-1 text-sm font-medium">{ex.name}</span>
                      <input type="number" className="w-12 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-center text-xs" value={ex.sets}
                        onChange={e => setCustomExercises(prev => prev.map(e2 => e2.name === ex.name ? { ...e2, sets: Number(e.target.value) } : e2))} />
                      <span className="text-xs text-gray-500">×</span>
                      <input type="number" className="w-12 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-center text-xs" value={ex.reps}
                        onChange={e => setCustomExercises(prev => prev.map(e2 => e2.name === ex.name ? { ...e2, reps: Number(e.target.value) } : e2))} />
                      <button type="button" onClick={() => removeExercise(ex.name)}>
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  ))}
                  {customExercises.length === 0 && (
                    <p className="text-center text-gray-600 text-sm py-4">No exercises added</p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">Weight History</h3>
            {profile?.weightHistory?.length > 0 ? (
              <div className="space-y-3">
                {[...profile.weightHistory].reverse().map((entry, i) => {
                  const isFirst = i === profile.weightHistory.length - 1;
                  return (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/3 rounded-xl">
                      <div>
                        <p className="text-sm font-medium">{entry.weight} kg</p>
                        <p className="text-xs text-gray-500">{format(new Date(entry.date), 'MMM d, yyyy · h:mm a')}</p>
                      </div>
                      {entry.note && (
                        <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                          entry.note.includes('gained') ? 'bg-red-500/10 text-red-400' :
                          entry.note.includes('lost') ? 'bg-green-500/10 text-green-400' :
                          '-accent/10 text-accent'
                        }`}>{entry.note}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-600 text-sm text-center py-8">No weight history yet</p>
            )}
          </motion.div>
        )}

        {/* Save button (shown on stats and goal tabs) */}
        {activeTab !== 'history' && (
          <div className="mt-6">
            {saved && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-xl text-sm text-center mb-3">
                ✓ Profile updated successfully!
              </div>
            )}
            <Button variant="gradient" className="w-full py-4" onClick={handleSave} disabled={saving}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
