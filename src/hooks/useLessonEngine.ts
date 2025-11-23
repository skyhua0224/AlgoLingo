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
    
    // Gamification State
    const [streak, setStreak] = useState(0);
    const [xpGained, setXpGained] = useState(0);

    // Helpers
    const mistakeManager = useMistakeManager();
    const timer = useTimer(status !== 'correct' && status !== 'wrong'); // Pause timer on feedback

    const currentScreen = screens[currentIndex];
    const isLastScreen = currentIndex === screens.length - 1;

    // --- Actions ---

    const handleCheck = useCallback((isCorrect: boolean) => {
        if (isCorrect) {
            setStatus('correct');
            setStreak(s => s + 1);
            setXpGained(x => x + 10);
        } else {
            setStatus('wrong');
            setStreak(0);
            // Record mistake
            mistakeManager.recordMistake(currentScreen, plan.title, nodeIndex);
        }
    }, [currentScreen, plan.title, nodeIndex, mistakeManager]);

    const handleNext = useCallback(() => {
        setStatus('idle');

        if (!isLastScreen) {
            // Normal progression
            setCurrentIndex(prev => prev + 1);
        } else {
            // End of current queue
            // Check if we need to enter Mistake Loop (Review Phase)
            // Condition: We have pending mistakes, we are NOT already in review mode (external), 
            // and we are NOT already in the internal mistake loop.
            if (mistakeManager.hasPendingMistakes && !isReviewMode && !mistakeManager.isInMistakeLoop) {
                
                mistakeManager.startReviewLoop();
                
                // Append mistakes to the END of the screen list
                setScreens(prev => [...prev, ...mistakeManager.retryQueue]);
                
                // Clear the queue so we don't re-add them later (they are now in the main screen list)
                mistakeManager.clearQueue();
                
                // Move to next screen (which is the first mistake)
                setCurrentIndex(prev => prev + 1);

            } else {
                // Lesson Complete
                onComplete(
                    { xp: xpGained, streak },
                    true, // shouldSave
                    mistakeManager.sessionMistakes
                );
            }
        }
    }, [isLastScreen, mistakeManager, isReviewMode, onComplete, xpGained, streak]);

    const retryCurrent = useCallback(() => {
        setStatus('idle');
        // No index change, just UI reset
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
    };
};