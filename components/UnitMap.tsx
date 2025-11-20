
import React from 'react';
import { Lock, Check, Star, ArrowLeft, History, PlayCircle, Gift, Crown, BookOpenCheck } from 'lucide-react';
import { SavedLesson } from '../types';

interface UnitMapProps {
  problemName: string;
  currentLevel: number; // 0-6
  savedLessons: SavedLesson[];
  onStartLevel: (level: number) => void;
  onLoadSaved: (lesson: SavedLesson) => void;
  onBack: () => void;
  language: 'Chinese' | 'English';
}

const LOCALE = {
    Chinese: {
        unit: "当前题目",
        start: "开始",
        review: "复习",
        challenge: "挑战",
        saved: "已保存课程",
        checkpoint: "复习",
        intro: "概念",
        basics: "基础",
        code: "实现",
        optimize: "优化",
        boss: "精通"
    },
    English: {
        unit: "Problem",
        start: "START",
        review: "Review",
        challenge: "Challenge",
        saved: "Saved Lessons",
        checkpoint: "Review",
        intro: "Intro",
        basics: "Basics",
        code: "Code",
        optimize: "Optimize",
        boss: "Mastery"
    }
};

export const UnitMap: React.FC<UnitMapProps> = ({ problemName, currentLevel, savedLessons, onStartLevel, onLoadSaved, onBack, language }) => {
  
  const t = LOCALE[language];

  // Explicit path with Review Checkpoints injected
  const pathNodes = [
      { id: 0, type: 'lesson', icon: <Star size={24} />, label: t.intro },
      { id: 1, type: 'lesson', icon: <Star size={24} />, label: t.basics },
      { id: 99, type: 'review', icon: <BookOpenCheck size={24} />, label: t.checkpoint }, // Interstitial
      { id: 2, type: 'lesson', icon: <Star size={24} />, label: t.code },
      { id: 98, type: 'review', icon: <BookOpenCheck size={24} />, label: t.checkpoint }, // Interstitial
      { id: 3, type: 'lesson', icon: <Star size={24} />, label: t.optimize },
      { id: 4, type: 'boss', icon: <Crown size={28} />, label: t.boss },
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 p-4 sticky top-0 z-10 flex items-center justify-between rounded-b-2xl shadow-sm md:rounded-none">
        <div className="flex items-center">
            <button onClick={onBack} className="text-gray-400 hover:text-gray-700 dark:hover:text-white mr-4 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <ArrowLeft size={24} />
            </button>
            <div>
                <h1 className="text-xl font-extrabold text-gray-800 dark:text-white tracking-tight">{problemName}</h1>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wide">{t.unit}</p>
            </div>
        </div>
      </div>

      {/* Path Container */}
      <div className="flex-1 p-8 flex flex-col items-center">
        
        {pathNodes.map((node, index) => {
            let isLocked = true;
            let isCompleted = false;

            if (node.type === 'review') {
                // Unlocked if previous lesson is done
                const prevNodeIndex = index - 1;
                const prevNodeId = pathNodes[prevNodeIndex].id;
                isLocked = currentLevel < (prevNodeId + 1);
                isCompleted = currentLevel > (prevNodeId + 1);
            } else {
                isLocked = node.id > currentLevel;
                isCompleted = node.id < currentLevel;
            }
            
            // If it's a review node and currentLevel is exactly at the point where it should be active
            // Review 99 is between 1 and 2. So if Level is 2, 99 is "completed" or "available to review again".
            // Let's make reviews always clickable if unlocked.
            const isCurrent = !isLocked && (node.type === 'review' ? !isCompleted : !isCompleted);

            const offset = index % 2 === 0 ? '0px' : index % 4 === 1 ? '-40px' : '40px';
            
            let bgClass = 'bg-brand';
            if (node.type === 'review') bgClass = 'bg-purple-500';
            if (node.type === 'boss') bgClass = 'bg-orange-500';
            
            const finalBg = isCompleted ? bgClass : isCurrent ? bgClass : 'bg-gray-200 dark:bg-gray-700';

            return (
            <div key={index} className="relative flex flex-col items-center mb-8 w-full max-w-xs" style={{ transform: `translateX(${offset})` }}>
              
              {/* Connecting Line */}
              {index < pathNodes.length - 1 && (
                <div className={`absolute top-10 left-1/2 transform -translate-x-1/2 w-3 h-24 -z-10 rounded-full ${
                   isCompleted ? bgClass : 'bg-gray-200 dark:bg-gray-700'
                }`} style={{ opacity: 0.5 }} />
              )}

              {/* Node Circle */}
              <button
                onClick={() => !isLocked && onStartLevel(node.id)}
                disabled={isLocked}
                className={`
                  relative flex items-center justify-center shadow-[0_6px_0_0_rgba(0,0,0,0.2)]
                  transition-all duration-200 active:translate-y-[6px] active:shadow-none
                  ${node.type === 'boss' ? 'w-24 h-24 rounded-3xl' : node.type === 'review' ? 'w-16 h-16 rounded-2xl' : 'w-20 h-20 rounded-full'}
                  ${finalBg} text-white border-4 border-white/20
                  ${isCurrent ? 'ring-4 ring-offset-4 ring-brand/20 dark:ring-brand/10 scale-110 z-10' : ''}
                  ${isLocked ? '!bg-gray-200 dark:!bg-gray-800 !text-gray-400 dark:!text-gray-600 !shadow-none cursor-not-allowed' : ''}
                `}
              >
                {isCompleted ? <Check size={node.type === 'review' ? 20 : 32} strokeWidth={4} /> : isLocked ? <Lock size={20} /> : node.icon}
              </button>
              
              {/* Current Label */}
              {isCurrent && (
                <div className="mt-3 text-center bg-white dark:bg-dark-card py-1.5 px-4 rounded-xl shadow-lg border-2 border-brand animate-bounce">
                    <h3 className="font-extrabold text-brand text-xs uppercase tracking-widest">{t.start}</h3>
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-dark-card border-t-2 border-l-2 border-brand rotate-45"></div>
                </div>
              )}
              
              {!isCurrent && (
                   <div className="mt-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{node.label}</div>
              )}
            </div>
          );
        })}

        {savedLessons.length > 0 && (
            <div className="w-full max-w-md mt-16 bg-white dark:bg-dark-card rounded-3xl p-6 border-2 border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-center gap-2 text-gray-400 mb-6 font-bold text-xs uppercase tracking-wider">
                    <History size={16} />
                    <span>{t.saved}</span>
                </div>
                <div className="space-y-3">
                    {savedLessons.map(lesson => (
                        <button 
                            key={lesson.id}
                            onClick={() => onLoadSaved(lesson)}
                            className="w-full p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-brand hover:bg-brand-bg/20 dark:hover:bg-brand/10 transition-all flex items-center justify-between group text-left"
                        >
                            <div>
                                <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-1">{lesson.plan.title}</h4>
                                <div className="flex items-center gap-2">
                                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                        {lesson.language}
                                    </span>
                                    <p className="text-xs text-gray-400">{new Date(lesson.timestamp).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <PlayCircle className="text-gray-300 dark:text-gray-600 group-hover:text-brand transition-colors" size={28} />
                        </button>
                    ))}
                </div>
            </div>
        )}

      </div>
    </div>
  );
};