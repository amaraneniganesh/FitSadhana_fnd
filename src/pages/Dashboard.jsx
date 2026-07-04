import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import api from '../lib/axios';
import Button from '../components/ui/Button';
import BodyVisualizer from '../components/BodyVisualizer';
import WorkoutCalendar from '../components/WorkoutCalendar';
import MonthlyCheckIn from '../components/MonthlyCheckIn';
import AICoach from '../components/AICoach';
import FoodLogger from '../components/FoodLogger';
import Sidebar from '../components/Sidebar';
import {
  Activity, Flame, Target, TrendingUp, TrendingDown,
  LogOut, Settings, Dumbbell, Calendar, Zap, Award,
  Apple, DropletIcon, Wheat, ChevronRight, ScanLine, Moon
} from 'lucide-react';
import { format, differenceInDays, startOfDay } from 'date-fns';

const WeightMarquee = ({ history }) => {
  if (!history || history.length < 2) return null;
  const latest = history[history.length - 1];
  const prev = history[history.length - 2];
  const diff = latest.weight - prev.weight;
  const isGain = diff > 0;
  const dateStr = format(new Date(latest.date), 'MMM d, yyyy');
  const prevDate = format(new Date(prev.date), 'MMM d');

  return (
    <div className={`overflow-hidden w-full py-2.5 rounded-2xl mb-6 border ${
      isGain ? 'bg-red-500/8 border-red-500/20' : 'bg-green-500/8 border-green-500/20'
    }`}>
      <div className="marquee-content flex items-center gap-4 px-6">
        {isGain
          ? <TrendingUp className="w-4 h-4 text-red-400 flex-shrink-0" />
          : <TrendingDown className="w-4 h-4 text-green-400 flex-shrink-0" />
        }
        <span className={`text-sm font-medium whitespace-nowrap ${isGain ? 'text-red-300' : 'text-green-300'}`}>
          {isGain ? '⚠️ Weight gained' : '🎉 Weight lost'}: {isGain ? '+' : ''}{diff.toFixed(1)} kg &nbsp;·&nbsp;
          {prevDate} ({prev.weight}kg) → {dateStr} ({latest.weight}kg) &nbsp;·&nbsp;
          {isGain ? 'Consider reviewing your diet and increasing cardio' : 'Great progress! Keep up the momentum!'}
        </span>
      </div>
    </div>
  );
};

