
import React from 'react';
import { Widget } from '../../../types';
import { BaseWidget } from '../BaseWidget';
import { Bot, Check } from 'lucide-react';
import { MarkdownText } from '../../common/MarkdownText';

interface QuizProps {
    widget: Widget;
    selectedIdx: number | null;
    onSelect: (i: number) => void;
    status: string;
}

export const QuizWidget: React.FC<QuizProps> = ({ widget, selectedIdx, onSelect, status }) => {
    if (!widget.quiz) return null;
    const correctIdx = widget.quiz.correctIndex;
    const correctOptionText = widget.quiz.options[correctIdx];

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
                {(widget.quiz.options || []).map((opt, idx) => {
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

            {/* Explicit Answer Box for Wrong State */}
            {status === 'wrong' && (
                 <div className="ml-14 mt-6 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-900/50 rounded-xl animate-fade-in-up shadow-sm flex items-start gap-3">
                    <Check size={18} className="text-green-600 dark:text-green-400 mt-0.5 shrink-0"/>
                    <div>
                        <h4 className="text-green-800 dark:text-green-300 font-extrabold text-xs uppercase mb-1 tracking-wider">
                            Correct Answer
                        </h4>
                        <div className="font-medium text-green-700 dark:text-green-200 text-sm">
                            <MarkdownText content={correctOptionText} />
                        </div>
                    </div>
                 </div>
            )}
        </BaseWidget>
    )
}
