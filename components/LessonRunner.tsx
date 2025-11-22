
import React, { useState, useRef, useEffect } from 'react';
import { LessonPlan, LessonScreen, Widget, MistakeRecord, UserPreferences } from '../types';
import { Button } from './Button';
import { 
  DialogueWidget, FlipCardWidget, CalloutWidget, InteractiveCodeWidget,
  ParsonsWidget, FillInWidget, QuizWidgetPresenter, StepsWidget
} from './widgets/LessonWidgets';
import { GlobalAiAssistant } from './GlobalAiAssistant';
import { X, CheckCircle, Flame, AlertCircle, MessageSquarePlus, Send, Sparkles, RotateCcw, ArrowRight, ThumbsUp, ThumbsDown, HelpCircle, SkipForward, LogOut, History, Code, Lightbulb, ExternalLink, Clock, Target, FastForward, Zap, Layout as LayoutIcon, PanelRightClose, PanelRightOpen, Globe } from 'lucide-react';
import { generateAiNotification, sendWebhookNotification } from '../services/notificationService';

interface LessonRunnerProps {
  plan: LessonPlan;
  nodeIndex: number; // 0-5 (Normal), 6 (LeetCode)
  onComplete: (stats: { xp: number; streak: number }, shouldSave: boolean, mistakes: MistakeRecord[]) => void;
  onExit: () => void;
  onRegenerate?: () => void; 
  language: 'Chinese' | 'English';
  preferences: UserPreferences;
  isReviewMode?: boolean;
  isSkipContext?: boolean;
}

type ScreenStatus = 'idle' | 'correct' | 'wrong';

const LOCALE = {
    Chinese: {
        incorrect: "错误",
        reviewTips: "请查看上方提示",
        correct: "正确!",
        check: "检查",
        next: "继续",
        continue: "继续",
        tryAgain: "再试一次",
        skip: "跳过",
        completed: "完成",
        askAi: "询问 AI",
        typing: "正在输入...",
        suggestions: "推荐提问:",
        mistakeLabel: "错题重练",
        retry: "再次尝试",
        reviewPhaseTitle: "错题修复",
        reviewPhaseDesc: "让我们攻克刚才做错的题目",
        startReview: "开始修复",
        lessonFeedback: "这节课怎么样？",
        badFeedback: "不好 (重新生成)",
        goodFeedback: "很好",
        exit: "退出",
        stay: "继续学习",
        leaveConfirmTitle: "确定要离开吗？",
        leaveConfirmDesc: "再坚持一下，还有几道题就完成了！现在退出将无法保存本次进度。",
        skipLockedTitle: "跳级挑战失败",
        skipLockedDesc: "错误已超过 2 次限制。跳级功能已锁定。",
        skipLockedAction: "转为练习模式 (不计入跳级)",
        quit: "退出",
        leetcodeExternal: "无法加载？在浏览器中打开",
        practiceMode: "练习模式",
        skipMode: "跳级挑战",
        remainingLives: "剩余机会",
        splitView: "分屏模式",
        fullView: "全屏模式",
        cantLoadIframe: "LeetCode 禁止了嵌入访问。请使用外部链接或尝试右侧的 AI 模拟。",
        openInNewTab: "在新标签页打开 LeetCode"
    },
    English: {
        incorrect: "Incorrect",
        reviewTips: "Review the explanation above",
        correct: "Correct!",
        check: "CHECK",
        next: "NEXT",
        continue: "CONTINUE",
        tryAgain: "TRY AGAIN",
        skip: "SKIP",
        completed: "COMPLETED",
        askAi: "Ask AI",
        typing: "Typing...",
        suggestions: "Suggestions:",
        mistakeLabel: "Review Mode",
        retry: "Try Again",
        reviewPhaseTitle: "Mistake Repair",
        reviewPhaseDesc: "Let's fix the problems you missed.",
        startReview: "Start Repair",
        lessonFeedback: "How was this lesson?",
        badFeedback: "Bad (Regenerate)",
        goodFeedback: "Good",
        exit: "Exit",
        stay: "Keep Learning",
        leaveConfirmTitle: "Are you sure?",
        leaveConfirmDesc: "You're almost there! Exiting now will lose your current progress.",
        skipLockedTitle: "Skip Challenge Failed",
        skipLockedDesc: "You exceeded the 2 mistake limit. Skip is now locked.",
        skipLockedAction: "Continue as Practice",
        quit: "Quit",
        leetcodeExternal: "Can't load? Open in Browser",
        practiceMode: "Practice Mode",
        skipMode: "Skip Challenge",
        remainingLives: "Lives Left",
        splitView: "Split View",
        fullView: "Full View",
        cantLoadIframe: "LeetCode blocked embedding. Use the external link or the AI simulation on the right.",
        openInNewTab: "Open LeetCode in New Tab"
    }
};

