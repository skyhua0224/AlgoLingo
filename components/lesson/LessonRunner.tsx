
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
import { LogOut, X, Maximize2, Minimize2 } from 'lucide-react';

// Direct Widget Imports
import { DialogueWidget } from '../widgets/Dialogue';
import { FlipCardWidget } from '../widgets/FlipCard';
import { CalloutWidget } from '../widgets/Callout';
import { InteractiveCodeWidget } from '../widgets/InteractiveCode';
import { ParsonsWidget } from '../widgets/Parsons';
import { FillInWidget } from '../widgets/FillIn';
import { QuizWidget as QuizWidgetPresenter } from '../widgets/Quiz'; 
import { StepsWidget } from '../widgets/StepsList';

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
  
  // LeetCode Mode (Index 6) - Full Screen Window
  if (props.nodeIndex === 6) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-100/90 dark:bg-black/90 backdrop-blur-md p-0 md:p-3">
            {/* 
                FIX: Increased height from 96vh to h-full on mobile, and md:h-[96vh] on desktop.
                This removes the large gap at the bottom while keeping the 'window' aesthetic on large screens.
            */}
            <div className="w-full h-full md:w-[98vw] md:h-[96vh] bg-white dark:bg-dark-bg md:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 relative animate-scale-in">
                {/* Window Controls */}
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
                            AlgoLingo Simulator
                        </span>
                    </div>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 hidden md:block">{props.plan.title}</span>
                    <div className="w-10"></div> 
                </div>
                
                {/* Content */}
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
          // ENABLED FOR REVIEW MODE TOO: If mistakes exist, go to repair loop.
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
    isReviewMode: props.isReviewMode
  });

  const [widgetState, setWidgetState] = useState<WidgetState>({});
  const validator = useWidgetValidator();
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    setWidgetState({});
  }, [engine.currentScreen?.id]);

  // Determine if the current screen requires user interaction to pass
  const activeWidget = engine.currentScreen.widgets.find(w => 
    ['quiz', 'parsons', 'fill-in', 'steps-list'].includes(w.type) || 
    (w.type === 'flipcard' && w.flipcard?.mode === 'assessment')
  );
  
  const isInteractiveScreen = !!activeWidget;

  const handleCheck = () => {
    if (!isInteractiveScreen) {
        engine.nextScreen();
        return;
    }

    const isCorrect = validator.validate(activeWidget as Widget, widgetState);
    engine.checkAnswer(isCorrect);
  };

  const handleStartRepair = () => {
      // Prioritize truly interactive widgets for repair
      let mistakesToRepair = sessionMistakes.filter(m => m.widget && m.widget.type !== 'dialogue' && m.widget.type !== 'callout');
      
      // Fallback
      if (mistakesToRepair.length === 0 && sessionMistakes.length > 0) {
          mistakesToRepair = sessionMistakes;
      }

      if (mistakesToRepair.length === 0) {
          setPhase('summary');
          return;
      }
      
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
      if (!satisfaction && props.onRegenerate) {
          props.onRegenerate();
          return;
      }
      
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
      const totalQuestions = hasRepaired 
          ? props.plan.screens.length + sessionMistakes.length 
          : props.plan.screens.length;

      return (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-dark-bg md:flex md:items-center md:justify-center md:bg-gray-100/90 md:dark:bg-black/90 md:backdrop-blur-sm">
             <div className="w-full h-full md:max-w-4xl md:h-[85vh] md:rounded-3xl bg-white dark:bg-dark-bg md:shadow-2xl overflow-hidden relative">
                <LessonSummary 
                    stats={{
                        timeSeconds: engine.timerSeconds,
                        totalQuestions: totalQuestions,
                        correctCount: Math.max(0, totalQuestions - sessionMistakes.length), 
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
      const displayStreak = (props.stats?.streak || 0) + 1;
      
      return (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-dark-bg md:flex md:items-center md:justify-center md:bg-gray-100/90 md:dark:bg-black/90 md:backdrop-blur-sm">
             <div className="w-full h-full md:max-w-4xl md:h-[85vh] md:rounded-3xl bg-white dark:bg-dark-bg md:shadow-2xl overflow-hidden relative">
                <StreakCelebration 
                    streak={displayStreak}
                    history={props.stats.history || {}} 
                    onContinue={() => {
                        props.onComplete({ xp: engine.xpGained, streak: engine.streak }, true, sessionMistakes);
                    }}
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
                  <h3 className="text-xl font-extrabold mb-2 text-gray-800 dark:text-white">
                      {props.language === 'Chinese' ? "确定要离开吗？" : "Are you sure?"}
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                      {props.language === 'Chinese' ? "现在退出将无法保存本次进度。" : "Exiting now will lose your current progress."}
                  </p>
                  <div className="flex flex-col gap-3">
                      <Button variant="primary" onClick={() => setShowExitConfirm(false)}>
                          {props.language === 'Chinese' ? "继续学习" : "Keep Learning"}
                      </Button>
                      <button onClick={props.onExit} className="text-gray-400 text-sm font-bold py-2">
                          {props.language === 'Chinese' ? "退出" : "Quit"}
                      </button>
                  </div>
              </div>
           </div>
      );
  }

  // STANDARD LESSON VIEW
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
            isSkipMode={props.isSkipContext}
            isMistakeMode={phase === 'mistake_loop'}
            onExit={() => setShowExitConfirm(true)}
            headerTitle={engine.currentScreen.header}
            language={props.language}
        />

        {/* Content Area - Full Height with padding adjustment */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-0 md:p-8 pb-32 md:pb-32 w-full bg-gray-50/30 dark:bg-dark-bg/30">
            <div className="mx-auto max-w-2xl transition-all duration-300 px-4 pt-4 md:px-0 md:pt-0">
                {engine.currentScreen.widgets.map((widget, idx) => (
                    <div key={widget.id + idx} className={`animate-fade-in-up delay-${Math.min(idx * 100, 400)} mb-6`}>
                        {widget.type === 'dialogue' && <DialogueWidget widget={widget} />}
                        {widget.type === 'callout' && <CalloutWidget widget={widget} />}
                        {widget.type === 'interactive-code' && <InteractiveCodeWidget widget={widget} language={props.language} />}
                        
                        {widget.type === 'flipcard' && (
                            <FlipCardWidget 
                                widget={widget} 
                                language={props.language}
                                onAssessment={(res) => engine.checkAnswer(res === 'remembered')} 
                            />
                        )}

                        {widget.type === 'quiz' && (
                            <QuizWidgetPresenter 
                                widget={widget}
                                selectedIdx={widgetState.quizSelection ?? null}
                                onSelect={(i) => setWidgetState(s => ({ ...s, quizSelection: i }))}
                                status={engine.status}
                            />
                        )}

                        {widget.type === 'parsons' && (
                            <ParsonsWidget 
                                widget={widget}
                                onUpdateOrder={(order) => setWidgetState(s => ({ ...s, parsonsOrder: order }))}
                                status={engine.status}
                                language={props.language}
                            />
                        )}

                        {widget.type === 'fill-in' && (
                            <FillInWidget 
                                widget={widget}
                                onUpdateAnswers={(ans) => setWidgetState(s => ({ ...s, fillInAnswers: ans }))}
                                language={props.language}
                            />
                        )}

                        {widget.type === 'steps-list' && (
                            <StepsWidget 
                                widget={widget}
                                onUpdateOrder={(order) => setWidgetState(s => ({ ...s, stepsOrder: order }))}
                            />
                        )}
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
