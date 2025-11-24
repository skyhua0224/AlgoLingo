
import React, { useState } from 'react';
import { ArrowLeft, History, PlayCircle, BookOpen, Code, Star, BookOpenCheck, Crown, AlertTriangle, FastForward } from 'lucide-react';
import { SavedLesson } from '../types';
import { Button } from './Button';
import { LevelNode, MasteryPlate } from './common/GamifiedMap';

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

      {/* Modern Floating Header */}
      <div className="sticky top-4 z-30 mx-4 md:mx-8 mt-4 rounded-2xl bg-white/90 dark:bg-dark-card/90 backdrop-blur-xl border border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <ArrowLeft size={24} />
            </button>
            <div>
                <h1 className="text-lg md:text-xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none truncate max-w-[200px] md:max-w-full">{problemName}</h1>
                <p className="text-brand font-bold text-[10px] uppercase tracking-wide mt-0.5">{t.unit}</p>
            </div>
        </div>
        
        <div className="hidden md:flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
             <Star size={14} className="text-yellow-500 fill-yellow-500"/>
             <span>{Math.min(currentLevel, 6)}/6 {t.completed}</span>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 pt-8 pb-24 px-4 md:px-16 w-full max-w-5xl mx-auto animate-fade-in-up">
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-10">
            {pathNodes.map((node) => {
                const isLocked = node.id > currentLevel;
                const isCompleted = node.id < currentLevel;
                const isCurrent = node.id === currentLevel;
                
                // Special Logic for Boss Node when Mastered (CENTERED)
                if (node.id === 5 && isMastered) {
                    return (
                        <MasteryPlate 
                            key={node.id}
                            title={t.masteryHub}
                            onLeetCodeClick={() => onStartLevel(6)}
                            onMasteryLoopClick={() => onStartLevel(5)}
                            leetcodeLabel={t.leetcodeMode}
                            masteryLoopLabel={t.masteryLoop}
                        />
                    );
                }

                const isBossNode = node.id === 5;
                const isBossSkipAvailable = isBossNode && isLocked && !isSkipLocked;
                const isBossSkipLocked = isBossNode && isLocked && isSkipLocked;

                return (
                    <LevelNode 
                        key={node.id}
                        id={node.id}
                        label={node.label}
                        subtitle={node.subtitle}
                        icon={node.icon}
                        status={isCompleted ? 'completed' : (isLocked ? 'locked' : 'active')}
                        isCurrent={isCurrent}
                        onClick={() => handleNodeClick(node.id, isLocked)}
                        showSkip={isBossSkipAvailable}
                        skipLocked={isBossSkipLocked}
                        skipLabel={t.skipTitle}
                        startLabel={t.startBtn}
                        completedLabel={t.mastered}
                        skipLockedLabel={t.skipLocked}
                    />
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
