
import React from 'react';
import { Widget } from '../../../types';
import { BaseWidget } from '../BaseWidget';
import { Bot, Check, CheckCircle2, X } from 'lucide-react';
import { MarkdownText } from '../../common/MarkdownText';

interface QuizProps {
    widget: Widget;
    selectedIdx: number | null;
    onSelect: (i: number) => void;
    status: string;
    language?: 'Chinese' | 'English'; // Added language prop
}

const WIDGET_LOCALE = {
    Chinese: {
        correctAnswer: "正确答案"
    },
    English: {
        correctAnswer: "Correct Answer"
    }
};

export const QuizWidget: React.FC<QuizProps> = ({ widget, selectedIdx, onSelect, status, language = 'English' }) => {
    if (!widget.quiz) return null;
    
    // --- ROBUSTNESS: Determine Correct Index ---
    let correctIdx = widget.quiz.correctIndex;
    const options = widget.quiz.options || [];

    // Handle case where AI returns "correctAnswer": "String Value" instead of correctIndex
    if (correctIdx === undefined || correctIdx === null) {
        const rawWidget = widget.quiz as any;
        if (rawWidget.correctAnswer) {
            // Try to find exact match
            const foundIdx = options.findIndex(opt => opt.trim() === rawWidget.correctAnswer.trim());
            if (foundIdx !== -1) {
                correctIdx = foundIdx;
            } else {
                // Try partial match (sometimes AI truncates)
                const partialIdx = options.findIndex(opt => opt.includes(rawWidget.correctAnswer) || rawWidget.correctAnswer.includes(opt));
                if (partialIdx !== -1) correctIdx = partialIdx;
            }
        }
    }

    // Fallback if we still don't have a valid index
    if (correctIdx === undefined || correctIdx < 0 || correctIdx >= options.length) {
        correctIdx = 0; // Safe fallback to prevent crash, though answer might be wrong visually
    }

    const correctOptionText = options[correctIdx];
    const t = WIDGET_LOCALE[language === 'Chinese' ? 'Chinese' : 'English'];

    return (
        <BaseWidget>
            <div className="flex gap-4 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm shrink-0 border-2 bg-brand text-white border-brand-dark">
                    <Bot size={20} />
                </div>
                <div className="bg-white dark:bg-dark-card border-2 border-gray-200 dark:border-gray-700 p-4 rounded-2xl rounded-tl-none shadow-sm text-gray-800 dark:text-dark-text font-bold text-sm md:text-base leading-relaxed">
                    <MarkdownText content={widget.quiz.question} />
                </div>
            </div>

            <div className="pl-14 space-y-3">
                {options.map((opt, idx) => {
                    let style = "border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400";
                    
                    // Idle: Highlight selected
                    if (status === 'idle' && selectedIdx === idx) {
                        style = "border-brand bg-brand-bg dark:bg-brand/20 text-brand-dark dark:text-brand-light ring-2 ring-brand ring-offset-1 dark:ring-offset-dark-bg";
                    }
                    
                    // Result: Correct Answer (Always highlight correct one in green)
                    if ((status === 'correct' || status === 'wrong') && idx === correctIdx) {
                        style = "border-green-500 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200";
                    }
                    
                    // Result: Wrong Selection (Highlight red)
                    if (status === 'wrong' && idx === selectedIdx && idx !== correctIdx) {
                        style = "border-red-500 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200";
                    }
                    
                    return (
                        <button 
                            key={idx} 
                            onClick={() => status === 'idle' && onSelect(idx)} 
                            className={`w-full text-left p-4 rounded-xl border-2 ${style} transition-all text-sm font-bold shadow-sm active:scale-[0.99]`}
                        >
                           <MarkdownText content={opt} />
                        </button>
                    )
                })}
            </div>

            {/* Answer & Explanation */}
            {(status === 'wrong' || (status === 'correct' && widget.quiz.explanation)) && (
                 <div className={`ml-14 mt-6 p-5 rounded-2xl animate-fade-in-up shadow-sm flex items-start gap-4 border-2 ${status === 'correct' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/50' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50'}`}>
                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-sm ${status === 'correct' ? 'bg-green-100 border-green-200 text-green-600 dark:bg-green-900/40 dark:border-green-800 dark:text-green-400' : 'bg-red-100 border-red-200 text-red-600 dark:bg-red-900/40 dark:border-red-800 dark:text-red-400'}`}>
                        {status === 'correct' ? <CheckCircle2 size={22} strokeWidth={2.5}/> : <X size={22} strokeWidth={2.5}/>}
                    </div>
                    
                    <div className="flex-1 pt-1">
                        {status === 'wrong' && (
                            <div className="mb-3">
                                <h4 className="text-red-800 dark:text-red-300 font-extrabold text-xs uppercase mb-1.5 tracking-wider">
                                    {t.correctAnswer}
                                </h4>
                                <div className="font-bold text-red-900 dark:text-red-100 text-sm bg-red-100/50 dark:bg-red-900/30 px-3 py-2 rounded-lg border border-red-100 dark:border-red-800 inline-block">
                                    <MarkdownText content={correctOptionText || "See option marked green"} />
                                </div>
                            </div>
                        )}
                        
                        {status === 'correct' && (
                             <h4 className="text-green-800 dark:text-green-300 font-extrabold text-sm uppercase mb-2 tracking-wider">
                                 {language === 'Chinese' ? "回答正确" : "Correct!"}
                             </h4>
                        )}
                        
                        {widget.quiz.explanation && (
                            <div className={`text-sm leading-relaxed ${status === 'wrong' ? 'pt-3 border-t border-red-200 dark:border-red-800 text-red-800 dark:text-red-200' : 'text-green-900 dark:text-green-100'}`}>
                                {status === 'wrong' && <div className="font-bold text-xs uppercase opacity-70 mb-1">Analysis</div>}
                                <MarkdownText content={widget.quiz.explanation} />
                            </div>
                        )}
                    </div>
                 </div>
            )}
        </BaseWidget>
    )
}
