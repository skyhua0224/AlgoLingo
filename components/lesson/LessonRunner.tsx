
import React, { useState, useEffect } from 'react';
import { LessonPlan, MistakeRecord, UserPreferences, Widget, LessonScreen, UserStats, LeetCodeContext } from '../../types';
import { useLessonEngine, ExamResult } from '../../hooks/useLessonEngine';
import { useWidgetValidator, WidgetState } from '../../hooks/useWidgetValidator';
import { regenerateLessonScreen, verifyAnswerDispute } from '../../services/geminiService';
import { LessonHeader } from './LessonHeader';
import { LessonFooter } from './LessonFooter';
import { LeetCodeRunner } from './LeetCodeRunner';
import { MistakeIntro } from './MistakeIntro';
import { LessonSummary, SummaryAction } from './LessonSummary';
import { ExamSummary } from './ExamSummary'; 
import { StreakCelebration } from './StreakCelebration';
import { GlobalAiAssistant } from '../GlobalAiAssistant';
import { Button } from '../Button';
import { LogOut, X, HeartCrack, AlertTriangle, ArrowRight, RefreshCw, AlertCircle, Wand2, ShieldCheck, HelpCircle, Loader2, CheckCircle2, FileText, ChevronRight, MessageSquare } from 'lucide-react';
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
import { TerminalWidget } from '../widgets/Terminal';
import { CodeWalkthroughWidget } from '../widgets/CodeWalkthrough';
import { MiniEditorWidget } from '../widgets/MiniEditor';
import { MermaidVisualWidget } from '../widgets/MermaidVisual';
import { VisualQuizWidget } from '../widgets/VisualQuiz';
import { ComparisonTableWidget } from '../widgets/ComparisonTable';
import { ComparisonCodeWidget } from '../widgets/ComparisonCode'; // NEW

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
  problemContext?: LeetCodeContext | null; 
  customSummaryActions?: SummaryAction[];
  allowMistakeLoop?: boolean;
}

type RunnerPhase = 'lesson' | 'mistake_intro' | 'mistake_loop' | 'summary' | 'streak_celebration' | 'exam_summary';

interface QualityIssue {
    type: 'lonely_dialogue' | 'broken_fillin' | 'bad_parsons' | 'empty_screen';
    reason: string;
    defaultPrompt: string;
}

