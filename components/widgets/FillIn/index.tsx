
import React, { useState, useEffect, useMemo } from 'react';
import { Widget } from '../../../types';
import { BaseWidget } from '../BaseWidget';
import { Keyboard, Check, X } from 'lucide-react';
import { MarkdownText } from '../../common/MarkdownText';

interface FillInProps {
    widget: Widget;
    onUpdateAnswers: (answers: string[]) => void;
    language: 'Chinese' | 'English';
    status?: string; 
    userAnswers?: string[]; 
}

const WIDGET_LOCALE = {
    Chinese: {
        keys: "辅助按键",
        correctAnswer: "正确答案:"
    },
    English: {
        keys: "Helper Keys",
        correctAnswer: "Correct Answer:"
    }
};

export const FillInWidget: React.FC<FillInProps> = ({ widget, onUpdateAnswers, language, status, userAnswers }) => {
    if (!widget.fillIn) return null;
    let { code, options, correctValues, inputMode, explanation } = widget.fillIn;
    const t = WIDGET_LOCALE[language];

    // --- ROBUSTNESS: Normalize Placeholders ---
    if (code) {
        code = code.replace(/\[BLANK\]/g, '__BLANK__');
        code = code.replace(/_{4,}/g, '__BLANK__');
    }

    const parts = code ? code.split('__BLANK__') : [];
    const [answers, setAnswers] = useState<string[]>([]);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    // --- DEDUPLICATE OPTIONS ---
    // AI often hallucinates duplicates (e.g. ['num', 'target', 'num', 'target']).
    // We use a Set to ensure unique buttons.
    const uniqueOptions = useMemo(() => {
        if (!options) return [];
        return Array.from(new Set(options));
    }, [options]);

    useEffect(() => {
        if (userAnswers && userAnswers.length > 0) {
            setAnswers(userAnswers);
        } else {
            const blankCount = Math.max(0, (code?.split('__BLANK__').length || 0) - 1);
            setAnswers(new Array(blankCount).fill(""));
        }
        setFocusedIndex(null);
    }, [widget.id, code, userAnswers]);

    useEffect(() => {
        onUpdateAnswers(answers);
    }, [answers]);

    const fill = (val: string) => {
        if (status !== 'idle' && status !== undefined) return;
        
        const targetIndex = focusedIndex !== null ? focusedIndex : answers.findIndex(a => !a);
        if (targetIndex !== -1) {
            const newAnswers = [...answers];
            if (inputMode === 'type') {
                 newAnswers[targetIndex] = (newAnswers[targetIndex] || '') + val;
            } else {
                 newAnswers[targetIndex] = val;
            }
            setAnswers(newAnswers);
        }
    };

    const handleTextChange = (val: string, idx: number) => {
         if (status !== 'idle' && status !== undefined) return;
         const newAnswers = [...answers];
         newAnswers[idx] = val;
         setAnswers(newAnswers);
    };

    const clear = (idx: number) => {
        if (status !== 'idle' && status !== undefined) return;
        const newAnswers = [...answers];
        newAnswers[idx] = "";
        setAnswers(newAnswers);
    };

    const isTypeMode = inputMode === 'type';
    const helperKeys = ['[', ']', '{', '}', '(', ')', ':', ';', '=', '->', '"', "'", '_'];

    return (
        <BaseWidget>
             <div className="bg-[#1e1e1e] p-5 rounded-xl mb-4 border-l-4 border-brand overflow-x-auto shadow-lg max-w-[calc(100vw-3rem)] md:max-w-full mx-auto">
                 <pre className="font-mono text-sm text-gray-300 leading-loose whitespace-pre-wrap font-medium">
                     {parts.map((part, i) => (
                         <React.Fragment key={i}>
                             {part}
                             {i < parts.length - 1 && (
                                isTypeMode ? (
                                    <input 
                                        type="text" 
                                        value={answers[i] || ''}
                                        onFocus={() => setFocusedIndex(i)}
                                        onChange={(e) => handleTextChange(e.target.value, i)}
                                        className={`bg-gray-800 border-b-2 text-brand-light font-bold px-2 mx-1 min-w-[60px] h-6 focus:outline-none focus:border-brand text-center transition-colors ${focusedIndex === i ? 'border-brand bg-gray-700' : 'border-gray-500'} ${status === 'wrong' ? 'text-red-400 border-red-500' : ''}`}
                                        // SHOW LENGTH HINT to solve variable ambiguity (e.g. '___ (3 chars)')
                                        placeholder={correctValues && correctValues[i] ? `${'_'.repeat(correctValues[i].length)} (${correctValues[i].length})` : '...'}
                                        readOnly={status !== 'idle' && status !== undefined}
                                    />
                                ) : (
                                 <span 
                                    onClick={() => clear(i)}
                                    className={`inline-flex items-center justify-center px-2 min-w-[60px] h-6 mx-1 border-b-2 rounded cursor-pointer align-middle transition-all select-none ${answers[i] ? (status === 'wrong' ? 'text-red-300 border-red-500 bg-red-900/20' : 'text-brand-light border-brand-light bg-brand/20 font-bold') : 'border-gray-600 bg-gray-800 hover:bg-gray-700 animate-pulse text-gray-500 text-xs'}`}
                                 >
                                     {answers[i] || (correctValues && correctValues[i] ? `${correctValues[i].length} ch` : '?')}
                                 </span>
                                )
                             )}
                         </React.Fragment>
                     ))}
                 </pre>
             </div>

             {/* Feedback & Explanation */}
             {(status === 'wrong' || status === 'correct') && (
                 <div className={`mb-6 p-5 rounded-2xl border-2 animate-fade-in-up shadow-sm flex items-start gap-4 ${status === 'correct' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/50' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50'}`}>
                    
                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-sm ${status === 'correct' ? 'bg-green-100 border-green-200 text-green-600 dark:bg-green-900/40 dark:border-green-800 dark:text-green-400' : 'bg-red-100 border-red-200 text-red-600 dark:bg-red-900/40 dark:border-red-800 dark:text-red-400'}`}>
                        {status === 'correct' ? <Check size={20} strokeWidth={3} /> : <X size={20} strokeWidth={3} />}
                    </div>

                    <div className="flex-1 min-w-0 pt-1">
                        {status === 'wrong' && (
                            <div className="mb-3">
                                <h4 className="text-red-800 dark:text-red-300 font-extrabold text-xs uppercase mb-1.5 tracking-wider">
                                    {t.correctAnswer}
                                </h4>
                                <div className="flex flex-wrap gap-2 font-mono text-sm text-red-700 dark:text-red-200 font-bold">
                                    {correctValues?.map((val, idx) => (
                                        <span key={idx} className="bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded-md border border-red-200 dark:border-red-800">{val}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {status === 'correct' && (
                             <h4 className="text-green-800 dark:text-green-300 font-extrabold text-sm uppercase mb-2 tracking-wider">
                                 {language === 'Chinese' ? "回答正确" : "Correct Solution"}
                             </h4>
                        )}
                        
                        {explanation && (
                            <div className={`text-sm leading-relaxed ${status === 'wrong' ? 'pt-3 border-t border-red-200 dark:border-red-800/50 text-red-900 dark:text-red-200' : 'text-green-900 dark:text-green-100'}`}>
                                 {status === 'wrong' && <div className="font-bold text-xs uppercase opacity-70 mb-1">Analysis</div>}
                                 <MarkdownText content={explanation} />
                            </div>
                        )}
                    </div>
                 </div>
             )}
             
             {(!status || status === 'idle') && !isTypeMode && (
                <div className="flex flex-wrap gap-3 justify-center">
                    {uniqueOptions.map((opt, idx) => (
                        <button 
                            key={idx} 
                            onClick={() => fill(opt)}
                            className="px-4 py-3 bg-white dark:bg-dark-card rounded-xl border-2 border-gray-200 dark:border-gray-700 border-b-4 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-brand hover:text-brand transition-all font-mono text-sm font-bold active:translate-y-1 active:border-b-2 shadow-sm text-gray-700 dark:text-gray-200"
                        >
                            {opt}
                        </button>
                    ))}
                </div>
             )}
             
             {(!status || status === 'idle') && isTypeMode && (
                 <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-xl">
                     <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-2">
                         <Keyboard size={14} />
                         {t.keys}
                     </div>
                     <div className="flex flex-wrap gap-2 justify-center">
                         {helperKeys.map((key) => (
                             <button
                                key={key}
                                onClick={() => fill(key)}
                                className="w-10 h-10 bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm hover:bg-brand hover:text-white hover:border-brand transition-colors font-mono font-bold text-lg text-gray-700 dark:text-gray-200 active:scale-95"
                             >
                                 {key}
                             </button>
                         ))}
                     </div>
                 </div>
             )}
        </BaseWidget>
    );
};
