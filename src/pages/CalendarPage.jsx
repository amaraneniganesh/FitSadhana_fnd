import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  format, isSameDay, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, addDays, subMonths, 
  addMonths, isSameMonth, isToday 
} from 'date-fns';
import api from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import Sidebar from '../components/Sidebar';
import { Target, Flame, ChevronLeft, ChevronRight, X, Utensils, Moon } from 'lucide-react';

export default function CalendarPage() {
  const user = useAuthStore(state => state.user);
  const [profile, setProfile] = useState(null);
  const [streak, setStreak] = useState(0);
  
  const [date, setDate] = useState(new Date()); // currently selected day
  const [currentMonth, setCurrentMonth] = useState(new Date()); // currently viewed month
  
  const [allWorkoutLogs, setAllWorkoutLogs] = useState([]);
  
  // Data for the selected day
  const [selectedWorkouts, setSelectedWorkouts] = useState(null);
  const [selectedNutrition, setSelectedNutrition] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState(null);
  const [loadingDay, setLoadingDay] = useState(false);
  
  // Side panel state
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        const [pRes, wRes] = await Promise.all([
          api.get('/profile/me'),
          api.get('/workouts/logs')
        ]);
        setProfile(pRes.data);
        setAllWorkoutLogs(wRes.data || []);
        
        // streak logic (simplified for UI)
        setStreak(wRes.data?.length > 0 ? 1 : 0);
      } catch (err) {
        console.error(err);
      }
    };
    fetchBaseData();
  }, []);

  const handleDayClick = async (value) => {
    setDate(value);
    setShowPanel(true);
    setLoadingDay(true);
    try {
      const dateStr = format(value, 'yyyy-MM-dd');
      
      // Filter workouts locally
      const dailyWorkout = allWorkoutLogs.find(log => isSameDay(new Date(log.date), value));
      setSelectedWorkouts(dailyWorkout || null);
      
      // Fetch nutrition and metrics for this specific date
      const [nRes, mRes] = await Promise.all([
        api.get(`/nutrition?date=${dateStr}`).catch(() => ({ data: [] })),
        api.get(`/metrics?date=${dateStr}`).catch(() => ({ data: null }))
      ]);
      
      setSelectedNutrition(nRes.data || []);
      setSelectedMetrics(mRes.data || null);
      
    } catch (err) {
      console.error('Error fetching daily data', err);
    } finally {
      setLoadingDay(false);
    }
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Calendar render functions
  const renderHeader = () => (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold">{format(currentMonth, 'MMMM yyyy')}</h2>
      <div className="flex gap-2">
        <button onClick={prevMonth} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-300" />
        </button>
        <button onClick={nextMonth} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
          <ChevronRight className="w-5 h-5 text-gray-300" />
        </button>
      </div>
    </div>
  );

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentMonth);
    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="text-center font-semibold text-gray-400 text-sm py-2" key={i}>
          {format(addDays(startDate, i), 'EEE')}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const formattedDate = format(day, 'd');
        const hasWorkout = allWorkoutLogs.find(log => isSameDay(new Date(log.date), cloneDay));
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelected = isSameDay(day, date);
        const isDayToday = isToday(day);

        days.push(
          <div
            className={`p-2 flex flex-col items-center justify-center min-h-[80px] rounded-2xl cursor-pointer transition-all border ${
              !isCurrentMonth ? 'text-gray-600 border-transparent opacity-50' : 
              isSelected ? 'bg-accent/20 border-accent text-accent shadow-[0_0_15px_var(--accent)] z-10' :
              hasWorkout ? 'bg-green-500/10 border-green-500/30 text-white hover:border-green-500/50' :
              isDayToday ? 'bg-white/10 border-white/20 text-white' :
              'bg-white/3 border-transparent hover:border-white/10 text-gray-300'
            }`}
            key={day.toString()}
            onClick={() => handleDayClick(cloneDay)}
          >
            <span className={`text-lg font-bold ${isDayToday && !isSelected ? 'text-violet-400' : ''}`}>{formattedDate}</span>
            {hasWorkout && <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-2 mb-2" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  // Calculations for panel
  const totalCalsConsumed = selectedNutrition.reduce((sum, f) => sum + f.calories, 0);
  const bmr = profile ? ((profile.gender === 'Male' ? 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5 : 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161)) : 2000;
  const activeBurn = (selectedWorkouts?.totalCaloriesBurned || 0) + ((selectedMetrics?.steps || 0) * 0.04);
  const totalBurn = Math.round(bmr + activeBurn);

  const getSleepHours = () => {
    if (!selectedMetrics?.sleepStart || !selectedMetrics?.sleepEnd) return 0;
    const [startH, startM] = selectedMetrics.sleepStart.split(':').map(Number);
    const [endH, endM] = selectedMetrics.sleepEnd.split(':').map(Number);
    let startD = new Date(); startD.setHours(startH, startM, 0, 0);
    let endD = new Date(); endD.setHours(endH, endM, 0, 0);
    if (endD <= startD) endD.setDate(endD.getDate() + 1);
    return (endD - startD) / 3600000;
  };
  const sleepHours = getSleepHours();

  return (
    <div className="min-h-screen bg-background text-white flex">
      <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-accent/6 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[10%] w-[400px] h-[400px] bg-violet-600/5 rounded-full blur-[130px] pointer-events-none z-0" />

      <Sidebar profile={profile} streak={streak} />

      <main className="ml-16 md:ml-60 flex-1 p-4 md:p-8 relative z-10 w-full overflow-hidden">
        <div className="mb-7">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Your Calendar</h1>
          <p className="text-gray-500 text-sm">Review your historical fitness data</p>
        </div>

        <div className="flex flex-col xl:flex-row gap-6">
          {/* Calendar View */}
          <div className="flex-1">
            <div className="glass rounded-3xl p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-violet-500 to-orange-500 opacity-50" />
              {renderHeader()}
              {renderDays()}
              {renderCells()}
            </div>
            
            <div className="mt-4 flex gap-5 text-xs text-gray-500 px-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                Workout Completed
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]"></span>
                Selected Date
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white/10 border border-white/20"></span>
                Rest Day
              </div>
            </div>
          </div>

          {/* Details Panel */}
          <AnimatePresence>
            {showPanel && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full lg:w-96 flex-shrink-0"
              >
                <div className="glass rounded-3xl p-5 h-[calc(100vh-8rem)] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6 sticky top-0 bg-background/80 backdrop-blur-md pb-2 z-10">
                    <div>
                      <h3 className="font-bold text-lg">{format(date, 'MMMM d, yyyy')}</h3>
                      <p className="text-xs text-gray-400">{isSameDay(date, new Date()) ? 'Today' : format(date, 'EEEE')}</p>
                    </div>
                    <button onClick={() => setShowPanel(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {loadingDay ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="w-6 h-6 border-2 border-accent border-t-blue-500 rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-5">
                      
                      {/* Daily Summary */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
                          <Flame className="w-4 h-4 text-orange-400 mb-1" />
                          <p className="text-xs text-orange-200/70">Total Burned</p>
                          <p className="text-lg font-bold text-orange-400">{totalBurn} <span className="text-xs font-normal">kcal</span></p>
                        </div>
                        <div className="bg-accent/10 border border-accent rounded-xl p-3">
                          <Utensils className="w-4 h-4 text-accent mb-1" />
                          <p className="text-xs text-blue-200/70">Consumed</p>
                          <p className="text-lg font-bold text-accent">{totalCalsConsumed} <span className="text-xs font-normal">kcal</span></p>
                        </div>
                      </div>

                      {/* Workout */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <Target className="w-4 h-4" /> Workout
                        </h4>
                        {selectedWorkouts ? (
                          <div className="bg-white/5 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-sm font-medium text-green-400">Completed</span>
                              <span className="text-xs text-gray-400">{selectedWorkouts.totalCaloriesBurned} kcal burned</span>
                            </div>
                            <div className="space-y-2">
                              {selectedWorkouts.completedExercises.map((ex, i) => (
                                <div key={i} className="flex justify-between text-sm items-center border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                  <span className="text-gray-300">{ex.exerciseName}</span>
                                  <span className="text-gray-500 font-medium bg-white/5 px-2 py-0.5 rounded-md">{ex.setsCompleted} × {ex.repsCompleted}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white/5 rounded-xl p-4 text-center">
                            <p className="text-sm text-gray-500">No workout logged this day.</p>
                          </div>
                        )}
                      </div>

                      {/* Nutrition */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <Utensils className="w-4 h-4" /> Meals
                        </h4>
                        {selectedNutrition.length > 0 ? (
                          <div className="space-y-2">
                            {selectedNutrition.map((meal, i) => (
                              <div key={i} className="bg-white/5 rounded-xl p-3 flex justify-between items-center">
                                <div>
                                  <p className="text-sm font-medium">{meal.name}</p>
                                  <p className="text-xs text-gray-500">{meal.protein}g P • {meal.carbs}g C • {meal.fat}g F</p>
                                </div>
                                <span className="text-sm font-bold text-accent">{meal.calories}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-white/5 rounded-xl p-4 text-center">
                            <p className="text-sm text-gray-500">No meals logged.</p>
                          </div>
                        )}
                      </div>

                      {/* Metrics */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <Moon className="w-4 h-4" /> Daily Metrics
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/5 rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-400 mb-1">Steps</p>
                            <p className="text-lg font-bold text-white">{selectedMetrics?.steps || 0}</p>
                          </div>
                          <div className="bg-white/5 rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-400 mb-1">Sleep</p>
                            <p className="text-lg font-bold text-indigo-400">{sleepHours > 0 ? `${sleepHours.toFixed(1)}h` : '--'}</p>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
