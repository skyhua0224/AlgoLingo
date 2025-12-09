
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../Button';
import { Check, X, ArrowRight, Flag, RotateCcw, Sparkles, Send, Loader2, MessageSquarePlus, AlertTriangle } from 'lucide-react';

interface LessonFooterProps {
  status: 'idle' | 'correct' | 'wrong';
  onCheck: () => void;
  onNext: () => void;
  language: 'Chinese' | 'English';
  isExamMode?: boolean;
  isLastQuestion?: boolean;
  onRegenerate?: (instruction: string) => Promise<void>;
  onReport?: () => void; // New prop for reporting bad questions/answers
  isRegenerating?: boolean;
}

export const LessonFooter: React.FC<LessonFooterProps> = ({ 
    status, onCheck, onNext, language, isExamMode, isLastQuestion, 
    onRegenerate, onReport, isRegenerating 
}) => {
  const isZh = language === 'Chinese';
  const [showRegenPopover, setShowRegenPopover] = useState(false);
  const [instruction, setInstruction] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  const t = {
    correct: isZh ? "正确!" : "Correct!",
    incorrect: isZh ? "错误" : "Incorrect",
    check: isZh ? "检查" : "CHECK",
    continue: isZh ? "继续" : "CONTINUE",
    next: isZh ? "下一题" : "Next Question",
    submit: isZh ? "交卷" : "Submit Exam",
    regen: isZh ? "重新生成本页" : "Regenerate Screen",
    regenHint: isZh ? "输入修改要求 (例如：太难了，简单点)..." : "Instructions (e.g. 'Too hard, simplify')...",
    regenBtn: isZh ? "确认生成" : "Confirm"
  };

  const getBgColor = () => {
    switch (status) {
        case 'correct': return 'bg-green-50/95 dark:bg-green-900/90 border-green-200 dark:border-green-800';
        case 'wrong': return 'bg-red-50/95 dark:bg-red-900/90 border-red-200 dark:border-red-800';
        default: return 'bg-white dark:bg-dark-card border-gray-100 dark:border-gray-800';
    }
  };

  // Click outside to close popover
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
              setShowRegenPopover(false);
          }
      };
      if (showRegenPopover) {
          document.addEventListener("mousedown", handleClickOutside);
      }
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showRegenPopover]);

  const handleRegenSubmit = async () => {
      if (onRegenerate) {
          await onRegenerate(instruction);
          setShowRegenPopover(false);
          setInstruction('');
      }
  };

  return (
    <div className={`absolute bottom-0 left-0 right-0 p-4 md:p-6 z-[50] border-t transition-all duration-300 ease-out ${getBgColor()}`}>
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
        {/* Feedback Area */}
        <div className="flex-1">
            {status !== 'idle' && !isExamMode && (
                <div className={`font-extrabold text-lg md:text-xl flex items-center gap-3 animate-fade-in-up ${status === 'correct' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    <div className={`p-1 rounded-full ${status === 'correct' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                        {status === 'correct' ? <Check size={24} /> : <X size={24} />}
                    </div>
                    {status === 'correct' ? t.correct : t.incorrect}
                </div>
            )}
        </div>

        {/* Buttons Container */}
        <div className="flex items-center gap-3">
            
            {/* Feedback / Report Button (Visible only on Error) */}
            {status === 'wrong' && onReport && (
                <button
                    onClick={onReport}
                    className="p-3.5 rounded-xl border-2 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors bg-white dark:bg-dark-card shadow-sm"
                    title={isZh ? "报错 / 申诉" : "Report / Appeal"}
                >
                    <AlertTriangle size={24} />
                </button>
            )}

            {/* Regenerate Button & Popover (Visible only on Idle) */}
            {status === 'idle' && onRegenerate && (
                <div className="relative" ref={popoverRef}>
                    {showRegenPopover && (
                        <div className="absolute bottom-full right-0 mb-4 w-72 bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl border-2 border-brand/20 p-4 animate-scale-in origin-bottom-right z-[60]">
                            <div className="flex items-center gap-2 text-brand-dark dark:text-brand-light font-bold mb-3 text-xs uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 pb-2">
                                <Sparkles size={14} />
                                {t.regen}
                            </div>
                            <textarea
                                className="w-full h-24 p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-600 rounded-xl text-sm mb-3 focus:border-brand outline-none resize-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder={t.regenHint}
                                value={instruction}
                                onChange={(e) => setInstruction(e.target.value)}
                                autoFocus
                            />
                            <button 
                                onClick={handleRegenSubmit}
                                disabled={isRegenerating}
                                className="w-full py-2.5 bg-brand text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-brand-dark transition-colors shadow-md"
                            >
                                {isRegenerating ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>}
                                {t.regenBtn}
                            </button>
                        </div>
                    )}
                    
                    <button 
                        onClick={() => setShowRegenPopover(!showRegenPopover)}
                        disabled={isRegenerating}
                        className={`p-3.5 rounded-xl transition-all border-2 ${showRegenPopover ? 'bg-brand text-white border-brand' : 'bg-white dark:bg-dark-card text-gray-400 border-gray-200 dark:border-gray-700 hover:border-brand hover:text-brand'}`}
                        title={t.regen}
                    >
                        {isRegenerating ? <Loader2 size={24} className="animate-spin"/> : <MessageSquarePlus size={24} />}
                    </button>
                </div>
            )}

            {/* Action Button */}
            <Button 
                onClick={() => status === 'idle' ? onCheck() : onNext()}
                variant={status === 'wrong' && !isExamMode ? 'secondary' : 'primary'}
                className={`w-36 md:w-48 shadow-xl transition-all flex items-center justify-center gap-2 ${status === 'wrong' && !isExamMode ? 'border-red-200 text-red-600' : ''}`}
                size="lg"
            >
                {isExamMode ? (
                    isLastQuestion ? <><Flag size={18}/> {t.submit}</> : <>{t.next} <ArrowRight size={18}/></>
                ) : (
                    status === 'idle' ? t.check : t.continue
                )}
            </Button>
        </div>
      </div>
    </div>
  );
};
