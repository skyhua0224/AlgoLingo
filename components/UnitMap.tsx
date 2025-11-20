
import React, { useState } from 'react';
import { Lock, Check, Star, ArrowLeft, History, PlayCircle, Crown, BookOpenCheck, AlertTriangle, FastForward, X } from 'lucide-react';
import { SavedLesson } from '../types';
import { Button } from './Button';

interface UnitMapProps {
  problemName: string;
  currentLevel: number; // 0-6
  savedLessons: SavedLesson[];
  onStartLevel: (level: number, isSkip?: boolean) => void;
  onLoadSaved: (lesson: SavedLesson) => void;
  onBack: () => void;
  language: 'Chinese' | 'English';
  failedSkips?: Record<string, boolean>; // To track if skip is disabled
}

const LOCALE = {
    Chinese: {
        unit: "当前题目",
        start: "开始",
        review: "复习",
        saved: "已保存课程",
        intro: "概念引入 (1)",
        basics: "基础训练 (2)",
        review1: "复习 I (3)",
        code: "进阶应用 (4)",
        review2: "复习 II (5)",
        mastery: "精通 (6)",
        skipTitle: "跳级挑战",
        skipDesc: "你即将跳过所有前置课程直接挑战最终 BOSS (精通阶段)。",
        skipWarn: "如果错误超过 2 次，挑战将失败，且该题目的跳级功能将永久锁定，必须按顺序学习。",
        confirmSkip: "确认跳级",
        cancel: "取消",
        locked: "已锁定",
        completed: "已完成",
        skipLocked: "跳级已锁定 (曾失败)"
    },
    English: {
        unit: "Problem",
        start: "START",
        review: "Review",
        saved: "Saved Lessons",
        intro: "Concept (1)",
        basics: "Basics (2)",
        review1: "Review I (3)",
        code: "Advanced (4)",
        review2: "Review II (5)",
        mastery: "Mastery (6)",
        skipTitle: "Skip to Mastery",
        skipDesc: "You are about to skip all previous lessons to challenge the final BOSS.",
        skipWarn: "If you make more than 2 mistakes, you will fail and this skip option will be locked forever.",
        confirmSkip: "Confirm Skip",
        cancel: "Cancel",
        locked: "Locked",
        completed: "Completed",
        skipLocked: "Skip Locked (Failed)"
    }
};

