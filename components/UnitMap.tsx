
import React, { useState } from 'react';
import { Lock, Check, Star, ArrowLeft, History, PlayCircle, Gift, Crown, BookOpenCheck, ChevronRight, AlertTriangle } from 'lucide-react';
import { SavedLesson } from '../types';
import { Button } from './Button';

interface UnitMapProps {
  problemName: string;
  currentLevel: number; // 0-6 based on new logic
  savedLessons: SavedLesson[];
  onStartLevel: (level: number, isSkipChallenge?: boolean) => void;
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
        concept: "概念引入",
        basics: "基础构建",
        reviewPhase: "复习巩固",
        opt1: "进阶优化 I",
        opt2: "进阶优化 II",
        mastery: "精通 (Boss)",
        skipTitle: "跳过至精通",
        skipDesc: "你确定要跳过前面的阶段直接挑战 BOSS 吗？",
        skipWarning: "挑战成功（错误 < 2）将直接标记本题全部完成。挑战失败将无法再次跳过。",
        confirmSkip: "确认跳过",
        cancel: "取消"
    },
    English: {
        unit: "Problem",
        start: "START",
        review: "Review",
        challenge: "Challenge",
        saved: "Saved Lessons",
        concept: "Concept",
        basics: "Basics",
        reviewPhase: "Review",
        opt1: "Optimization I",
        opt2: "Optimization II",
        mastery: "Mastery (Boss)",
        skipTitle: "Skip to Mastery",
        skipDesc: "Are you sure you want to skip previous phases and challenge the BOSS directly?",
        skipWarning: "Success (< 2 mistakes) will mark all phases complete. Failure disables this skip option.",
        confirmSkip: "Confirm Skip",
        cancel: "Cancel"
    }
};

