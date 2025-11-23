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
import { LogOut, X } from 'lucide-react';

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
  if (props.nodeIndex === 6) {
    return (
        <div className="fixed inset-0 z-[60] bg-white dark:bg-dark-bg md:relative md:z-0 md:inset-auto md:h-[calc(100vh-6rem)] w-full mx-auto md:rounded-3xl md:overflow-hidden md:border border-gray-200 dark:border-gray-700 shadow-2xl">
            <div className="h-12 border-b border-gray-200 dark:border-gray-700 flex justify-end items-center px-4">
                <button onClick={props.onExit} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400"><X size={20}/></button>
            </div>
            <LeetCodeRunner 
                plan={props.plan} 
                preferences={props.preferences} 
                language={props.language} 
                onSuccess={() => props.onComplete({ xp: 50, streak: 1 }, true, [])}
            />
        </div>
    );
  }

  const [phase, setPhase] = useState<RunnerPhase>('lesson');
  const [sessionMistakes, setSessionMistakes] = useState<MistakeRecord[]>([]);
  
  const handleEngineComplete = (stats: { xp: number; streak: number }, shouldSave: boolean, mistakes: MistakeRecord[]) => {
      setSessionMistakes(prev => [...prev, ...mistakes]);

      if (phase === 'lesson') {
          if (mistakes.length > 0 && !props.isReviewMode) {
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
  // This prevents "Dialogue" screens from being treated as "Correct" answerable questions
  const activeWidget = engine.currentScreen.widgets.find(w => 
    ['quiz', 'parsons', 'fill-in', 'steps-list'].includes(w.type) || 
    (w.type === 'flipcard' && w.flipcard?.mode === 'assessment')
  );
  
  const isInteractiveScreen = !!activeWidget;

  const handleCheck = () => {
    if (!isInteractiveScreen) {
        // If it's a passive screen (dialogue), just go next
        engine.nextScreen();
        return;
    }

    const isCorrect = validator.validate(activeWidget as Widget, widgetState);
    engine.checkAnswer(isCorrect);
  };

  const handleStartRepair = () => {
      // Create repair screens focusing ONLY on the failed widget
      // We prioritize widgets that are truly interactive.
      let mistakesToRepair = sessionMistakes.filter(m => m.widget && m.widget.type !== 'dialogue' && m.widget.type !== 'callout');
      
      // Fallback: If strict filter removes everything (e.g. only dialogue mistakes were recorded for some reason), 
      // just use everything so the user doesn't get skipped.
      if (mistakesToRepair.length === 0 && sessionMistakes.length > 0) {
          mistakesToRepair = sessionMistakes;
      }

      if (mistakesToRepair.length === 0) {
          // If truly no mistakes (should not happen if we are in this function), go to summary
          setPhase('summary');
          return;
      }
      
      const mistakeScreens: LessonScreen[] = mistakesToRepair.map((m) => ({
          id: `repair_${m.id}`,
          header: 'Mistake Repair',
          widgets: [m.widget!], // Only show the failed widget
          isRetry: true
      }));

      engine.startMistakeRepair(mistakeScreens);
      setPhase('mistake_loop');
  };

  const finishLesson = (satisfaction: boolean) => {
      if (!satisfaction && props.onRegenerate) {
          props.onRegenerate();
          return;
      }
      
      // Daily Celebration Logic
      // Check if this is the first time finishing a lesson today
      const today = new Date().toISOString().split('T')[0];
      const lastPlayedLocal = localStorage.getItem('algolingo_last_played_date');
      const isFirstTimeToday = lastPlayedLocal !== today;

      if (satisfaction && isFirstTimeToday) { 
          // Update local flag immediately
          localStorage.setItem('algolingo_last_played_date', today);
          // Go to celebration view. DO NOT call onComplete yet because it unmounts the component.
          setPhase('streak_celebration');
      } else {
          // Standard Exit: Call onComplete which saves data AND exits view via App.tsx
          props.onComplete({ xp: engine.xpGained, streak: engine.streak }, true, sessionMistakes);
      }
  };

  if (phase === 'mistake_intro') {
      return (
          <div className="fixed inset-0 z-[60] bg-white dark:bg-dark-bg md:relative md:z-0 md:inset-auto md:h-[calc(100vh-6rem)] md:max-w-4xl mx-auto md:rounded-3xl shadow-2xl overflow-hidden">
               <MistakeIntro count={sessionMistakes.length} onStart={handleStartRepair} language={props.language} />
          </div>
      );
  }

  if (phase === 'summary') {
      const hadMistakeLoop = sessionMistakes.length > 0 && !props.isReviewMode;
      const totalQuestions = hadMistakeLoop 
          ? props.plan.screens.length + sessionMistakes.length 
          : props.plan.screens.length;

      return (
        <div className="fixed inset-0 z-[60] bg-white dark:bg-dark-bg md:relative md:z-0 md:inset-auto md:h-[calc(100vh-6rem)] md:max-w-4xl mx-auto md:rounded-3xl shadow-2xl overflow-hidden">
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
      );
  }

  if (phase === 'streak_celebration') {
      // Use user stats from props + 1 (assuming streak maintained)
      const displayStreak = (props.stats?.streak || 0) + 1;
      
      return (
        <div className="fixed inset-0 z-[60] bg-white dark:bg-dark-bg md:relative md:z-0 md:inset-auto md:h-[calc(100vh-6rem)] md:max-w-4xl mx-auto md:rounded-3xl shadow-2xl overflow-hidden">
             <StreakCelebration 
                streak={displayStreak}
                history={props.stats.history || {}} 
                onContinue={() => {
                    // NOW call onComplete to save and exit
                    props.onComplete({ xp: engine.xpGained, streak: engine.streak }, true, sessionMistakes);
                }}
                language={props.language}
             />
        </div>
      );
  }

  if (showExitConfirm) {
      return (
           <div className="absolute inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
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

  return (
    <div className="fixed inset-0 z-[60] bg-white dark:bg-dark-bg flex flex-col md:relative md:z-0 md:inset-auto md:h-[calc(100vh-6rem)] md:max-w-4xl mx-auto md:rounded-3xl md:overflow-hidden md:border border-gray-200 dark:border-gray-700 shadow-2xl transition-all">
      
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

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-32 md:pb-32 w-full bg-gray-50/30 dark:bg-dark-bg/30">
          <div className="mx-auto max-w-2xl transition-all duration-300">
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
  );
};