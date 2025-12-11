
import React, { useState, useEffect } from 'react';
import { ArrowLeft, History, PlayCircle, BookOpen, Code, Star, BookOpenCheck, Crown, AlertTriangle, FastForward, Settings, Crosshair, FileText, X, Loader2, List, Hash, Tag, Brain } from 'lucide-react';
import { SavedLesson, SolutionStrategy, UserPreferences, LeetCodeContext } from '../types';
import { Button } from './Button';
import { LevelNode, MasteryPlate } from './common/GamifiedMap';
import { SolutionSetup } from './SolutionSetup';
import { MarkdownText } from './common/MarkdownText';

interface UnitMapProps {
  problemName: string;
  problemDesc?: string; 
  currentLevel: number; // 0-6
  savedLessons: SavedLesson[];
  onStartLevel: (level: number, isSkip?: boolean, solutionContext?: SolutionStrategy) => void;
  onLoadSaved: (lesson: SavedLesson) => void;
  onBack: () => void;
  language: 'Chinese' | 'English';
  preferences: UserPreferences;
  failedSkips?: Record<string, boolean>; 
  problemContext: LeetCodeContext | null;
  onEnsureContext: (problemName: string) => Promise<void>;
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
        masteryHub: "精通中心",
        strategyBtn: "解题策略",
        strategyDesc: "当前目标解法",
        loadingContext: "AI 正在分析题目详情...",
        problemDesc: "题目详情",
        similar: "相关题目"
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
        masteryHub: "Mastery Hub",
        strategyBtn: "Strategy",
        strategyDesc: "Target Solution",
        loadingContext: "AI is analyzing problem details...",
        problemDesc: "Description",
        similar: "Similar Questions"
    }
};