const NavItem = ({ icon: Icon, label, to, active, onClick }) => (
  <Link to={to || '#'} onClick={onClick}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
      active ? '-accent/15 text-accent' : 'text-text-secondary hover:text-foreground hover:bg-secondary'
    }`}
  >
    <Icon className="w-5 h-5 flex-shrink-0" />
    <span className="hidden md:block text-sm font-medium">{label}</span>
  </Link>
);

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <motion.div whileHover={{ y: -2 }} className="glass rounded-2xl p-4 flex items-start gap-3 card-hover cursor-default">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon className="w-5 h-5 text-foreground" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-text-secondary mb-0.5">{label}</p>
      <p className="text-lg font-bold text-foreground leading-tight truncate">{value}</p>
      {sub && <p className="text-xs text-text-secondary mt-0.5">{sub}</p>}
    </div>
  </motion.div>
);

const MacroBar = ({ label, value, max, color, unit }) => {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-secondary font-medium">{value}{unit} / {max}{unit}</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
};

const Dashboard = () => {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const [profile, setProfile] = useState(null);
  const [lastLog, setLastLog] = useState(null);
  const [allLogs, setAllLogs] = useState([]);
  const [streak, setStreak] = useState(0);
  const [steps, setSteps] = useState(0);
  const [sleepStart, setSleepStart] = useState('');
  const [sleepEnd, setSleepEnd] = useState('');
  
  const [stepsInput, setStepsInput] = useState('');
  const [sleepStartInput, setSleepStartInput] = useState('');
  const [sleepEndInput, setSleepEndInput] = useState('');
  
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [triggerScan, setTriggerScan] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, lRes, mRes] = await Promise.all([
          api.get('/profile/me'),
          api.get('/workouts/logs'),
          api.get('/metrics').catch(() => ({ data: { steps: 0, sleepStart: '', sleepEnd: '' } })) // Fail gracefully if not logged
        ]);
        setProfile(pRes.data);
        
        const logs = lRes.data || [];
        setAllLogs(logs);
        if (logs.length > 0) setLastLog(logs[0]);
        
        const metric = mRes.data;
        if (metric) {
           setSteps(metric.steps || 0);
           setSleepStart(metric.sleepStart || '');
           setSleepEnd(metric.sleepEnd || '');
        }

        // Calculate streak
        let s = 0;
        const today = startOfDay(new Date());
        for (let i = 0; i < logs.length; i++) {
          const logDay = startOfDay(new Date(logs[i].date));
          const diff = differenceInDays(today, logDay);
          if (diff === i || (i === 0 && diff === 0)) s++;
          else break;
        }
        setStreak(s);
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, []);

  const saveMetrics = async (newSteps, newSleepStart, newSleepEnd) => {
    try {
      const payload = {
         steps: newSteps !== undefined ? newSteps : steps,
         sleepStart: newSleepStart !== undefined ? newSleepStart : sleepStart,
         sleepEnd: newSleepEnd !== undefined ? newSleepEnd : sleepEnd,
         date: new Date()
      };
      const res = await api.post('/metrics', payload);
      setSteps(res.data.steps);
      setSleepStart(res.data.sleepStart);
      setSleepEnd(res.data.sleepEnd);
      setStepsInput('');
    } catch (err) {
      console.error('Failed to save metrics', err);
    }
  };

  const bmi = profile ? (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1) : '—';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  // Estimated macros from TDEE
  const protein = profile ? Math.round((profile.tdee * 0.3) / 4) : 0;
  const carbs = profile ? Math.round((profile.tdee * 0.4) / 4) : 0;
  const fats = profile ? Math.round((profile.tdee * 0.3) / 9) : 0;

  // Daily Summary Calculations
  const isMale = profile?.gender === 'Male';
  const bmr = profile ? (isMale 
    ? (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) + 5
    : (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) - 161) : 0;
  
  const today = new Date();
  const todayWorkout = allLogs.find(l => {
    const d = new Date(l.date);
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });
  const workoutCals = todayWorkout ? todayWorkout.totalCaloriesBurned : 0;
  const stepCals = steps * 0.04;
  
  const activeCals = Math.round(workoutCals + stepCals);
  const totalBurned = Math.round(bmr + activeCals);
  const netCals = caloriesConsumed - totalBurned;
  const weeklyChangeKg = ((netCals * 7) / 7700).toFixed(2);
  const isLosing = netCals < 0;

  const getSleepHours = () => {
    if (!sleepStart || !sleepEnd) return 0;
    const [startH, startM] = sleepStart.split(':').map(Number);
    const [endH, endM] = sleepEnd.split(':').map(Number);
    let startDate = new Date(); startDate.setHours(startH, startM, 0, 0);
    let endDate = new Date(); endDate.setHours(endH, endM, 0, 0);
    if (endDate <= startDate) endDate.setDate(endDate.getDate() + 1);
    return (endDate - startDate) / (1000 * 60 * 60);
  };
  const sleepHours = getSleepHours();
  
  const getSleepComment = (hours) => {
    if (hours === 0) return "Log your sleep to see insights.";
    if (hours < 6) return "⚠️ < 6 hrs limits fat loss & recovery.";
    if (hours > 9) return "Over 9 hrs might make you groggy.";
    return "✅ Optimal sleep for muscle & metabolism!";
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-300 pb-20 md:pb-0">
      {/* Ambient Background Glows */}
      <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bgbg-accent/10 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[10%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[130px] pointer-events-none z-0" />

      {/* Sidebar */}
      <Sidebar profile={profile} streak={streak} onScanClick={() => setTriggerScan(p => p + 1)} />

      {/* Main */}
      <main className="ml-0 md:ml-60 flex-1 p-4 md:p-8 relative z-10 w-full overflow-hidden max-w-[100vw]">

        {/* Topbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-7 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">{greeting}, {user?.username} 👋</h1>
            <p className="text-text-secondary text-sm">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <Link to="/workout">
            <Button variant="gradient" className="flex items-center gap-2 text-sm">
              <Dumbbell className="w-4 h-4" /> Start Workout
            </Button>
          </Link>
        </div>

        {/* Weight change marquee */}
        <WeightMarquee history={profile?.weightHistory} />

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard icon={Activity} label="BMI" value={bmi} color="-accent/20" sub={bmi !== '—' ? (bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : 'Overweight') : ''} />
          <StatCard icon={Flame} label="Daily TDEE" value={profile ? `${profile.tdee}` : '—'} color="bg-orange-500/20" sub="kcal/day" />
          <StatCard icon={Zap} label="Streak" value={`${streak} days`} color="bg-yellow-500/20" sub={streak > 0 ? '🔥 On fire!' : 'Start today'} />
          <StatCard icon={Award} label="Workouts" value={allLogs.length} color="bg-green-500/20" sub="logged total" />
        </div>

        {/* Main 3-col grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Col 1: Body Visualizer */}
          <div className="glass rounded-3xl p-5 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Your Physique</h3>
              <Link to="/profile" className="text-xs text-accent hover:text-blue-300 transition-colors flex items-center gap-1">
                Edit <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {profile ? (
              <BodyVisualizer
                height={profile.height}
                weight={profile.weight}
                goal={profile.fitnessGoal}
                gender={profile.gender}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-28 h-56 rounded-2xl shimmer" />
              </div>
            )}

            {profile && (
              <div className="mt-4 grid grid-cols-3 gap-2 pt-4 border-t border-border">
                {[
                  { l: 'Height', v: `${profile.height}cm` },
                  { l: 'Weight', v: `${profile.weight}kg` },
                  { l: 'Age', v: profile.age },
                ].map(({ l, v }) => (
                  <div key={l} className="text-center">
                    <p className="text-xs text-text-secondary">{l}</p>
                    <p className="text-sm font-semibold">{v}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Col 2: Calendar */}
          <div className="glass rounded-3xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Activity Calendar</h3>
              <div className="flex gap-3 text-xs text-text-secondary">
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />Done</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Miss</div>
              </div>
            </div>
            <WorkoutCalendar />
          </div>

          {/* Col 3: Nutrition + Last Workout */}
          <div className="space-y-4">
            {/* Daily Nutrition */}
            {profile && <FoodLogger tdee={profile.tdee} onLog={setCaloriesConsumed} triggerScan={triggerScan} />}

            {/* Last Workout */}
            <div className="glass rounded-3xl p-5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Last Workout</h3>
                <Link to="/workout" className="text-xs text-accent hover:text-blue-300">New +</Link>
              </div>
              {lastLog ? (
                <div>
                  <p className="text-xs text-text-secondary mb-3">{format(new Date(lastLog.date), 'EEE, MMM d')}</p>
                  <div className="space-y-1.5 mb-3">
                    {lastLog.completedExercises.slice(0, 4).map((ex, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-text-secondary truncate">{ex.exerciseName}</span>
                        <span className="text-text-secondary ml-2 flex-shrink-0">{ex.setsCompleted}×{ex.repsCompleted}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-orange-500/8 rounded-xl">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-orange-300 font-medium">{lastLog.totalCaloriesBurned} kcal burned</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Dumbbell className="w-8 h-8 text-text-secondary mx-auto mb-2" />
                  <p className="text-sm text-text-secondary">No workouts yet</p>
                  <Link to="/workout" className="text-xs text-accent mt-1 block">Start now →</Link>
                </div>
              )}
            </div>

            {/* Sleep Tracker */}
            <div className="glass rounded-3xl p-5 relative overflow-hidden">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-400" />
                Sleep Tracker
              </h3>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Bedtime</label>
                  <input
                    type="time"
                    value={sleepStartInput || sleepStart}
                    onChange={(e) => setSleepStartInput(e.target.value)}
                    onBlur={() => saveMetrics(undefined, sleepStartInput, undefined)}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Wake Time</label>
                  <input
                    type="time"
                    value={sleepEndInput || sleepEnd}
                    onChange={(e) => setSleepEndInput(e.target.value)}
                    onBlur={() => saveMetrics(undefined, undefined, sleepEndInput)}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
              </div>

              {sleepHours > 0 && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-indigo-300">Total Sleep</span>
                    <span className="font-bold text-indigo-400">{sleepHours.toFixed(1)} hrs</span>
                  </div>
                  <p className="text-xs text-indigo-200/70">{getSleepComment(sleepHours)}</p>
                </div>
              )}
            </div>

            {/* End of Day Summary */}
            <div className="glass rounded-3xl p-5 relative overflow-hidden">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-violet-400" />
                End of Day Summary
              </h3>
              
              <div className="mb-4">
                <label className="text-xs text-text-secondary mb-1 block">Log Today's Steps</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={stepsInput || (steps === 0 ? '' : steps)}
                    onChange={(e) => setStepsInput(e.target.value)}
                    placeholder="e.g. 8000"
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-violet-500/50"
                  />
                  <button 
                    onClick={() => saveMetrics(Number(stepsInput), undefined, undefined)}
                    className="bg-violet-600 hover:bg-violet-500 text-foreground px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-secondary rounded-xl p-3 flex flex-col justify-center">
                  <p className="text-xs text-text-secondary mb-1 flex justify-between items-center">
                    <span>Active</span>
                    <span className="text-orange-400/80 font-medium">{activeCals}</span>
                  </p>
                  <p className="text-xs text-text-secondary mb-1 flex justify-between items-center">
                    <span title="Basal Metabolic Rate">Resting (BMR)</span>
                    <span className="text-orange-400/80 font-medium">{bmr}</span>
                  </p>
                  <div className="mt-1 pt-1 border-t border-border flex justify-between items-center">
                    <span className="text-xs text-text-secondary font-medium">Total</span>
                    <span className="text-sm font-bold text-orange-400">{totalBurned} kcal</span>
                  </div>
                </div>
                <div className="bg-secondary rounded-xl p-3 flex flex-col justify-center text-center">
                  <p className="text-xs text-text-secondary mb-1">Total Consumed</p>
                  <p className="text-2xl font-bold text-accent">{caloriesConsumed} <span className="text-xs font-normal text-text-secondary">kcal</span></p>
                </div>
              </div>

              <div className="bg-secondary rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Projected Weekly Change</p>
                    <p className="text-xl font-bold">
                      {isLosing ? '' : '+'}{weeklyChangeKg} <span className="text-sm font-normal text-text-secondary">kg/week</span>
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${isLosing ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {isLosing ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                  </div>
                </div>
                <p className="text-xs text-text-secondary mt-2">
                  Based on today's deficit/surplus of <span className="font-medium text-text-secondary">{Math.abs(netCals)} kcal</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AICoach />
      <MonthlyCheckIn profile={profile} onUpdate={setProfile} />
    </div>
  );
};

export default Dashboard;
