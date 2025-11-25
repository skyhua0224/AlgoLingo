
import { useState, useCallback } from 'react';
import { LessonPlan, LessonScreen, MistakeRecord } from '../types';
import { useMistakeManager } from './useMistakeManager';
import { useTimer } from './useTimer';

interface UseLessonEngineProps {
    plan: LessonPlan;
    nodeIndex: number;
    onComplete: (stats: { xp: number; streak: number }, shouldSave: boolean, mistakes: MistakeRecord[]) => void;
    isReviewMode?: boolean;
    maxMistakes?: number; // Optional limit for Skip/Exam modes
}

export type EngineStatus = 'idle' | 'correct' | 'wrong';

export interface ExamResult {
    screenIndex: number;
    isCorrect: boolean;
    userState: any;
}

export const useLessonEngine = ({ plan, nodeIndex, onComplete, isReviewMode = false, maxMistakes }: UseLessonEngineProps) => {
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
        // Reset status so user can see the feedback or move on
        // We keep status as 'wrong' so they can see why they failed, 
        // or they can just click "Continue" in the footer.
    }, []);

    const handleCheck = useCallback((isCorrect: boolean) => {
        if (isCorrect) {
            setStatus('correct');
            setStreak(s => s + 1);
            setXpGained(x => x + 10);
        } else {
            setStatus('wrong');
            setStreak(0);
            
            // Check Failure Condition (Lives System)
            const currentMistakeCount = mistakeManager.sessionMistakes.length;
            
            // Only fail if limit is NOT disabled
            if (maxMistakes !== undefined && !isLimitDisabled && currentMistakeCount >= maxMistakes) {
                mistakeManager.recordMistake(currentScreen, plan.title, nodeIndex);
                setIsFailed(true);
                return; // Stop processing
            }

            if (mistakeManager.isInMistakeLoop) {
                // If in review mode and wrong, push copy to end of queue to ensure mastery
                setScreens(prev => [...prev, { ...currentScreen, id: currentScreen.id + '_retry_' + Date.now() }]);
            } else {
                // Normal mode: Record mistake
                mistakeManager.recordMistake(currentScreen, plan.title, nodeIndex);
            }
        }
    }, [currentScreen, plan.title, nodeIndex, mistakeManager, mistakeManager.isInMistakeLoop, maxMistakes, isLimitDisabled]);

    // Special handler for Exam Mode - Records result but does NOT change status (silent advance)
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

        // Auto advance
        if (!isLastScreen) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setIsFinished(true);
            onComplete(
                { xp: xpGained, streak },
                true, 
                mistakeManager.sessionMistakes
            );
        }
    }, [currentIndex, currentScreen, isLastScreen, mistakeManager, nodeIndex, onComplete, plan.title, xpGained, streak]);

    const handleNext = useCallback(() => {
        if (isFailed) return; // Block next if failed

        if (!isLastScreen) {
            setStatus('idle');
            setCurrentIndex(prev => prev + 1);
        } else {
            setIsFinished(true); // Stop timer
            onComplete(
                { xp: xpGained, streak },
                true, 
                mistakeManager.sessionMistakes
            );
        }
    }, [isLastScreen, onComplete, xpGained, streak, mistakeManager.sessionMistakes, isFailed]);

    const retryCurrent = useCallback(() => {
        setStatus('idle');
    }, []);

    return {
        // State
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
        
        // Actions
        checkAnswer: handleCheck,
        nextScreen: handleNext,
        retryCurrent,
        startMistakeRepair,
        continueAsPractice,
        submitExamAnswer
    };
};
