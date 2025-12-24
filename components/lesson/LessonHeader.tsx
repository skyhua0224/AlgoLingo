
import React, { useEffect, useState } from 'react';
import { X, Flame, Heart, RotateCcw, Clock, FileText } from 'lucide-react';

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
  totalTime?: number; 
  onShowDescription?: () => void; 
  isReviewContext?: boolean; 
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
  isReviewContext
}) => {
  const [animateStreak, setAnimateStreak] = useState(false);
  
  // Trigger bounce animation on streak change
  useEffect(() => {
      if (streak > 0) {
          setAnimateStreak(true);
          const t = setTimeout(() => setAnimateStreak(false), 300);
          return () => clearTimeout(t);
      }
  }, [streak]);

  // Calculate Progress
  // We use currentScreenIndex + 1 visually, but clamp it to totalScreens
  const progressPercent = Math.min(100, Math.round(((currentScreenIndex + 1) / totalScreens) * 100));
  
  const remainingLives = Math.max(0, 3 - mistakeCount);
  const remainingTime = totalTime ? Math.max(0, totalTime - timerSeconds) : timerSeconds;
  
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Status Colors
  const progressColor = isMistakeMode 
    ? 'bg-red-500' 
    : (isSkipMode ? 'bg-orange-500' : 'bg-brand');
    
  const trackColor = 'bg-gray-200 dark:bg-gray-700';

  return (
    <div className="h-16 px-4 md:px-6 flex items-center justify-between shrink-0 z-20 bg-white dark:bg-dark-card select-none">
      
      {/* 1. Left: Exit Button */}
      <button 
        onClick={onExit}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
      >
        <X size={28} strokeWidth={2.5} />
      </button>

      {/* 2. Center: Thick Progress Bar */}
      <div className="flex-1 mx-4 md:mx-8 relative h-4">
        {isMistakeMode ? (
             <div className="flex items-center justify-center gap-2 text-red-500 font-black text-xs uppercase tracking-widest animate-pulse">
                <RotateCcw size={14}/> Debugging...
             </div>
        ) : (
            <div className={`w-full h-full ${trackColor} rounded-full overflow-hidden relative`}>
                {/* Highlight/Glow (Optional visual polish) */}
                <div className="absolute top-1 left-2 right-2 h-1 bg-white/20 rounded-full z-10 pointer-events-none"></div>
                
                <div 
                    className={`h-full ${progressColor} transition-all duration-500 ease-out rounded-full relative`}
                    style={{ width: `${progressPercent}%` }}
                >
                    {/* Inner highlight for "3D" effect */}
                    <div className="absolute top-1 left-2 right-2 h-1 bg-white/30 rounded-full"></div>
                </div>
            </div>
        )}
      </div>

      {/* 3. Right: Stats (Hearts or Streak) & Description Toggle */}
      <div className="flex items-center justify-end gap-4 min-w-[60px]">
        
        {/* Description Toggle (Only if context available) */}
        {onShowDescription && (
            <button 
                onClick={onShowDescription}
                className="text-gray-400 hover:text-brand transition-colors p-1"
                title="Problem Description"
            >
                <FileText size={24} />
            </button>
        )}

        {/* Timer Display (For Exams OR Review Context) */}
        {(totalTime || isReviewContext) ? (
             <div className={`flex items-center gap-1.5 font-mono font-bold ${totalTime && remainingTime < 60 ? 'text-red-500 animate-pulse' : 'text-gray-500'}`}>
                 <Clock size={18}/>
                 {formatTime(remainingTime)}
             </div>
        ) : isSkipMode ? (
            /* Lives Mode (Skip) */
            <div className="flex items-center gap-1">
                <Heart size={24} className="text-red-500 fill-current animate-pulse-soft" />
                <span className="font-black text-red-500 text-lg">{remainingLives}</span>
            </div>
        ) : (
            /* Standard Streak Mode */
            <div className={`flex items-center gap-1.5 transition-transform ${animateStreak ? 'scale-125' : 'scale-100'}`}>
                <div className="relative">
                    <Flame 
                        size={28} 
                        className={`${streak > 0 ? 'text-orange-500 fill-orange-500' : 'text-gray-300 dark:text-gray-700'}`} 
                    />
                    {streak >= 5 && (
                        <div className="absolute inset-0 bg-orange-400 blur-lg opacity-40 animate-pulse"></div>
                    )}
                </div>
                <span className={`font-black text-lg ${streak > 0 ? 'text-orange-500' : 'text-gray-300 dark:text-gray-700'}`}>
                    {streak}
                </span>
            </div>
        )}
      </div>
    </div>
  );
};
