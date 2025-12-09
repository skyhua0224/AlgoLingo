
import React, { useState, useEffect } from 'react';
import { Sparkles, Code2, CheckCircle, Edit3, ArrowRight, BookOpen, Loader2, Tag, Zap, X, GraduationCap } from 'lucide-react';
import { SolutionStrategy, UserPreferences, LeetCodeContext } from '../types';
import { refineUserSolution } from '../services/geminiService';
import { MarkdownText } from './common/MarkdownText';
import { Button } from './Button';
import { InteractiveCodeWidget } from './widgets/InteractiveCode';

interface SolutionSetupProps {
    problemContext: LeetCodeContext;
    preGeneratedSolutions: SolutionStrategy[]; // NEW PROP
    preferences: UserPreferences;
    language: 'Chinese' | 'English';
    onConfirm: (strategy: SolutionStrategy) => void;
    onCancel: () => void;
}

export const SolutionSetup: React.FC<SolutionSetupProps> = ({ problemContext, preGeneratedSolutions, preferences, language, onConfirm, onCancel }) => {
    const isZh = language === 'Chinese';
    const [solutions, setSolutions] = useState<SolutionStrategy[]>(preGeneratedSolutions);
    const [selectedId, setSelectedId] = useState<string | null>(preGeneratedSolutions[0]?.id || null);
    const [customInput, setCustomInput] = useState('');
    const [refining, setRefining] = useState(false);
    const [viewMode, setViewMode] = useState<'standard' | 'custom'>('standard');

    const problemName = problemContext.meta.title;

    // Use passed solutions directly. No generation here.
    
    const handleRefineCustom = async () => {
        if (!customInput.trim()) return;
        setRefining(true);
        try {
            const data = await refineUserSolution(customInput, problemName, preferences);
            
            const codeLines = data.codeLines || (data.code ? data.code.split('\n').map((l: string) => ({ code: l, explanation: "Custom Logic" })) : []);
            
            const customStrategy: SolutionStrategy = {
                id: `custom_${Date.now()}`,
                title: isZh ? "我的自定义解法" : "My Custom Solution",
                complexity: data.complexity || "Analysis Pending",
                code: data.code || customInput,
                codeLines: codeLines,
                language: preferences.targetLanguage,
                derivation: data.derivation || "Custom logic provided by user.",
                tags: data.tags || ["Custom"],
                concept: data.concept || { front: "Custom", back: "User defined approach" },
                isCustom: true
            };
            setSolutions(prev => [...prev, customStrategy]);
            setSelectedId(customStrategy.id);
            setViewMode('standard');
        } catch (e) {
            alert(isZh ? "分析失败，请重试" : "Analysis Failed");
        } finally {
            setRefining(false);
        }
    };

    const activeSolution = solutions.find(s => s.id === selectedId);

    return (
        <div className="fixed inset-0 z-[100] bg-gray-50 dark:bg-black/95 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 animate-scale-in">
            {/* Full Screen Modal */}
            <div className="w-full h-full md:w-[95vw] md:h-[95vh] bg-white dark:bg-dark-card rounded-none md:rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col md:flex-row relative">
                
                {/* Close Button Mobile */}
                <button onClick={onCancel} className="md:hidden absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 z-50">
                    <X size={20}/>
                </button>

                {/* Sidebar: List */}
                <div className="w-full md:w-[320px] shrink-0 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dark-bg/50 p-6 flex flex-col h-1/3 md:h-full overflow-hidden">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <BookOpen size={16} /> {isZh ? "选择解题策略" : "Choose Strategy"}
                    </h3>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                        {solutions.map(sol => (
                            <button
                                key={sol.id}
                                onClick={() => { setSelectedId(sol.id); setViewMode('standard'); }}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all group ${selectedId === sol.id ? 'border-brand bg-white dark:bg-dark-card shadow-md ring-1 ring-brand/20' : 'border-transparent hover:bg-white dark:hover:bg-dark-card hover:border-gray-200 dark:hover:border-gray-700'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`font-bold text-sm ${selectedId === sol.id ? 'text-brand' : 'text-gray-700 dark:text-gray-300'}`}>{sol.title}</span>
                                    {selectedId === sol.id && <CheckCircle size={16} className="text-brand shrink-0"/>}
                                </div>
                                <div className="text-xs text-gray-500 font-mono mb-2">{sol.complexity}</div>
                                <div className="flex flex-wrap gap-1">
                                    {sol.tags?.slice(0, 3).map((tag, i) => (
                                        <span key={i} className="text-[9px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded border border-gray-200 dark:border-gray-700">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </button>
                        ))}

                        <button 
                            onClick={() => setViewMode('custom')}
                            className={`w-full p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-500 hover:text-brand hover:border-brand transition-all flex items-center justify-center gap-2 ${viewMode === 'custom' ? 'bg-brand/5 border-brand text-brand' : ''}`}
                        >
                            <Edit3 size={16} /> {isZh ? "添加自定义解法" : "Add Custom Solution"}
                        </button>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 hidden md:block">
                        <button onClick={onCancel} className="w-full py-2 text-xs font-bold text-gray-400 hover:text-gray-600 mb-2">
                            {isZh ? "返回" : "Cancel"}
                        </button>
                        <Button 
                            variant="primary" 
                            className="w-full py-4 shadow-lg flex items-center justify-center gap-2"
                            disabled={!selectedId && viewMode !== 'custom'}
                            onClick={() => {
                                if (viewMode === 'standard' && activeSolution) onConfirm(activeSolution);
                                else if (viewMode === 'custom') alert("Please define your custom solution first.");
                            }}
                        >
                            {isZh ? "开始学习" : "Start Learning"} <ArrowRight size={18}/>
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col h-2/3 md:h-full bg-white dark:bg-dark-card relative overflow-hidden">
                    {viewMode === 'standard' && activeSolution ? (
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 space-y-8">
                            {/* Header */}
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">{activeSolution.title}</h1>
                                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-bold text-gray-500 border border-gray-200 dark:border-gray-700 font-mono">
                                        {activeSolution.complexity}
                                    </span>
                                </div>
                                <div className="flex gap-2 mb-6">
                                    {activeSolution.tags?.map((tag, i) => (
                                        <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 text-xs font-bold rounded-lg border border-blue-100 dark:border-blue-900/50">
                                            <Tag size={12}/> {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Deep Dive Derivation (Markdown) */}
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-6 md:p-8 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                <h3 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <GraduationCap size={16}/> {isZh ? "教授解析 (Derivation)" : "Professor's Derivation"}
                                </h3>
                                <div className="text-sm md:text-base text-gray-800 dark:text-gray-200 leading-relaxed prose dark:prose-invert max-w-none">
                                    <MarkdownText content={activeSolution.derivation} />
                                </div>
                            </div>

                            {/* Implementation Code */}
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Code2 size={14}/> {isZh ? "代码逐行解析" : "Code Walkthrough"}
                                </h3>
                                <div className="w-full">
                                    <InteractiveCodeWidget 
                                        widget={{
                                            id: 'preview_code',
                                            type: 'interactive-code',
                                            interactiveCode: {
                                                language: activeSolution.language,
                                                lines: activeSolution.codeLines.length > 0 ? activeSolution.codeLines : activeSolution.code.split('\n').map(l => ({ code: l, explanation: '' })),
                                                caption: isZh ? "标准实现" : "Reference Implementation"
                                            }
                                        }}
                                        language={language}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 p-6 md:p-10 flex flex-col animate-fade-in-up overflow-y-auto">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{isZh ? "自定义解法" : "Custom Solution"}</h2>
                            <p className="text-sm text-gray-500 mb-6">{isZh ? "粘贴你的代码或思路，AI 将为你生成结构化课程。" : "Paste your code or logic. AI will structure a lesson around it."}</p>
                            
                            <textarea 
                                className="flex-1 bg-gray-50 dark:bg-[#1e1e1e] border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 font-mono text-sm focus:border-brand outline-none resize-none mb-6 text-gray-800 dark:text-gray-200"
                                placeholder={isZh ? "// 在此粘贴代码或描述... 越详细，AI分析越准确" : "// Paste code or description here..."}
                                value={customInput}
                                onChange={(e) => setCustomInput(e.target.value)}
                            />
                            
                            <div className="flex justify-end">
                                <button 
                                    onClick={handleRefineCustom}
                                    disabled={!customInput.trim() || refining}
                                    className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2"
                                >
                                    {refining ? <Loader2 size={18} className="animate-spin"/> : <Zap size={18}/>}
                                    {isZh ? "AI 深度分析并生成" : "AI Deep Analyze & Generate"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Mobile Footer Action */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800 md:hidden bg-white dark:bg-dark-card">
                        <Button 
                            variant="primary" 
                            className="w-full py-3 shadow-lg flex items-center justify-center gap-2"
                            disabled={!selectedId && viewMode !== 'custom'}
                            onClick={() => {
                                if (viewMode === 'standard' && activeSolution) onConfirm(activeSolution);
                                else if (viewMode === 'custom') alert("Please define your custom solution first.");
                            }}
                        >
                            {isZh ? "开始学习" : "Start Learning"} <ArrowRight size={18}/>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
