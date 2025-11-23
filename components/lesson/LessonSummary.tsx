
import React from 'react';
import { Clock, Target, Zap, RotateCcw, ThumbsUp, ThumbsDown, CheckCircle2, ArrowRight } from 'lucide-react';

interface LessonSummaryProps {
    stats: {
        timeSeconds: number;
        totalQuestions: number;
        correctCount: number;
        mistakeCount: number;
        xpGained: number;
    };
    language: 'Chinese' | 'English';
    onContinue: (satisfaction: boolean) => void;
}

export const LessonSummary: React.FC<LessonSummaryProps> = ({ stats, language, onContinue }) => {
    const isZh = language === 'Chinese';

    const accuracy = Math.round((stats.correctCount / Math.max(1, stats.totalQuestions)) * 100);

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-dark-bg animate-fade-in-up overflow-y-auto">
            {/* Header Area */}
            <div className="pt-12 pb-8 text-center bg-yellow-400/10 dark:bg-yellow-900/10">
                <h2 className="text-3xl font-extrabold text-yellow-500 mb-2 uppercase tracking-wide">
                    {isZh ? "课程完成！" : "Lesson Complete!"}
                </h2>
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 font-bold text-sm">
                    <Zap size={16} className="fill-current"/> +{stats.xpGained} XP
                </div>
            </div>

            {/* Stats Grid */}
            <div className="p-6 md:p-12 max-w-2xl mx-auto w-full grid grid-cols-2 gap-4">
                <StatBox 
                    icon={<Target className="text-blue-500" />} 
                    label={isZh ? "正确率" : "Accuracy"} 
                    value={`${accuracy}%`} 
                    color="bg-blue-500"
                />
                <StatBox 
                    icon={<Clock className="text-orange-500" />} 
                    label={isZh ? "用时" : "Time"} 
                    value={formatTime(stats.timeSeconds)} 
                    color="bg-orange-500"
                />
                <StatBox 
                    icon={<CheckCircle2 className="text-green-500" />} 
                    label={isZh ? "完成题目" : "Questions"} 
                    value={stats.totalQuestions} 
                    color="bg-green-500"
                />
                <StatBox 
                    icon={<RotateCcw className="text-red-500" />} 
                    label={isZh ? "错题数" : "Mistakes"} 
                    value={stats.mistakeCount} 
                    color="bg-red-500"
                />
            </div>

            {/* Satisfaction / Action Section */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-dark-card/30">
                <h3 className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-sm mb-6">
                    {isZh ? "你对本次生成的课程满意吗？" : "How was this AI-generated lesson?"}
                </h3>
                
                <div className="flex flex-col md:flex-row gap-4 w-full max-w-md">
                    {/* Dissatisfied / Redo Button */}
                    <button 
                        onClick={() => onContinue(false)}
                        className="flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all group active:scale-95"
                    >
                        <ThumbsDown size={24} className="group-hover:-translate-y-1 transition-transform" />
                        <div className="text-left">
                            <div className="font-bold text-sm">{isZh ? "不满意" : "Not Good"}</div>
                            <div className="text-[10px] uppercase font-bold opacity-70">{isZh ? "重新生成" : "Regenerate"}</div>
                        </div>
                    </button>

                    {/* Satisfied / Continue Button (Primary) */}
                    <button 
                        onClick={() => onContinue(true)}
                        className="flex-[2] flex items-center justify-center gap-3 p-4 rounded-xl bg-brand border-b-4 border-brand-dark text-white shadow-xl hover:bg-brand-light active:border-b-0 active:translate-y-1 transition-all"
                    >
                        <ThumbsUp size={24} className="animate-bounce" />
                        <div className="text-left">
                            <div className="font-bold text-lg leading-none">{isZh ? "很棒，继续！" : "Great! Continue"}</div>
                            <div className="text-[10px] uppercase font-bold opacity-80">{isZh ? "完成并保存" : "Finish & Save"}</div>
                        </div>
                        <ArrowRight size={24} className="ml-2 opacity-80" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatBox = ({ icon, label, value, color }: any) => (
    <div className="bg-white dark:bg-dark-card border-2 border-gray-100 dark:border-gray-700 rounded-2xl p-4 flex flex-col items-start gap-1">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</div>
        <div className="flex items-center gap-3">
             <div className={`${color.replace('bg-', 'text-')} opacity-80`}>{icon}</div>
             <div className="text-2xl font-black text-gray-800 dark:text-white">{value}</div>
        </div>
    </div>
);