export const UnitMap: React.FC<UnitMapProps> = ({ 
    problemName, currentLevel, savedLessons, onStartLevel, onLoadSaved, onBack, language, failedSkips, preferences,
    problemContext, onEnsureContext
}) => {
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [showSolutionSetup, setShowSolutionSetup] = useState(false);
  const [activeStrategy, setActiveStrategy] = useState<SolutionStrategy | null>(null);
  const [showDescription, setShowDescription] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const t = LOCALE[language];

  // Initial Data Load
  useEffect(() => {
      const init = async () => {
          if (!problemContext && !isLoading) {
              setIsLoading(true);
              try {
                  await onEnsureContext(problemName);
              } catch(e) {
                  console.error("Context Gen Failed");
              } finally {
                  setIsLoading(false);
              }
          }
      };
      init();
  }, [problemName]);

  // Strategy Load
  useEffect(() => {
      const savedKey = `algolingo_active_strategy_${problemName}_${preferences.targetLanguage}`;
      const saved = localStorage.getItem(savedKey);
      if (saved) {
          try { setActiveStrategy(JSON.parse(saved)); } catch(e) {}
      } else {
          // If no strategy and context is loaded, offer to set one up
          if (currentLevel < 6 && problemContext) setShowSolutionSetup(true);
      }
  }, [problemName, preferences.targetLanguage, problemContext]);

  const handleStrategyConfirm = (strategy: SolutionStrategy) => {
      setActiveStrategy(strategy);
      localStorage.setItem(`algolingo_active_strategy_${problemName}_${preferences.targetLanguage}`, JSON.stringify(strategy));
      setShowSolutionSetup(false);
  };

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
      if (nodeId === 5) {
          if (isLocked) {
              if (!isSkipLocked) {
                  setShowSkipModal(true);
                  return;
              }
          } else {
              onStartLevel(5, false, activeStrategy || undefined);
          }
          return;
      }
      
      if (!isLocked) {
          onStartLevel(nodeId, false, activeStrategy || undefined);
      }
  };

  const confirmSkip = () => {
      setShowSkipModal(false);
      onStartLevel(5, true, activeStrategy || undefined); // true = isSkip
  };

  // --- LOADING STATE ---
  if (!problemContext || isLoading) {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-dark-bg animate-fade-in-up">
              <div className="bg-white dark:bg-dark-card p-8 rounded-3xl shadow-xl flex flex-col items-center text-center max-w-sm w-full mx-4">
                  <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mb-6">
                      <Loader2 size={32} className="text-brand animate-spin" />
                  </div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">{t.loadingContext}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{problemName}</p>
              </div>
          </div>
      );
  }

  const difficultyColor = problemContext.meta.difficulty === 'Easy' ? 'text-green-600 bg-green-100 dark:bg-green-900/30' : 
                          problemContext.meta.difficulty === 'Medium' ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' :
                          'text-red-600 bg-red-100 dark:bg-red-900/30';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-dark-bg relative transition-colors duration-500">
      
      {/* Strategy Selection Modal */}
      {showSolutionSetup && (
          <SolutionSetup 
              problemName={problemName}
              problemDesc={problemContext.problem.description}
              preferences={preferences}
              language={language}
              onConfirm={handleStrategyConfirm}
              onCancel={() => setShowSolutionSetup(false)}
          />
      )}

      {/* Description Sidebar (LeetCode Style) */}
      <div 
        className={`fixed inset-y-0 right-0 w-full md:w-[500px] bg-white dark:bg-[#111] z-[80] shadow-2xl transform transition-transform duration-300 border-l border-gray-200 dark:border-gray-800 flex flex-col ${showDescription ? 'translate-x-0' : 'translate-x-full'}`}
      >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-[#151515]">
              <div className="flex items-center gap-3">
                  <List size={18} className="text-gray-500"/>
                  <h3 className="font-bold text-gray-800 dark:text-white uppercase tracking-wider text-sm">{t.problemDesc}</h3>
              </div>
              <button onClick={() => setShowDescription(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-gray-500">
                  <X size={18}/>
              </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {/* Title & Stats */}
              <div className="mb-6">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">{problemContext.meta.title}</h2>
                  <div className="flex items-center gap-3 text-xs font-bold">
                      <span className={`px-3 py-1 rounded-full ${difficultyColor}`}>
                          {problemContext.meta.difficulty}
                      </span>
                      {/* Fake Tags for Visual Completeness */}
                      <div className="flex gap-2">
                          <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-1 rounded flex items-center gap-1"><Tag size={10}/> Array</span>
                          <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-1 rounded flex items-center gap-1"><Tag size={10}/> HashTable</span>
                      </div>
                  </div>
              </div>

              {/* Main Description Body */}
              <div className="prose dark:prose-invert prose-sm max-w-none text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
                  <MarkdownText content={problemContext.problem.description} />
              </div>

              {/* Examples */}
              <div className="mt-8 space-y-4">
                  {problemContext.problem.examples.map((ex, i) => (
                      <div key={i} className="bg-gray-50 dark:bg-[#1a1a1a] rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                          <div className="bg-gray-100 dark:bg-[#252526] px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
                              Example {i + 1}
                          </div>
                          <div className="p-4 font-mono text-xs md:text-sm space-y-2">
                              <div><span className="text-gray-500 font-bold">Input:</span> <span className="text-gray-800 dark:text-gray-200">{ex.input}</span></div>
                              <div><span className="text-gray-500 font-bold">Output:</span> <span className="text-gray-800 dark:text-gray-200">{ex.output}</span></div>
                              {ex.explanation && (
                                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700 mt-2 text-gray-600 dark:text-gray-400">
                                      <span className="font-bold">Explanation:</span>
                                      <MarkdownText content={ex.explanation} className="mt-1" />
                                  </div>
                              )}
                          </div>
                      </div>
                  ))}
              </div>

              {/* Constraints */}
              <div className="mt-8">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Constraints:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-xs md:text-sm font-mono text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-[#1a1a1a] p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                      {problemContext.problem.constraints.map((c, i) => (
                          <li key={i}>{c}</li>
                      ))}
                  </ul>
              </div>
          </div>
      </div>

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
                <h1 className="text-lg md:text-xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none truncate max-w-[200px] md:max-w-full">{problemContext.meta.title}</h1>
                <p className="text-brand font-bold text-[10px] uppercase tracking-wide mt-0.5">{t.unit}</p>
            </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
             <button
                onClick={() => setShowDescription(true)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-brand hover:bg-brand/10 transition-colors md:hidden"
             >
                 <FileText size={18}/>
             </button>
             <button 
                onClick={() => setShowDescription(!showDescription)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
             >
                 <FileText size={14} />
                 {t.problemDesc}
             </button>

             <button 
                onClick={() => setShowSolutionSetup(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors border border-blue-100 dark:border-blue-900/50"
             >
                 <Crosshair size={14} />
                 <span className="hidden md:inline">{activeStrategy ? activeStrategy.title : t.strategyBtn}</span>
             </button>

             <div className="hidden md:flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                 <Star size={14} className="text-yellow-500 fill-yellow-500"/>
                 <span>{Math.min(currentLevel, 6)}/6 {t.completed}</span>
            </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 pt-8 pb-24 px-4 md:px-16 w-full max-w-5xl mx-auto animate-fade-in-up">
        
        {/* Active Strategy Banner */}
        {activeStrategy && (
            <div className="mb-8 p-4 bg-white dark:bg-dark-card border-l-4 border-blue-500 rounded-r-xl shadow-sm flex justify-between items-center animate-fade-in-down">
                <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{t.strategyDesc}</div>
                    <div className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        {activeStrategy.title}
                        {activeStrategy.tags?.map((tag, i) => (
                            <span key={i} className="text-[9px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded">{tag}</span>
                        ))}
                    </div>
                </div>
                <button onClick={() => setShowSolutionSetup(true)} className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                    <Settings size={18}/>
                </button>
            </div>
        )}

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
                            onLeetCodeClick={() => onStartLevel(6, false, activeStrategy || undefined)}
                            onMasteryLoopClick={() => onStartLevel(5, false, activeStrategy || undefined)}
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
