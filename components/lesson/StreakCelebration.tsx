
import React from 'react';
import { Button } from '../Button';
import { Flame, Check } from 'lucide-react';

interface StreakCelebrationProps {
    streak: number;
    history: Record<string, number>;
    onContinue: () => void;
    language: 'Chinese' | 'English';
}

export const StreakCelebration: React.FC<StreakCelebrationProps> = ({ streak, history, onContinue, language }) => {
    const isZh = language === 'Chinese';
    
    // Generate last 7 days including today (Local Time)
    const calendarDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        
        // Label (Local Day)
        const dayLabel = d.toLocaleDateString(isZh ? 'zh-CN' : 'en-US', { weekday: 'narrow' });
        
        // Key (UTC) - To match how history is stored in App.tsx (toISOString().split('T')[0])
        // We need to check if the user played on this day relative to UTC storage.
        // However, mixing Local UI with UTC storage causes the "Date Jumping" bug.
        // Best effort: Check for the ISO string of this date object.
        const dateKey = d.toISOString().split('T')[0];
        
        const xp = history[dateKey] || 0;
        const isToday = i === 6;

        return {
            date: dateKey,
            label: dayLabel,
            // Active if XP exists OR if it's today (assuming we just finished a lesson to get here)
            active: xp > 0 || isToday 
        };
    });

    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in-up bg-orange-50 dark:bg-dark-bg">
            <div className="relative mb-12">
                <div className="absolute inset-0 bg-orange-500 blur-3xl opacity-20 rounded-full animate-pulse-soft"></div>
                <Flame size={120} className="text-orange-500 fill-orange-500 drop-shadow-lg relative z-10 animate-bounce" />
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-dark-card px-4 py-1 rounded-full shadow-lg border-2 border-orange-100 dark:border-orange-900 text-orange-600 font-black text-xl whitespace-nowrap z-20">
                    {streak} {isZh ? "天连胜" : "DAY STREAK"}
                </div>
            </div>
            
            <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-8">
                {isZh ? "势不可挡！" : "You're on fire!"}
            </h2>

            <div className="bg-white dark:bg-dark-card border-2 border-orange-100 dark:border-orange-900/30 p-6 rounded-3xl w-full max-w-md mb-12 shadow-sm">
                <div className="flex justify-between items-center">
                    {calendarDays.map((d, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 text-sm font-bold transition-all ${
                                 d.active 
                                 ? 'bg-orange-500 border-orange-500 text-white shadow-md scale-110' 
                                 : 'border-gray-200 dark:border-gray-700 text-gray-300'
                             }`}>
                                 {d.active ? <Check size={20}/> : null}
                             </div>
                             <span className={`text-xs font-bold uppercase ${d.active ? 'text-orange-500' : 'text-gray-300'}`}>
                                 {d.label}
                             </span>
                        </div>
                    ))}
                </div>
            </div>

            <Button 
                onClick={onContinue} 
                variant="primary" 
                size="lg" 
                className="w-full max-w-sm shadow-xl py-4 bg-orange-500 border-orange-600 hover:bg-orange-400"
            >
                {isZh ? "继续" : "CONTINUE"}
            </Button>
        </div>
    );
};
