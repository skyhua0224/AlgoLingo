
import React, { useEffect, useState } from 'react';
import { Clock, Zap, XCircle, Flame, Heart, RotateCcw, FileText, Dumbbell } from 'lucide-react';
import { Button } from '../Button';

interface LessonHeaderProps {
  currentScreenIndex: number;
  totalScreens: number;
  streak: number;
  mistakeCount: number;
  timerSeconds: number;
  isSkipMode?: boolean;
  isMistakeMode?: boolean; // Now strictly for RETRY LOOP
  onExit: () => void;
  headerTitle?: string;
  language: 'Chinese' | 'English';
  totalTime?: number; 
  onShowDescription?: () => void; 
  isReviewContext?: boolean; // New prop for generic "Review Mode" (Purple)
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
  totalTime,
  onShowDescription,
  isReviewContext = false
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
  
  const remainingTime = totalTime ? Math.max(0, totalTime - timerSeconds) : timerSeconds;
  const isUrgent = totalTime && remainingTime < 60; 

  // --- THEME LOGIC ---
  // Mistake Loop -> Red (Danger/Correction)
  // Review Context (Drill) -> Indigo/Purple (Focus)
  // Standard -> White/Dark
  let bgClass = 'bg-white dark:bg-dark-card border-gray-200 dark:border-gray-700';
  if (isMistakeMode) {
      bgClass = 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30';
  } else if (isReviewContext) {
      bgClass = 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-900/30';
  }

  return (
    <div className={`h-16 px-4 md:px-6 border-b flex items-center justify-between shrink-0 z-10 select-none transition-colors ${bgClass}`}>
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
                         <div className="flex items-center gap-1 truncate max-w-[150px]">
                             {isReviewContext && <Dumbbell size={10} className="text-indigo-500"/>}
                             <span>{headerTitle || "Lesson"}</span>
                         </div>
                         <span>{currentScreenIndex + 1}/{totalScreens}</span>
                     </div>
                     <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ease-out rounded-full ${isSkipMode || totalTime ? 'bg-orange-500' : (isReviewContext ? 'bg-indigo-500' : 'bg-brand')}`} 
                            style={{ width: `${progressPercent}%` }} 
                        />
                     </div>
                </div>
            </>
        )}
      </div>

      {/* Right: Exit */}
      <div className="w-1/4 flex justify-end gap-2">
        {onShowDescription && (
            <button 
                onClick={onShowDescription}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                title={isZh ? "查看题目描述" : "View Problem Description"}
            >
                <FileText size={20} />
            </button>
        )}
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
