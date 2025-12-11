
import React, { useState, useEffect } from 'react';
import { LessonPlan, MistakeRecord, UserPreferences, Widget, LessonScreen, UserStats, LeetCodeContext } from '../../types';
import { useLessonEngine, ExamResult } from '../../hooks/useLessonEngine';
import { useWidgetValidator, WidgetState } from '../../hooks/useWidgetValidator';
import { regenerateLessonScreen, verifyAnswerDispute } from '../../services/geminiService';
import { LessonHeader } from './LessonHeader';
import { LessonFooter } from './LessonFooter';
import { LeetCodeRunner } from './LeetCodeRunner';
import { MistakeIntro } from './MistakeIntro';
import { LessonSummary } from './LessonSummary';
import { ExamSummary } from './ExamSummary'; 
import { StreakCelebration } from './StreakCelebration';
import { GlobalAiAssistant } from '../GlobalAiAssistant';
import { Button } from '../Button';
import { LogOut, X, HeartCrack, AlertTriangle, ArrowRight, RefreshCw, AlertCircle, Wand2, ShieldCheck, HelpCircle, Loader2, CheckCircle2, FileText, ChevronRight } from 'lucide-react';
import { MarkdownText } from '../common/MarkdownText'; 

// Direct Widget Imports
import { DialogueWidget } from '../widgets/Dialogue';
import { FlipCardWidget } from '../widgets/FlipCard';
import { CalloutWidget } from '../widgets/Callout';
import { InteractiveCodeWidget } from '../widgets/InteractiveCode';
import { ParsonsWidget } from '../widgets/Parsons';
import { FillInWidget } from '../widgets/FillIn';
import { QuizWidget as QuizWidgetPresenter } from '../widgets/Quiz'; 
import { StepsWidget } from '../widgets/StepsList';
// New Engineering Widgets
import { TerminalWidget } from '../widgets/Terminal';
import { CodeWalkthroughWidget } from '../widgets/CodeWalkthrough';
import { MiniEditorWidget } from '../widgets/MiniEditor';
import { ArchCanvasWidget } from '../widgets/ArchCanvas';
// New Forge Widgets
import { MermaidVisualWidget } from '../widgets/MermaidVisual';
import { VisualQuizWidget } from '../widgets/VisualQuiz';
import { ComparisonTableWidget } from '../widgets/ComparisonTable';

interface LessonRunnerProps {
  plan: LessonPlan;
  nodeIndex: number;
  onComplete: (stats: { xp: number; streak: number }, shouldSave: boolean, mistakes: MistakeRecord[]) => void;
  onExit: () => void;
  onRegenerate?: () => void;
  onUpdatePlan?: (newPlan: LessonPlan) => void;
  language: 'Chinese' | 'English';
  preferences: UserPreferences;
  isReviewMode?: boolean;
  isSkipContext?: boolean;
  stats: UserStats;
  problemContext?: LeetCodeContext | null; // NEW: Passed context
}

type RunnerPhase = 'lesson' | 'mistake_intro' | 'mistake_loop' | 'summary' | 'streak_celebration' | 'exam_summary';

interface QualityIssue {
    type: 'lonely_dialogue' | 'broken_fillin' | 'bad_parsons' | 'empty_screen';
    reason: string;
    defaultPrompt: string;
}