export const UnitMap: React.FC<UnitMapProps> = ({ problemName, currentLevel, savedLessons, onStartLevel, onLoadSaved, onBack, language, failedSkips }) => {
  const [showSkipModal, setShowSkipModal] = useState(false);
  const t = LOCALE[language];

  // 6 Phases: Indices 0 to 5
  const pathNodes = [
      { id: 0, type: 'lesson', icon: <Star size={24} />, label: t.intro },
      { id: 1, type: 'lesson', icon: <Star size={24} />, label: t.basics },
      { id: 2, type: 'review', icon: <BookOpenCheck size={24} />, label: t.review1 },
      { id: 3, type: 'lesson', icon: <Star size={24} />, label: t.code },
      { id: 4, type: 'review', icon: <BookOpenCheck size={24} />, label: t.review2 },
      { id: 5, type: 'boss', icon: <Crown size={28} />, label: t.mastery },
  ];

  const isSkipLocked = failedSkips && failedSkips[problemName];

  const handleNodeClick = (nodeId: number, isLocked: boolean) => {
      // Special handling for Boss Node (5) - Skip Logic
      if (nodeId === 5 && isLocked) {
          if (isSkipLocked) {
              // Shake animation or simple alert could go here
              return;
          }
          setShowSkipModal(true);
          return;
      }

      if (!isLocked) {
          onStartLevel(nodeId);
      }
  };

  const confirmSkip = () => {
      setShowSkipModal(false);
      onStartLevel(5, true); // true = isSkip
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-dark-bg relative">
      
      {/* Skip Confirmation Modal */}
      {showSkipModal && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-up">
              <div className="bg-white dark:bg-dark-card rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl border-2 border-orange-100 dark:border-orange-900/50">
                  <div className="mb-4 bg-orange-100 dark:bg-orange-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                        <FastForward className="text-orange-500" size={32} />
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-800 dark:text-white mb-2">{t.skipTitle}</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm leading-relaxed">{t.skipDesc}</p>
                  
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 p-3 rounded-xl mb-6 flex items-start gap-2 text-left">
                      <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5"/>
                      <p className="text-xs text-red-600 dark:text-red-400 font-bold">{t.skipWarn}</p>
                  </div>

                  <div className="flex flex-col gap-3">
                      <Button variant="primary" onClick={confirmSkip} className="w-full bg-orange-500 border-orange-700 hover:bg-orange-400 shadow-lg">{t.confirmSkip}</Button>
                      <button onClick={() => setShowSkipModal(false)} className="text-gray-400 text-sm font-bold hover:text-gray-600 py-2">{t.cancel}</button>
                  </div>
              </div>
          </div>
      )}

      {/* Floating Header */}
      <div className="fixed top-4 left-4 right-4 z-30 bg-white/80 dark:bg-dark-card/80 backdrop-blur-md border border-gray-200 dark:border-gray-800 p-4 rounded-2xl shadow-lg flex items-center justify-between max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <ArrowLeft size={24} />
            </button>
            <div>
                <h1 className="text-lg font-extrabold text-gray-800 dark:text-white tracking-tight leading-none">{problemName}</h1>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wide mt-1">{t.unit}</p>
            </div>
        </div>
      </div>

      {/* Path Container */}
      <div className="flex-1 pt-32 pb-20 px-8 flex flex-col items-center max-w-3xl mx-auto w-full z-0">
        
        {pathNodes.map((node, index) => {
            const isLocked = node.id > currentLevel;
            const isCompleted = node.id < currentLevel;
            const isCurrent = node.id === currentLevel;
            
            // Special check for Boss Skip capability
            const isBossNode = node.id === 5;
            const isBossSkipAvailable = isBossNode && isLocked && !isSkipLocked;
            const isBossSkipLocked = isBossNode && isLocked && isSkipLocked;

            // Visual styling: Zig-zag pattern
            const offset = index % 2 === 0 ? '0px' : index % 4 === 1 ? '-40px' : '40px';
            
            let bgClass = 'bg-brand';
            if (node.type === 'review') bgClass = 'bg-purple-500';
            if (node.type === 'boss') bgClass = 'bg-orange-500';
            
            const finalBg = isCompleted ? bgClass : isCurrent ? bgClass : 'bg-gray-200 dark:bg-gray-700';

            return (
            <div key={index} className="relative flex flex-col items-center mb-10 w-full max-w-xs z-10" style={{ transform: `translateX(${offset})` }}>
              
              {/* Connecting Line */}
              {index < pathNodes.length - 1 && (
                <div className={`absolute top-10 left-1/2 transform -translate-x-1/2 w-2 h-28 -z-10 rounded-full ${
                   isCompleted ? bgClass : 'bg-gray-200 dark:bg-gray-700'
                }`} style={{ opacity: 0.5 }} />
              )}

              {/* Node Circle */}
              <button
                onClick={() => handleNodeClick(node.id, isLocked)}
                disabled={isLocked && !isBossSkipAvailable}
                className={`
                  relative flex items-center justify-center shadow-[0_6px_0_0_rgba(0,0,0,0.1)]
                  transition-all duration-200 active:translate-y-[6px] active:shadow-none
                  ${node.type === 'boss' ? 'w-24 h-24 rounded-3xl' : node.type === 'review' ? 'w-16 h-16 rounded-2xl' : 'w-20 h-20 rounded-full'}
                  ${finalBg} text-white border-4 border-white/50 dark:border-white/10
                  ${isCurrent ? 'ring-4 ring-offset-4 ring-brand/20 dark:ring-brand/10 scale-110 z-10' : ''}
                  ${isBossSkipAvailable ? '!bg-white dark:!bg-dark-card !text-orange-500 !border-orange-400 border-dashed cursor-pointer animate-pulse' : ''}
                  ${isBossSkipLocked ? '!bg-gray-300 dark:!bg-gray-800 !text-gray-500 !border-gray-400 cursor-not-allowed opacity-70' : ''}
                  ${isLocked && !isBossSkipAvailable && !isBossSkipLocked ? '!bg-gray-200 dark:!bg-gray-800 !text-gray-400 dark:!text-gray-600 !shadow-none cursor-not-allowed' : ''}
                `}
              >
                {isCompleted ? <Check size={node.type === 'review' ? 20 : 32} strokeWidth={4} /> : 
                 isBossSkipAvailable ? <FastForward size={32}/> :
                 (isLocked ? (isBossSkipLocked ? <Lock size={24} className="text-gray-500"/> : <Lock size={20} />) : node.icon)}
              </button>
              
              {/* Labels */}
              {isCurrent && (
                <div className="mt-3 text-center bg-white dark:bg-dark-card py-1.5 px-4 rounded-xl shadow-lg border-2 border-brand animate-bounce">
                    <h3 className="font-extrabold text-brand text-xs uppercase tracking-widest">{t.start}</h3>
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-dark-card border-t-2 border-l-2 border-brand rotate-45"></div>
                </div>
              )}

              {isBossSkipAvailable && (
                 <div className="mt-3 text-center bg-orange-500 text-white py-1 px-3 rounded-full shadow-lg text-[10px] font-bold uppercase tracking-wider">
                     {t.skipTitle}
                 </div>
              )}
              
              {isBossSkipLocked && (
                 <div className="mt-2 text-[10px] font-bold text-gray-400 uppercase">{t.skipLocked}</div>
              )}

              {!isCurrent && !isBossSkipAvailable && !isBossSkipLocked && (
                   <div className="mt-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{node.label}</div>
              )}
            </div>
          );
        })}

        {savedLessons.length > 0 && (
            <div className="w-full max-w-md mt-8 bg-white dark:bg-dark-card rounded-3xl p-6 border-2 border-gray-100 dark:border-gray-700 shadow-sm z-10">
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
