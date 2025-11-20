
import React, { useState, useRef, useEffect } from 'react';
import { LessonPlan, LessonScreen, Widget, MistakeRecord, UserPreferences } from '../types';
import { Button } from './Button';
import { 
  DialogueWidget, FlipCardWidget, CalloutWidget, InteractiveCodeWidget,
  ParsonsWidget, FillInWidget, QuizWidgetPresenter, CodeEditorWidget, StepsWidget
} from './widgets/LessonWidgets';
import { X, CheckCircle, Flame, AlertCircle, MessageSquarePlus, Send, Sparkles, RotateCcw, ArrowRight, ThumbsUp, ThumbsDown, HelpCircle, SkipForward, LogOut, History } from 'lucide-react';
import { generateAiAssistance } from '../services/geminiService';
import { GEMINI_MODELS } from '../constants';

interface LessonRunnerProps {
  plan: LessonPlan;
  nodeIndex: number; // New prop to track phase
  onComplete: (stats: { xp: number; streak: number }, shouldSave: boolean, mistakes: MistakeRecord[]) => void;
  onExit: () => void;
  onRegenerate?: () => void; // New: Regen callback
  language: 'Chinese' | 'English';
  preferences: UserPreferences;
  isReviewMode?: boolean;
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
        skipConfirmTitle: "确定要跳过吗？",
        skipConfirmDesc: "建议询问 AI 助手帮助理解，直接跳过将无法巩固知识点。",
        skipChallengeFail: "错误太多 (>2)。挑战失败。"
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
        skipConfirmTitle: "Skip this problem?",
        skipConfirmDesc: "We recommend asking the AI for help. Skipping might affect your mastery.",
        skipChallengeFail: "Too many errors (>2). Challenge failed."
    }
};

