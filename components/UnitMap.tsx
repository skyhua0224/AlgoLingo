
import React, { useState } from 'react';
import { Lock, Check, Star, ArrowLeft, History, PlayCircle, Crown, BookOpenCheck, AlertTriangle, FastForward, BookOpen, Code, Sparkles, Trophy, Layout } from 'lucide-react';
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
        startBtn: "开始",
        mastered: "已精通",
        leetcodeMode: "力扣学习",
        masteryLoop: "精通挑战",
        masteryHub: "精通中心"
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
        startBtn: "Start",
        mastered: "Mastered",
        leetcodeMode: "LeetCode Study",
        masteryLoop: "Mastery Challenge",
        masteryHub: "Mastery Hub"
    }
};

export const UnitMap: React.FC<UnitMapProps> = ({ problemName, currentLevel, savedLessons, onStartLevel, onLoadSaved, onBack, language, failedSkips }) => {
  const [showSkipModal, setShowSkipModal] = useState(false);
  const t = LOCALE[language];

  // 6 Phases: Indices 0 to 5. Index 6 is LeetCode (Virtual)
  const pathNodes = [
      { id: 0, type: 'lesson', icon: <BookOpen size={24} />, label: t.intro, subtitle: "Level 1" },
      { id: 1, type: 'lesson', icon: <Code size={24} />, label: t.basics, subtitle: "Level 2" },
      { id: 2, type: 'review', icon: <BookOpenCheck size={24} />, label: t.review1, subtitle: "Level 3" },
      { id: 3, type: 'lesson', icon: <Star size={24} />, label: t.code, subtitle: "Level 4" },
      { id: 4, type: 'review', icon: <BookOpenCheck size={24} />, label: t.review2, subtitle: "Level 5" },
      { id: 5, type: 'boss', icon: <Crown size={28} />, label: t.mastery, subtitle: "BOSS" },
  ];

  const isSkipLocked = failedSkips && failedSkips[problemName];
  const isMastered = currentLevel >= 6;

  const handleNodeClick = (nodeId: number, isLocked: boolean) => {
      // Boss Node Logic
      if (nodeId === 5) {
          // If locked and skip available -> Skip Modal
          if (isLocked) {
              if (!isSkipLocked) {
                  setShowSkipModal(true);
                  return;
              }
          } else {
              // If unlocked or mastered, start Mastery Phase (Index 5)
              onStartLevel(5);
          }
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

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white/90 dark:bg-dark-card/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 md:px-12 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <ArrowLeft size={24} />
            </button>
            <div>
                <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">{problemName}</h1>
                <p className="text-brand font-bold text-xs uppercase tracking-wide mt-1">{t.unit}</p>
            </div>
        </div>
        
        <div className="hidden md:flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
             <Star size={14} className="text-yellow-500 fill-yellow-500"/>
             <span>{Math.min(currentLevel, 6)}/6 {t.completed}</span>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 pt-32 pb-24 px-4 md:px-16 w-full max-w-5xl mx-auto animate-fade-in-up">
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-10">
            {pathNodes.map((node) => {
                const isLocked = node.id > currentLevel;
                const isCompleted = node.id < currentLevel;
                const isCurrent = node.id === currentLevel;
                
                // Special Logic for Boss Node when Mastered
                if (node.id === 5 && isMastered) {
                    return (
                        <div key={node.id} className="col-span-1 md:col-span-2 md:col-start-2 p-1 rounded-3xl bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 shadow-xl animate-pulse-soft">
                             <div className="bg-white dark:bg-dark-card rounded-[20px] p-6 h-full flex flex-col items-center justify-center text-center gap-4">
                                 <div className="flex items-center gap-2 mb-2">
                                     <Crown size={32} className="text-yellow-500 fill-yellow-500"/>
                                     <h3 className="text-2xl font-extrabold text-gray-800 dark:text-white">{t.masteryHub}</h3>
                                 </div>
                                 
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                     <button 
                                         onClick={() => onStartLevel(6)} // Phase 7 = Index 6 = LeetCode
                                         className="flex flex-col items-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-brand hover:bg-brand-bg dark:hover:bg-brand/10 transition-all group"
                                     >
                                         <Layout size={24} className="text-gray-500 group-hover:text-brand mb-2"/>
                                         <span className="font-bold text-sm text-gray-700 dark:text-gray-200">{t.leetcodeMode}</span>
                                     </button>

                                     <button 
                                         onClick={() => onStartLevel(5)} // Replay Mastery
                                         className="flex flex-col items-center p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-700 hover:border-yellow-500 hover:bg-yellow-100 transition-all group"
                                     >
                                         <Trophy size={24} className="text-yellow-600 dark:text-yellow-500 mb-2"/>
                                         <span className="font-bold text-sm text-yellow-800 dark:text-yellow-400">{t.masteryLoop}</span>
                                     </button>
                                 </div>
                             </div>
                        </div>
                    );
                }

                const isBossNode = node.id === 5;
                const isBossSkipAvailable = isBossNode && isLocked && !isSkipLocked;
                const isBossSkipLocked = isBossNode && isLocked && isSkipLocked;

                let borderColor = isCurrent ? 'border-brand' : 'border-gray-200 dark:border-gray-700';
                let bgColor = 'bg-white dark:bg-dark-card';
                let iconColor = 'text-gray-400 dark:text-gray-500';
                
                if (isCompleted) {
                    borderColor = 'border-yellow-500'; // Gold for completed
                    bgColor = 'bg-yellow-50 dark:bg-yellow-900/10';
                    iconColor = 'text-yellow-500';
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

                return (
                    <button
                        key={node.id}
                        onClick={() => handleNodeClick(node.id, isLocked)}
                        disabled={isLocked && !isBossSkipAvailable}
                        className={`
                            relative p-8 rounded-3xl border-2 border-b-4 transition-all duration-200 text-left flex flex-col h-full min-h-[180px] justify-between
                            ${borderColor} ${bgColor}
                            ${!isLocked || isBossSkipAvailable ? 'hover:-translate-y-1 hover:shadow-md active:translate-y-0 active:shadow-none active:border-b-2' : 'opacity-80 cursor-not-allowed'}
                            ${isCurrent ? 'ring-4 ring-brand/20 dark:ring-brand/10' : ''}
                            ${isCompleted ? 'shadow-sm' : ''}
                        `}
                    >
                        <div className="flex justify-between items-start mb-4">
                             <div className={`p-4 rounded-2xl ${isCompleted ? 'bg-yellow-100 dark:bg-yellow-900/30' : (isCurrent ? 'bg-brand-bg dark:bg-brand/20' : 'bg-gray-200 dark:bg-gray-700')} ${iconColor}`}>
                                 {isCompleted ? <Sparkles size={24} className="text-yellow-500" /> : 
                                  isBossSkipAvailable ? <FastForward size={24} /> :
                                  (isLocked ? <Lock size={24} className="text-gray-400" /> : node.icon)
                                 }
                             </div>
                             <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{node.subtitle}</span>
                        </div>
                        
                        <div className="mt-2">
                            <h3 className={`text-lg font-extrabold mb-2 ${isLocked && !isBossSkipAvailable ? 'text-gray-400' : 'text-gray-800 dark:text-white'}`}>
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
                                    <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400 uppercase">{t.mastered}</span>
                                )}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>

        {savedLessons.length > 0 && (
            <div className="mt-16">
                <div className="flex items-center gap-2 text-gray-400 mb-6 font-bold text-xs uppercase tracking-wider px-2">
                    <History size={16} />
                    <span>{t.saved}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {savedLessons.map(lesson => (
                        <button 
                            key={lesson.id}
                            onClick={() => onLoadSaved(lesson)}
                            className="w-full p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card hover:border-brand hover:shadow-md transition-all flex items-center justify-between group text-left"
                        >
                            <div>
                                <h4 className="font-bold text-gray-800 dark:text-gray-200 text-base mb-2">{lesson.plan.title}</h4>
                                <div className="flex items-center gap-2">
                                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                        {lesson.language}
                                    </span>
                                    <p className="text-xs text-gray-400">{new Date(lesson.timestamp).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <PlayCircle className="text-gray-300 dark:text-gray-600 group-hover:text-brand transition-colors" size={32} />
                        </button>
                    ))}
                </div>
            </div>
        )}

      </div>
    </div>
  );
};
