
import React from 'react';
import { Button } from '../Button';
import { Check, X, AlertCircle, ArrowRight, Flag } from 'lucide-react';

interface LessonFooterProps {
  status: 'idle' | 'correct' | 'wrong';
  onCheck: () => void;
  onNext: () => void;
  language: 'Chinese' | 'English';
  isExamMode?: boolean;
  isLastQuestion?: boolean;
}

export const LessonFooter: React.FC<LessonFooterProps> = ({ status, onCheck, onNext, language, isExamMode, isLastQuestion }) => {
  const isZh = language === 'Chinese';
  const t = {
    correct: isZh ? "正确!" : "Correct!",
    incorrect: isZh ? "错误" : "Incorrect",
    check: isZh ? "检查" : "CHECK",
    continue: isZh ? "继续" : "CONTINUE",
    next: isZh ? "下一题" : "Next Question",
    submit: isZh ? "交卷" : "Submit Exam"
  };

  const getBgColor = () => {
    switch (status) {
        case 'correct': return 'bg-green-50/95 dark:bg-green-900/90 border-green-200 dark:border-green-800';
        case 'wrong': return 'bg-red-50/95 dark:bg-red-900/90 border-red-200 dark:border-red-800';
        default: return 'bg-white dark:bg-dark-card border-gray-100 dark:border-gray-800';
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
  );
};
