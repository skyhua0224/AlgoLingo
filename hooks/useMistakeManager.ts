
import { useState, useCallback } from 'react';
import { LessonScreen, MistakeRecord, Widget } from '../types';

// Helper: Fisher-Yates Shuffle
const shuffleArray = <T>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

export const useMistakeManager = () => {
    const [sessionMistakes, setSessionMistakes] = useState<MistakeRecord[]>([]);
    const [retryQueue, setRetryQueue] = useState<LessonScreen[]>([]);
    const [isInMistakeLoop, setIsInMistakeLoop] = useState(false);

    const recordMistake = useCallback((screen: LessonScreen, problemName: string, nodeIndex: number) => {
        // STRICT FILTER: Only record truly interactive widgets.
        const interactiveTypes = [
            'quiz', 'parsons', 'fill-in', 'interactive-code', 'leetcode', 'steps-list',
            'terminal', 'mini-editor', 'visual-quiz', 'code-walkthrough'
        ];
        
        let targetWidget: Widget | undefined = screen.widgets.find(w => 
            interactiveTypes.includes(w.type) || 
            (w.type === 'flipcard' && w.flipcard?.mode === 'assessment')
        );

        if (!targetWidget) {
            return;
        }

        const newRecord: MistakeRecord = {
            id: `${Date.now()}-${Math.random()}`,
            problemName,
            nodeIndex,
            questionType: targetWidget.type,
            context: screen.header || 'Practice',
            widget: targetWidget,
            timestamp: Date.now(),
            reviewCount: 0
        };

        setSessionMistakes(prev => {
            const last = prev[prev.length - 1];
            if (last && last.widget?.id === targetWidget?.id) return prev;
            return [...prev, newRecord];
        });

        // Add to retry queue (Logic remains same, but we will shuffle when accessing)
        setRetryQueue(prev => {
            if (prev.find(s => s.id === screen.id || s.id === `retry_${screen.id}`)) return prev;
            
            const retryScreen: LessonScreen = { 
                id: `retry_${screen.id}_${Date.now()}`,
                header: `Retry: ${screen.header || 'Concept'}`,
                widgets: [targetWidget!], 
                isRetry: true
            };
            
            return [...prev, retryScreen];
        });
    }, []);

    const removeLastMistake = useCallback(() => {
        setSessionMistakes(prev => prev.slice(0, -1));
        setRetryQueue(prev => prev.slice(0, -1));
    }, []);

    const startReviewLoop = useCallback(() => {
        setIsInMistakeLoop(true);
    }, []);

    const clearQueue = useCallback(() => {
        setRetryQueue([]);
    }, []);

    // New Helper: Get Shuffled Queue
    const getMistakeScreens = useCallback(() => {
        return shuffleArray(retryQueue);
    }, [retryQueue]);

    return {
        sessionMistakes,
        retryQueue,
        getMistakeScreens, // Export this
        isInMistakeLoop,
        hasPendingMistakes: retryQueue.length > 0,
        recordMistake,
        removeLastMistake,
        startReviewLoop,
        clearQueue
    };
};
