import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  format, isSameDay, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, addDays, subMonths, 
  addMonths, isSameMonth, isToday 
} from 'date-fns';
import api from '../lib/axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WorkoutCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [logs, setLogs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await api.get('/workouts/logs');
        setLogs(data);
      } catch (error) {
        console.error("Failed to fetch logs", error);
      }
    };
    fetchLogs();
  }, []);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const handleDayClick = (day) => {
    navigate('/calendar');
  };

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-base font-bold text-gray-200">{format(currentMonth, 'MMMM yyyy')}</h3>
      <div className="flex gap-1">
        <button onClick={prevMonth} className="w-8 h-8 rounded-lg bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center transition-colors">
          <ChevronLeft className="w-4 h-4 text-text-secondary" />
        </button>
        <button onClick={nextMonth} className="w-8 h-8 rounded-lg bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center transition-colors">
          <ChevronRight className="w-4 h-4 text-text-secondary" />
        </button>
      </div>
    </div>
  );

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentMonth);
    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="text-center font-medium text-text-secondary text-[11px] uppercase tracking-wider py-1" key={i}>
          {format(addDays(startDate, i), 'EEE')}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-1">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    const today = new Date();
    today.setHours(0,0,0,0);

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const formattedDate = format(day, 'd');
        const hasWorkout = logs.find(log => isSameDay(new Date(log.date), cloneDay));
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isDayToday = isToday(day);
        
        let isMissed = false;
        if (isCurrentMonth && !hasWorkout && cloneDay < today && !isDayToday) {
          isMissed = true;
        }

        days.push(
          <div
            className={`flex items-center justify-center h-10 w-full rounded-xl cursor-pointer transition-all border text-sm relative group ${
              !isCurrentMonth ? 'text-text-secondary border-transparent opacity-40 hover:bg-foreground/5 hover:opacity-100' : 
              hasWorkout ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:border-green-500/50 hover:bg-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]' :
              isMissed ? 'bg-red-500/5 border-red-500/10 text-red-300 hover:border-red-500/30' :
              isDayToday ? 'bg-accent/15 border-accent/30 text-accent font-bold' :
              'bg-foreground/3 border-transparent hover:border-border text-text-secondary hover:bg-foreground/5'
            }`}
            key={day.toString()}
            onClick={() => handleDayClick(cloneDay)}
          >
            <span>{formattedDate}</span>
            {/* Tooltip on hover */}
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[#222] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              {hasWorkout ? 'Done' : isMissed ? 'Miss' : 'Open in Calendar'}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1.5 mb-1.5" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div className="w-full">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
};

export default WorkoutCalendar;