export const LessonRunner: React.FC<LessonRunnerProps> = (props) => {
  const [showDescription, setShowDescription] = useState(false); 

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
                                onSuccess={() => props.onComplete({xp: 50, streak: 1}, true, [])}
                                onSaveDrillResult={(stats, mistakes) => props.onComplete(stats, true, mistakes)}
                                context={props.problemContext}
                            />
                        </div>
                    </div>
                </div>
                {renderDescriptionSidebar()}
            </div>
        </div>
    );
  }

  const { 
    currentScreen, currentIndex, totalScreens, status, streak, xpGained, timerSeconds, 
    checkAnswer, nextScreen, isMistakeLoop, mistakeCount, isFailed, isLimitDisabled, examHistory, submitExamAnswer, replaceCurrentScreen, rectifyMistake, startMistakeRepair
  } = useLessonEngine({
      plan: props.plan,
      nodeIndex: props.nodeIndex,
      onComplete: props.onComplete,
      isReviewMode: props.isReviewMode,
      allowMistakeLoop: props.allowMistakeLoop, // Pass allowance flag
      maxMistakes: (props.isSkipContext && !props.isReviewMode) ? 2 : undefined
  });

  const { validate } = useWidgetValidator();
  
  const [quizSelection, setQuizSelection] = useState<number | null>(null);
  const [fillInAnswers, setFillInAnswers] = useState<string[]>([]);
  const [parsonsOrder, setParsonsOrder] = useState<string[]>([]);
  const [stepsOrder, setStepsOrder] = useState<string[]>([]);
  const [miniEditorValid, setMiniEditorValid] = useState(false);

  // Appeal State
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [userReason, setUserReason] = useState("");
  const [isAppealing, setIsAppealing] = useState(false);
  const [appealStatus, setAppealStatus] = useState<'idle' | 'loading' | 'success' | 'rejected'>('idle');
  const [appealExplanation, setAppealExplanation] = useState('');

  const [isRegenerating, setIsRegenerating] = useState(false);
  const [qualityIssue, setQualityIssue] = useState<QualityIssue | null>(null);

  useEffect(() => {
    setQuizSelection(null);
    setFillInAnswers([]);
    setParsonsOrder([]);
    setStepsOrder([]);
    setMiniEditorValid(false);
    setQualityIssue(null);
    setShowAppealModal(false); // Reset modal on new screen
    setAppealStatus('idle');
    setIsAppealing(false);
    setUserReason("");
    
    if (currentScreen && currentScreen.widgets.length === 1 && currentScreen.widgets[0].type === 'dialogue') {
        setQualityIssue({ 
            type: 'lonely_dialogue', 
            reason: "This screen only has text. Add an interactive element.", 
            defaultPrompt: "Add a 'quiz' or 'interactive-code' widget to follow this dialogue." 
        });
    }
  }, [currentScreen?.id]);

  const handleCheck = () => {
    const state: WidgetState = { quizSelection, fillInAnswers, parsonsOrder, stepsOrder, miniEditorValid };
    const targetWidget = currentScreen.widgets.find(w => 
        ['quiz', 'parsons', 'fill-in', 'steps-list', 'mini-editor', 'visual-quiz', 'terminal', 'interactive-code'].includes(w.type) ||
        (w.type === 'flipcard' && w.flipcard?.mode === 'assessment')
    );

    let isCorrect = true;
    if (targetWidget) {
        if (targetWidget.type === 'interactive-code') {
             isCorrect = true; 
        } else {
             isCorrect = validate(targetWidget, state);
        }
    }

    if (props.plan.context?.type === 'career_exam') {
        submitExamAnswer(isCorrect, state);
    } else {
        checkAnswer(isCorrect);
    }
  };

  const openAppealModal = () => {
      setShowAppealModal(true);
  }

  const confirmAppeal = async () => {
      if (!userReason.trim()) return;
      setShowAppealModal(false);
      setAppealStatus('loading');
      setIsAppealing(true);
      
      const targetWidget = currentScreen.widgets.find(w => 
        ['quiz', 'parsons', 'fill-in'].includes(w.type)
      );
      
      if (!targetWidget) return;

      // Construct user's attempted answer for context
      let attemptedAnswer = "";
      if (targetWidget.type === 'quiz' && quizSelection !== null && targetWidget.quiz) attemptedAnswer = targetWidget.quiz.options[quizSelection];
      if (targetWidget.type === 'fill-in') attemptedAnswer = fillInAnswers.join(", ");
      if (targetWidget.type === 'parsons') attemptedAnswer = parsonsOrder.join("\n");

      // Append reasoning
      const fullAppealContext = `User Attempt: "${attemptedAnswer}". User Argument: "${userReason}"`;

      try {
          const result = await verifyAnswerDispute(
              targetWidget, 
              fullAppealContext, 
              `${props.plan.title} - ${currentScreen.header}`, 
              props.preferences
          );
          
          if (result.verdict === 'correct') {
              setAppealStatus('success');
              setAppealExplanation(result.explanation || "Appeal accepted by AI Judge.");
              rectifyMistake();
          } else {
              setAppealStatus('rejected');
              setAppealExplanation(result.explanation || "Appeal rejected.");
          }
      } catch (e) {
          setAppealStatus('rejected');
          setAppealExplanation("Judge disconnected.");
      }
  };

  const handleRegenerateScreen = async (instruction: string) => {
      if (!currentScreen || isRegenerating) return;
      setIsRegenerating(true);
      
      try {
          const planContext = props.plan.context || {};
          if (!planContext.topic) planContext.topic = props.plan.title;

          const newScreen = await regenerateLessonScreen(
              currentScreen,
              planContext,
              instruction, 
              props.preferences
          );
          
          replaceCurrentScreen(newScreen);
          setQualityIssue(null);
      } catch (e) {
          alert("Regeneration failed. Please try again.");
      } finally {
          setIsRegenerating(false);
      }
  };

  if (isFailed) {
      return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-red-50 dark:bg-dark-bg animate-scale-in">
              <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 text-red-500 shadow-xl">
                  <HeartCrack size={48} />
              </div>
              <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-2">
                  {props.language === 'Chinese' ? "挑战失败" : "Challenge Failed"}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
                  {props.language === 'Chinese' 
                   ? "错误次数过多。建议先从基础课程开始复习。" 
                   : "Too many mistakes. We recommend reviewing the basics first."}
              </p>
              
              <div className="flex flex-col gap-3 w-full max-w-xs">
                  <Button onClick={() => startMistakeRepair(props.plan.screens)} variant="primary" className="w-full">
                      {props.language === 'Chinese' ? "进入复习模式" : "Start Review Mode"}
                  </Button>
                  <button onClick={props.onExit} className="text-gray-400 font-bold text-sm hover:text-gray-600 p-2">
                      {props.language === 'Chinese' ? "退出" : "Exit"}
                  </button>
              </div>
          </div>
      );
  }

  if (props.plan.context?.type === 'career_exam' && (currentIndex >= totalScreens)) {
      return (
          <ExamSummary 
              screens={props.plan.screens} 
              results={examHistory} 
              score={xpGained}
              onClose={props.onExit}
              language={props.language}
          />
      );
  }

  if (currentIndex >= totalScreens) {
      return (
          <LessonSummary 
              stats={{ 
                  timeSeconds: timerSeconds, 
                  totalQuestions: totalScreens, 
                  correctCount: streak, 
                  mistakeCount: mistakeCount,
                  xpGained: xpGained 
              }}
              language={props.language}
              onContinue={(satisfied) => {
                  if (satisfied) props.onComplete({ xp: xpGained, streak }, true, []);
                  else props.onRegenerate && props.onRegenerate();
              }}
              customActions={props.customSummaryActions} 
          />
      );
  }

  const isZh = props.language === 'Chinese';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-dark-bg relative overflow-hidden">
        <LessonHeader 
            currentScreenIndex={currentIndex} 
            totalScreens={totalScreens} 
            streak={streak} 
            mistakeCount={mistakeCount} 
            timerSeconds={timerSeconds}
            isSkipMode={props.isSkipContext && !props.isReviewMode}
            isMistakeMode={isMistakeLoop} 
            isReviewContext={props.isReviewMode} 
            onExit={props.onExit}
            headerTitle={currentScreen.header}
            language={props.language}
            totalTime={props.plan.context?.timeLimit}
            onShowDescription={props.problemContext ? () => setShowDescription(true) : undefined}
        />

        <GlobalAiAssistant 
            problemName={props.plan.title} 
            preferences={props.preferences} 
            language={props.language} 
            currentPlan={props.plan} 
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pb-32 md:pb-32 relative">
            <div className="max-w-2xl mx-auto w-full">
                {qualityIssue && (
                    <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/10 border-2 border-yellow-100 dark:border-yellow-900/30 rounded-2xl p-4 flex items-start gap-3 animate-fade-in-down">
                        <Wand2 size={20} className="text-yellow-500 shrink-0 mt-0.5"/>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-400 mb-1">
                                {isZh ? "AI 建议优化此页面" : "AI Suggestion: Optimize Screen"}
                            </h4>
                            <p className="text-xs text-yellow-700 dark:text-yellow-500 mb-3 leading-relaxed">
                                {qualityIssue.reason}
                            </p>
                            <button 
                                onClick={() => handleRegenerateScreen(qualityIssue.defaultPrompt)}
                                disabled={isRegenerating}
                                className="px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 text-yellow-700 dark:text-yellow-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                            >
                                {isRegenerating ? <Loader2 size={12} className="animate-spin"/> : <RefreshCw size={12}/>}
                                {isZh ? "自动修复" : "Auto-Fix"}
                            </button>
                        </div>
                    </div>
                )}

                {currentScreen.widgets.map((widget, idx) => (
                    <React.Fragment key={widget.id}>
                        {widget.type === 'dialogue' && <DialogueWidget widget={widget} />}
                        {widget.type === 'flipcard' && <FlipCardWidget widget={widget} language={props.language} />}
                        {widget.type === 'callout' && <CalloutWidget widget={widget} />}
                        {widget.type === 'interactive-code' && <InteractiveCodeWidget widget={widget} language={props.language} />}
                        {widget.type === 'comparison-code' && <ComparisonCodeWidget widget={widget} language={props.language} />}
                        {widget.type === 'parsons' && <ParsonsWidget widget={widget} onUpdateOrder={setParsonsOrder} status={status} language={props.language} />}
                        {widget.type === 'fill-in' && <FillInWidget widget={widget} onUpdateAnswers={setFillInAnswers} language={props.language} status={status} />}
                        {widget.type === 'quiz' && <QuizWidgetPresenter widget={widget} selectedIdx={quizSelection} onSelect={setQuizSelection} status={status} language={props.language} />}
                        {widget.type === 'steps-list' && <StepsWidget widget={widget} onUpdateOrder={setStepsOrder} />}
                        {widget.type === 'terminal' && <TerminalWidget widget={widget} status={status} />}
                        {widget.type === 'code-walkthrough' && <CodeWalkthroughWidget widget={widget} />}
                        {widget.type === 'mini-editor' && <MiniEditorWidget widget={widget} onValidationChange={setMiniEditorValid} />}
                        {widget.type === 'mermaid' && <MermaidVisualWidget widget={widget} onRegenerate={handleRegenerateScreen} />}
                        {widget.type === 'visual-quiz' && <VisualQuizWidget widget={widget} />}
                        {widget.type === 'comparison-table' && <ComparisonTableWidget widget={widget} />}
                    </React.Fragment>
                ))}
            </div>
        </div>

        {/* Appeal Modal */}
        {showAppealModal && (
            <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in-up">
                <div className="bg-white dark:bg-dark-card rounded-3xl p-6 w-full max-w-md shadow-2xl border-2 border-orange-100 dark:border-orange-900/50">
                    <div className="mb-4 bg-orange-100 dark:bg-orange-900/30 w-12 h-12 rounded-full flex items-center justify-center text-orange-500">
                        <MessageSquare size={24} />
                    </div>
                    <h3 className="text-xl font-extrabold text-gray-800 dark:text-white mb-2">{isZh ? "申诉理由" : "Appeal Reason"}</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
                        {isZh ? "请简述为什么您的答案是正确的。AI 法官将根据理由重新裁定。" : "Why is your answer correct? AI Judge will review your case."}
                    </p>
                    
                    <textarea 
                        className="w-full h-32 p-3 bg-gray-50 dark:bg-black/20 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-brand outline-none resize-none mb-6 text-sm"
                        placeholder={isZh ? "例如：使用了不同的变量名..." : "e.g. Used synonym variable..."}
                        value={userReason}
                        onChange={(e) => setUserReason(e.target.value)}
                        autoFocus
                    />

                    <div className="flex gap-3">
                        <button onClick={() => setShowAppealModal(false)} className="flex-1 py-3 text-gray-500 font-bold text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
                            {isZh ? "取消" : "Cancel"}
                        </button>
                        <button 
                            onClick={confirmAppeal}
                            disabled={!userReason.trim()}
                            className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-orange-600 disabled:opacity-50"
                        >
                            {isZh ? "提交申诉" : "Submit Appeal"}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {isAppealing && (
            <div className="absolute bottom-24 left-0 right-0 px-6 z-[60] animate-slide-in-bottom">
                <div className={`max-w-xl mx-auto rounded-2xl shadow-2xl p-4 border-2 flex items-start gap-3 ${
                    appealStatus === 'loading' ? 'bg-white dark:bg-gray-800 border-gray-200' :
                    appealStatus === 'success' ? 'bg-green-50 dark:bg-green-900/30 border-green-200' :
                    'bg-red-50 dark:bg-red-900/30 border-red-200'
                }`}>
                    <div className="mt-0.5">
                        {appealStatus === 'loading' && <Loader2 size={20} className="animate-spin text-brand"/>}
                        {appealStatus === 'success' && <ShieldCheck size={20} className="text-green-500"/>}
                        {appealStatus === 'rejected' && <AlertCircle size={20} className="text-red-500"/>}
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-sm mb-1">
                            {appealStatus === 'loading' && (isZh ? "AI 法官正在审理..." : "AI Judge Reviewing...")}
                            {appealStatus === 'success' && (isZh ? "申诉成功！" : "Appeal Accepted!")}
                            {appealStatus === 'rejected' && (isZh ? "申诉被驳回" : "Appeal Rejected")}
                        </h4>
                        {appealStatus !== 'loading' && (
                            <p className="text-xs opacity-90 leading-relaxed">{appealExplanation}</p>
                        )}
                    </div>
                    {appealStatus !== 'loading' && (
                        <button onClick={() => setIsAppealing(false)} className="p-1 hover:bg-black/5 rounded">
                            <X size={16}/>
                        </button>
                    )}
                </div>
            </div>
        )}

        <LessonFooter 
            status={status} 
            onCheck={handleCheck} 
            onNext={nextScreen} 
            language={props.language} 
            isExamMode={props.plan.context?.type === 'career_exam'}
            isLastQuestion={currentIndex === totalScreens - 1}
            onRegenerate={handleRegenerateScreen}
            isRegenerating={isRegenerating}
            onReport={status === 'wrong' ? openAppealModal : undefined}
        />

        {renderDescriptionSidebar()}
    </div>
  );
};
