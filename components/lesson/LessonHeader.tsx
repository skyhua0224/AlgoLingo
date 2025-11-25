
import React, { useEffect, useState } from 'react';
import { Clock, Zap, XCircle, Flame, Heart, RotateCcw } from 'lucide-react';
import { Button } from '../Button';

interface LessonHeaderProps {
  currentScreenIndex: number;
  totalScreens: number;
  streak: number;
  mistakeCount: number;
  timerSeconds: number;
  isSkipMode?: boolean;
  isMistakeMode?: boolean;
  onExit: () => void;
  headerTitle?: string;
  language: 'Chinese' | 'English';
  totalTime?: number; // Optional: Total seconds allowed for exam
}

export const LessonHeader: React.FC<LessonHeaderProps> = ({
  currentScreenIndex,
  totalScreens,
  streak,
  mistakeCount,
  timerSeconds,
  isSkipMode = false,
  isMistakeMode = false,
  onExit,
  headerTitle,
  language,
  totalTime
}) => {
  const [showStreakAnim, setShowStreakAnim] = useState(false);
  const isZh = language === 'Chinese';

  // Trigger animation every 5 streaks
  useEffect(() => {
    if (streak > 0 && streak % 5 === 0) {
      setShowStreakAnim(true);
      const timer = setTimeout(() => setShowStreakAnim(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [streak]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = ((currentScreenIndex + 1) / totalScreens) * 100;
  const remainingLives = Math.max(0, 3 - mistakeCount);
  const mistakesLeft = totalScreens - currentScreenIndex;
  
  // Calculate remaining time if totalTime is provided
  const remainingTime = totalTime ? Math.max(0, totalTime - timerSeconds) : timerSeconds;
  const isUrgent = totalTime && remainingTime < 60; // Red if less than 1 min

  return (
    <div className={`h-16 px-4 md:px-6 border-b flex items-center justify-between shrink-0 z-10 select-none transition-colors ${
        isMistakeMode 
        ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' 
        : 'bg-white dark:bg-dark-card border-gray-200 dark:border-gray-700'
    }`}>
      {/* Left: Timer & Lives/Mistakes */}
      <div className="flex items-center gap-4 w-1/4">
        <div className={`hidden md:flex items-center gap-2 font-mono font-bold text-sm ${isUrgent ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
          <Clock size={16} />
          {formatTime(remainingTime)}
        </div>
        
        {isSkipMode ? (
          <div className="flex items-center gap-1">
             {[...Array(3)].map((_, i) => (
                 <Heart 
                    key={i} 
                    size={20} 
                    className={`${i < remainingLives ? 'fill-red-500 text-red-500' : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'} transition-colors`}
                 />
             ))}
          </div>
        ) : (
          !isMistakeMode && mistakeCount > 0 && !totalTime && (
            <div className="flex items-center gap-1 text-red-500 font-bold text-sm animate-pulse-soft">
              <XCircle size={18} />
              <span>{mistakeCount}</span>
            </div>
          )
        )}
      </div>

      {/* Center: Progress / Streak / Mistake Count */}
      <div className="flex-1 flex flex-col items-center max-w-xs mx-auto relative">
        {isMistakeMode ? (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-extrabold text-sm uppercase tracking-wider animate-pulse-soft">
                <RotateCcw size={16}/>
                <span>{mistakesLeft} {isZh ? "待修复" : "To Fix"}</span>
            </div>
        ) : (
            <>
                <div 
                    className={`absolute -top-1 transition-all duration-500 flex flex-col items-center ${showStreakAnim ? 'scale-150 opacity-100 z-20' : 'scale-75 opacity-0 z-0'}`}
                >
                     <Flame size={32} className="text-orange-500 fill-orange-500 animate-bounce" />
                     <span className="text-orange-600 font-black text-xs">{streak} STREAK!</span>
                </div>

                <div className={`w-full transition-opacity duration-300 ${showStreakAnim ? 'opacity-0' : 'opacity-100'}`}>
                     <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1">
                         <span className="truncate max-w-[120px]">{headerTitle || "Lesson"}</span>
                         <span>{currentScreenIndex + 1}/{totalScreens}</span>
                     </div>
                     <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ease-out rounded-full ${isSkipMode || totalTime ? 'bg-orange-500' : 'bg-brand'}`} 
                            style={{ width: `${progressPercent}%` }} 
                        />
                     </div>
                </div>
            </>
        )}
      </div>

      {/* Right: Exit */}
      <div className="w-1/4 flex justify-end">
        <button 
            onClick={onExit}
            className="text-gray-300 hover:text-gray-500 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
        >
            <XCircle size={24} />
        </button>
      </div>
    </div>
  );
};
