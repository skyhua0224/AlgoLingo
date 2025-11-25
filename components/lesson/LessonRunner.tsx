
import React, { useState, useEffect } from 'react';
import { LessonPlan, MistakeRecord, UserPreferences, Widget, LessonScreen, UserStats } from '../../types';
import { useLessonEngine } from '../../hooks/useLessonEngine';
import { useWidgetValidator, WidgetState } from '../../hooks/useWidgetValidator';
import { LessonHeader } from './LessonHeader';
import { LessonFooter } from './LessonFooter';
import { LeetCodeRunner } from './LeetCodeRunner';
import { MistakeIntro } from './MistakeIntro';
import { LessonSummary } from './LessonSummary';
import { StreakCelebration } from './StreakCelebration';
import { GlobalAiAssistant } from '../GlobalAiAssistant';
import { Button } from '../Button';
import { LogOut, X, HeartCrack, AlertTriangle, ArrowRight } from 'lucide-react';

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
  language: 'Chinese' | 'English';
  preferences: UserPreferences;
  isReviewMode?: boolean;
  isSkipContext?: boolean;
  stats: UserStats;
}

type RunnerPhase = 'lesson' | 'mistake_intro' | 'mistake_loop' | 'summary' | 'streak_celebration';

export const LessonRunner: React.FC<LessonRunnerProps> = (props) => {
  
  if (props.nodeIndex === 6) {
    const windowTitle = props.plan.description === "LeetCode Simulator" ? "AlgoLingo Simulator" : "IDE Workspace";
    
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-100/90 dark:bg-black/90 backdrop-blur-md p-0 md:p-3">
            <div className="w-full h-full md:w-[98vw] md:h-[96vh] bg-white dark:bg-dark-bg md:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 relative animate-scale-in">
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
                            {windowTitle}
                        </span>
                    </div>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 hidden md:block">{props.plan.title}</span>
                    <div className="w-10"></div> 
                </div>
                <div className="flex-1 overflow-hidden relative">
                    <LeetCodeRunner 
                        plan={props.plan} 
                        preferences={props.preferences} 
                        language={props.language} 
                        onSuccess={() => props.onComplete({ xp: 50, streak: 1 }, true, [])}
                    />
                </div>
            </div>
        </div>
    );
  }

  const [phase, setPhase] = useState<RunnerPhase>('lesson');
  const [sessionMistakes, setSessionMistakes] = useState<MistakeRecord[]>([]);
  const [hasRepaired, setHasRepaired] = useState(false);
  
  const handleEngineComplete = (stats: { xp: number; streak: number }, shouldSave: boolean, mistakes: MistakeRecord[]) => {
      setSessionMistakes(prev => [...prev, ...mistakes]);

      if (phase === 'lesson') {
          if (mistakes.length > 0) {
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
    maxMistakes: props.isSkipContext ? 2 : undefined
  });

  const [widgetState, setWidgetState] = useState<WidgetState>({});
  const validator = useWidgetValidator();
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    setWidgetState({});
  }, [engine.currentScreen?.id]);

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
    if (['terminal', 'code-walkthrough', 'mini-editor', 'arch-canvas', 'mermaid', 'visual-quiz', 'comparison-table'].includes(activeWidget?.type || '')) {
        engine.checkAnswer(true);
    } else {
        engine.checkAnswer(isCorrect);
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
      <div className="w-full h-full md:max-w-5xl md:h-[96vh] bg-white dark:bg-dark-bg md:rounded-3xl md:shadow-2xl flex flex-col overflow-hidden relative border border-gray-200 dark:border-gray-700 transition-all">
        <GlobalAiAssistant problemName={props.plan.title} preferences={props.preferences} language={props.language} />
        <LessonHeader 
            currentScreenIndex={engine.currentIndex}
            totalScreens={engine.totalScreens}
            streak={engine.streak}
            mistakeCount={engine.mistakeCount}
            timerSeconds={engine.timerSeconds}
            isSkipMode={props.isSkipContext && !engine.isLimitDisabled}
            isMistakeMode={phase === 'mistake_loop'}
            onExit={() => setShowExitConfirm(true)}
            headerTitle={engine.currentScreen.header}
            language={props.language}
        />
        <div className="flex-1 overflow-y-auto custom-scrollbar p-0 md:p-8 pb-32 md:pb-32 w-full bg-gray-50/30 dark:bg-dark-bg/30">
            
            <div className="mx-auto max-w-2xl transition-all duration-300 px-4 pt-4 md:px-0 md:pt-0">
                {engine.currentScreen.widgets.map((widget, idx) => (
                    <div key={widget.id + idx} className={`animate-fade-in-up delay-${Math.min(idx * 100, 400)} mb-6`}>
                        {widget.type === 'dialogue' && <DialogueWidget widget={widget} />}
                        {widget.type === 'callout' && <CalloutWidget widget={widget} />}
                        {widget.type === 'interactive-code' && <InteractiveCodeWidget widget={widget} language={props.language} />}
                        {widget.type === 'flipcard' && <FlipCardWidget widget={widget} language={props.language} onAssessment={(res) => engine.checkAnswer(res === 'remembered')} />}
                        {widget.type === 'quiz' && <QuizWidgetPresenter widget={widget} selectedIdx={widgetState.quizSelection ?? null} onSelect={(i) => setWidgetState(s => ({ ...s, quizSelection: i }))} status={engine.status} />}
                        {widget.type === 'parsons' && <ParsonsWidget widget={widget} onUpdateOrder={(order) => setWidgetState(s => ({ ...s, parsonsOrder: order }))} status={engine.status} language={props.language} />}
                        {widget.type === 'fill-in' && <FillInWidget widget={widget} onUpdateAnswers={(ans) => setWidgetState(s => ({ ...s, fillInAnswers: ans }))} language={props.language} status={engine.status} />}
                        {widget.type === 'steps-list' && <StepsWidget widget={widget} onUpdateOrder={(order) => setWidgetState(s => ({ ...s, stepsOrder: order }))} />}
                        {/* New Engineering Widgets */}
                        {widget.type === 'terminal' && <TerminalWidget widget={widget} status={engine.status} />}
                        {widget.type === 'code-walkthrough' && <CodeWalkthroughWidget widget={widget} />}
                        {widget.type === 'mini-editor' && <MiniEditorWidget widget={widget} />}
                        {widget.type === 'arch-canvas' && <ArchCanvasWidget widget={widget} />}
                        {/* New Forge Widgets */}
                        {widget.type === 'mermaid' && <MermaidVisualWidget widget={widget} />}
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
        />
      </div>
    </div>
  );
};
