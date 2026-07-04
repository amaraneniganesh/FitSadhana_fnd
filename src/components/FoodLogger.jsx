import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, X, Utensils, ScanLine } from 'lucide-react';
import api from '../lib/axios';
import { useNavigate } from 'react-router-dom';

const FoodLogger = ({ tdee, onLog, triggerScan }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [foodInput, setFoodInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [foodLog, setFoodLog] = useState([]);

  // Respond to global scan triggers (e.g. from Sidebar)
  React.useEffect(() => {
    if (triggerScan > 0) {
      navigate('/scanner');
    }
  }, [triggerScan]);

  // Fetch today's food log on mount
  React.useEffect(() => {
    const fetchLog = async () => {
      try {
        const { data } = await api.get('/nutrition');
        setFoodLog(data || []);
        if (onLog && data) onLog(data.reduce((s, f) => s + f.calories, 0));
      } catch (err) { console.error(err); }
    };
    fetchLog();
  }, [onLog]);

  // Mock targets based on TDEE
  const proteinTarget = tdee ? Math.round((tdee * 0.3) / 4) : 150;
  const carbsTarget = tdee ? Math.round((tdee * 0.4) / 4) : 200;
  const fatsTarget = tdee ? Math.round((tdee * 0.3) / 9) : 60;

  const currentProtein = foodLog.reduce((s, f) => s + f.protein, 0);
  const currentCarbs = foodLog.reduce((s, f) => s + f.carbs, 0);
  const currentFats = foodLog.reduce((s, f) => s + f.fat, 0);
  const currentCalories = foodLog.reduce((s, f) => s + f.calories, 0);

  const saveLog = async (foodData) => {
    try {
      const saveRes = await api.post('/nutrition', foodData);
      const updatedLogs = saveRes.data;
      setFoodLog(updatedLogs);
      if (onLog) onLog(updatedLogs.reduce((s, f) => s + f.calories, 0));
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const analyzeAndLog = async () => {
    if (!foodInput.trim()) return;
    setLoading(true);
    setError('');
    
    try {
      const analyzeRes = await api.post('/nutrition/analyze', { food: foodInput });
      const success = await saveLog(analyzeRes.data);
      if (success) {
        setFoodInput('');
        setIsOpen(false);
      } else {
        setError('Failed to save to database.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not analyze food.');
    } finally {
      setLoading(false);
    }
  };



  const removeLog = async (id) => {
    try {
      const { data } = await api.delete(`/nutrition/${id}`);
      setFoodLog(data);
      if (onLog) onLog(data.reduce((s, f) => s + f.calories, 0));
    } catch (err) { console.error(err); }
  };

  const MacroBar = ({ label, current, max, color }) => {
    const pct = Math.min(100, (current / max) * 100);
    return (
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-text-secondary">{label}</span>
          <span className="text-text-secondary font-medium">{current}g / {max}g</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
    );
  };

  return (
    <div className="glass rounded-3xl p-5 relative overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Utensils className="w-4 h-4 text-green-400" />
          Food Logger
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/scanner')}
            className="text-sm bg-secondary text-text-secondary hover:bg-secondary px-3 py-2.5 min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center gap-1 transition-colors"
            title="Scan Barcode"
            aria-label="Scan Barcode"
          >
            <ScanLine className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsOpen(true)}
            className="text-sm font-medium bg-accent/10 text-accent hover:bg-accent/20 px-4 py-2.5 min-h-[44px] rounded-xl flex items-center gap-2 transition-colors"
            aria-label="Add Food"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      <div className="space-y-1 mb-4">
        <MacroBar label="Protein" current={currentProtein} max={proteinTarget} color="#3b82f6" />
        <MacroBar label="Carbs" current={currentCarbs} max={carbsTarget} color="#f59e0b" />
        <MacroBar label="Fats" current={currentFats} max={fatsTarget} color="#ec4899" />
      </div>

      <div className="pt-3 border-t border-border flex justify-between items-center text-sm">
        <span className="text-text-secondary">Total Calories</span>
        <span className="font-bold text-green-400">{currentCalories} / {tdee} kcal</span>
      </div>

      {loading && !isOpen && (
         <div className="mt-4 flex items-center justify-center gap-2 text-xs text-text-secondary">
           <div className="w-3 h-3 border-2 border-border border-t-white rounded-full animate-spin" />
           Looking up product...
         </div>
      )}

      {foodLog.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-text-secondary uppercase tracking-wide font-semibold mb-2">Today's Meals</p>
          {foodLog.map((log, i) => (
            <div key={i} className="flex justify-between items-center bg-secondary p-2.5 rounded-xl text-sm">
              <div className="min-w-0 flex-1 pr-2">
                <p className="font-medium truncate">{log.name}</p>
                <p className="text-xs text-text-secondary">{log.calories} kcal • {log.protein}g P • {log.carbs}g C • {log.fat}g F</p>
              </div>
              <button onClick={() => removeLog(log._id)} className="p-1 hover:bg-secondary rounded-lg transition-colors text-text-secondary hover:text-red-400">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}



      {/* Add Meal Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute inset-0 bg-background/95 backdrop-blur-md z-10 p-5 flex flex-col"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" /> What did you eat?
              </h3>
              <button onClick={() => { setIsOpen(false); setError(''); }} className="text-text-secondary hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-xs text-text-secondary mb-4">
              Describe your meal naturally. AI will calculate the calories and macros automatically.
            </p>

            <textarea 
              value={foodInput}
              onChange={e => setFoodInput(e.target.value)}
              placeholder="e.g. I had 2 scrambled eggs, a slice of whole wheat toast, and a black coffee."
              className="w-full h-32 bg-secondary border border-border rounded-xl p-3 text-sm text-foreground focus:outline-none focus:border-accent resize-none mb-3"
            />
            
            {error && <p className="text-xs text-red-400 mb-3 bg-red-500/10 p-2 rounded-lg">{error}</p>}
            
            <button 
              onClick={analyzeAndLog}
              disabled={loading || !foodInput.trim()}
              className="w-full py-3 bg-accent rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:opacity-90 mt-auto"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-border border-t-white rounded-full animate-spin" />
              ) : (
                <><Sparkles className="w-4 h-4" /> Analyze & Log Food</>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FoodLogger;
