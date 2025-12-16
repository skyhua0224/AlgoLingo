
import React from 'react';
import { Coffee, Flame, Zap, ArrowRight, X } from 'lucide-react';
import { Button } from './Button';

interface DailyStandupModalProps {
    streak: number;
    onClose: () => void;
    onStartWarmup: () => void;
    isZh: boolean;
}

export const DailyStandupModal: React.FC<DailyStandupModalProps> = ({ streak, onClose, onStartWarmup, isZh }) => {
    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-up">
            <div className="bg-white dark:bg-dark-card w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
                    <X size={20} />
                </button>

                {/* Header Graphic */}
                <div className="h-32 bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="text-center relative z-10 text-white">
                        <div className="inline-flex p-3 bg-white/20 rounded-full mb-2 backdrop-blur-md shadow-lg">
                            <Coffee size={32} />
                        </div>
                        <h2 className="text-xl font-black uppercase tracking-widest text-shadow-sm">
                            {isZh ? "每日站会" : "Daily Standup"}
                        </h2>
                    </div>
                </div>

                <div className="p-6 text-center">
                    <div className="flex justify-center gap-4 mb-6">
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl flex-1 border border-orange-100 dark:border-orange-900/30">
                            <Flame size={24} className="text-orange-500 mx-auto mb-1"/>
                            <div className="text-2xl font-black text-gray-800 dark:text-white">{streak}</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{isZh ? "天连胜" : "Day Streak"}</div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl flex-1 border border-blue-100 dark:border-blue-900/30">
                            <Zap size={24} className="text-blue-500 mx-auto mb-1"/>
                            <div className="text-2xl font-black text-gray-800 dark:text-white">+10%</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{isZh ? "今日经验加成" : "XP Boost"}</div>
                        </div>
                    </div>

                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed font-medium">
                        {isZh 
                         ? "新的一天开始了。保持手感，先来一组快速热身？" 
                         : "A new day begins. Keep your momentum. Start with a quick warmup?"}
                    </p>

                    <Button onClick={onStartWarmup} variant="primary" className="w-full shadow-xl py-4 text-lg flex items-center justify-center gap-2">
                        {isZh ? "开始热身" : "Start Warmup"} <ArrowRight size={20}/>
                    </Button>
                </div>
            </div>
        </div>
    );
};
