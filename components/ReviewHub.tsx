
import React, { useState } from 'react';
import { Button } from './Button';
import { Zap, RotateCcw, Brain, ListX, Clock, Dumbbell, X } from 'lucide-react';
import { MistakeRecord } from '../types';

interface ReviewHubProps {
    mistakeCount: number;
    onStartReview: () => void;
    onStartMistakePractice: (strategy: 'all' | 'due') => void;
    onStartSyntaxClinic: () => void; 
    onBack: () => void;
    targetLanguage: string;
    mistakes: MistakeRecord[]; 
}

export const ReviewHub: React.FC<ReviewHubProps> = ({ mistakeCount, onStartReview, onStartMistakePractice, onStartSyntaxClinic, onBack, targetLanguage, mistakes }) => {
    const [showPracticeModal, setShowPracticeModal] = useState(false);

    return (
        <div className="w-full h-full flex flex-col bg-gray-50 dark:bg-dark-bg">
            {/* Sticky Header */}
            <div className="bg-white dark:bg-dark-card p-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 shrink-0">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-extrabold text-gray-800 dark:text-dark-text">复习中心</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wide">Review Hub</p>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-black text-brand">{mistakeCount}</span>
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Errors</p>
                    </div>
                </div>
            </div>

            {/* Scrollable Content - Added pb-24 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32 md:pb-24">
                
                {/* 1. Smart Repair (Standard Review - AI) */}
                <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border-2 border-gray-100 dark:border-gray-700 shadow-sm transform transition-all hover:scale-[1.01]">
                    <div className="flex items-start gap-4 mb-6">
                        <div className={`p-3 rounded-2xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 shrink-0`}>
                             <Zap size={28} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-800 dark:text-dark-text mb-1">智能训练</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                                AI 分析你的历史错题，生成个性化的综合复习课程。包含代码挑战。
                            </p>
                        </div>
                    </div>
                    <Button 
                        variant="primary" 
                        className="w-full py-4 text-base shadow-md"
                        onClick={onStartReview}
                    >
                        开始智能训练
                    </Button>
                </div>

                {/* 2. Mistake Practice (Local Replay) */}
                <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border-2 border-red-100 dark:border-red-900/30 shadow-sm transform transition-all hover:scale-[1.01]">
                    <div className="flex items-start gap-4 mb-6">
                        <div className={`p-3 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-500 shrink-0`}>
                            <RotateCcw size={28} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-800 dark:text-dark-text mb-1">错题重练</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                                原题重现。不消耗 AI Token，专注于快速记忆巩固。
                            </p>
                        </div>
                    </div>
                    
                    <Button 
                        variant="secondary" 
                        className="w-full border-red-200 text-red-500 hover:bg-red-50 dark:bg-transparent dark:border-red-900 dark:text-red-400 py-4 text-base"
                        disabled={mistakeCount === 0}
                        onClick={() => setShowPracticeModal(true)}
                    >
                        {mistakeCount > 0 ? "进入错题集" : "暂无错题"}
                    </Button>

                    {/* Mistake List Preview */}
                    {mistakeCount > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-wider">
                                <ListX size={12} />
                                <span>Recent Errors</span>
                            </div>
                            <div className="space-y-2">
                                {mistakes.slice().reverse().slice(0, 3).map((m, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate max-w-[60%]">{m.problemName}</span>
                                        <span className="text-[10px] px-2 py-1 bg-white dark:bg-gray-700 text-gray-500 rounded-md border border-gray-100 dark:border-gray-600">{new Date(m.timestamp).toLocaleDateString(undefined, {month:'numeric', day:'numeric'})}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Weakness Targeting */}
                <div className="bg-gradient-to-br from-brand-bg to-white dark:from-brand/10 dark:to-dark-card p-6 rounded-3xl border-2 border-brand dark:border-brand/50 shadow-sm">
                     <div className="flex items-center gap-4 mb-4">
                        <div className="bg-brand p-3 rounded-2xl text-white shadow-lg shadow-brand/30">
                            <Brain size={28} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-brand-dark dark:text-brand-light">{targetLanguage} 语法诊所</h3>
                            <p className="text-brand-dark/70 dark:text-brand-light/70 text-xs">专项突破语法盲区</p>
                        </div>
                    </div>
                    <Button 
                        variant="primary" 
                        className="w-full py-3 text-sm"
                        onClick={onStartSyntaxClinic}
                    >
                        进入诊所 (17题)
                    </Button>
                </div>

            </div>

            {/* Practice Mode Modal */}
            {showPracticeModal && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm animate-fade-in-up">
                    <div className="bg-white dark:bg-dark-card w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-8 shadow-2xl border-t-2 md:border-2 border-gray-100 dark:border-gray-700 mb-20 md:mb-0">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-extrabold text-gray-800 dark:text-white">选择练习模式</h3>
                            <button onClick={() => setShowPracticeModal(false)} className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-full"><X size={20}/></button>
                        </div>
                        
                        <div className="space-y-4">
                            <button 
                                onClick={() => { setShowPracticeModal(false); onStartMistakePractice('due'); }}
                                className="w-full p-5 rounded-2xl border-2 border-brand bg-brand-bg/30 dark:bg-brand/10 text-left hover:bg-brand-bg dark:hover:bg-brand/20 transition-all group active:scale-95"
                            >
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-2 bg-brand text-white rounded-lg"><Clock size={20}/></div>
                                    <div>
                                        <span className="block font-bold text-brand-dark dark:text-brand-light text-lg">记忆曲线推荐</span>
                                        <span className="text-xs text-brand/70 font-bold uppercase tracking-wide">Recommended</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                    仅复习到达艾宾浩斯遗忘点的错题，效率最高。
                                </p>
                            </button>

                            <button 
                                onClick={() => { setShowPracticeModal(false); onStartMistakePractice('all'); }}
                                className="w-full p-5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-left hover:border-gray-400 dark:hover:border-gray-500 transition-all active:scale-95"
                            >
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg"><Dumbbell size={20}/></div>
                                    <span className="block font-bold text-gray-700 dark:text-gray-200 text-lg">刷爆错题本</span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                    暴力复习所有历史错题 ({mistakeCount}题)。
                                </p>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