// Helper to remove comments
const cleanCodeLine = (line: string) => {
    return line.replace(/\s*#.*$/, '').replace(/\s*\/\/.*$/, '').trim();
};

export const LessonRunner: React.FC<LessonRunnerProps> = ({ plan, nodeIndex, onComplete, onExit, onRegenerate, language, preferences, isReviewMode = false, isSkipContext = false }) => {
  const [screens, setScreens] = useState<LessonScreen[]>(plan.screens || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Skip / Practice Logic
  // isSkipModeVisual implies we show the "Boss/Skip" UI styles
  const [isSkipModeVisual, setIsSkipModeVisual] = useState(isSkipContext); 
  const [isPracticeMode, setIsPracticeMode] = useState(false); 
  const [showSkipLockedModal, setShowSkipLockedModal] = useState(false);

  const [isInMistakeLoop, setIsInMistakeLoop] = useState(false); 
  const [showReviewIntro, setShowReviewIntro] = useState(false); 
  const [showFeedback, setShowFeedback] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  const currentScreen = screens[currentIndex];
  const [status, setStatus] = useState<ScreenStatus>('idle');
  const [streak, setStreak] = useState(0);
  const [xpGained, setXpGained] = useState(0);
  const [sessionMistakes, setSessionMistakes] = useState<MistakeRecord[]>([]);
  
  const [timerSeconds, setTimerSeconds] = useState(0);

  // LeetCode Layout State
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const t = LOCALE[language];

  // Interaction States
  const [quizSelection, setQuizSelection] = useState<number | null>(null);
  const [parsonsOrder, setParsonsOrder] = useState<string[]>([]);
  const [stepsOrder, setStepsOrder] = useState<string[]>([]);
  const [fillInAnswers, setFillInAnswers] = useState<string[]>([]);

  const [widgetResetKey, setWidgetResetKey] = useState(0);

  useEffect(() => {
      const interval = setInterval(() => setTimerSeconds(s => s + 1), 1000);
      return () => clearInterval(interval);
  }, []);

  if (!screens || screens.length === 0) {
      return <div className="p-8 text-center">Error loading lesson. <button onClick={onExit} className="text-brand underline">Exit</button></div>;
  }

  useEffect(() => {
      setStatus('idle');
      resetInteractions();
  }, [currentScreen?.id]);

  const resetInteractions = () => {
      setQuizSelection(null);
      setParsonsOrder([]); 
      setStepsOrder([]);
      setFillInAnswers([]);
      setWidgetResetKey(prev => prev + 1);
  }

  const interactiveWidget = currentScreen?.widgets.find(w => {
      if (w.type === 'quiz') return true;
      if (w.type === 'parsons') return true;
      if (w.type === 'fill-in') return true;
      if (w.type === 'leetcode') return true; 
      if (w.type === 'steps-list' && w.stepsList?.mode === 'interactive') return true;
      if (w.type === 'flipcard' && w.flipcard?.mode === 'assessment') return true;
      return false;
  });

  const handleCheck = (forcedResult?: boolean) => {
      if (!interactiveWidget) {
          handleNext();
          return;
      }

      let isCorrect = forcedResult !== undefined ? forcedResult : false;
      let failureContext = "";

      if (forcedResult === undefined) {
          if (interactiveWidget.type === 'quiz' && interactiveWidget.quiz) {
              isCorrect = quizSelection === interactiveWidget.quiz.correctIndex;
              failureContext = interactiveWidget.quiz.question;
          } else if (interactiveWidget.type === 'parsons') {
              const correctLines = interactiveWidget.parsons?.lines || [];
              const userClean = parsonsOrder.map(cleanCodeLine).filter(l => l.length > 0);
              const correctClean = correctLines.map(cleanCodeLine).filter(l => l.length > 0);
              isCorrect = JSON.stringify(userClean) === JSON.stringify(correctClean);
              failureContext = "Logic ordering";
          } else if (interactiveWidget.type === 'steps-list' && interactiveWidget.stepsList) {
              const correctStr = JSON.stringify(interactiveWidget.stepsList.correctOrder || []);
              isCorrect = interactiveWidget.stepsList.correctOrder ? JSON.stringify(stepsOrder) === correctStr : true;
              failureContext = "Algorithm steps";
          } else if (interactiveWidget.type === 'fill-in' && interactiveWidget.fillIn) {
              const correct = interactiveWidget.fillIn.correctValues;
              if (interactiveWidget.fillIn.inputMode === 'type') {
                  isCorrect = fillInAnswers.every((ans, i) => ans.trim().toLowerCase() === correct[i].trim().toLowerCase());
              } else {
                  isCorrect = JSON.stringify(fillInAnswers) === JSON.stringify(correct);
              }
              failureContext = interactiveWidget.fillIn.code;
          }
      }

      if (isCorrect) {
          setStatus('correct');
          setStreak(s => s + 1);
          setXpGained(x => x + 10);
      } else {
          setStatus('wrong');
          setStreak(0);
          
          const newMistake: MistakeRecord = {
              id: Date.now().toString(),
              problemName: plan.title,
              nodeIndex: nodeIndex, 
              questionType: interactiveWidget.type,
              context: failureContext,
              timestamp: Date.now(),
              widget: interactiveWidget
          };
          // Update Mistakes
          const updatedMistakes = [...sessionMistakes, newMistake];
          setSessionMistakes(updatedMistakes);

          // STRICT SKIP LOGIC: Fail if > 2 mistakes (i.e. on the 3rd mistake)
          if (isSkipModeVisual && !isPracticeMode) {
              // We allow 2 lives (2 mistakes). The 3rd mistake is fatal.
              if (updatedMistakes.length > 2) {
                  setShowSkipLockedModal(true);
              }
          }
      }
  };

  const handleNext = () => {
      if (currentIndex < screens.length - 1) {
          setCurrentIndex(p => p + 1);
      } else {
          if (sessionMistakes.length > 0 && !isInMistakeLoop && !isReviewMode) {
              setShowReviewIntro(true);
          } else {
              setShowFeedback(true);
              // Trigger AI Notification asynchronously
              if (preferences.notificationConfig.enabled) {
                  const updatedStats = { streak: streak, xp: xpGained }; // Partial stat
                  generateAiNotification(updatedStats as any, preferences, 'lesson_complete').then(msg => {
                      sendWebhookNotification(preferences.notificationConfig, msg);
                  });
              }
          }
      }
  };

  const handleTryAgain = () => {
      setStatus('idle');
      resetInteractions();
  };

  const convertToPractice = () => {
      setIsPracticeMode(true);
      setShowSkipLockedModal(false);
  }

  const handleFeedback = (good: boolean) => {
      if (good) {
          onComplete({ xp: xpGained, streak }, true, sessionMistakes);
      } else {
          if (onRegenerate) onRegenerate(); 
          else onExit();
      }
  }

  const formatTime = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  const handleExitClick = () => {
      if (showFeedback) {
          onExit();
      } else {
          setShowExitConfirm(true);
      }
  };

  if (!currentScreen) return null;

  const progressPercent = ((currentIndex + 1) / screens.length) * 100;
  const showSkipUI = isSkipModeVisual && !isPracticeMode;
  
  // Determine LeetCode Layout
  const isLeetCodeMode = currentScreen.widgets.some(w => w.type === 'leetcode');

  // Remaining lives calculation for UI display (Start with 3 lives: 0,1,2 allowed mistakes? No, usually 3 hearts = 3 lives. Mistake 1 -> 2 hearts. Mistake 2 -> 1 heart. Mistake 3 -> 0 hearts (Fail).
  // So lives = 3 - mistakes.
  const remainingLives = Math.max(0, 3 - sessionMistakes.length);

  return (
    <div className={`fixed inset-0 z-[60] bg-white dark:bg-dark-bg flex flex-col md:relative md:z-0 md:inset-auto md:h-[calc(100vh-6rem)] ${isLeetCodeMode ? 'md:w-full md:max-w-full' : 'md:max-w-4xl'} mx-auto md:rounded-3xl md:overflow-hidden md:border border-gray-200 dark:border-gray-700 shadow-2xl transition-all`}>
      
      {/* GLOBAL AI ASSISTANT */}
      <GlobalAiAssistant 
        problemName={plan.title} 
        preferences={preferences} 
        language={language}
      />

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
           <div className="absolute inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="bg-white dark:bg-dark-card rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl border-2 border-gray-200 dark:border-gray-700 animate-scale-in">
                  <div className="mb-4 bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                        <LogOut className="text-gray-500 dark:text-gray-400" size={32} />
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-800 dark:text-white mb-2">{t.leaveConfirmTitle}</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">{t.leaveConfirmDesc}</p>
                  <div className="flex flex-col gap-3">
                      <Button variant="primary" onClick={() => setShowExitConfirm(false)} className="w-full">{t.stay}</Button>
                      <button onClick={onExit} className="text-gray-400 text-sm font-bold hover:text-gray-600 py-2">{t.quit}</button>
                  </div>
              </div>
           </div>
       )}

       {showSkipLockedModal && (
          <div className="absolute inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="bg-white dark:bg-dark-card rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl border-2 border-red-100 dark:border-red-900/50 animate-scale-in">
                  <div className="mb-4 bg-red-100 dark:bg-red-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="text-red-500" size={32} />
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-800 dark:text-white mb-2">{t.skipLockedTitle}</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">{t.skipLockedDesc}</p>
                  <div className="flex flex-col gap-3">
                      <Button variant="primary" onClick={convertToPractice} className="w-full">{t.skipLockedAction}</Button>
                      <button onClick={onExit} className="text-gray-400 text-sm font-bold hover:text-gray-600 py-2">{t.quit}</button>
                  </div>
              </div>
          </div>
      )}

      {showReviewIntro && (
          <div className="absolute inset-0 z-[70] bg-white dark:bg-dark-bg flex flex-col items-center justify-center p-8 text-center">
              <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-full shadow-lg mb-6">
                  <RotateCcw size={48} className="text-orange-500" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white mb-2">{t.reviewPhaseTitle}</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs">{t.reviewPhaseDesc}</p>
              <Button onClick={() => {
                  const uniqueMistakes = sessionMistakes.filter((m, i, self) => i === self.findIndex(t => t.widget?.id === m.widget?.id));
                  const reviewScreens: LessonScreen[] = uniqueMistakes.map((m, i) => ({
                      id: `review_${i}`,
                      header: `${t.mistakeLabel} ${i + 1}/${uniqueMistakes.length}`,
                      widgets: [m.widget!],
                      isRetry: true
                  }));
                  setScreens(reviewScreens);
                  setCurrentIndex(0);
                  setIsInMistakeLoop(true);
                  setShowReviewIntro(false);
                  setStatus('idle');
              }} variant="primary" className="w-full max-w-xs flex items-center justify-center gap-2">
                  {t.startReview} <ArrowRight size={20}/>
              </Button>
          </div>
      )}

      {showFeedback && (
           <div className="absolute inset-0 z-[70] bg-brand-bg dark:bg-brand/5 flex flex-col items-center justify-center p-8 text-center animate-fade-in-up">
              <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white mb-8">{t.lessonFeedback}</h2>
              <div className="flex gap-4 w-full max-w-sm">
                   <button onClick={() => handleFeedback(false)} className="flex-1 p-6 bg-white dark:bg-dark-card border-2 border-red-100 dark:border-red-900/30 rounded-2xl hover:bg-red-50 transition-all group">
                       <ThumbsDown size={32} className="text-red-400 mb-2 mx-auto group-hover:scale-110 transition-transform"/>
                       <span className="text-xs font-bold text-red-400 uppercase">{t.badFeedback}</span>
                   </button>
                   <button onClick={() => handleFeedback(true)} className="flex-1 p-6 bg-white dark:bg-dark-card border-2 border-green-100 dark:border-green-900/30 rounded-2xl hover:bg-green-50 transition-all group">
                       <ThumbsUp size={32} className="text-green-500 mb-2 mx-auto group-hover:scale-110 transition-transform"/>
                       <span className="text-xs font-bold text-green-500 uppercase">{t.goodFeedback}</span>
                   </button>
              </div>
          </div>
      )}

      {/* HEADER */}
      <div className="h-16 px-6 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0 z-10">
          <div className="w-20 flex items-center gap-2 text-gray-400 font-mono font-bold text-sm">
              <Clock size={16}/>
              {formatTime(timerSeconds)}
          </div>

          <div className="flex-1 flex flex-col items-center max-w-xs mx-auto">
               <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-1">
                   <div className={`h-full transition-all duration-500 ${showSkipUI ? 'bg-orange-500' : 'bg-brand'}`} style={{ width: `${progressPercent}%` }} />
               </div>
               <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1">
                   {isSkipModeVisual ? (isPracticeMode ? t.practiceMode : t.skipMode) : currentScreen.header || "Lesson"}
                   {showSkipUI && <FastForward size={10} className="text-orange-500" />}
               </div>
          </div>

          <div className="w-20 flex items-center justify-end gap-3">
               {showSkipUI && (
                   <div className="flex items-center gap-1 text-red-500 font-bold text-sm" title={t.remainingLives}>
                       <Zap size={16} className="fill-current"/>
                       {remainingLives}
                   </div>
               )}
               
               {!showSkipUI && (
                   <div className="flex items-center gap-1 text-orange-500 font-bold text-sm">
                       <Flame size={16} className={`${streak > 0 ? 'fill-current animate-pulse-soft' : ''}`}/>
                       {streak}
                   </div>
               )}
               <button onClick={handleExitClick} className="text-gray-300 hover:text-gray-500 transition-colors"><X size={20} /></button>
          </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-hidden relative flex flex-col bg-gray-50/30 dark:bg-dark-bg/30">
          
          {/* SPLIT LAYOUT FOR LEETCODE MODE */}
          {isLeetCodeMode && currentScreen.widgets[0]?.leetcode ? (
              <div className="flex h-full">
                  {/* Left Side: Iframe / Fallback (75%) */}
                  <div className={`${sidebarOpen ? 'w-full md:w-3/4' : 'w-full'} h-full border-r border-gray-200 dark:border-gray-700 relative bg-white dark:bg-dark-card transition-all duration-300`}>
                      
                      {/* Iframe Overlay/Fallback for X-Frame-Options Issues */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-0">
                          <Globe size={48} className="text-gray-300 mb-4"/>
                          <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300 mb-2">{t.cantLoadIframe}</h3>
                          <a 
                                href={`https://leetcode.cn/problems/${currentScreen.widgets[0].leetcode.problemSlug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-brand text-white rounded-lg font-bold shadow hover:bg-brand-dark transition-colors flex items-center gap-2"
                          >
                                <ExternalLink size={16} /> {t.openInNewTab}
                          </a>
                      </div>
                      
                      {/* Actual Iframe (Might be blocked by browser, but requested by user) */}
                      <iframe 
                          src={`https://leetcode.cn/problems/${currentScreen.widgets[0].leetcode.problemSlug}`}
                          className="w-full h-full relative z-10 bg-transparent"
                          title="LeetCode Problem"
                          // If blocked, the user sees the fallback above through transparency or failure
                          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                      />
                      
                      <button 
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="absolute top-4 right-4 z-20 p-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-600 rounded-full shadow-md text-gray-500 hover:text-brand"
                      >
                          {sidebarOpen ? <PanelRightClose size={20}/> : <PanelRightOpen size={20}/>}
                      </button>
                  </div>

                  {/* Right Side: Collapsible Sidebar (25%) */}
                  <div className={`${sidebarOpen ? 'hidden md:flex md:w-1/4' : 'hidden'} h-full flex-col border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-bg overflow-y-auto custom-scrollbar transition-all duration-300`}>
                       <div className="p-4 space-y-6">
                           <div className="flex items-center gap-2 text-brand font-bold uppercase tracking-wider text-xs mb-2">
                               <Lightbulb size={14}/> AI Concept Card
                           </div>
                           {/* Concept Card */}
                           <FlipCardWidget widget={{
                                ...currentScreen.widgets[0],
                                id: currentScreen.widgets[0].id + '_concept',
                                type: 'flipcard',
                                flipcard: {
                                    front: currentScreen.widgets[0].leetcode.concept.front,
                                    back: currentScreen.widgets[0].leetcode.concept.back,
                                    mode: 'learn'
                                }
                           }} />

                           <div className="flex items-center gap-2 text-brand font-bold uppercase tracking-wider text-xs mb-2">
                               <Code size={14}/> Solution Code
                           </div>
                           {/* Code */}
                           <InteractiveCodeWidget widget={currentScreen.widgets[0]} />
                       </div>
                  </div>
              </div>
          ) : (
              /* STANDARD SINGLE COLUMN LAYOUT */
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-32 md:pb-32 w-full">
                    <div className="mx-auto max-w-2xl transition-all duration-300">
                        {currentScreen.isRetry && (
                            <div className="bg-orange-50 dark:bg-orange-900/10 border-l-4 border-orange-400 p-4 mb-6 rounded-r-xl shadow-sm flex items-start gap-3 animate-fade-in-down">
                                <RotateCcw className="text-orange-500 shrink-0 mt-1" size={20} />
                                <div>
                                    <h3 className="text-orange-800 dark:text-orange-400 font-bold text-sm uppercase tracking-wide">{t.mistakeLabel}</h3>
                                    <p className="text-orange-700 dark:text-orange-500/80 text-sm mt-1">Let's review this concept again.</p>
                                </div>
                            </div>
                        )}
                        
                        {currentScreen.widgets.length === 0 ? (
                             <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                 <AlertCircle size={48} className="mb-4 opacity-50"/>
                                 <p className="text-sm font-bold">{language === 'Chinese' ? "内容加载失败" : "Content failed to load"}</p>
                                 <p className="text-xs mt-2">Slide is empty.</p>
                             </div>
                        ) : (
                            currentScreen.widgets.map((widget, idx) => (
                                <div key={widget.id + idx + widgetResetKey} className={`animate-fade-in-up delay-${Math.min(idx * 100, 400)} mb-6`}>
                                    {widget.type === 'dialogue' && <DialogueWidget widget={widget} />}
                                    {widget.type === 'callout' && <CalloutWidget widget={widget} />}
                                    {widget.type === 'interactive-code' && <InteractiveCodeWidget widget={widget} />}
                                    {widget.type === 'steps-list' && <StepsWidget widget={widget} onUpdateOrder={widget.stepsList?.mode === 'interactive' ? setStepsOrder : undefined} />}
                                    {widget.type === 'flipcard' && <FlipCardWidget widget={widget} onAssessment={(result) => status === 'idle' && handleCheck(result === 'remembered')} />}
                                    {widget.type === 'quiz' && <QuizWidgetPresenter widget={widget} selectedIdx={quizSelection} onSelect={setQuizSelection} status={status} />}
                                    {widget.type === 'parsons' && <ParsonsWidget widget={widget} onUpdateOrder={setParsonsOrder} status={status} />}
                                    {widget.type === 'fill-in' && <FillInWidget widget={widget} onUpdateAnswers={setFillInAnswers} />}
                                </div>
                            ))
                        )}
                    </div>
               </div>
          )}
      </div>

      {/* Footer */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 z-[50] border-t transition-all duration-500 ease-out 
            ${status === 'idle' 
                ? 'bg-white dark:bg-dark-card border-gray-100 dark:border-gray-800' 
                : status === 'correct' 
                    ? 'bg-green-50/95 dark:bg-green-900/90 backdrop-blur-md border-green-200 dark:border-green-800 animate-slide-in-bottom' 
                    : 'bg-red-50/95 dark:bg-red-900/90 backdrop-blur-md border-red-200 dark:border-red-800 animate-slide-in-bottom'
            }`}>
            <div className={`${isLeetCodeMode ? 'w-full px-4' : 'max-w-2xl mx-auto'} flex items-center justify-between gap-4`}>
                {status === 'wrong' && (
                    <div className="flex items-center gap-3 text-red-600 dark:text-red-200 overflow-hidden">
                        <div className="bg-red-100 dark:bg-red-800/50 p-2 rounded-full shrink-0"><AlertCircle size={24}/></div>
                        <div className="min-w-0">
                            <div className="font-extrabold text-lg leading-none mb-1">{t.incorrect}</div>
                            <div className="text-xs opacity-90 font-medium truncate text-red-700 dark:text-red-300">
                                {interactiveWidget?.type === 'fill-in' && interactiveWidget.fillIn 
                                    ? `Solution: ${interactiveWidget.fillIn.correctValues.join(' ')}` 
                                    : (interactiveWidget?.type === 'quiz' && interactiveWidget.quiz?.explanation 
                                        ? interactiveWidget.quiz.explanation 
                                        : t.reviewTips)
                                }
                            </div>
                        </div>
                    </div>
                )}
                {status === 'correct' && (
                    <div className="flex items-center gap-3 text-green-600 dark:text-green-300">
                        <div className="bg-green-100 dark:bg-green-800/50 p-2 rounded-full"><CheckCircle size={24}/></div>
                        <div className="font-extrabold text-lg">{t.correct}</div>
                    </div>
                )}
                {status === 'idle' && <div className="flex-1"></div>}
                
                <div className="flex gap-3 ml-auto">
                    {!(interactiveWidget?.type === 'flipcard' && interactiveWidget.flipcard?.mode === 'assessment') && (
                        <Button 
                            onClick={() => {
                                if (status === 'idle') {
                                    // If no widgets, just skip
                                    if (currentScreen.widgets.length === 0) {
                                        handleNext();
                                    } else {
                                        interactiveWidget ? handleCheck() : handleNext();
                                    }
                                } else if (status === 'wrong' && isInMistakeLoop) {
                                    handleTryAgain();
                                } else {
                                    handleNext();
                                }
                            }}
                            variant={status === 'wrong' ? 'secondary' : 'primary'}
                            className="w-32 md:w-40 shadow-lg"
                        >
                            {status === 'idle' 
                                ? (interactiveWidget ? t.check : t.next) 
                                : (status === 'wrong' && isInMistakeLoop ? t.tryAgain : t.continue)
                            }
                        </Button>
                    )}
                </div>
                
                {(interactiveWidget?.type === 'flipcard' && interactiveWidget.flipcard?.mode === 'assessment') && status !== 'idle' && (
                    <Button 
                        onClick={handleNext}
                        variant={status === 'wrong' ? 'secondary' : 'primary'}
                        className={`w-32 md:w-40 shadow-lg ml-auto`}
                    >
                        {t.continue}
                    </Button>
                )}
            </div>
      </div>

    </div>
  );
};
