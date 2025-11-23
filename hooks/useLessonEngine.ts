
import { useState, useCallback } from 'react';
import { LessonPlan, LessonScreen, MistakeRecord } from '../types';
import { useMistakeManager } from './useMistakeManager';
import { useTimer } from './useTimer';

interface UseLessonEngineProps {
    plan: LessonPlan;
    nodeIndex: number;
    onComplete: (stats: { xp: number; streak: number }, shouldSave: boolean, mistakes: MistakeRecord[]) => void;
    isReviewMode?: boolean;
}

export type EngineStatus = 'idle' | 'correct' | 'wrong';

export const useLessonEngine = ({ plan, nodeIndex, onComplete, isReviewMode = false }: UseLessonEngineProps) => {
    // Core State
    const [screens, setScreens] = useState<LessonScreen[]>(plan.screens || []);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [status, setStatus] = useState<EngineStatus>('idle');
    const [isFinished, setIsFinished] = useState(false);
    
    // Gamification State
    const [streak, setStreak] = useState(0);
    const [xpGained, setXpGained] = useState(0);

    // Helpers
    const mistakeManager = useMistakeManager();
    const timer = useTimer(status !== 'correct' && status !== 'wrong' && !isFinished);

    const currentScreen = screens[currentIndex];
    const isLastScreen = currentIndex === screens.length - 1;

    // --- Actions ---

    const startMistakeRepair = useCallback((mistakeScreens: LessonScreen[]) => {
        setScreens(mistakeScreens);
        setCurrentIndex(0);
        setStatus('idle');
        setIsFinished(false);
        mistakeManager.startReviewLoop();
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
                // If in review mode and wrong, push copy to end of queue to ensure mastery
                setScreens(prev => [...prev, { ...currentScreen, id: currentScreen.id + '_retry_' + Date.now() }]);
            } else {
                // Normal mode: Record mistake
                mistakeManager.recordMistake(currentScreen, plan.title, nodeIndex);
            }
        }
    }, [currentScreen, plan.title, nodeIndex, mistakeManager, mistakeManager.isInMistakeLoop]);

    const handleNext = useCallback(() => {
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
    }, [isLastScreen, onComplete, xpGained, streak, mistakeManager.sessionMistakes]);

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
        
        // Actions
        checkAnswer: handleCheck,
        nextScreen: handleNext,
        retryCurrent,
        startMistakeRepair
    };
};
