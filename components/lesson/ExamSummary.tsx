
import React, { useState } from 'react';
import { LessonScreen } from '../../types/lesson';
import { ExamResult } from '../../hooks/useLessonEngine';
import { CheckCircle2, XCircle, Search, ChevronRight, Trophy } from 'lucide-react';
import { Button } from '../Button';
// Widget Imports for Review Mode
import { QuizWidget } from '../widgets/Quiz';
import { FillInWidget } from '../widgets/FillIn';
import { ParsonsWidget } from '../widgets/Parsons';
import { InteractiveCodeWidget } from '../widgets/InteractiveCode';

interface ExamSummaryProps {
    screens: LessonScreen[];
    results: ExamResult[];
    score: number;
    onClose: () => void;
    language: 'Chinese' | 'English';
}

export const ExamSummary: React.FC<ExamSummaryProps> = ({ screens, results, score, onClose, language }) => {
    const isZh = language === 'Chinese';
    const [activeReviewIndex, setActiveReviewIndex] = useState<number | null>(null);

    // Calculate stats
    const total = screens.length;
    const correctCount = results.filter(r => r.isCorrect).length;
    const percentage = Math.round((correctCount / total) * 100);
    
    const getGrade = (p: number) => {
        if (p >= 90) return { label: 'S', color: 'text-yellow-500' };
        if (p >= 80) return { label: 'A', color: 'text-green-500' };
        if (p >= 60) return { label: 'B', color: 'text-blue-500' };
        return { label: 'C', color: 'text-red-500' };
    };
    
    const grade = getGrade(percentage);

    const renderReviewWidget = (screen: LessonScreen, result: ExamResult) => {
        return screen.widgets.map((widget, idx) => (
            <div key={idx} className="mb-6 pointer-events-none opacity-90">
                {widget.type === 'quiz' && <QuizWidget widget={widget} selectedIdx={result.userState?.quizSelection ?? null} onSelect={() => {}} status={result.isCorrect ? 'correct' : 'wrong'} language={language} />}
                {widget.type === 'fill-in' && <FillInWidget widget={widget} onUpdateAnswers={() => {}} language={language} status={result.isCorrect ? 'correct' : 'wrong'} userAnswers={result.userState?.fillInAnswers} />}
                {widget.type === 'parsons' && <ParsonsWidget widget={widget} onUpdateOrder={() => {}} status={result.isCorrect ? 'correct' : 'wrong'} language={language} userOrder={result.userState?.parsonsOrder} />}
                {widget.type === 'interactive-code' && <InteractiveCodeWidget widget={widget} language={language} />}
            </div>
        ));
    };

    // Detail View
    if (activeReviewIndex !== null) {
        const screen = screens[activeReviewIndex];
        const result = results.find(r => r.screenIndex === activeReviewIndex);
        
        return (
            <div className="fixed inset-0 z-[120] bg-white dark:bg-dark-bg flex flex-col animate-fade-in-up">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-dark-card">
                    <div className="font-bold text-lg flex items-center gap-2">
                        <span className="text-gray-400">#{activeReviewIndex + 1}</span>
                        {result?.isCorrect 
                            ? <span className="text-green-500 flex items-center gap-1"><CheckCircle2 size={20}/> {isZh ? "正确" : "Correct"}</span>
                            : <span className="text-red-500 flex items-center gap-1"><XCircle size={20}/> {isZh ? "错误" : "Incorrect"}</span>
                        }
                    </div>
                    <button onClick={() => setActiveReviewIndex(null)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold">
                        {isZh ? "关闭" : "Close"}
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-gray-100/50 dark:bg-black/20">
                    <div className="max-w-2xl mx-auto">
                        {result ? renderReviewWidget(screen, result) : <p>No data</p>}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[110] bg-white dark:bg-dark-bg flex flex-col overflow-hidden animate-fade-in-up">
            {/* Header Score */}
            <div className="bg-white dark:bg-dark-card border-b border-gray-200 dark:border-gray-800 p-8 text-center shadow-sm shrink-0 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand to-blue-500"></div>
                
                <div className="mb-2 text-xs font-bold text-gray-400 uppercase tracking-widest">{isZh ? "最终得分" : "Final Score"}</div>
                <div className="flex items-center justify-center gap-4 mb-6">
                    <div className={`text-6xl font-black ${grade.color} drop-shadow-sm`}>{percentage}</div>
                    <div className="text-left">
                        <div className={`text-4xl font-black ${grade.color} opacity-50`}>{grade.label}</div>
                        <div className="text-xs font-bold text-gray-400">{correctCount} / {total}</div>
                    </div>
                </div>
                
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full text-sm font-bold">
                    <Trophy size={16}/> +{score} XP Earned
                </div>
            </div>

            {/* Question List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 bg-gray-50 dark:bg-dark-bg/50">
                <div className="max-w-2xl mx-auto space-y-3">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="font-bold text-gray-500 uppercase text-xs tracking-wider">{isZh ? "答题回顾" : "Review Answers"}</h3>
                        <span className="text-xs text-gray-400">{isZh ? "点击查看详情" : "Tap to review"}</span>
                    </div>
                    
                    {screens.map((screen, idx) => {
                        const result = results.find(r => r.screenIndex === idx);
                        const isCorrect = result?.isCorrect;
                        
                        return (
                            <button 
                                key={idx}
                                onClick={() => setActiveReviewIndex(idx)}
                                className={`w-full p-4 rounded-xl border bg-white dark:bg-dark-card flex items-center justify-between group hover:shadow-md transition-all ${isCorrect ? 'border-gray-200 dark:border-gray-700' : 'border-red-200 dark:border-red-900/30'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isCorrect ? 'bg-green-100 text-green-600 dark:bg-green-900/20' : 'bg-red-100 text-red-600 dark:bg-red-900/20'}`}>
                                        {isCorrect ? <CheckCircle2 size={18}/> : <XCircle size={18}/>}
                                    </div>
                                    <div className="text-left">
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">Question {idx + 1}</div>
                                        <div className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate max-w-[200px] md:max-w-sm">{screen.header}</div>
                                    </div>
                                </div>
                                <div className="p-2 text-gray-300 group-hover:text-brand transition-colors">
                                    <Search size={18}/>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-card shrink-0 flex justify-center">
                <Button onClick={onClose} size="lg" className="w-full max-w-md shadow-xl">
                    {isZh ? "完成并退出" : "Finish & Exit"}
                </Button>
            </div>
        </div>
    );
};
