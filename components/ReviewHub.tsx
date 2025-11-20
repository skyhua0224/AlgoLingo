
import React, { useState } from 'react';
import { Button } from './Button';
import { Zap, RotateCcw, Brain, ListX, Clock, Dumbbell, X } from 'lucide-react';
import { MistakeRecord } from '../types';

interface ReviewHubProps {
    mistakeCount: number;
    onStartReview: () => void;
    onStartMistakePractice: (strategy: 'all' | 'due') => void; // Changed arg type
    onStartSyntaxClinic: () => void; 
    onBack: () => void;
    targetLanguage: string;
    mistakes: MistakeRecord[]; 
}

export const ReviewHub: React.FC<ReviewHubProps> = ({ mistakeCount, onStartReview, onStartMistakePractice, onStartSyntaxClinic, onBack, targetLanguage, mistakes }) => {
    const [showPracticeModal, setShowPracticeModal] = useState(false);

    return (
        <div className="bg-gray-50 dark:bg-dark-bg min-h-screen flex flex-col">
            <div className="bg-white dark:bg-dark-card p-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
                <h1 className="text-xl font-extrabold text-gray-800 dark:text-dark-text">复习中心</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">根据艾宾浩斯曲线推荐</p>
            </div>

            <div className="p-4 space-y-6">
                
                {/* 1. Smart Repair (Standard Review - AI) */}
                <div className="bg-white dark:bg-dark-card p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-500`}>
                             <Zap size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-800 dark:text-dark-text">智能训练</h3>
                            <p className="text-gray-400 text-xs">
                                AI 生成的综合复习课程
                            </p>
                        </div>
                    </div>
                    <Button 
                        variant="primary" 
                        className="w-full"
                        onClick={onStartReview}
                    >
                        开始智能训练
                    </Button>
                </div>

                {/* 2. Mistake Practice (Local Replay) */}
                <div className="bg-white dark:bg-dark-card p-6 rounded-2xl border-2 border-red-100 dark:border-red-900/30 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-500`}>
                            <RotateCcw size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-800 dark:text-dark-text">错题重练</h3>
                            <p className="text-gray-400 text-xs">
                                {mistakeCount > 0 ? `累积 ${mistakeCount} 个错误需要修复` : '暂无错题，太棒了！'}
                            </p>
                        </div>
                    </div>
                    <Button 
                        variant="secondary" 
                        className="w-full border-red-200 text-red-500 hover:bg-red-50 dark:bg-transparent dark:border-red-900 dark:text-red-400"
                        disabled={mistakeCount === 0}
                        onClick={() => setShowPracticeModal(true)}
                    >
                        进入错题集
                    </Button>

                    {/* Mistake List Preview */}
                    {mistakeCount > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
                                <ListX size={14} />
                                <span>Top Mistakes</span>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                                {mistakes.slice().reverse().slice(0, 5).map((m, idx) => (
                                    <div key={idx} className="flex flex-col gap-1 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <div className="flex justify-between items-start">
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{m.problemName}</span>
                                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-500 rounded uppercase tracking-wide">{m.questionType}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {m.context || "Logic Error"}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Weakness Targeting */}
                <div className="bg-brand-bg dark:bg-brand/10 p-6 rounded-2xl border-2 border-brand dark:border-brand/50 shadow-sm">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="bg-brand p-2 rounded-lg text-white">
                            <Brain size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-brand-dark dark:text-brand-light">{targetLanguage} 语法诊所</h3>
                            <p className="text-brand-dark/70 dark:text-brand-light/70 text-xs">针对 {targetLanguage} 的专项强化训练</p>
                        </div>
                    </div>
                    <Button 
                        variant="primary" 
                        className="w-full"
                        onClick={onStartSyntaxClinic}
                    >
                        进入诊所 (17题)
                    </Button>
                </div>

            </div>

            {/* Practice Mode Modal */}
            {showPracticeModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in-up">
                    <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-3xl p-6 shadow-2xl border-2 border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-extrabold text-gray-800 dark:text-white">选择练习模式</h3>
                            <button onClick={() => setShowPracticeModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X size={20}/></button>
                        </div>
                        
                        <div className="space-y-4">
                            <button 
                                onClick={() => { setShowPracticeModal(false); onStartMistakePractice('due'); }}
                                className="w-full p-4 rounded-xl border-2 border-brand bg-brand-bg/30 dark:bg-brand/10 text-left hover:bg-brand-bg dark:hover:bg-brand/20 transition-colors group"
                            >
                                <div className="flex items-center gap-3 mb-1">
                                    <Clock className="text-brand"/>
                                    <span className="font-bold text-brand-dark dark:text-brand-light">记忆曲线推荐 (NO AI)</span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 ml-9">仅复习到达艾宾浩斯遗忘点的错题</p>
                            </button>

                            <button 
                                onClick={() => { setShowPracticeModal(false); onStartMistakePractice('all'); }}
                                className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-left hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                            >
                                <div className="flex items-center gap-3 mb-1">
                                    <Dumbbell className="text-gray-600 dark:text-gray-300"/>
                                    <span className="font-bold text-gray-700 dark:text-gray-200">刷爆错题本 (NO AI)</span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 ml-9">复习所有历史错题 ({mistakeCount}题)</p>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
