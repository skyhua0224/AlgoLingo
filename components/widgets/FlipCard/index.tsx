
import React, { useState, useEffect } from 'react';
import { Widget } from '../../../types';
import { BaseWidget } from '../BaseWidget';
import { MarkdownText } from '../../common/MarkdownText';
import { Eye, Sparkles } from 'lucide-react';

interface FlipCardProps {
    widget: Widget;
    onAssessment?: (result: 'forgot' | 'remembered') => void;
    language: 'Chinese' | 'English';
}

const WIDGET_LOCALE = {
    Chinese: {
        tapToFlip: "点击翻转",
        tapToBack: "点击翻回",
        forgot: "忘记了",
        gotIt: "记住了",
        viewer: "3D模型"
    },
    English: {
        tapToFlip: "Tap to flip",
        tapToBack: "Tap to flip back",
        forgot: "Forgot",
        gotIt: "Got it",
        viewer: "3D Model"
    }
};

export const FlipCardWidget: React.FC<FlipCardProps> = ({ widget, onAssessment, language }) => {
  if (!widget.flipcard) return null;
  const [flipped, setFlipped] = useState(false);
  const { front, back, hint, mode, model3d } = widget.flipcard;
  const t = WIDGET_LOCALE[language];

  useEffect(() => {
    setFlipped(false);
  }, [widget.id, front]);

  return (
    <BaseWidget className="flex flex-col items-center">
        <div 
            onClick={() => !flipped && setFlipped(true)}
            className={`relative w-full cursor-pointer transition-all duration-300 group`}
        >
            {/* Front */}
            <div className={`
                w-full min-h-[180px] bg-white dark:bg-dark-card rounded-2xl border-2 border-b-4 border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center shadow-sm
                ${flipped ? 'hidden' : 'flex'}
                group-hover:border-brand group-hover:translate-y-[-2px] transition-all
            `}>
                <div className="mb-4 p-3 bg-brand-bg dark:bg-brand/10 rounded-full text-brand">
                    <Eye size={28} />
                </div>
                <div className="text-xl font-bold text-gray-800 dark:text-dark-text">
                    <MarkdownText content={front || "Tap to reveal"} />
                </div>
                {hint && <p className="mt-3 text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wide">{hint}</p>}
                <p className="mt-6 text-xs text-brand font-bold uppercase tracking-wider">{t.tapToFlip}</p>
            </div>

            {/* Back */}
            <div className={`
                w-full min-h-[180px] bg-brand-bg dark:bg-brand/10 rounded-2xl border-2 border-b-4 border-brand p-6 flex flex-col items-center justify-center text-center shadow-sm
                ${flipped ? 'flex animate-scale-in' : 'hidden'}
            `}>
                 <div className="mb-4 p-3 bg-white dark:bg-dark-card rounded-full text-brand">
                    <Sparkles size={28} />
                </div>
                <div className="text-lg font-bold text-brand-dark dark:text-brand-light">
                    <MarkdownText content={back || "..."} />
                </div>
                
                {model3d && (
                     <div className="my-2 text-xs text-gray-500 italic">
                        [{t.viewer}: {model3d}]
                     </div>
                )}
                
                {mode === 'assessment' && onAssessment && (
                    <div className="mt-6 flex gap-4 w-full">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onAssessment('forgot'); }}
                            className="flex-1 bg-white dark:bg-dark-card border-2 border-red-200 dark:border-red-900 text-red-500 py-3 rounded-xl font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95 transition-transform"
                        >
                            {t.forgot}
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onAssessment('remembered'); }}
                            className="flex-1 bg-brand text-white py-3 rounded-xl font-bold text-sm hover:bg-brand-light shadow-sm active:scale-95 transition-transform"
                        >
                            {t.gotIt}
                        </button>
                    </div>
                )}

                {!mode && <p className="mt-6 text-xs text-brand-dark/50 font-bold uppercase tracking-wider" onClick={() => setFlipped(false)}>{t.tapToBack}</p>}
            </div>
        </div>
    </BaseWidget>
  );
};