export const LessonRunner: React.FC<LessonRunnerProps> = (props) => {
  const [showDescription, setShowDescription] = useState(false); // Global Sidebar state

  const renderDescriptionSidebar = () => {
      if (!props.problemContext) return null;
      return (
        <div 
            className={`fixed inset-y-0 right-0 h-full bg-white dark:bg-[#111] z-[120] shadow-2xl transform transition-transform duration-300 border-l border-gray-200 dark:border-gray-800 flex flex-col w-[450px] ${showDescription ? 'translate-x-0' : 'translate-x-full'}`}
        >
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-[#151515]">
                <div className="flex items-center gap-2">
                    <FileText size={18} className="text-brand"/>
                    <h3 className="font-bold text-gray-800 dark:text-white uppercase tracking-wider text-sm">{props.language === 'Chinese' ? "题目描述" : "Problem Description"}</h3>
                </div>
                <button onClick={() => setShowDescription(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-gray-500">
                    <ChevronRight size={18}/>
                </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="prose dark:prose-invert prose-sm max-w-none">
                    <h2 className="text-xl font-black mb-4 text-gray-900 dark:text-white">{props.problemContext.meta.title}</h2>
                    <div className="flex gap-2 mb-6">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${props.problemContext.meta.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : props.problemContext.meta.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {props.problemContext.meta.difficulty}
                        </span>
                    </div>
                    <MarkdownText content={props.problemContext.problem.description} className="whitespace-pre-wrap leading-relaxed"/>
                </div>
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 space-y-4">
                    {props.problemContext.problem.examples.map((ex, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 font-mono text-xs">
                            <div className="mb-2"><strong className="text-gray-500">Input:</strong> <span className="text-gray-800 dark:text-gray-200">{ex.input}</span></div>
                            <div className="mb-2"><strong className="text-gray-500">Output:</strong> <span className="text-gray-800 dark:text-gray-200">{ex.output}</span></div>
                            {ex.explanation && (
                                <div className="text-gray-600 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <strong className="text-gray-500">Explanation:</strong> 
                                    <MarkdownText content={ex.explanation} className="mt-1" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-6">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-2">Constraints:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-xs font-mono text-gray-500 dark:text-gray-400">
                        {props.problemContext.problem.constraints.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                </div>
            </div>
        </div>
      );
  };

  if (props.nodeIndex === 6) {
    // SIMULATOR MODE LAYOUT
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-100/90 dark:bg-black/90 backdrop-blur-md">
            <div className="flex w-full h-full relative overflow-hidden">
                {/* Main Content Area (Shrinks when sidebar is open) */}
                <div className={`h-full flex flex-col transition-all duration-300 ease-in-out ${showDescription ? 'w-[calc(100%-450px)]' : 'w-full'}`}>
                    <div className="h-full bg-white dark:bg-dark-bg md:rounded-r-none shadow-2xl flex flex-col overflow-hidden border-r border-gray-200 dark:border-gray-700 relative animate-scale-in">
                        <div className="h-10 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center px-4 bg-gray-50 dark:bg-dark-card shrink-0 select-none">
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1.5 group">
                                    <button onClick={props.onExit} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center">
                                        <X size={8} className="text-red-900 opacity-0 group-hover:opacity-100"/>
                                    </button>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"/>
                                    <div className="w-3 h-3 rounded-full bg-green-500"/>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-2 border-l border-gray-300 dark:border-gray-600 pl-2">
                                    AlgoLingo IDE
                                </span>
                            </div>
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 hidden md:block">{props.plan.title}</span>
                            <button 
                                onClick={() => setShowDescription(!showDescription)}
                                className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors ${showDescription ? 'text-brand' : ''}`}
                                title="Toggle Description"
                            >
                                <FileText size={16}/>
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden relative">
                            <LeetCodeRunner 
                                plan={props.plan} 
                                preferences={props.preferences} 
                                language={props.language} 
                                onSuccess={() => props.onComplete({ xp: 50, streak: 1 }, true, [])}
                                context={props.problemContext} 
                            />
                        </div>
                    </div>
                </div>
                
                {/* Global Sidebar (Push Layout) */}
                {renderDescriptionSidebar()}
            </div>
        </div>
    );
  }

  // STANDARD LESSON MODE
  const [phase, setPhase] = useState<RunnerPhase>('lesson');
  const [sessionMistakes, setSessionMistakes] = useState<MistakeRecord[]>([]);
  const [hasRepaired, setHasRepaired] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  const [qualityIssue, setQualityIssue] = useState<QualityIssue | null>(null);
  const [ignoredIssues, setIgnoredIssues] = useState<string[]>([]); 

  const [showReportModal, setShowReportModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [disputeResult, setDisputeResult] = useState<{verdict: 'correct'|'incorrect', explanation: string} | null>(null);

  const isExamMode = props.plan.context?.type === 'career_exam';
  const examTimeLimit = 600; 

  const hasLifeLimit = props.isSkipContext || props.nodeIndex === 5;
  const activeMaxMistakes = (hasLifeLimit && phase !== 'mistake_loop') ? 2 : undefined;

  const handleEngineComplete = (stats: { xp: number; streak: number }, shouldSave: boolean, mistakes: MistakeRecord[]) => {
      setSessionMistakes(prev => [...prev, ...mistakes]);

      if (phase === 'lesson') {
          if (isExamMode) {
              setPhase('exam_summary');
          } else if (mistakes.length > 0) {
              setPhase('mistake_intro');
          } else {
              setPhase('summary');
          }
      } else if (phase === 'mistake_loop') {
          setPhase('summary');
      }
  };

  const engine = useLessonEngine({
    plan: props.plan,
    nodeIndex: props.nodeIndex,
    onComplete: handleEngineComplete,
    isReviewMode: props.isReviewMode,
    maxMistakes: activeMaxMistakes 
  });

  const [widgetState, setWidgetState] = useState<WidgetState>({});
  const validator = useWidgetValidator();
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    setWidgetState({});
    
    if (engine.currentScreen && !ignoredIssues.includes(engine.currentScreen.id)) {
        const screen = engine.currentScreen;
        const isZh = props.language === 'Chinese';
        
        if (screen.widgets.length === 1 && screen.widgets[0].type === 'dialogue') {
            setQualityIssue({
                type: 'lonely_dialogue',
                reason: isZh ? "此页面仅包含单一对话气泡，缺乏互动。" : "This screen has only text, missing visual interactivity.",
                defaultPrompt: "Add an 'interactive-code' widget or a 'quiz' to visualize the concept mentioned in the dialogue."
            });
            return;
        }

        const fillIn = screen.widgets.find(w => w.type === 'fill-in');
        if (fillIn && fillIn.fillIn) {
             const { inputMode, options } = fillIn.fillIn;
             if ((!inputMode || inputMode === 'select') && (!options || options.length === 0)) {
                 setQualityIssue({
                     type: 'broken_fillin',
                     reason: isZh ? "填空题缺少选项数据。" : "Fill-in question is missing options.",
                     defaultPrompt: "Regenerate the fill-in widget. It MUST include an 'options' array with the correct answer and distractors."
                 });
                 return;
             }
        }

        const parsons = screen.widgets.find(w => w.type === 'parsons');
        if (parsons && parsons.parsons && (!parsons.parsons.lines || parsons.parsons.lines.length < 3)) {
            setQualityIssue({
                type: 'bad_parsons',
                reason: isZh ? "代码拼图行数过少，缺乏挑战性。" : "The Parsons puzzle is too short.",
                defaultPrompt: "Regenerate the Parsons puzzle with at least 5 lines of logical code. Do not use trivial lines."
            });
            return;
        }

        setQualityIssue(null);
    } else {
        setQualityIssue(null);
    }

  }, [engine.currentScreen?.id, ignoredIssues, props.language]);

  const activeWidget = engine.currentScreen.widgets.find(w => 
    ['quiz', 'parsons', 'fill-in', 'steps-list', 'mini-editor', 'terminal', 'arch-canvas'].includes(w.type) || 
    (w.type === 'flipcard' && w.flipcard?.mode === 'assessment')
  );
  
  const isInteractiveScreen = !!activeWidget;

  const handleCheck = () => {
    if (!isInteractiveScreen) {
        engine.nextScreen();
        return;
    }

    const isCorrect = validator.validate(activeWidget as Widget, widgetState);
    const isAutoPass = ['terminal', 'code-walkthrough', 'arch-canvas', 'mermaid', 'visual-quiz', 'comparison-table'].includes(activeWidget?.type || '');
    const finalResult = isAutoPass ? true : isCorrect;

    if (isExamMode) {
        engine.submitExamAnswer(finalResult, widgetState);
    } else {
        engine.checkAnswer(finalResult);
    }
  };

  const handleRegenerateScreen = async (instruction: string) => {
      if (!engine.currentScreen) return;
      setIsRegenerating(true);
      setQualityIssue(null);

      try {
          const newScreen = await regenerateLessonScreen(
              engine.currentScreen,
              props.plan.context,
              instruction,
              props.preferences
          );
          engine.replaceCurrentScreen(newScreen);
          if (props.onUpdatePlan) {
              const updatedScreens = [...props.plan.screens];
              updatedScreens[engine.currentIndex] = newScreen;
              const updatedPlan = { ...props.plan, screens: updatedScreens };
              props.onUpdatePlan(updatedPlan);
          }
      } catch (e) {
          alert(props.language === 'Chinese' ? "重新生成失败，请重试" : "Regeneration failed, please try again");
      } finally {
          setIsRegenerating(false);
      }
  };

  const handleStartRepair = () => {
      let mistakesToRepair = sessionMistakes.filter(m => m.widget && m.widget.type !== 'dialogue' && m.widget.type !== 'callout');
      if (mistakesToRepair.length === 0 && sessionMistakes.length > 0) mistakesToRepair = sessionMistakes;
      if (mistakesToRepair.length === 0) { setPhase('summary'); return; }
      
      const mistakeScreens: LessonScreen[] = mistakesToRepair.map((m) => ({
          id: `repair_${m.id}`,
          header: 'Mistake Repair',
          widgets: [m.widget!], 
          isRetry: true
      }));

      engine.startMistakeRepair(mistakeScreens);
      setHasRepaired(true);
      setPhase('mistake_loop');
  };

  const finishLesson = (satisfaction: boolean) => {
      if (!satisfaction && props.onRegenerate) { props.onRegenerate(); return; }
      const today = new Date().toISOString().split('T')[0];
      const lastPlayedLocal = localStorage.getItem('algolingo_last_played_date');
      const isFirstTimeToday = lastPlayedLocal !== today;

      if (satisfaction && isFirstTimeToday) { 
          localStorage.setItem('algolingo_last_played_date', today);
          setPhase('streak_celebration');
      } else {
          props.onComplete({ xp: engine.xpGained, streak: engine.streak }, true, sessionMistakes);
      }
  };

  const handleDispute = async () => {
      if (!activeWidget) return;
      setIsVerifying(true);
      
      let userAnswer: any = "No Answer";
      if (activeWidget.type === 'quiz' && widgetState.quizSelection !== undefined) {
          userAnswer = activeWidget.quiz?.options[widgetState.quizSelection] || "Index " + widgetState.quizSelection;
      } else if (activeWidget.type === 'fill-in' && widgetState.fillInAnswers) {
          userAnswer = widgetState.fillInAnswers;
      } else if (activeWidget.type === 'parsons' && widgetState.parsonsOrder) {
          userAnswer = "User Ordered Code:\n" + widgetState.parsonsOrder.join('\n');
      } else if (activeWidget.type === 'steps-list' && widgetState.stepsOrder) {
          userAnswer = "User Ordered Steps:\n" + widgetState.stepsOrder.join('\n');
      }

      try {
          const result = await verifyAnswerDispute(
              activeWidget,
              userAnswer,
              engine.currentScreen.header || props.plan.title,
              props.preferences
          );
          setDisputeResult(result);
          if (result.verdict === 'correct') {
              engine.rectifyMistake();
              setSessionMistakes(prev => prev.slice(0, -1)); 
          }
      } catch (e) {
          alert("AI Judge Offline.");
          setShowReportModal(false);
      } finally {
          setIsVerifying(false);
      }
  };

  if (engine.isFailed) {
      return (
          <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in-up">
              <div className="bg-white dark:bg-dark-card rounded-3xl p-8 w-full max-w-md text-center shadow-2xl border-4 border-red-500 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
                  <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                      <HeartCrack size={40} className="text-red-500 fill-current" />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
                      {props.language === 'Chinese' ? "挑战失败" : "Challenge Failed"}
                  </h2>
                  <div className="flex flex-col gap-3 mt-6">
                      <Button variant="primary" onClick={engine.continueAsPractice} className="w-full py-4 shadow-xl bg-brand hover:bg-brand-dark border-brand-dark flex items-center justify-center gap-2">
                          {props.language === 'Chinese' ? "继续练习 (降级)" : "Continue as Practice"} <ArrowRight size={18}/>
                      </Button>
                      <button onClick={props.onExit} className="w-full py-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold text-sm">
                          {props.language === 'Chinese' ? "退出" : "Exit"}
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  if (phase === 'exam_summary') {
      return (
          <ExamSummary 
              screens={props.plan.screens}
              results={engine.examHistory}
              score={engine.xpGained}
              onClose={() => props.onComplete({ xp: engine.xpGained, streak: engine.streak }, true, sessionMistakes)}
              language={props.language}
          />
      );
  }

  if (phase === 'mistake_intro') {
      return (
          <div className="fixed inset-0 z-[100] bg-white dark:bg-dark-bg md:flex md:items-center md:justify-center md:bg-gray-100/90 md:dark:bg-black/90 md:backdrop-blur-sm">
               <div className="w-full h-full md:max-w-4xl md:h-[80vh] md:rounded-3xl bg-white dark:bg-dark-bg md:shadow-2xl overflow-hidden relative">
                    <MistakeIntro count={sessionMistakes.length} onStart={handleStartRepair} language={props.language} />
               </div>
          </div>
      );
  }

  if (phase === 'summary') {
      return (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-dark-bg md:flex md:items-center md:justify-center md:bg-gray-100/90 md:dark:bg-black/90 md:backdrop-blur-sm">
             <div className="w-full h-full md:max-w-4xl md:h-[85vh] md:rounded-3xl bg-white dark:bg-dark-bg md:shadow-2xl overflow-hidden relative">
                <LessonSummary 
                    stats={{
                        timeSeconds: engine.timerSeconds,
                        totalQuestions: hasRepaired ? props.plan.screens.length + sessionMistakes.length : props.plan.screens.length,
                        correctCount: Math.max(0, (hasRepaired ? props.plan.screens.length + sessionMistakes.length : props.plan.screens.length) - sessionMistakes.length), 
                        mistakeCount: sessionMistakes.length,
                        xpGained: engine.xpGained
                    }}
                    language={props.language}
                    onContinue={finishLesson}
                />
             </div>
        </div>
      );
  }

  if (phase === 'streak_celebration') {
      return (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-dark-bg md:flex md:items-center md:justify-center md:bg-gray-100/90 md:dark:bg-black/90 md:backdrop-blur-sm">
             <div className="w-full h-full md:max-w-4xl md:h-[85vh] md:rounded-3xl bg-white dark:bg-dark-bg md:shadow-2xl overflow-hidden relative">
                <StreakCelebration 
                    streak={(props.stats?.streak || 0) + 1}
                    history={props.stats.history || {}} 
                    onContinue={() => props.onComplete({ xp: engine.xpGained, streak: engine.streak }, true, sessionMistakes)}
                    language={props.language}
                />
             </div>
        </div>
      );
  }

  if (showExitConfirm) {
      return (
           <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="bg-white dark:bg-dark-card rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl">
                  <div className="mb-4 bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto"><LogOut/></div>
                  <h3 className="text-xl font-extrabold mb-2 text-gray-800 dark:text-white">{props.language === 'Chinese' ? "确定要离开吗？" : "Are you sure?"}</h3>
                  <div className="flex flex-col gap-3 mt-6">
                      <Button variant="primary" onClick={() => setShowExitConfirm(false)}>{props.language === 'Chinese' ? "继续学习" : "Keep Learning"}</Button>
                      <button onClick={props.onExit} className="text-gray-400 text-sm font-bold py-2">{props.language === 'Chinese' ? "退出" : "Quit"}</button>
                  </div>
              </div>
           </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-100/80 dark:bg-black/80 backdrop-blur-sm p-0 md:p-4">
      <div className="flex w-full h-full relative overflow-hidden">
        {/* Main Lesson Container */}
        <div className={`h-full flex flex-col transition-all duration-300 ease-in-out ${showDescription ? 'w-[calc(100%-450px)]' : 'w-full'}`}>
            <div className="w-full h-full bg-white dark:bg-dark-bg md:rounded-3xl md:shadow-2xl flex flex-col overflow-hidden relative border border-gray-200 dark:border-gray-700 transition-all animate-scale-in">
                
                <GlobalAiAssistant 
                    problemName={props.plan.title} 
                    preferences={props.preferences} 
                    language={props.language} 
                    currentPlan={props.plan} 
                />
                
                <div className="relative">
                    <LessonHeader 
                        currentScreenIndex={engine.currentIndex}
                        totalScreens={engine.totalScreens}
                        streak={engine.streak}
                        mistakeCount={engine.mistakeCount}
                        timerSeconds={engine.timerSeconds}
                        isSkipMode={activeMaxMistakes !== undefined && !engine.isLimitDisabled}
                        isMistakeMode={phase === 'mistake_loop'}
                        onExit={() => setShowExitConfirm(true)}
                        headerTitle={engine.currentScreen.header}
                        language={props.language}
                        totalTime={isExamMode ? examTimeLimit : undefined}
                    />
                    {/* Toggle button for Description Sidebar */}
                    {props.problemContext && (
                        <button 
                            onClick={() => setShowDescription(!showDescription)}
                            className={`absolute top-3 right-16 p-2 text-gray-400 hover:text-brand transition-colors z-20 ${showDescription ? 'text-brand' : ''}`}
                            title="View Problem Description"
                        >
                            <FileText size={20}/>
                        </button>
                    )}
                </div>

                {/* MODALS */}
                {qualityIssue && (
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[60] w-full max-w-lg px-4 animate-slide-in-bottom">
                        <div className="bg-white dark:bg-[#151515] border-2 border-red-500/50 dark:border-red-500/30 shadow-2xl rounded-2xl p-4 flex flex-col gap-3">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full text-red-500 shrink-0">
                                    <AlertCircle size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 dark:text-white text-sm">
                                        {props.language === 'Chinese' ? "检测到内容质量问题" : "Content Quality Issue Detected"}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                                        {qualityIssue.reason}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button 
                                    onClick={() => { setQualityIssue(null); setIgnoredIssues(prev => [...prev, engine.currentScreen.id]); }}
                                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                >
                                    {props.language === 'Chinese' ? "忽略 (Ignore)" : "Ignore"}
                                </button>
                                <button 
                                    onClick={() => handleRegenerateScreen(qualityIssue.defaultPrompt)}
                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                                >
                                    <Wand2 size={12} />
                                    {props.language === 'Chinese' ? "AI 自动修复" : "Auto-Fix"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showReportModal && (
                    <div className="absolute inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-dark-card w-full max-w-sm rounded-3xl p-6 shadow-2xl border-2 border-red-100 dark:border-red-900/50">
                            {!disputeResult ? (
                                <>
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-extrabold text-lg text-gray-800 dark:text-white">
                                            {props.language === 'Chinese' ? "反馈与申诉" : "Feedback & Appeal"}
                                        </h3>
                                        <button onClick={() => setShowReportModal(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                                            <X size={20} className="text-gray-400" />
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                        {props.language === 'Chinese' ? "你认为你的答案是正确的吗？还是题目有问题？" : "Do you believe your answer is correct, or is the question flawed?"}
                                    </p>
                                    <div className="space-y-3">
                                        <button 
                                            onClick={handleDispute}
                                            disabled={isVerifying}
                                            className="w-full py-4 bg-brand text-white rounded-2xl font-bold shadow-lg hover:bg-brand-light transition-all flex items-center justify-center gap-3"
                                        >
                                            {isVerifying ? <Loader2 size={18} className="animate-spin"/> : <ShieldCheck size={18} />}
                                            {isVerifying ? (props.language === 'Chinese' ? "AI 正在裁决..." : "AI Judging...") : (props.language === 'Chinese' ? "我的答案是正确的" : "My Answer is Correct")}
                                        </button>
                                        <button 
                                            onClick={() => handleRegenerateScreen("The previous question was confusing or broken. Make it better.")}
                                            className="w-full py-4 bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-2xl font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-all flex items-center justify-center gap-3"
                                        >
                                            <AlertTriangle size={18} />
                                            {props.language === 'Chinese' ? "题目质量差 (重生成)" : "Bad Question (Regenerate)"}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center animate-fade-in-up">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${disputeResult.verdict === 'correct' ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'}`}>
                                        {disputeResult.verdict === 'correct' ? <CheckCircle2 size={32} /> : <HeartCrack size={32} />}
                                    </div>
                                    <h3 className={`text-xl font-black mb-2 uppercase ${disputeResult.verdict === 'correct' ? 'text-green-600' : 'text-red-600'}`}>
                                        {disputeResult.verdict === 'correct' ? (props.language === 'Chinese' ? "申诉成功！" : "Appeal Accepted!") : (props.language === 'Chinese' ? "申诉驳回" : "Appeal Rejected")}
                                    </h3>
                                    <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl text-left border border-gray-100 dark:border-gray-700 max-h-48 overflow-y-auto custom-scrollbar">
                                        <MarkdownText content={disputeResult.explanation} />
                                    </div>
                                    <Button onClick={() => { setShowReportModal(false); setDisputeResult(null); }} variant={disputeResult.verdict === 'correct' ? 'primary' : 'secondary'} className="w-full">
                                        {props.language === 'Chinese' ? "我知道了" : "Got it"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto custom-scrollbar p-0 md:p-8 pb-32 md:pb-32 w-full bg-gray-50/30 dark:bg-dark-bg/30">
                    <div className="mx-auto max-w-2xl transition-all duration-300 px-4 pt-4 md:px-0 md:pt-0">
                        {engine.currentScreen.widgets.map((widget, idx) => (
                            <div key={widget.id + idx} className={`animate-fade-in-up delay-${Math.min(idx * 100, 400)} mb-6`}>
                                {widget.type === 'dialogue' && <DialogueWidget widget={widget} />}
                                {widget.type === 'callout' && <CalloutWidget widget={widget} />}
                                {(widget.type === 'interactive-code' || widget.type === 'code') && (
                                    <InteractiveCodeWidget widget={widget.type === 'code' ? { ...widget, type: 'interactive-code', interactiveCode: { language: widget.code?.language || 'python', lines: (widget.code?.content || '').split('\n').map(l => ({code: l, explanation: ''})), caption: widget.code?.caption } } : widget} language={props.language} />
                                )}
                                {widget.type === 'flipcard' && <FlipCardWidget widget={widget} language={props.language} onAssessment={(res) => engine.checkAnswer(res === 'remembered')} />}
                                {widget.type === 'quiz' && <QuizWidgetPresenter widget={widget} selectedIdx={widgetState.quizSelection ?? null} onSelect={(i) => setWidgetState(s => ({ ...s, quizSelection: i }))} status={engine.status} language={props.language} />}
                                {widget.type === 'parsons' && <ParsonsWidget widget={widget} onUpdateOrder={(order) => setWidgetState(s => ({ ...s, parsonsOrder: order }))} status={engine.status} language={props.language} />}
                                {widget.type === 'fill-in' && <FillInWidget widget={widget} onUpdateAnswers={(ans) => setWidgetState(s => ({ ...s, fillInAnswers: ans }))} language={props.language} status={engine.status} />}
                                {widget.type === 'steps-list' && <StepsWidget widget={widget} onUpdateOrder={(order) => setWidgetState(s => ({ ...s, stepsOrder: order }))} />}
                                {widget.type === 'terminal' && <TerminalWidget widget={widget} status={engine.status} />}
                                {widget.type === 'code-walkthrough' && <CodeWalkthroughWidget widget={widget} />}
                                {widget.type === 'mini-editor' && <MiniEditorWidget widget={widget} onValidationChange={(isValid) => setWidgetState(prev => ({ ...prev, miniEditorValid: isValid }))} />}
                                {widget.type === 'arch-canvas' && <ArchCanvasWidget widget={widget} />}
                                {widget.type === 'mermaid' && <MermaidVisualWidget widget={widget} onRegenerate={handleRegenerateScreen} />}
                                {widget.type === 'visual-quiz' && <VisualQuizWidget widget={widget} />}
                                {widget.type === 'comparison-table' && <ComparisonTableWidget widget={widget} />}
                            </div>
                        ))}
                    </div>
                </div>
                <LessonFooter 
                    status={isInteractiveScreen ? engine.status : 'idle'}
                    onCheck={handleCheck}
                    onNext={engine.nextScreen}
                    language={props.language}
                    isExamMode={isExamMode}
                    isLastQuestion={engine.currentIndex === engine.totalScreens - 1}
                    onRegenerate={handleRegenerateScreen}
                    onReport={() => setShowReportModal(true)}
                    isRegenerating={isRegenerating}
                />
            </div>
        </div>
        
        {/* Sidebar (Push Layout) */}
        {renderDescriptionSidebar()}
      </div>
    </div>
  );
};
