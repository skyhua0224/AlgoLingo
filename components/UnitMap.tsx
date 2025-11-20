
import React, { useState } from 'react';
import { Lock, Check, Star, ArrowLeft, History, PlayCircle, Crown, BookOpenCheck, AlertTriangle, FastForward, BookOpen, Code } from 'lucide-react';
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
        start: "开始挑战",
        review: "复习",
        saved: "已保存课程",
        intro: "概念引入",
        basics: "基础训练",
        review1: "复习阶段 I",
        code: "代码实现",
        review2: "复习阶段 II",
        mastery: "精通认证",
        skipTitle: "跳级挑战",
        skipDesc: "你即将跳过所有前置课程直接挑战最终 BOSS (精通阶段)。",
        skipWarn: "如果错误超过 2 次，挑战将失败，且该题目的跳级功能将永久锁定，必须按顺序学习。",
        confirmSkip: "确认跳级",
        cancel: "取消",
        locked: "已锁定",
        completed: "已完成",
        skipLocked: "跳级已锁定",
        startBtn: "开始"
    },
    English: {
        unit: "Problem",
        start: "Start Challenge",
        review: "Review",
        saved: "Saved Lessons",
        intro: "Concept",
        basics: "Basics",
        review1: "Review Phase I",
        code: "Implementation",
        review2: "Review Phase II",
        mastery: "Mastery",
        skipTitle: "Skip to Mastery",
        skipDesc: "You are about to skip all previous lessons to challenge the final BOSS.",
        skipWarn: "If you make more than 2 mistakes, you will fail and this skip option will be locked forever.",
        confirmSkip: "Confirm Skip",
        cancel: "Cancel",
        locked: "Locked",
        completed: "Completed",
        skipLocked: "Skip Locked",
        startBtn: "Start"
    }
};

