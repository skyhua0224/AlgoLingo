
import { Widget } from '../types';

export interface WidgetState {
    quizSelection?: number | null;
    parsonsOrder?: string[];
    fillInAnswers?: string[];
    stepsOrder?: string[];
}

// Helper to match the cleaning logic in ParsonsWidget
const cleanCodeLine = (line: string) => {
    // 1. Remove comments
    let cleaned = line.replace(/\s*#.*$/, '').replace(/\s*\/\/.*$/, '');
    // 2. Remove trailing semicolons and braces (open or close)
    cleaned = cleaned.replace(/[;{}]+$/, '');
    // 3. Trim whitespace
    return cleaned.trim();
};

// Helper to normalize strings for comparison (removes all whitespace, lowercase)
const normalize = (str: string) => str.replace(/\s+/g, '').toLowerCase();

export const useWidgetValidator = () => {
    const validate = (widget: Widget, state: WidgetState): boolean => {
        if (!widget) return true; // Non-interactive widgets pass automatically

        switch (widget.type) {
            case 'quiz':
                if (widget.quiz && state.quizSelection !== undefined && state.quizSelection !== null) {
                    return state.quizSelection === widget.quiz.correctIndex;
                }
                return false;

            case 'parsons':
                if (widget.parsons && state.parsonsOrder && widget.parsons.lines) {
                    // 1. Get the Correct Order (The original lines from the AI plan)
                    const expectedOrder = widget.parsons.lines
                        .map(cleanCodeLine)
                        .filter(l => l.length > 0);

                    const userOrder = state.parsonsOrder;

                    // 2. Strict Comparison
                    if (userOrder.length !== expectedOrder.length) return false;

                    for (let i = 0; i < expectedOrder.length; i++) {
                        if (userOrder[i] !== expectedOrder[i]) {
                            return false;
                        }
                    }
                    return true;
                }
                return false;

            case 'fill-in':
                if (widget.fillIn && state.fillInAnswers) {
                    const correctValues = widget.fillIn.correctValues || [];
                    const userAnswers = state.fillInAnswers;
                    
                    if (userAnswers.length !== correctValues.length) return false;

                    // Case-insensitive + Whitespace-insensitive comparison
                    return correctValues.every((expected, index) => {
                        const actual = userAnswers[index] || '';
                        return normalize(actual) === normalize(expected);
                    });
                }
                return false;

            case 'flipcard':
                return true; // Handled by specific event handlers in LessonRunner

            case 'steps-list':
                 if (widget.stepsList && widget.stepsList.mode === 'interactive') {
                     if (state.stepsOrder && state.stepsOrder.length > 0) {
                         // If correctOrder is provided by AI, perform strict check
                         if (widget.stepsList.correctOrder && widget.stepsList.correctOrder.length > 0) {
                             return JSON.stringify(state.stepsOrder) === JSON.stringify(widget.stepsList.correctOrder);
                         }
                         // Fallback: Logic flow assumes interaction occurred and all items present
                         return state.stepsOrder.length === widget.stepsList.items.length;
                     }
                     return false; 
                 }
                 return true;

            default:
                return true;
        }
    };

    return { validate };
};
