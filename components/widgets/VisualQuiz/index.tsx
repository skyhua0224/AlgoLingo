
import React, { useState } from 'react';
import { Widget } from '../../../types';
import { BaseWidget } from '../BaseWidget';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import * as Icons from 'lucide-react';

interface VisualQuizProps {
    widget: Widget;
}

export const VisualQuizWidget: React.FC<VisualQuizProps> = ({ widget }) => {
    if (!widget.visualQuiz) return null;
    const { question, options, correctId, explanation } = widget.visualQuiz;
    
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const isCorrect = selectedId === correctId;
    const hasAnswered = selectedId !== null;

    // Helper to render dynamic icon
    const renderIcon = (name: string | undefined) => {
        if (!name) return <HelpCircle size={32} />;
        const IconComp = (Icons as any)[name] || Icons.HelpCircle;
        return <IconComp size={32} />;
    };

    return (
        <BaseWidget>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 text-center">
                {question}
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
                {options.map((opt) => {
                    const isSelected = selectedId === opt.id;
                    const isTargetCorrect = opt.id === correctId;
                    
                    let borderColor = 'border-gray-200 dark:border-gray-700';
                    let bgClass = 'bg-white dark:bg-dark-card hover:border-brand/50';
                    
                    if (hasAnswered) {
                        if (isTargetCorrect) {
                            borderColor = 'border-green-500';
                            bgClass = 'bg-green-50 dark:bg-green-900/20';
                        } else if (isSelected && !isTargetCorrect) {
                            borderColor = 'border-red-500';
                            bgClass = 'bg-red-50 dark:bg-red-900/20';
                        } else {
                            bgClass = 'opacity-50 grayscale';
                        }
                    } else if (isSelected) {
                        borderColor = 'border-brand';
                    }

                    return (
                        <button
                            key={opt.id}
                            disabled={hasAnswered}
                            onClick={() => setSelectedId(opt.id)}
                            className={`
                                relative p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all
                                ${borderColor} ${bgClass}
                                ${!hasAnswered ? 'hover:shadow-md active:scale-95' : 'cursor-default'}
                            `}
                        >
                            {opt.imageUrl ? (
                                <div className="w-full h-24 rounded-xl bg-gray-100 dark:bg-black overflow-hidden">
                                    <img src={opt.imageUrl} alt={opt.label} className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-300">
                                    {renderIcon(opt.icon)}
                                </div>
                            )}
                            
                            <span className="font-bold text-sm text-gray-800 dark:text-gray-200">{opt.label}</span>
                            
                            {hasAnswered && isTargetCorrect && (
                                <div className="absolute top-2 right-2 text-green-500"><CheckCircle2 size={20} /></div>
                            )}
                            {hasAnswered && isSelected && !isTargetCorrect && (
                                <div className="absolute top-2 right-2 text-red-500"><XCircle size={20} /></div>
                            )}
                        </button>
                    );
                })}
            </div>

            {hasAnswered && (
                <div className={`p-4 rounded-xl text-sm leading-relaxed animate-fade-in-up ${isCorrect ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
                    <strong>{isCorrect ? "Correct!" : "Not quite."}</strong> {explanation}
                </div>
            )}
        </BaseWidget>
    );
};
