
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

    const renderIcon = (name: string | undefined) => {
        if (!name) return <HelpCircle size={48} />;
        const IconComp = (Icons as any)[name] || Icons.HelpCircle;
        return <IconComp size={48} strokeWidth={1.5} />;
    };

    return (
        <BaseWidget>
            <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-8 text-center leading-tight">
                    {question}
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    {options.map((opt) => {
                        const isSelected = selectedId === opt.id;
                        const isTargetCorrect = opt.id === correctId;
                        
                        let borderColor = 'border-gray-100 dark:border-gray-800';
                        let bgClass = 'bg-gray-50/50 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-800/50';
                        let iconColor = 'text-gray-400 dark:text-gray-600';
                        let opacityClass = 'opacity-100';

                        if (hasAnswered) {
                            if (isTargetCorrect) {
                                borderColor = 'border-green-500 ring-2 ring-green-500/20';
                                bgClass = 'bg-green-50 dark:bg-green-900/20';
                                iconColor = 'text-green-600 dark:text-green-400';
                            } else if (isSelected && !isTargetCorrect) {
                                borderColor = 'border-red-500 ring-2 ring-red-500/20';
                                bgClass = 'bg-red-50 dark:bg-red-900/20';
                                iconColor = 'text-red-600 dark:text-red-400';
                            } else {
                                opacityClass = 'opacity-40 grayscale';
                            }
                        } else if (isSelected) {
                            borderColor = 'border-brand ring-2 ring-brand/20';
                            iconColor = 'text-brand';
                        }

                        return (
                            <button
                                key={opt.id}
                                disabled={hasAnswered}
                                onClick={() => setSelectedId(opt.id)}
                                className={`
                                    relative p-6 rounded-2xl border-2 flex flex-col items-center gap-4 transition-all min-h-[160px] justify-center
                                    ${borderColor} ${bgClass} ${opacityClass}
                                    ${!hasAnswered ? 'hover:scale-[1.02] active:scale-95 cursor-pointer shadow-sm' : 'cursor-default'}
                                `}
                            >
                                <div className={`transition-transform duration-500 ${isSelected ? 'scale-110' : ''} ${iconColor}`}>
                                    {renderIcon(opt.icon)}
                                </div>
                                
                                <span className="font-black text-xs md:text-sm text-gray-800 dark:text-gray-200 text-center leading-tight uppercase tracking-widest">
                                    {opt.label}
                                </span>
                                
                                {hasAnswered && isTargetCorrect && (
                                    <div className="absolute -top-3 -right-3 bg-white dark:bg-dark-card rounded-full p-1 text-green-500 shadow-lg border-2 border-green-500 animate-scale-in">
                                        <CheckCircle2 size={24} fill="currentColor" className="text-white dark:text-dark-card"/>
                                    </div>
                                )}
                                {hasAnswered && isSelected && !isTargetCorrect && (
                                    <div className="absolute -top-3 -right-3 bg-white dark:bg-dark-card rounded-full p-1 text-red-500 shadow-lg border-2 border-red-500 animate-scale-in">
                                        <XCircle size={24} fill="currentColor" className="text-white dark:text-dark-card"/>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {hasAnswered && (
                    <div className={`p-5 rounded-2xl text-sm leading-relaxed border-2 animate-fade-in-up flex gap-4 ${isCorrect ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'}`}>
                        <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 ${isCorrect ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'}`}>
                            {isCorrect ? <CheckCircle2 size={20}/> : <XCircle size={20}/>}
                        </div>
                        <div>
                            <strong className="block mb-1 uppercase text-xs tracking-widest font-black">{isCorrect ? "Insight Validated" : "Correction Required"}</strong> 
                            <p className="font-medium opacity-90">{explanation}</p>
                        </div>
                    </div>
                )}
            </div>
        </BaseWidget>
    );
};
