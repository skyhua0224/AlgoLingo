
import { useState, useCallback } from 'react';
import { LessonPlan, LessonScreen, MistakeRecord } from '../types';
import { useMistakeManager } from './useMistakeManager';
import { useTimer } from './useTimer';

interface UseLessonEngineProps {
    plan: LessonPlan;
    nodeIndex: number;
    onComplete: (stats: { xp: number; streak: number }, shouldSave: boolean, mistakes: MistakeRecord[]) => void;
    isReviewMode?: boolean; // If true, typically disables the loop unless overridden
    allowMistakeLoop?: boolean; // Force enable loop even in review mode (for Drills)
    maxMistakes?: number; 
}

export type EngineStatus = 'idle' | 'correct' | 'wrong';

export interface ExamResult {
    screenIndex: number;
    isCorrect: boolean;
    userState: any;
}

export const useLessonEngine = ({ plan, nodeIndex, onComplete, isReviewMode = false, allowMistakeLoop = false, maxMistakes }: UseLessonEngineProps) => {
    // Core State
    const [screens, setScreens] = useState<LessonScreen[]>(plan.screens || []);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [status, setStatus] = useState<EngineStatus>('idle');
    const [isFinished, setIsFinished] = useState(false);
    const [isFailed, setIsFailed] = useState(false);
    const [isLimitDisabled, setIsLimitDisabled] = useState(false);
    
    // Exam State
    const [examHistory, setExamHistory] = useState<ExamResult[]>([]);
    
    // Gamification State
    const [streak, setStreak] = useState(0);
    const [xpGained, setXpGained] = useState(0);

    // Helpers
    const mistakeManager = useMistakeManager();
    const timer = useTimer(status !== 'correct' && status !== 'wrong' && !isFinished && !isFailed);

    const currentScreen = screens[currentIndex];
    const isLastScreen = currentIndex === screens.length - 1;

    // --- Actions ---

    const startMistakeRepair = useCallback((mistakeScreens: LessonScreen[]) => {
        setScreens(mistakeScreens);
        setCurrentIndex(0);
        setStatus('idle');
        setIsFinished(false);
        setIsFailed(false);
        mistakeManager.startReviewLoop();
    }, [mistakeManager]);

    const continueAsPractice = useCallback(() => {
        setIsFailed(false);
        setIsLimitDisabled(true);
    }, []);

    const replaceCurrentScreen = useCallback((newScreen: LessonScreen) => {
        setScreens(prev => {
            const updated = [...prev];
            updated[currentIndex] = newScreen;
            return updated;
        });
        setStatus('idle');
    }, [currentIndex]);

    const rectifyMistake = useCallback(() => {
        setStatus('correct');
        setStreak(s => s === 0 ? 1 : s + 1);
        setXpGained(x => x + 10);
        mistakeManager.removeLastMistake();
    }, [mistakeManager]);

    const handleCheck = useCallback((isCorrect: boolean) => {
        if (isCorrect) {
            setStatus('correct');
            setStreak(s => s + 1);
            setXpGained(x => x + 10);
        } else {
            setStatus('wrong');
            setStreak(0);
            
            if (mistakeManager.isInMistakeLoop) {
                // In repair loop: Push copy to end to ensure mastery
                setScreens(prev => [...prev, { ...currentScreen, id: currentScreen.id + '_retry_' + Date.now() }]);
            } else {
                // Normal mode
                mistakeManager.recordMistake(currentScreen, plan.title, nodeIndex);
            }
        }
    }, [currentScreen, plan.title, nodeIndex, mistakeManager, mistakeManager.isInMistakeLoop]);

    const submitExamAnswer = useCallback((isCorrect: boolean, userState: any) => {
        const result: ExamResult = {
            screenIndex: currentIndex,
            isCorrect,
            userState
        };
        
        setExamHistory(prev => [...prev, result]);
        
        if (!isCorrect) {
            mistakeManager.recordMistake(currentScreen, plan.title, nodeIndex);
        } else {
            setXpGained(x => x + 10);
        }

        if (!isLastScreen) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setIsFinished(true);
            // In Exam Mode, we usually want to show a specific Exam Summary, 
            // handled by LessonRunner checking (currentIndex >= totalScreens)
            setCurrentIndex(prev => prev + 1); 
        }
    }, [currentIndex, currentScreen, isLastScreen, mistakeManager, nodeIndex, plan.title, xpGained, streak]);

    const handleNext = useCallback(() => {
        // Failure Check
        if (maxMistakes !== undefined && !isLimitDisabled) {
            if (mistakeManager.sessionMistakes.length > maxMistakes) {
                setIsFailed(true);
                return;
            }
        }

        if (isFailed) return;

        if (!isLastScreen) {
            setStatus('idle');
            setCurrentIndex(prev => prev + 1);
        } else {
            // --- LOOP LOGIC FIXED ---
            const shouldEnterLoop = mistakeManager.hasPendingMistakes && !mistakeManager.isInMistakeLoop && (!isReviewMode || allowMistakeLoop);

            if (shouldEnterLoop) {
                mistakeManager.startReviewLoop();
                setScreens(prev => [...prev, ...mistakeManager.retryQueue]);
                mistakeManager.clearQueue();
                setCurrentIndex(prev => prev + 1);
                setStatus('idle');
            } else {
                // CRITICAL FIX: Increment index to trigger LessonSummary in parent component
                setIsFinished(true);
                setCurrentIndex(prev => prev + 1);
            }
        }
    }, [isLastScreen, xpGained, streak, mistakeManager, isFailed, maxMistakes, isLimitDisabled, isReviewMode, allowMistakeLoop]);

    const retryCurrent = useCallback(() => {
        setStatus('idle');
    }, []);

    return {
        currentScreen,
        currentIndex,
        totalScreens: screens.length,
        status,
        streak,
        xpGained,
        timerSeconds: timer.seconds,
        isMistakeLoop: mistakeManager.isInMistakeLoop,
        mistakeCount: mistakeManager.sessionMistakes.length,
        isFailed,
        isLimitDisabled,
        examHistory,
        checkAnswer: handleCheck,
        nextScreen: handleNext,
        retryCurrent,
        startMistakeRepair,
        continueAsPractice,
        submitExamAnswer,
        replaceCurrentScreen,
        rectifyMistake
    };
};