export const UnitMap: React.FC<UnitMapProps> = ({ problemName, currentLevel, savedLessons, onStartLevel, onLoadSaved, onBack, language }) => {
  const [showSkipModal, setShowSkipModal] = useState(false);
  const t = LOCALE[language];

  // Check if skip is failed previously (stored in localStorage)
  const skipFailedKey = `skip_failed_${problemName}`;
  const isSkipDisabled = localStorage.getItem(skipFailedKey) === 'true';

  const handleSkipClick = () => {
      if (isSkipDisabled) return;
      setShowSkipModal(true);
  }

  const confirmSkip = () => {
      setShowSkipModal(false);
      onStartLevel(5, true); // Start Level 5 (Mastery) with skip flag
  }

  // 6 Phases: 0, 1, 2, 3, 4, 5
  const pathNodes = [
      { id: 0, type: 'lesson', icon: <Star size={20} />, label: t.concept },
      { id: 1, type: 'lesson', icon: <Star size={20} />, label: t.basics },
      { id: 2, type: 'review', icon: <BookOpenCheck size={20} />, label: t.reviewPhase }, 
      { id: 3, type: 'lesson', icon: <Star size={20} />, label: t.opt1 },
      { id: 4, type: 'lesson', icon: <Star size={20} />, label: t.opt2 },
      { id: 5, type: 'boss', icon: <Crown size={28} />, label: t.mastery },
  ];

  return (
    <div className="flex flex-col min-h-full relative bg-gray-50 dark:bg-dark-bg">
      
      {/* Floating Header (Rounded Island) */}
      <div className="fixed top-6 left-4 right-4 z-30 flex justify-center pointer-events-none">
          <div className="bg-white/95 dark:bg-dark-card/95 backdrop-blur-md p-4 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 flex items-center gap-4 w-full max-w-2xl pointer-events-auto">
            <button 
                onClick={onBack} 
                className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
                <ArrowLeft size={20} />
            </button>
            <div className="min-w-0 flex-1">
                <h1 className="text-lg font-extrabold text-gray-800 dark:text-white truncate leading-tight">{problemName}</h1>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{t.unit}</p>
            </div>
            <div className="shrink-0 flex gap-1">
                 <div className={`h-2 rounded-full bg-gray-200 dark:bg-gray-700 w-20 overflow-hidden`}>
                     <div className="h-full bg-brand" style={{ width: `${Math.min(100, (currentLevel / 6) * 100)}%` }}></div>
                 </div>
            </div>
          </div>
      </div>

      {/* Path Container */}
      <div className="flex-1 pt-40 pb-20 flex flex-col items-center relative">
        
        {/* Background Decorative Line */}
        <div className="absolute top-40 bottom-20 left-1/2 w-3 bg-gray-200 dark:bg-gray-800 -translate-x-1/2 rounded-full -z-10"></div>

        {pathNodes.map((node, index) => {
            const isLocked = node.id > currentLevel;
            const isCompleted = node.id < currentLevel;
            const isCurrent = node.id === currentLevel;
            
            // Review nodes are playable if unlocked (<= currentLevel)
            // Lesson nodes are playable if <= currentLevel (completed ones can be replayed)
            const isPlayable = node.id <= currentLevel;

            // Special handling for Mastery Skip
            const isMasterySkipAvailable = node.id === 5 && isLocked && !isSkipDisabled;

            // Zigzag layout
            const zigzag = index % 2 === 0 ? 'translate-x-0' : index % 4 === 1 ? '-translate-x-12' : 'translate-x-12';
            
            let baseColor = 'bg-brand';
            let shadowColor = 'shadow-brand/40';
            if (node.type === 'review') { baseColor = 'bg-purple-500'; shadowColor = 'shadow-purple-500/40'; }
            if (node.type === 'boss') { baseColor = 'bg-orange-500'; shadowColor = 'shadow-orange-500/40'; }

            const nodeSize = node.type === 'boss' ? 'w-24 h-24' : node.type === 'review' ? 'w-16 h-16' : 'w-20 h-20';

            return (
            <div key={index} className={`relative flex flex-col items-center mb-16 transition-transform duration-500 ${zigzag} z-0`}>
              
              {/* Node Button */}
              <button
                onClick={() => {
                    if (isPlayable) onStartLevel(node.id);
                    else if (isMasterySkipAvailable) handleSkipClick();
                }}
                disabled={!isPlayable && !isMasterySkipAvailable}
                className={`
                  relative flex items-center justify-center rounded-[2rem]
                  transition-all duration-300 group
                  ${nodeSize}
                  ${isLocked 
                    ? isMasterySkipAvailable 
                        ? 'bg-gray-200 dark:bg-gray-800 border-4 border-orange-400 border-dashed cursor-pointer hover:scale-110' // Skip Mode Style
                        : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed shadow-inner' 
                    : `${baseColor} text-white shadow-lg ${shadowColor} hover:scale-105 active:scale-95 active:shadow-none`
                   }
                  ${isCurrent ? 'ring-8 ring-brand/20 dark:ring-brand/10 animate-pulse-soft' : ''}
                `}
              >
                {/* Icon */}
                {isCompleted ? (
                    <div className="bg-white/20 p-2 rounded-full">
                        <Check size={node.type === 'review' ? 16 : 24} strokeWidth={4} />
                    </div>
                ) : isLocked ? (
                    isMasterySkipAvailable ? <Crown size={24} className="text-orange-400 animate-bounce" /> : <Lock size={20} />
                ) : (
                    <div className="drop-shadow-md">{node.icon}</div>
                )}

                {/* Stars for Completed Lessons */}
                {isCompleted && node.type === 'lesson' && (
                    <div className="absolute -bottom-3 flex gap-1 bg-white dark:bg-dark-card px-2 py-0.5 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
                        <Star size={10} className="fill-yellow-400 text-yellow-400" />
                        <Star size={10} className="fill-yellow-400 text-yellow-400" />
                        <Star size={10} className="fill-yellow-400 text-yellow-400" />
                    </div>
                )}
              </button>
              
              {/* Label Badge */}
              <div className={`
                mt-4 px-4 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm border-2 transition-all
                ${isCurrent 
                    ? 'bg-white dark:bg-dark-card border-brand text-brand scale-110' 
                    : isLocked && !isMasterySkipAvailable
                        ? 'bg-transparent border-transparent text-gray-400 dark:text-gray-600' 
                        : 'bg-white dark:bg-dark-card border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                }
              `}>
                {node.label}
              </div>

              {/* Skip Tooltip */}
              {isMasterySkipAvailable && (
                  <div className="absolute -right-32 top-0 w-28 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-bold p-2 rounded-xl border border-orange-200 dark:border-orange-800 shadow-sm hidden md:block">
                      Click to Skip Challenge
                  </div>
              )}
            </div>
          );
        })}

        {/* Saved Lessons */}
        {savedLessons.length > 0 && (
            <div className="w-full max-w-md mt-4 px-4 animate-fade-in-up mb-12">
                <div className="bg-white dark:bg-dark-card rounded-3xl p-4 border-2 border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-3 text-gray-400 text-xs font-bold uppercase tracking-wider">
                        <History size={14} />
                        <span>{t.saved}</span>
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                        {savedLessons.map(lesson => (
                            <button 
                                key={lesson.id}
                                onClick={() => onLoadSaved(lesson)}
                                className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between group text-left border border-transparent hover:border-brand/30"
                            >
                                <div>
                                    <div className="font-bold text-gray-700 dark:text-gray-200 text-xs mb-0.5">{lesson.plan.title}</div>
                                    <div className="text-[10px] text-gray-400">{new Date(lesson.timestamp).toLocaleDateString()}</div>
                                </div>
                                <ChevronRight size={16} className="text-gray-300 group-hover:text-brand transition-colors" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Skip Modal */}
      {showSkipModal && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="bg-white dark:bg-dark-card rounded-3xl p-8 w-full max-w-md text-center shadow-2xl border-2 border-gray-100 dark:border-gray-700 animate-scale-in">
                  <div className="mb-6 bg-orange-100 dark:bg-orange-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto border-4 border-white dark:border-dark-card shadow-lg">
                        <Crown className="text-orange-500" size={40} />
                  </div>
                  <h3 className="text-2xl font-extrabold text-gray-800 dark:text-white mb-3">{t.skipTitle}</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm leading-relaxed">{t.skipDesc}</p>
                  
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/50 mb-8 flex items-start gap-3 text-left">
                      <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5"/>
                      <p className="text-xs text-red-600 dark:text-red-400 font-bold leading-relaxed">{t.skipWarning}</p>
                  </div>

                  <div className="flex flex-col gap-3">
                      <Button variant="primary" onClick={confirmSkip} className="bg-orange-500 border-orange-600 hover:bg-orange-400">{t.confirmSkip}</Button>
                      <button onClick={() => setShowSkipModal(false)} className="text-gray-400 text-sm font-bold hover:text-gray-600 py-3">{t.cancel}</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