// Helper to remove comments for comparison
const cleanCodeLine = (line: string) => {
    return line.replace(/\s*#.*$/, '').replace(/\s*\/\/.*$/, '').trim();
};

const stripMarkdown = (text: string) => text ? text.replace(/\*\*/g, '') : '';

export const LessonRunner: React.FC<LessonRunnerProps> = ({ plan, nodeIndex, onComplete, onExit, onRegenerate, language, preferences, isReviewMode = false }) => {
  // Lesson State
  const [screens, setScreens] = useState<LessonScreen[]>(plan.screens || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInMistakeLoop, setIsInMistakeLoop] = useState(false); // Local review loop
  const [showReviewIntro, setShowReviewIntro] = useState(false); 
  const [showFeedback, setShowFeedback] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  
  const currentScreen = screens[currentIndex];
  
  const [status, setStatus] = useState<ScreenStatus>('idle');
  const [streak, setStreak] = useState(0);
  const [xpGained, setXpGained] = useState(0);
  const [sessionMistakes, setSessionMistakes] = useState<MistakeRecord[]>([]);
  
  const t = LOCALE[language];

  // Interaction States
  const [quizSelection, setQuizSelection] = useState<number | null>(null);
  const [parsonsOrder, setParsonsOrder] = useState<string[]>([]);
  const [stepsOrder, setStepsOrder] = useState<string[]>([]);
  const [fillInAnswers, setFillInAnswers] = useState<string[]>([]);
  const [codeEditorStatus, setCodeEditorStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');

  // Chat State
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatModel, setChatModel] = useState<string>(preferences.apiConfig.gemini.model || 'gemini-2.5-flash');

  // Reset Key used to force re-render widgets on "Try Again"
  const [widgetResetKey, setWidgetResetKey] = useState(0);

  if (!screens || screens.length === 0) {
      return <div className="p-8 text-center">Error loading lesson. <button onClick={onExit} className="text-brand underline">Exit</button></div>;
  }

  useEffect(() => {
      setStatus('idle');
      resetInteractions();
      setChatMessages([]); 
  }, [currentScreen?.id]);

  const resetInteractions = () => {
      setQuizSelection(null);
      setParsonsOrder([]); // Widget will re-shuffle via key
      setStepsOrder([]);
      setFillInAnswers([]);
      setCodeEditorStatus('idle');
      setWidgetResetKey(prev => prev + 1);
  }

  // --- ROBUST INTERACTIVE CHECK ---
  const interactiveWidget = currentScreen?.widgets.find(w => {
      if (w.type === 'quiz') return true;
      if (w.type === 'parsons') return true;
      if (w.type === 'fill-in') return true;
      if (w.type === 'code-editor') return true;
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
              // Clean comments for robust comparison
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
                  // Fuzzy match case insensitive
                  isCorrect = fillInAnswers.every((ans, i) => ans.trim().toLowerCase() === correct[i].trim().toLowerCase());
              } else {
                  isCorrect = JSON.stringify(fillInAnswers) === JSON.stringify(correct);
              }
              failureContext = interactiveWidget.fillIn.code;
          } else if (interactiveWidget.type === 'code-editor') {
              isCorrect = codeEditorStatus === 'success';
              failureContext = "Coding implementation";
          }
      }

      if (isCorrect) {
          setStatus('correct');
          setStreak(s => s + 1);
          setXpGained(x => x + 10);
      } else {
          setStatus('wrong');
          setStreak(0);
          
          // Record Mistake if first time wrong
          const newMistake: MistakeRecord = {
              id: Date.now().toString(),
              problemName: plan.title,
              nodeIndex: nodeIndex, // Track phase
              questionType: interactiveWidget.type,
              context: failureContext,
              timestamp: Date.now(),
              widget: interactiveWidget // Capture FULL widget state for faithful replay
          };
          setSessionMistakes(p => [...p, newMistake]);
      }
  };

  const handleNext = () => {
      if (currentIndex < screens.length - 1) {
          setCurrentIndex(p => p + 1);
      } else {
          // End of Lesson
          // If in Skip Challenge mode, skip review intro and go straight to feedback/complete
          if (plan.isSkipChallenge || (sessionMistakes.length === 0) || isInMistakeLoop || isReviewMode) {
              setShowFeedback(true);
          } else {
              setShowReviewIntro(true);
          }
      }
  };

  const handleTryAgain = () => {
      setStatus('idle');
      resetInteractions();
      // Don't advance index, user must solve it
  };

  const handleSkipConfirm = () => {
      setShowSkipModal(false);
      handleNext();
  };

  const handleFeedback = (good: boolean) => {
      if (good) {
          onComplete({ xp: xpGained, streak }, true, sessionMistakes);
      } else {
          if (onRegenerate) {
              onRegenerate(); // Trigger Regen
          } else {
              onExit();
          }
      }
  }

  const startReviewPhase = () => {
      // Deduplicate mistakes based on Widget ID so we don't ask the same question multiple times
      const uniqueIds = new Set();
      const uniqueMistakes = sessionMistakes.filter(m => {
          if (!m.widget || uniqueIds.has(m.widget.id)) return false;
          uniqueIds.add(m.widget.id);
          return true;
      });

      if (uniqueMistakes.length === 0) {
          setShowFeedback(true);
          return;
      }

      const reviewScreens: LessonScreen[] = uniqueMistakes.map((m, i) => ({
          id: `review_mistake_${m.widget!.id}_${i}`, // Unique ID triggers resetInteractions
          header: `${t.mistakeLabel} ${i + 1}/${uniqueMistakes.length}`,
          widgets: [m.widget!],
          isRetry: true
      }));

      setScreens(reviewScreens);
      setCurrentIndex(0);
      setIsInMistakeLoop(true);
      setShowReviewIntro(false);
      setStatus('idle');
  };

  const handleChatSubmit = async (msg?: string) => {
      const userMsg = msg || chatInput;
      if (!userMsg.trim()) return;
      
      setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
      setChatInput('');
      setIsChatLoading(true);

      const context = currentScreen.widgets.map(w => {
          if (w.dialogue) return `Dialogue: ${w.dialogue.text}`;
          if (w.code) return `Code: ${w.code.content}`;
          if (w.quiz) return `Quiz Question: ${w.quiz.question}`;
          if (w.interactiveCode) return `Code Lines: ${w.interactiveCode.lines.map(l => l.code).join('\n')}`;
          return '';
      }).join('\n---\n');

      const aiResponse = await generateAiAssistance(context, userMsg, preferences, chatModel);
      setChatMessages(prev => [...prev, { role: 'ai', text: aiResponse || "Sorry, I couldn't help." }]);
      setIsChatLoading(false);
  }

  // Intercept Exit
  const handleExitClick = () => {
      setShowExitModal(true);
  }

  // --- Modals ---
  if (showReviewIntro) {
      return (
          <div className="fixed inset-0 z-[60] bg-orange-50 dark:bg-orange-900/20 flex flex-col items-center justify-center p-8 text-center md:relative md:z-0 md:inset-auto md:h-full md:rounded-3xl">
              <div className="bg-white dark:bg-dark-card p-6 rounded-full shadow-lg mb-6">
                  <RotateCcw size={48} className="text-orange-500" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white mb-2">{t.reviewPhaseTitle}</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs">{t.reviewPhaseDesc}</p>
              <div className="flex flex-col gap-2 w-full max-w-xs">
                <div className="text-xs text-center text-orange-600 mb-2 font-bold bg-orange-100 py-1 rounded-full">
                    {sessionMistakes.length} {t.incorrect}
                </div>
                <Button onClick={startReviewPhase} variant="primary" className="w-full flex items-center justify-center gap-2">
                    {t.startReview} <ArrowRight size={20}/>
                </Button>
              </div>
          </div>
      );
  }

  if (showFeedback) {
      return (
          <div className="fixed inset-0 z-[60] bg-brand-bg dark:bg-brand/5 flex flex-col items-center justify-center p-8 text-center animate-fade-in-up md:relative md:z-0 md:inset-auto md:h-full md:rounded-3xl">
              <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white mb-8">{t.lessonFeedback}</h2>
              <div className="flex gap-4 w-full max-w-sm">
                   <button 
                        onClick={() => handleFeedback(false)}
                        className="flex-1 p-6 bg-white dark:bg-dark-card border-2 border-red-100 dark:border-red-900/30 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/10 hover:border-red-200 transition-all group"
                   >
                       <ThumbsDown size={32} className="text-red-400 mb-2 mx-auto group-hover:scale-110 transition-transform"/>
                       <span className="text-xs font-bold text-red-400 uppercase">{t.badFeedback}</span>
                   </button>
                   <button 
                        onClick={() => handleFeedback(true)}
                        className="flex-1 p-6 bg-white dark:bg-dark-card border-2 border-green-100 dark:border-green-900/30 rounded-2xl hover:bg-green-50 dark:hover:bg-green-900/10 hover:border-green-200 transition-all group"
                   >
                       <ThumbsUp size={32} className="text-green-500 mb-2 mx-auto group-hover:scale-110 transition-transform"/>
                       <span className="text-xs font-bold text-green-500 uppercase">{t.goodFeedback}</span>
                   </button>
              </div>
          </div>
      )
  }

  if (!currentScreen) return null;

  const progress = ((currentIndex + 1) / screens.length) * 100;
  const isReviewing = isReviewMode || isInMistakeLoop;

  return (
    // Full Screen Override on Mobile using fixed inset-0 z-[60]
    <div className="fixed inset-0 z-[60] bg-white dark:bg-dark-bg flex flex-col md:relative md:z-0 md:inset-auto md:h-[calc(100vh-6rem)] md:rounded-3xl md:overflow-hidden md:border border-gray-200 dark:border-gray-700 shadow-2xl max-w-4xl mx-auto">
      
      {/* Exit Modal */}
      {showExitModal && (
          <div className="absolute inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="bg-white dark:bg-dark-card rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl border-2 border-gray-100 dark:border-gray-700 animate-scale-in">
                  <div className="mb-4 bg-red-100 dark:bg-red-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                        <LogOut className="text-red-500" size={32} />
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-800 dark:text-white mb-2">{t.leaveConfirmTitle}</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">{t.leaveConfirmDesc}</p>
                  <div className="flex flex-col gap-3">
                      <Button variant="primary" onClick={() => setShowExitModal(false)}>{t.stay}</Button>
                      <button onClick={onExit} className="text-gray-400 text-sm font-bold hover:text-gray-600 py-2">{t.exit}</button>
                  </div>
              </div>
          </div>
      )}

       {/* Skip Question Modal */}
       {showSkipModal && (
          <div className="absolute inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="bg-white dark:bg-dark-card rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl border-2 border-gray-100 dark:border-gray-700 animate-scale-in">
                  <div className="mb-4 bg-orange-100 dark:bg-orange-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                        <HelpCircle className="text-orange-500" size={32} />
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-800 dark:text-white mb-2">{t.skipConfirmTitle}</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">{t.skipConfirmDesc}</p>
                  <div className="flex flex-col gap-3">
                      <Button variant="secondary" onClick={() => { setShowSkipModal(false); setShowChat(true); }} icon={<Sparkles size={16}/>}>{t.askAi}</Button>
                      <button onClick={handleSkipConfirm} className="text-gray-400 text-sm font-bold hover:text-gray-600 py-2">{t.skip}</button>
                      <button onClick={() => setShowSkipModal(false)} className="text-brand text-sm font-bold py-2">Cancel</button>
                  </div>
              </div>
          </div>
      )}


      {/* Header */}
      <div className={`px-6 py-4 backdrop-blur-sm flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 z-10 sticky top-0 ${isReviewing ? 'bg-orange-50/80 dark:bg-orange-900/20' : 'bg-white/80 dark:bg-dark-bg/80'}`}>
        <button onClick={handleExitClick} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><X size={24} /></button>
        <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden relative">
            <div className={`absolute h-full transition-all duration-700 ease-out rounded-full ${isReviewing ? 'bg-orange-500' : 'bg-brand'}`} style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center text-orange-500 font-bold gap-1">
            <Flame size={20} className={`fill-current ${streak > 0 ? 'animate-pulse-soft' : ''}`}/> {streak}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-32 md:pb-40 custom-scrollbar bg-gray-50/50 dark:bg-dark-bg">
          <div className="max-w-2xl mx-auto space-y-2">
              
              {/* Screen Header */}
              <div className="mb-6 text-center">
                 {isReviewing && <div className="inline-block px-3 py-1 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-full text-xs font-bold uppercase tracking-wider mb-2">{t.mistakeLabel}</div>}
                 {plan.isSkipChallenge && <div className="inline-block px-3 py-1 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full text-xs font-bold uppercase tracking-wider mb-2 animate-pulse">SKIP CHALLENGE</div>}
                 {currentScreen.header && <h3 className="text-sm font-bold text-brand uppercase tracking-widest mb-1">{currentScreen.header}</h3>}
                 {currentIndex === 0 && !isReviewing && <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white">{stripMarkdown(plan.title)}</h2>}
              </div>
              
              {/* Local Replay Indicator */}
              {plan.isLocalReplay && (
                   <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-xl mb-6 flex items-center justify-center gap-2 text-gray-500 text-xs font-bold uppercase">
                       <History size={14}/> Local Replay • No AI
                   </div>
              )}

              {currentScreen.isRetry && (
                  <div className="bg-orange-50 dark:bg-orange-900/10 border-l-4 border-orange-400 p-4 mb-6 rounded-r-xl shadow-sm flex items-start gap-3 animate-fade-in-down">
                      <RotateCcw className="text-orange-500 shrink-0 mt-1" size={20} />
                      <div>
                        <h3 className="text-orange-800 dark:text-orange-400 font-bold text-sm uppercase tracking-wide">{t.mistakeLabel}</h3>
                        <p className="text-orange-700 dark:text-orange-500/80 text-sm mt-1">Let's review this concept again.</p>
                      </div>
                  </div>
              )}

              {currentScreen.widgets.map((widget, idx) => {
                  if (widget.type === 'flipcard' && (!widget.flipcard || !widget.flipcard.front)) return null;
                  
                  return (
                    <div key={widget.id + idx + widgetResetKey} className={`animate-fade-in-up delay-${Math.min(idx * 100, 400)}`}>
                        {widget.type === 'dialogue' && <DialogueWidget widget={widget} />}
                        {widget.type === 'flipcard' && (
                            <FlipCardWidget 
                                widget={widget} 
                                onAssessment={(result) => status === 'idle' && handleCheck(result === 'remembered')}
                            />
                        )}
                        {widget.type === 'callout' && <CalloutWidget widget={widget} />}
                        {widget.type === 'interactive-code' && <InteractiveCodeWidget widget={widget} />}
                        {widget.type === 'steps-list' && <StepsWidget widget={widget} onUpdateOrder={setStepsOrder} />}
                        
                        {/* Interactive Widgets */}
                        {widget.type === 'quiz' && (
                            <QuizWidgetPresenter 
                                widget={widget} 
                                selectedIdx={quizSelection} 
                                onSelect={setQuizSelection} 
                                status={status} 
                            />
                        )}
                        {widget.type === 'parsons' && (
                            <ParsonsWidget 
                                widget={widget} 
                                onUpdateOrder={setParsonsOrder} 
                                status={status} 
                            />
                        )}
                        {widget.type === 'fill-in' && (
                            <FillInWidget widget={widget} onUpdateAnswers={setFillInAnswers} />
                        )}
                        {widget.type === 'code-editor' && (
                            <CodeEditorWidget widget={widget} onUpdateStatus={setCodeEditorStatus} preferences={preferences} />
                        )}
                    </div>
                )
              })}
          </div>
      </div>

      {/* Chat */}
      {showChat && (
          <div className="absolute bottom-28 right-6 w-80 md:w-96 bg-white/95 dark:bg-dark-card/95 backdrop-blur-md rounded-2xl shadow-glass border border-white/20 dark:border-gray-700 flex flex-col overflow-hidden animate-scale-in z-30 max-h-[500px]">
              <div className="bg-gradient-to-r from-brand to-brand-light text-white p-3 font-bold text-sm flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-2">
                      <Sparkles size={14}/> 
                      <span>{t.askAi}</span>
                  </div>
                  <div className="flex items-center gap-2">
                     {/* Independent Model Selector */}
                     <select 
                        className="bg-white/20 text-white border-none rounded px-2 py-0.5 text-xs font-mono outline-none cursor-pointer hover:bg-white/30"
                        value={chatModel}
                        onChange={(e) => setChatModel(e.target.value)}
                     >
                         {GEMINI_MODELS.map(m => <option key={m} value={m} className="text-black">{m}</option>)}
                     </select>
                     <button onClick={() => setShowChat(false)} className="hover:bg-white/20 rounded-full p-1 transition-colors"><X size={16}/></button>
                  </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-transparent h-64 custom-scrollbar">
                  {chatMessages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center px-4">
                          <HelpCircle size={32} className="mb-2 opacity-20" />
                          <p className="text-xs">Ask me anything about the current code or concept.</p>
                      </div>
                  )}
                  {chatMessages.map((m, i) => (
                      <div key={i} className={`p-3 rounded-2xl text-xs max-w-[85%] shadow-sm leading-relaxed ${m.role === 'user' ? 'bg-brand text-white ml-auto rounded-tr-none' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 mr-auto rounded-tl-none'}`}>
                          {m.text}
                      </div>
                  ))}
                  {isChatLoading && <div className="text-xs text-gray-400 italic ml-2 animate-pulse">{t.typing}</div>}
              </div>

              {/* Suggested Questions Chips */}
              {plan.suggestedQuestions && plan.suggestedQuestions.length > 0 && (
                  <div className="px-3 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
                      {plan.suggestedQuestions.map((q, i) => (
                          <button 
                             key={i} 
                             onClick={() => handleChatSubmit(q)}
                             className="whitespace-nowrap bg-brand-bg dark:bg-brand/10 border border-brand/20 text-brand text-[10px] font-bold px-3 py-1.5 rounded-full hover:bg-brand/10 dark:hover:bg-brand/20 transition-colors active:scale-95"
                          >
                              {q}
                          </button>
                      ))}
                  </div>
              )}

              <div className="p-2 border-t border-gray-100 dark:border-gray-700 flex gap-2 bg-white dark:bg-dark-card">
                  <input 
                    className="flex-1 text-xs bg-gray-50 dark:bg-gray-800 border-0 rounded-xl px-3 py-2 focus:ring-2 focus:ring-brand/50 outline-none transition-shadow dark:text-white" 
                    placeholder="Type your question..."
                    value={chatInput} 
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleChatSubmit()}
                  />
                  <button onClick={() => handleChatSubmit()} className="p-2 text-brand hover:bg-brand-bg dark:hover:bg-brand/10 rounded-xl transition-colors"><Send size={18}/></button>
              </div>
          </div>
      )}

      {!showChat && (
          <button 
            onClick={() => setShowChat(true)}
            className="absolute bottom-28 right-6 bg-white dark:bg-dark-card text-brand border-2 border-brand p-3 rounded-full shadow-glass hover:scale-110 hover:shadow-xl transition-all z-20 group"
          >
              <MessageSquarePlus size={24} className="group-hover:animate-pulse" />
          </button>
      )}

      {/* Bottom Bar */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 pb-6 z-[70] border-t transition-all duration-500 ease-out 
        ${status === 'idle' 
            ? 'bg-white dark:bg-dark-bg border-gray-100 dark:border-gray-800' 
            : status === 'correct' 
                ? 'bg-green-50/95 dark:bg-green-900/90 backdrop-blur-md border-green-200 dark:border-green-800 animate-slide-in-bottom' 
                : 'bg-red-50/95 dark:bg-red-900/90 backdrop-blur-md border-red-200 dark:border-red-800 animate-slide-in-bottom'
        }`}>
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
              {status === 'wrong' && (
                  <div className="flex items-center gap-3 text-red-600 dark:text-red-200 overflow-hidden">
                      <div className="bg-red-100 dark:bg-red-800/50 p-2 rounded-full shrink-0"><AlertCircle size={24}/></div>
                      <div className="min-w-0">
                          <div className="font-extrabold text-lg leading-none mb-1">{t.incorrect}</div>
                          {isReviewing || plan.isSkipChallenge ? (
                               // In Review Mode OR Skip Challenge, don't show answer immediately.
                               <div className="text-xs opacity-90 font-medium text-red-700 dark:text-red-300">
                                   {plan.isSkipChallenge && sessionMistakes.length > 2 ? t.skipChallengeFail : "Keep trying!"}
                               </div>
                          ) : (
                               <div className="text-xs opacity-90 font-medium truncate text-red-700 dark:text-red-300">
                                 {interactiveWidget?.type === 'fill-in' && interactiveWidget.fillIn 
                                    ? `Solution: ${interactiveWidget.fillIn.correctValues.join(' ')}` 
                                    : (interactiveWidget?.type === 'quiz' && interactiveWidget.quiz?.explanation 
                                        ? interactiveWidget.quiz.explanation 
                                        : t.reviewTips)
                                 }
                               </div>
                          )}
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
              
              {/* Action Buttons */}
              <div className="flex gap-3 ml-auto">
                  {/* Skip Button (Visible only when wrong in review mode) */}
                  {status === 'wrong' && isReviewing && (
                       <button 
                           onClick={() => setShowSkipModal(true)}
                           className="px-4 py-3 font-bold text-gray-400 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors flex items-center gap-2 text-sm"
                       >
                           <SkipForward size={18} /> {t.skip}
                       </button>
                  )}

                  {!(interactiveWidget?.type === 'flipcard' && interactiveWidget.flipcard?.mode === 'assessment') && (
                      <Button 
                        onClick={() => {
                            if (status === 'idle') {
                                interactiveWidget ? handleCheck() : handleNext();
                            } else if (status === 'wrong' && (isReviewing || plan.isSkipChallenge)) {
                                handleTryAgain();
                            } else {
                                handleNext();
                            }
                        }}
                        variant={status === 'wrong' ? (isReviewing ? 'secondary' : 'secondary') : 'primary'}
                        className="w-32 md:w-40 shadow-lg"
                      >
                          {status === 'idle' 
                             ? (interactiveWidget ? t.check : t.next) 
                             : (status === 'wrong' && (isReviewing || plan.isSkipChallenge) ? t.tryAgain : t.continue)
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
