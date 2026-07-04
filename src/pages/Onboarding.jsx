import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import api from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import { ChevronRight, ChevronLeft, Check, Plus, X } from 'lucide-react';

// Complete goal-based exercise presets
const GOAL_EXERCISES = {
  'Weight Loss': [
    { name: 'Jumping Jacks', sets: 3, reps: 30, caloriesPerSet: 15 },
    { name: 'Burpees', sets: 3, reps: 12, caloriesPerSet: 20 },
    { name: 'Mountain Climbers', sets: 3, reps: 20, caloriesPerSet: 12 },
    { name: 'Jump Rope', sets: 4, reps: 50, caloriesPerSet: 18 },
    { name: 'High Knees', sets: 3, reps: 30, caloriesPerSet: 14 },
  ],
  'Aesthetic Body': [
    { name: 'Pushups', sets: 4, reps: 15, caloriesPerSet: 8 },
    { name: 'Pull-ups', sets: 3, reps: 10, caloriesPerSet: 10 },
    { name: 'Crunches', sets: 4, reps: 20, caloriesPerSet: 5 },
    { name: 'Tricep Dips', sets: 3, reps: 12, caloriesPerSet: 7 },
    { name: 'Leg Raises', sets: 3, reps: 15, caloriesPerSet: 6 },
  ],
  'Fit Body': [
    { name: 'Pushups', sets: 3, reps: 10, caloriesPerSet: 8 },
    { name: 'Squats', sets: 3, reps: 15, caloriesPerSet: 10 },
    { name: 'Plank', sets: 3, reps: 60, caloriesPerSet: 6 },
    { name: 'Lunges', sets: 3, reps: 12, caloriesPerSet: 9 },
    { name: 'Jumping Jacks', sets: 3, reps: 25, caloriesPerSet: 12 },
  ],
  'Muscle Gain': [
    { name: 'Barbell Bench Press', sets: 4, reps: 8, caloriesPerSet: 15 },
    { name: 'Deadlifts', sets: 4, reps: 6, caloriesPerSet: 20 },
    { name: 'Shoulder Press', sets: 4, reps: 10, caloriesPerSet: 12 },
    { name: 'Pull-ups', sets: 4, reps: 8, caloriesPerSet: 10 },
    { name: 'Dumbbell Curls', sets: 4, reps: 12, caloriesPerSet: 8 },
  ],
  'Athletic Performance': [
    { name: 'Box Jumps', sets: 4, reps: 10, caloriesPerSet: 18 },
    { name: 'Sprint Intervals', sets: 6, reps: 1, caloriesPerSet: 30 },
    { name: 'Agility Ladder', sets: 4, reps: 1, caloriesPerSet: 15 },
    { name: 'Clean & Jerk', sets: 4, reps: 6, caloriesPerSet: 22 },
    { name: 'Broad Jumps', sets: 3, reps: 8, caloriesPerSet: 16 },
  ],
};

const ALL_EXERCISES = [
  { name: 'Pushups', caloriesPerSet: 8 },
  { name: 'Squats', caloriesPerSet: 10 },
  { name: 'Pull-ups', caloriesPerSet: 10 },
  { name: 'Plank', caloriesPerSet: 6 },
  { name: 'Lunges', caloriesPerSet: 9 },
  { name: 'Burpees', caloriesPerSet: 20 },
  { name: 'Dumbbell Curls', caloriesPerSet: 8 },
  { name: 'Shoulder Press', caloriesPerSet: 12 },
  { name: 'Jumping Jacks', caloriesPerSet: 12 },
  { name: 'Mountain Climbers', caloriesPerSet: 12 },
  { name: 'Tricep Dips', caloriesPerSet: 7 },
  { name: 'Leg Raises', caloriesPerSet: 6 },
  { name: 'Deadlifts', caloriesPerSet: 20 },
  { name: 'Barbell Bench Press', caloriesPerSet: 15 },
  { name: 'Box Jumps', caloriesPerSet: 18 },
  { name: 'High Knees', caloriesPerSet: 14 },
  { name: 'Crunches', caloriesPerSet: 5 },
  { name: 'Jump Rope', caloriesPerSet: 18 },
];

