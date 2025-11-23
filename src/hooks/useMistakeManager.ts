import { useState, useCallback } from 'react';
import { LessonScreen, MistakeRecord, Widget } from '../types';

export const useMistakeManager = () => {
    const [sessionMistakes, setSessionMistakes] = useState<MistakeRecord[]>([]);
    const [retryQueue, setRetryQueue] = useState<LessonScreen[]>([]);
    const [isInMistakeLoop, setIsInMistakeLoop] = useState(false);

    const recordMistake = useCallback((screen: LessonScreen, problemName: string, nodeIndex: number) => {
        // STRICTER FINDER: Prioritize true interactive widgets.
        // We explicitly look for widgets that have a 'correct' answer state.
        const interactiveTypes = ['quiz', 'parsons', 'fill-in', 'leetcode', 'steps-list'];
        
        let targetWidget: Widget | undefined = screen.widgets.find(w => 
            interactiveTypes.includes(w.type) || 
            (w.type === 'flipcard' && w.flipcard?.mode === 'assessment')
        );

        // If no strict interactive widget found, check for ANY widget that isn't purely decorative.
        // We strictly exclude 'dialogue', 'callout', and static 'code' from being the "mistake" source.
        if (!targetWidget) {
            targetWidget = screen.widgets.find(w => 
                !['dialogue', 'callout', 'code'].includes(w.type)
            );
        }

        // If we still found nothing (e.g. screen is ONLY dialogue), do not record a mistake.
        // This prevents "Bubble pages" from being counted.
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
            timestamp: Date.now()
        };

        setSessionMistakes(prev => {
            // Deduplicate: Don't add if we just added this exact widget ID
            const last = prev[prev.length - 1];
            if (last && last.widget?.id === targetWidget?.id) return prev;
            return [...prev, newRecord];
        });

        // Add to immediate retry queue (if not already in loop)
        setRetryQueue(prev => {
            if (prev.find(s => s.id === screen.id || s.id === `retry_${screen.id}`)) return prev;
            
            // Create a dedicated retry screen containing ONLY the failed widget to focus attention
            const retryScreen: LessonScreen = { 
                id: `retry_${screen.id}_${Date.now()}`,
                header: `Retry: ${screen.header || 'Concept'}`,
                widgets: [targetWidget!], // Only show the interactive part
                isRetry: true
            };
            
            return [...prev, retryScreen];
        });
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
        startReviewLoop,
        clearQueue
    };
};