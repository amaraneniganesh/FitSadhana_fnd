import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import {
  Search, Plus, CheckCircle2, Circle, ArrowLeft, Flame,
  X, Sparkles, Trophy, Dumbbell, Clock, Route, Activity
} from 'lucide-react';
import api from '../lib/axios';
import { EXERCISE_DB, TARGET_COLORS } from '../data/exercises';

export default function Workout() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [completed, setCompleted] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/profile/me');
        setProfile(data);
        if (data.customExercises?.length > 0) {
          setExercises(data.customExercises.map((ex, i) => ({ ...ex, id: ex._id || Date.now() + i })));
        }
      } catch (err) { console.error(err); }
    };
    fetchProfile();
  }, []);

  const filteredDB = EXERCISE_DB.filter(ex => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchName = ex.name.toLowerCase().includes(query);
    const matchSynonym = ex.synonyms?.some(syn => syn.toLowerCase().includes(query));
    return (matchName || matchSynonym) && !exercises.find(e => e.name === ex.name);
  });

  const addExercise = (ex) => {
    // Add default values based on tracking type
    const defaultVals = { sets: 3, reps: 10, duration: 60, distance: 1 };
    setExercises(prev => [...prev, { ...ex, ...defaultVals, id: Date.now() }]);
    setSearchQuery('');
    setShowSearch(false);
  };

  const removeExercise = (id) => {
    setExercises(prev => prev.filter(e => e.id !== id));
    setCompleted(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const updateExercise = (id, field, val) =>
    setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, [field]: Number(val) } : ex));

  const toggleDone = (id) =>
    setCompleted(prev => ({ ...prev, [id]: !prev[id] }));

  const totalCals = exercises.reduce((sum, ex) =>
    completed[ex.id] ? sum + (ex.caloriesPerSet || 8) * (ex.sets || 1) : sum, 0);

  const completedCount = Object.values(completed).filter(Boolean).length;

  const generateAiPlan = async () => {
    setAiLoading(true);
    try {
      const { data } = await api.post('/workouts/generate');
      setExercises(data.map((ex, i) => ({ ...ex, id: Date.now() + i })));
      setCompleted({});
    } catch (err) {
      alert(err.response?.data?.message || 'AI Coach unavailable. Set GEMINI_API_KEY in backend/.env');
    } finally {
      setAiLoading(false);
    }
  };

  const finishWorkout = async () => {
    if (completedCount === 0) { alert('Complete at least one exercise!'); return; }
    setSaving(true);
    try {
      await api.post('/workouts/log', {
        completedExercises: exercises.filter(ex => completed[ex.id]).map(ex => ({
          exerciseName: ex.name,
          trackingType: ex.trackingType || 'Reps',
          setsCompleted: ex.sets || 1,
          repsCompleted: ex.reps,
          durationCompleted: ex.duration,
          distanceCompleted: ex.distance,
          caloriesBurned: (ex.caloriesPerSet || 8) * (ex.sets || 1)
        })),
        totalCaloriesBurned: totalCals,
        status: completedCount === exercises.length ? 'Completed' : 'Partial'
      });
      setSavedSuccess(true);
    } catch (err) {
      alert('Failed to save. Is the server running?');
    } finally {
      setSaving(false);
    }
  };

  const progress = exercises.length > 0 ? (completedCount / exercises.length) * 100 : 0;

  const renderInput = (ex, field, label, icon, min, max, unit, step = 1) => {
    const isDone = completed[ex.id];
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-text-secondary flex items-center gap-1">{icon} {label}</span>
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
          <button onClick={() => updateExercise(ex.id, field, Math.max(min, (ex[field] || min) - step))} disabled={isDone}
            className="w-6 h-6 flex items-center justify-center text-text-secondary hover:text-foreground disabled:opacity-30 text-sm">−</button>
          <span className="min-w-[1.5rem] text-center text-sm font-semibold">{ex[field] || min}{unit}</span>
          <button onClick={() => updateExercise(ex.id, field, Math.min(max, (ex[field] || min) + step))} disabled={isDone}
            className="w-6 h-6 flex items-center justify-center text-text-secondary hover:text-foreground disabled:opacity-30 text-sm">+</button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed top-0 right-0 w-80 h-80 bg-accent/8 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-0 left-0 w-72 h-72 bg-violet-600/6 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* ─── HEADER ─── */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-shrink-0 w-9 h-9 rounded-xl bg-secondary border border-border flex items-center justify-center hover:bg-secondary transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-text-secondary" />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">Today's Workout</h1>
            {profile && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-text-secondary">Goal:</span>
                <span className="text-xs font-semibold text-accent">{profile.fitnessGoal}</span>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 flex items-center gap-2 bg-orange-500/12 border border-orange-500/25 px-3 py-1.5 rounded-xl">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-bold text-orange-300">{totalCals}</span>
            <span className="text-xs text-orange-500 hidden sm:block">kcal</span>
          </div>
        </div>

        {exercises.length > 0 && (
          <div className="w-full h-0.5 bg-secondary">
            <motion.div
              className="h-full bg-accent"
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', damping: 20 }}
            />
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 relative z-10 space-y-5">
        
        {/* ─── AI COACH SUGGESTION ─── */}
        <div className="glass rounded-2xl overflow-hidden">
          <button
            onClick={generateAiPlan}
            disabled={aiLoading}
            className="w-full flex items-center gap-3 p-4 hover:bg-white/3 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Generate AI Plan</p>
              <p className="text-xs text-text-secondary">Replace current exercises with a personalized routine</p>
            </div>
            {aiLoading && <div className="w-4 h-4 border-2 border-accent border-t-blue-500 rounded-full animate-spin" />}
          </button>
        </div>

        {/* ─── EXERCISE LIST ─── */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-sm text-text-secondary uppercase tracking-wider">Your Plan</h2>
            <button
              onClick={() => setShowSearch(s => !s)}
              className="flex items-center gap-1.5 text-xs text-accent hover:text-blue-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Manual
            </button>
          </div>

          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-3"
              >
                <div className="glass rounded-2xl overflow-hidden">
                  <div className="p-3 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Search exercises or synonyms (e.g., jogging)..."
                        className="w-full bg-secondary border border-border rounded-xl py-2.5 pl-9 pr-4 text-sm text-foreground focus:outline-none focus:border-accent placeholder:text-text-secondary"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredDB.slice(0, 15).map(ex => (
                      <button key={ex.id}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary transition-colors text-left border-b border-border"
                        onClick={() => addExercise(ex)}
                      >
                        <span className="text-base">{ex.emoji}</span>
                        <div className="flex-1">
                          <span className="text-sm font-medium">{ex.name}</span>
                          <span className="text-xs text-text-secondary ml-2">{ex.target}</span>
                          <p className="text-xs text-text-secondary mt-0.5 tracking-wide">{ex.trackingType}</p>
                        </div>
                        <Plus className="w-4 h-4 text-accent" />
                      </button>
                    ))}
                    {filteredDB.length === 0 && (
                      <div className="px-4 py-5 text-center text-text-secondary text-sm">No results for "{searchQuery}"</div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {exercises.map((ex, idx) => {
                const isDone = completed[ex.id];
                const cals = (ex.caloriesPerSet || 8) * (ex.sets || 1);
                const targetColor = TARGET_COLORS[ex.target] || '#6b7280';
                const type = ex.trackingType || 'Reps';

                return (
                  <motion.div
                    key={ex.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                      isDone
                        ? 'bg-green-500/6 border-green-500/30'
                        : 'bg-white/3 border-border hover:border-border'
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <button onClick={() => toggleDone(ex.id)} className="mt-0.5 flex-shrink-0">
                          {isDone
                            ? <CheckCircle2 className="w-6 h-6 text-green-500" />
                            : <Circle className="w-6 h-6 text-text-secondary hover:text-accent transition-colors" />
                          }
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-base">{ex.emoji || '💪'}</span>
                            <span className={`font-semibold text-sm ${isDone ? 'line-through text-text-secondary' : 'text-foreground'}`}>
                              {ex.name}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-3">
                            <span
                              className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full"
                              style={{ background: `${targetColor}18`, color: targetColor, border: `1px solid ${targetColor}30` }}
                            >
                              {ex.target}
                            </span>
                            <span className="text-[10px] bg-secondary text-text-secondary px-2 py-0.5 rounded-full">
                              {type}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 flex-wrap">
                            {/* Always show Sets unless it's Distance */}
                            {type !== 'Distance' && renderInput(ex, 'sets', 'Sets', <Activity className="w-3 h-3"/>, 1, 20, '')}
                            
                            {/* Dynamic Inputs based on Tracking Type */}
                            {type === 'Reps' && renderInput(ex, 'reps', 'Reps', <Dumbbell className="w-3 h-3"/>, 1, 300, '')}
                            {(type === 'Duration' || type === 'Hold Time') && renderInput(ex, 'duration', 'Time', <Clock className="w-3 h-3"/>, 10, 3600, 's', 10)}
                            {type === 'Distance' && renderInput(ex, 'distance', 'Dist', <Route className="w-3 h-3"/>, 0.5, 100, 'km', 0.5)}

                            {isDone && (
                              <span className="flex items-center gap-1 text-xs text-orange-400 font-medium ml-auto">
                                <Flame className="w-3 h-3" /> {cals} kcal
                              </span>
                            )}
                          </div>
                        </div>

                        <button onClick={() => removeExercise(ex.id)}
                          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-all">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {exercises.length === 0 && (
              <div className="text-center py-12">
                <Dumbbell className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-text-secondary text-sm">No exercises yet. Click Generate AI Plan or Add Manual.</p>
              </div>
            )}
          </div>
        </div>

        {/* ─── FINISH BUTTON ─── */}
        {!savedSuccess ? (
          <div className="pb-8 mt-6">
            <Button
              variant="gradient"
              className="w-full py-4 text-base font-semibold"
              onClick={finishWorkout}
              disabled={saving || completedCount === 0}
            >
              {saving
                ? 'Saving...'
                : `Finish Workout${totalCals > 0 ? ` · 🔥 ${totalCals} kcal` : ''}`
              }
            </Button>
            {completedCount === 0 && (
              <p className="text-center text-xs text-text-secondary mt-2">Tick at least one exercise to finish</p>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pb-8 mt-6"
          >
            <div className="bg-green-500/10 border border-green-500/30 rounded-3xl p-8 text-center">
              <Trophy className="w-14 h-14 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Workout Complete! 🎉</h3>
              <p className="text-text-secondary mb-1">You burned <span className="text-orange-400 font-bold">{totalCals} kcal</span></p>
              <p className="text-text-secondary text-sm mb-6">
                {completedCount}/{exercises.length} exercises completed · Calendar updated ✅
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary border border-border text-foreground px-6 py-3 rounded-xl font-medium transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