export const UnitMap: React.FC<UnitMapProps> = ({ problemName, currentLevel, savedLessons, onStartLevel, onLoadSaved, onBack, language, failedSkips }) => {
  const [showSkipModal, setShowSkipModal] = useState(false);
  const t = LOCALE[language];

  // 6 Phases: Indices 0 to 5
  const pathNodes = [
      { id: 0, type: 'lesson', icon: <BookOpen size={24} />, label: t.intro, subtitle: "Level 1" },
      { id: 1, type: 'lesson', icon: <Code size={24} />, label: t.basics, subtitle: "Level 2" },
      { id: 2, type: 'review', icon: <BookOpenCheck size={24} />, label: t.review1, subtitle: "Level 3" },
      { id: 3, type: 'lesson', icon: <Star size={24} />, label: t.code, subtitle: "Level 4" },
      { id: 4, type: 'review', icon: <BookOpenCheck size={24} />, label: t.review2, subtitle: "Level 5" },
      { id: 5, type: 'boss', icon: <Crown size={28} />, label: t.mastery, subtitle: "BOSS" },
  ];

  const isSkipLocked = failedSkips && failedSkips[problemName];

  const handleNodeClick = (nodeId: number, isLocked: boolean) => {
      // Special handling for Boss Node (5) - Skip Logic
      if (nodeId === 5 && isLocked) {
          if (isSkipLocked) {
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

      {/* Floating Rounded Header */}
      <div className="fixed top-6 left-6 right-6 z-30">
        <div className="bg-white/90 dark:bg-dark-card/90 backdrop-blur-md border border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between shadow-lg rounded-2xl max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-lg md:text-xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none truncate max-w-[200px] md:max-w-none">{problemName}</h1>
                    <p className="text-brand font-bold text-xs uppercase tracking-wide mt-0.5">{t.unit}</p>
                </div>
            </div>
            
            {/* Current Progress Indicator */}
            <div className="hidden md:flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                <Star size={14} className="text-yellow-500 fill-yellow-500"/>
                <span>{currentLevel}/6 {t.completed}</span>
            </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 pt-32 pb-24 px-6 md:px-12 w-full max-w-5xl mx-auto animate-fade-in-up">
        
        {/* Redesigned 3-Column Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {pathNodes.map((node) => {
                const isLocked = node.id > currentLevel;
                const isCompleted = node.id < currentLevel;
                const isCurrent = node.id === currentLevel;
                
                // Special check for Boss Skip capability
                const isBossNode = node.id === 5;
                const isBossSkipAvailable = isBossNode && isLocked && !isSkipLocked;
                const isBossSkipLocked = isBossNode && isLocked && isSkipLocked;

                let borderColor = isCurrent ? 'border-brand' : 'border-gray-200 dark:border-gray-700';
                let bgColor = 'bg-white dark:bg-dark-card';
                let iconColor = 'text-gray-400 dark:text-gray-500';
                
                if (isCompleted) {
                    borderColor = 'border-green-500';
                    bgColor = 'bg-green-50 dark:bg-green-900/10';
                    iconColor = 'text-green-500';
                } else if (isCurrent) {
                    borderColor = 'border-brand';
                    bgColor = 'bg-white dark:bg-dark-card';
                    iconColor = 'text-brand';
                } else if (isBossSkipAvailable) {
                    borderColor = 'border-orange-400';
                    bgColor = 'bg-orange-50 dark:bg-orange-900/10';
                    iconColor = 'text-orange-500';
                } else if (isLocked) {
                    bgColor = 'bg-gray-100 dark:bg-gray-800';
                }

                if (node.type === 'boss') {
                     if (isCompleted) {
                         borderColor = 'border-yellow-500';
                         iconColor = 'text-yellow-500';
                         bgColor = 'bg-yellow-50 dark:bg-yellow-900/10';
                     } else if (isCurrent) {
                         borderColor = 'border-yellow-500';
                     }
                }

                return (
                    <button
                        key={node.id}
                        onClick={() => handleNodeClick(node.id, isLocked)}
                        disabled={isLocked && !isBossSkipAvailable}
                        className={`
                            relative p-6 md:p-8 rounded-2xl border-2 border-b-4 transition-all duration-200 text-left flex flex-col h-full min-h-[160px] justify-between
                            ${borderColor} ${bgColor}
                            ${!isLocked || isBossSkipAvailable ? 'hover:-translate-y-1 hover:shadow-md active:translate-y-0 active:shadow-none active:border-b-2' : 'opacity-70 cursor-not-allowed'}
                            ${isCurrent ? 'ring-4 ring-brand/20 dark:ring-brand/10' : ''}
                        `}
                    >
                        <div className="flex justify-between items-start mb-2">
                             <div className={`p-3 rounded-xl ${isCompleted ? 'bg-green-200 dark:bg-green-900/30' : (isCurrent ? 'bg-brand-bg dark:bg-brand/20' : 'bg-gray-200 dark:bg-gray-700')} ${iconColor}`}>
                                 {isCompleted ? <Check size={20} strokeWidth={3} /> : 
                                  isBossSkipAvailable ? <FastForward size={20} /> :
                                  (isLocked ? <Lock size={20} className="text-gray-400" /> : node.icon)
                                 }
                             </div>
                             <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">{node.subtitle}</span>
                        </div>
                        
                        <div className="mt-1">
                            <h3 className={`text-base md:text-lg font-extrabold mb-2 truncate ${isLocked && !isBossSkipAvailable ? 'text-gray-400' : 'text-gray-800 dark:text-white'}`}>
                                {node.label}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2">
                                {isCurrent && (
                                    <span className="inline-block bg-brand text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide animate-pulse">
                                        {t.startBtn}
                                    </span>
                                )}
                                {isBossSkipAvailable && (
                                    <span className="inline-block bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                                        {t.skipTitle}
                                    </span>
                                )}
                                {isBossSkipLocked && (
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">{t.skipLocked}</span>
                                )}
                                {isCompleted && (
                                    <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase">{t.completed}</span>
                                )}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>

        {savedLessons.length > 0 && (
            <div className="mt-12 md:mt-16">
                <div className="flex items-center gap-2 text-gray-400 mb-4 font-bold text-xs uppercase tracking-wider px-2">
                    <History size={16} />
                    <span>{t.saved}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedLessons.map(lesson => (
                        <button 
                            key={lesson.id}
                            onClick={() => onLoadSaved(lesson)}
                            className="w-full p-5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card hover:border-brand hover:shadow-md transition-all flex items-center justify-between group text-left"
                        >
                            <div>
                                <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm md:text-base mb-1">{lesson.plan.title}</h4>
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
