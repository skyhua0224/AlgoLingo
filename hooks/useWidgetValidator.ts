
import { Widget } from '../types';

export interface WidgetState {
    quizSelection?: number | null;
    parsonsOrder?: string[];
    fillInAnswers?: string[];
    stepsOrder?: string[];
    miniEditorValid?: boolean;
}

// Helper to match the cleaning logic in ParsonsWidget
const cleanCodeLine = (line: string | any) => {
    // Safety check for non-string inputs
    let text = line;
    if (typeof text !== 'string') {
        if (text && typeof text === 'object') {
            text = text.code || text.content || text.text || JSON.stringify(text);
        } else {
            text = String(text || '');
        }
    }

    // 1. Remove comments
    let cleaned = text.replace(/\s*#.*$/, '').replace(/\s*\/\/.*$/, '');
    
    // 2. Trim whitespace
    cleaned = cleaned.trim();
    
    // 3. Remove trailing semicolons (Standard Parsons practice)
    cleaned = cleaned.replace(/;+$/, '');
    
    // 4. Handle pure closing braces (e.g. "}", "};")
    // These are usually structural noise in Parsons and are removed.
    if (cleaned === '}' || cleaned === '};') {
        return ''; 
    }
    
    // 5. Smart Brace Handling
    // We want to remove '{' if it's a block opener (e.g. "if (x) {")
    // But we MUST PRESERVE '{' if it's data initialization (e.g. "map = {", "return {", "new int[] {")
    if (cleaned.endsWith('{')) {
        const trimmedWithoutBrace = cleaned.slice(0, -1).trim();
        const lastChar = trimmedWithoutBrace.slice(-1);
        
        // Symbols that imply data structure or assignment usually precede a brace we want to KEEP.
        // = (Assignment)
        // : (Dict/JSON)
        // , (List item)
        // [ (Array)
        // ( (Function call arg)
        // Also 'return' keyword
        if (!['=', ':', ',', '[', '('].includes(lastChar) && !trimmedWithoutBrace.endsWith('return')) {
             cleaned = trimmedWithoutBrace;
        }
    }
    
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

            case 'mini-editor':
                return !!state.miniEditorValid;

            default:
                return true;
        }
    };

    return { validate };
};
