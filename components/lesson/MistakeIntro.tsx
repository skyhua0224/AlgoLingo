
import React from 'react';
import { Button } from '../Button';
import { RotateCcw, ShieldAlert, ArrowRight } from 'lucide-react';

interface MistakeIntroProps {
    count: number;
    onStart: () => void;
    language: 'Chinese' | 'English';
}

export const MistakeIntro: React.FC<MistakeIntroProps> = ({ count, onStart, language }) => {
    const isZh = language === 'Chinese';
    
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in-up bg-white dark:bg-dark-bg z-50 absolute inset-0">
            <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 text-red-500 shadow-lg animate-pulse-soft">
                <RotateCcw size={48} />
            </div>
            
            <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-4">
                {isZh ? "让我们修复这些错误" : "Let's fix these errors"}
            </h2>
            
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-100 dark:border-red-900/50 p-6 rounded-2xl mb-8 max-w-sm w-full">
                <div className="flex items-center justify-center gap-3 text-red-600 dark:text-red-400 font-bold text-lg">
                    <ShieldAlert size={24} />
                    <span>{count} {isZh ? "个待修复错题" : "Mistakes Remaining"}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {isZh ? "立即复习错题可以提升 40% 的记忆留存率。" : "Reviewing mistakes immediately helps solidify your memory by 40%."}
                </p>
            </div>

            <Button 
                onClick={onStart} 
                variant="primary" 
                size="lg" 
                className="w-full max-w-xs shadow-xl py-4 flex items-center justify-center gap-2"
            >
                {isZh ? "开始修复" : "Start Repair"} <ArrowRight size={20}/>
            </Button>
        </div>
    );
};
