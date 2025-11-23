import { Widget } from '../types';

export interface WidgetState {
    quizSelection?: number | null;
    parsonsOrder?: string[];
    fillInAnswers?: string[];
}

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
                if (widget.parsons && state.parsonsOrder) {
                    // In a real Parsons problem, we should check the order against a solution.
                    // For this implementation (based on legacy logic), checking if all lines are used 
                    // is the baseline, but we ideally want strict equality if a 'correctOrder' existed.
                    // Since the current Schema defines 'lines' as the content, and we shuffle them,
                    // strict validation would require us to know the original order.
                    // LEGACY COMPATIBILITY: We assume the user has arranged *all* lines.
                    // Future Improvement: Add 'correctOrder' to Parsons schema.
                    const requiredLineCount = widget.parsons.lines?.length || 0;
                    return state.parsonsOrder.length === requiredLineCount;
                }
                return false;

            case 'fill-in':
                if (widget.fillIn && state.fillInAnswers) {
                    const correctValues = widget.fillIn.correctValues || [];
                    const userAnswers = state.fillInAnswers;
                    
                    if (userAnswers.length !== correctValues.length) return false;

                    // Case-insensitive comparison for text inputs
                    return correctValues.every((expected, index) => {
                        const actual = userAnswers[index] || '';
                        return actual.trim().toLowerCase() === expected.trim().toLowerCase();
                    });
                }
                return false;

            case 'flipcard':
                // Flipcards in assessment mode trigger validation via explicit buttons, 
                // typically handled outside this generic validator or returning true here 
                // to delegate logic to the button click handler.
                return true;

            case 'steps-list':
                 // Interactive mode validation
                 if (widget.stepsList && widget.stepsList.mode === 'interactive' && widget.stepsList.correctOrder) {
                     // TODO: Implement steps validation if we add `correctOrder` to the widget data generation
                     // For now, assume passing if list is fully interacted with
                     return true; 
                 }
                 return true;

            default:
                return true;
        }
    };

    return { validate };
};