const steps = [
  { id: 'basics', title: 'Body Stats', subtitle: 'Tell us about yourself' },
  { id: 'goals', title: 'Goals & Activity', subtitle: 'Shape your fitness journey' },
  { id: 'preferences', title: 'Preferences', subtitle: 'Fine-tune your experience' },
];

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showExerciseBuilder, setShowExerciseBuilder] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [formData, setFormData] = useState({
    height: '', weight: '', age: '', gender: 'Male',
    activityLevel: 'Moderately Active', fitnessGoal: 'Fit Body', experienceLevel: 'Beginner',
    workoutDays: 4, dietPreference: 'Any', gymAccess: true,
    customExercises: [],
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const updateProfileStatus = useAuthStore((state) => state.updateProfileStatus);

  useEffect(() => {
    setShowExerciseBuilder(formData.fitnessGoal === 'Own Plan');
  }, [formData.fitnessGoal]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const addCustomExercise = (ex) => {
    if (!formData.customExercises.find(e => e.name === ex.name)) {
      setFormData(prev => ({
        ...prev,
        customExercises: [...prev.customExercises, { ...ex, sets: 3, reps: 10 }]
      }));
    }
    setExerciseSearch('');
  };

  const removeCustomExercise = (name) => {
    setFormData(prev => ({
      ...prev,
      customExercises: prev.customExercises.filter(e => e.name !== name)
    }));
  };

  const updateCustomExercise = (name, field, val) => {
    setFormData(prev => ({
      ...prev,
      customExercises: prev.customExercises.map(e =>
        e.name === name ? { ...e, [field]: Number(val) } : e
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep !== steps.length - 1) { handleNext(); return; }

    if (formData.fitnessGoal === 'Own Plan' && formData.customExercises.length === 0) {
      alert('Please add at least one exercise to your own plan!');
      return;
    }

    setLoading(true);
    try {
      await api.post('/profile/onboarding', {
        ...formData,
        height: Number(formData.height),
        weight: Number(formData.weight),
        age: Number(formData.age),
      });
      updateProfileStatus(true);
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      alert('Failed to save profile data.');
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = ALL_EXERCISES.filter(ex =>
    ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) &&
    !formData.customExercises.find(e => e.name === ex.name)
  );

  const inputCls = "w-full input-field";
  const selectCls = "w-full select-field";
  const labelCls = "block text-sm font-medium mb-2 text-text-secondary";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/8 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-2xl z-10 relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-2xl font-bold tracking-tight mb-1 text-foreground">FitSadhana</div>
          <p className="text-text-secondary text-sm">Step {currentStep + 1} of {steps.length}</p>
        </div>

        <div className="glass-strong rounded-3xl p-8 md:p-10">
          {/* Progress */}
          <div className="flex gap-2 mb-8">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex-1 flex flex-col gap-1.5">
                <div className={`h-1 rounded-full transition-all duration-500 ${idx <= currentStep ? 'bg-gradient-to-r from-accent to-accent' : 'bg-foreground/8'}`} />
                <span className={`text-xs text-center transition-colors ${idx === currentStep ? 'text-accent' : 'text-text-secondary'}`}>{step.title}</span>
              </div>
            ))}
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1">{steps[currentStep].title}</h2>
            <p className="text-text-secondary text-sm">{steps[currentStep].subtitle}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-5 min-h-[280px]"
              >
                {/* Step 0 – Body Stats */}
                {currentStep === 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelCls}>Height (cm)</label>
                      <input type="number" required className={inputCls} placeholder="175" value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelCls}>Weight (kg)</label>
                      <input type="number" required className={inputCls} placeholder="70" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelCls}>Age</label>
                      <input type="number" required className={inputCls} placeholder="25" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelCls}>Gender</label>
                      <select className={selectCls} value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                        <option>Male</option><option>Female</option><option>Other</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 1 – Goals */}
                {currentStep === 1 && (
                  <div className="space-y-5">
                    <div>
                      <label className={labelCls}>Activity Level</label>
                      <select className={selectCls} value={formData.activityLevel} onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value })}>
                        <option>Sedentary</option><option>Lightly Active</option>
                        <option>Moderately Active</option><option>Very Active</option><option>Super Active</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Fitness Goal</label>
                      <div className="grid grid-cols-2 gap-3">
                        {['Weight Loss', 'Aesthetic Body', 'Fit Body', 'Muscle Gain', 'Athletic Performance', 'Own Plan'].map(g => (
                          <button
                            key={g} type="button"
                            onClick={() => setFormData({ ...formData, fitnessGoal: g })}
                            className={`py-3 px-4 rounded-xl text-sm font-medium transition-all border ${
                              formData.fitnessGoal === g
                                ? 'bg-accent/15 border-accent text-accent'
                                : 'bg-foreground/3 border-border text-text-secondary hover:border-border'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Experience Level</label>
                      <select className={selectCls} value={formData.experienceLevel} onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}>
                        <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                      </select>
                    </div>

                    {/* Own Plan - Exercise Builder */}
                    {showExerciseBuilder && (
                      <div className="border border-dashed border-accent/30 rounded-2xl p-4">
                        <h4 className="text-sm font-semibold text-accent mb-3">Build Your Custom Plan</h4>
                        <div className="relative mb-3">
                          <input
                            type="text" placeholder="Search exercises to add..."
                            className={inputCls}
                            value={exerciseSearch}
                            onChange={(e) => setExerciseSearch(e.target.value)}
                          />
                          {exerciseSearch && (
                            <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-[#1a1a1a] border border-border rounded-xl max-h-40 overflow-y-auto">
                              {filteredExercises.map(ex => (
                                <button key={ex.name} type="button" onClick={() => addCustomExercise(ex)}
                                  className="w-full text-left px-4 py-2.5 hover:bg-foreground/5 text-sm flex justify-between">
                                  {ex.name} <Plus className="w-4 h-4 -accent" />
                                </button>
                              ))}
                              {filteredExercises.length === 0 && <div className="px-4 py-3 text-text-secondary text-sm">No results</div>}
                            </div>
                          )}
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {formData.customExercises.map(ex => (
                            <div key={ex.name} className="flex items-center gap-2 bg-foreground/4 rounded-xl p-2">
                              <span className="flex-1 text-sm font-medium">{ex.name}</span>
                              <input type="number" className="w-14 bg-foreground/5 border border-border rounded-lg px-2 py-1 text-center text-xs" value={ex.sets} onChange={(e) => updateCustomExercise(ex.name, 'sets', e.target.value)} />
                              <span className="text-text-secondary text-xs">sets</span>
                              <input type="number" className="w-14 bg-foreground/5 border border-border rounded-lg px-2 py-1 text-center text-xs" value={ex.reps} onChange={(e) => updateCustomExercise(ex.name, 'reps', e.target.value)} />
                              <span className="text-text-secondary text-xs">reps</span>
                              <button type="button" onClick={() => removeCustomExercise(ex.name)}>
                                <X className="w-4 h-4 text-red-400 hover:text-red-300" />
                              </button>
                            </div>
                          ))}
                          {formData.customExercises.length === 0 && <p className="text-text-secondary text-sm text-center py-4">No exercises added yet</p>}
                        </div>
                      </div>
                    )}

                    {/* Preview for preset goals */}
                    {formData.fitnessGoal !== 'Own Plan' && GOAL_EXERCISES[formData.fitnessGoal] && (
                      <div className="border border-green-500/20 bg-green-500/5 rounded-2xl p-4">
                        <h4 className="text-xs font-semibold text-green-400 mb-2 uppercase tracking-wide">Your Plan Includes</h4>
                        <div className="flex flex-wrap gap-2">
                          {GOAL_EXERCISES[formData.fitnessGoal].map(ex => (
                            <span key={ex.name} className="chip bg-green-500/10 text-green-300 border border-green-500/20">
                              {ex.name} · {ex.sets}×{ex.reps}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2 – Preferences */}
                {currentStep === 2 && (
                  <div className="space-y-5">
                    <div>
                      <label className={labelCls}>Workout Days per Week</label>
                      <div className="flex gap-2 flex-wrap">
                        {[2, 3, 4, 5, 6, 7].map(d => (
                          <button key={d} type="button"
                            onClick={() => setFormData({ ...formData, workoutDays: d })}
                            className={`w-12 h-12 rounded-xl text-sm font-semibold transition-all border ${
                              formData.workoutDays === d
                                ? 'bg-accent/20 border-accent text-accent'
                                : 'bg-foreground/3 border-border text-text-secondary hover:border-border'
                            }`}
                          >{d}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Diet Preference</label>
                      <select className={selectCls} value={formData.dietPreference} onChange={(e) => setFormData({ ...formData, dietPreference: e.target.value })}>
                        <option>Any</option><option>Vegetarian</option><option>Vegan</option><option>Keto</option><option>Paleo</option>
                      </select>
                    </div>
                    <div
                      onClick={() => setFormData({ ...formData, gymAccess: !formData.gymAccess })}
                      className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                        formData.gymAccess ? 'bg-accent/10 border-accent/40' : 'bg-foreground/3 border-border'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                        formData.gymAccess ? 'bg-accent border-accent' : 'border-gray-600'
                      }`}>
                        {formData.gymAccess && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">Gym Access</p>
                        <p className="text-xs text-text-secondary">I have access to a fully equipped gym</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              {currentStep > 0 ? (
                <Button type="button" variant="ghost" onClick={handlePrev} className="px-5">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
              ) : <div />}

              <Button type="submit" variant="gradient" className="px-8" disabled={loading}>
                {currentStep === steps.length - 1
                  ? (loading ? 'Saving...' : <><Check className="w-4 h-4 mr-1" /> Complete Setup</>)
                  : <>Next <ChevronRight className="w-4 h-4 ml-1" /></>
                }
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
