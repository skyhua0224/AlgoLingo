
import { useState, useCallback } from 'react';
import { LessonScreen, MistakeRecord, Widget } from '../types';

export const useMistakeManager = () => {
    const [sessionMistakes, setSessionMistakes] = useState<MistakeRecord[]>([]);
    const [retryQueue, setRetryQueue] = useState<LessonScreen[]>([]);
    const [isInMistakeLoop, setIsInMistakeLoop] = useState(false);

    const recordMistake = useCallback((screen: LessonScreen, problemName: string, nodeIndex: number) => {
        // STRICT FILTER: Only record truly interactive widgets.
        // This prevents "Dialogue" bubbles or "Callouts" from appearing as empty/broken exercises in Review Mode.
        const interactiveTypes = ['quiz', 'parsons', 'fill-in', 'interactive-code', 'leetcode', 'steps-list'];
        
        let targetWidget: Widget | undefined = screen.widgets.find(w => 
            interactiveTypes.includes(w.type) || 
            (w.type === 'flipcard' && w.flipcard?.mode === 'assessment')
        );

        // If the screen contains NO interactive widget (e.g., purely instructional dialogue), 
        // DO NOT record a mistake. You cannot "fail" a conversation.
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
            // Deduplicate: Don't add if we just added this exact widget ID
            const last = prev[prev.length - 1];
            if (last && last.widget?.id === targetWidget?.id) return prev;
            return [...prev, newRecord];
        });

        // Add to immediate retry queue (if not already in loop)
        setRetryQueue(prev => {
            // Avoid duplicate screens in queue by ID
            if (prev.find(s => s.id === screen.id || s.id === `retry_${screen.id}`)) return prev;
            
            // Create a dedicated retry screen containing ONLY the failed widget to focus attention
            // This ensures in review mode, the user sees the problem, not the surrounding fluff.
            const retryScreen: LessonScreen = { 
                id: `retry_${screen.id}_${Date.now()}`,
                header: `Retry: ${screen.header || 'Concept'}`,
                widgets: [targetWidget!], 
                isRetry: true
            };
            
            return [...prev, retryScreen];
        });
    }, []);

    // NEW: Undo the last mistake (used for Appeals)
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

    return {
        sessionMistakes,
        retryQueue,
        isInMistakeLoop,
        hasPendingMistakes: retryQueue.length > 0,
        recordMistake,
        removeLastMistake,
        startReviewLoop,
        clearQueue
    };
};
