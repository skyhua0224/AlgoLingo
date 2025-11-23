
import React, { useState, useEffect } from 'react';
import { Widget } from '../../../types';
import { BaseWidget } from '../BaseWidget';
import { Keyboard } from 'lucide-react';

interface FillInProps {
    widget: Widget;
    onUpdateAnswers: (answers: string[]) => void;
    language: 'Chinese' | 'English';
}

const WIDGET_LOCALE = {
    Chinese: {
        keys: "辅助按键"
    },
    English: {
        keys: "Helper Keys"
    }
};

export const FillInWidget: React.FC<FillInProps> = ({ widget, onUpdateAnswers, language }) => {
    if (!widget.fillIn) return null;
    const { code, options, inputMode } = widget.fillIn;
    const parts = code ? code.split('__BLANK__') : [];
    const [answers, setAnswers] = useState<string[]>([]);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const t = WIDGET_LOCALE[language];

    useEffect(() => {
        const blankCount = Math.max(0, (code?.split('__BLANK__').length || 0) - 1);
        setAnswers(new Array(blankCount).fill(""));
        setFocusedIndex(null);
    }, [widget.id, code]);

    useEffect(() => {
        onUpdateAnswers(answers);
    }, [answers]);

    const fill = (val: string) => {
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
         const newAnswers = [...answers];
         newAnswers[idx] = val;
         setAnswers(newAnswers);
    };

    const clear = (idx: number) => {
        const newAnswers = [...answers];
        newAnswers[idx] = "";
        setAnswers(newAnswers);
    }

    const isTypeMode = inputMode === 'type';
    const helperKeys = ['[', ']', '{', '}', '(', ')', ':', ';', '=', '->', '"', "'", '_'];

    return (
        <BaseWidget>
             <div className="bg-[#1e1e1e] p-5 rounded-xl mb-6 border-l-4 border-brand overflow-x-auto shadow-lg max-w-[calc(100vw-3rem)] md:max-w-full mx-auto">
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
                                        className={`bg-gray-800 border-b-2 text-brand-light font-bold px-2 mx-1 min-w-[60px] h-6 focus:outline-none focus:border-brand text-center transition-colors ${focusedIndex === i ? 'border-brand bg-gray-700' : 'border-gray-500'}`}
                                        placeholder="..."
                                    />
                                ) : (
                                 <span 
                                    onClick={() => clear(i)}
                                    className={`inline-flex items-center justify-center px-2 min-w-[60px] h-6 mx-1 border-b-2 rounded cursor-pointer align-middle transition-all select-none ${answers[i] ? 'text-brand-light border-brand-light bg-brand/20 font-bold' : 'border-gray-600 bg-gray-800 hover:bg-gray-700 animate-pulse'}`}
                                 >
                                     {answers[i] || '?'}
                                 </span>
                                )
                             )}
                         </React.Fragment>
                     ))}
                 </pre>
             </div>
             
             {!isTypeMode && (
                <div className="flex flex-wrap gap-3 justify-center">
                    {(options || []).map((opt, idx) => (
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
             {isTypeMode && (
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
