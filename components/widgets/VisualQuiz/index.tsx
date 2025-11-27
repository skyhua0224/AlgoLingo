
import React, { useState } from 'react';
import { Widget } from '../../../types';
import { BaseWidget } from '../BaseWidget';
import { CheckCircle2, XCircle, HelpCircle, ImageOff } from 'lucide-react';
import * as Icons from 'lucide-react';

interface VisualQuizProps {
    widget: Widget;
}

export const VisualQuizWidget: React.FC<VisualQuizProps> = ({ widget }) => {
    if (!widget.visualQuiz) return null;
    const { question, options, correctId, explanation } = widget.visualQuiz;
    
    const [selectedId, setSelectedId] = useState<string | null>(null);
    // Track failed images to fallback to icons
    const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

    const isCorrect = selectedId === correctId;
    const hasAnswered = selectedId !== null;

    const handleImageError = (id: string) => {
        setFailedImages(prev => ({ ...prev, [id]: true }));
    };

    // Helper to render dynamic icon
    const renderIcon = (name: string | undefined, isFallback: boolean = false) => {
        if (!name) return <HelpCircle size={32} />;
        const IconComp = (Icons as any)[name] || (isFallback ? ImageOff : Icons.HelpCircle);
        return <IconComp size={32} />;
    };

    return (
        <BaseWidget>
            <div className="bg-white dark:bg-dark-card p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-6 text-center leading-tight">
                    {question}
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    {options.map((opt) => {
                        const isSelected = selectedId === opt.id;
                        const isTargetCorrect = opt.id === correctId;
                        
                        let borderColor = 'border-gray-200 dark:border-gray-700';
                        let bgClass = 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700';
                        let opacityClass = 'opacity-100';

                        if (hasAnswered) {
                            if (isTargetCorrect) {
                                borderColor = 'border-green-500 ring-1 ring-green-500';
                                bgClass = 'bg-green-50 dark:bg-green-900/20';
                            } else if (isSelected && !isTargetCorrect) {
                                borderColor = 'border-red-500 ring-1 ring-red-500';
                                bgClass = 'bg-red-50 dark:bg-red-900/20';
                            } else {
                                opacityClass = 'opacity-50 grayscale';
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
                                    relative p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all h-full min-h-[160px] justify-center
                                    ${borderColor} ${bgClass} ${opacityClass}
                                    ${!hasAnswered ? 'hover:scale-[1.02] active:scale-95 hover:shadow-md cursor-pointer' : 'cursor-default'}
                                `}
                            >
                                {opt.imageUrl && !failedImages[opt.id] ? (
                                    <div className="w-full h-24 rounded-lg bg-gray-200 dark:bg-black overflow-hidden relative">
                                        <img 
                                            src={opt.imageUrl} 
                                            alt={opt.label} 
                                            className="w-full h-full object-cover"
                                            onError={() => handleImageError(opt.id)}
                                        />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-white dark:bg-black/20 flex items-center justify-center text-gray-400 dark:text-gray-500 mb-2">
                                        {renderIcon(opt.icon, !!opt.imageUrl)}
                                    </div>
                                )}
                                
                                <span className="font-bold text-xs md:text-sm text-gray-700 dark:text-gray-300 text-center leading-tight px-1">{opt.label}</span>
                                
                                {hasAnswered && isTargetCorrect && (
                                    <div className="absolute -top-2 -right-2 bg-white dark:bg-dark-card rounded-full p-1 text-green-500 shadow-sm"><CheckCircle2 size={20} fill="currentColor" className="text-white dark:text-dark-card"/></div>
                                )}
                                {hasAnswered && isSelected && !isTargetCorrect && (
                                    <div className="absolute -top-2 -right-2 bg-white dark:bg-dark-card rounded-full p-1 text-red-500 shadow-sm"><XCircle size={20} fill="currentColor" className="text-white dark:text-dark-card"/></div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {hasAnswered && (
                    <div className={`p-4 rounded-xl text-sm leading-relaxed border animate-fade-in-up flex gap-3 ${isCorrect ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'}`}>
                        <div className="shrink-0 mt-0.5">
                            {isCorrect ? <CheckCircle2 size={18}/> : <XCircle size={18}/>}
                        </div>
                        <div>
                            <strong className="block mb-1 uppercase text-xs tracking-wider">{isCorrect ? "Correct!" : "Incorrect"}</strong> 
                            {explanation}
                        </div>
                    </div>
                )}
            </div>
        </BaseWidget>
    );
};
