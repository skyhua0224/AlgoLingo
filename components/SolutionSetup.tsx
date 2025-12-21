
import React, { useState, useEffect } from 'react';
import { Sparkles, Code2, ArrowRight, X, Flame, ThumbsUp, Zap, Lightbulb, RefreshCw, Trash2, Workflow, ChevronRight, Brain, Key, ScrollText } from 'lucide-react';
import { SolutionStrategy, UserPreferences, MissionBriefData, SmartTagData } from '../types';
import { generateProblemStrategies } from '../services/geminiService';
import { MarkdownText } from './common/MarkdownText';
import { Button } from './Button';
import { InteractiveCodeWidget } from './widgets/InteractiveCode';
import { LogicFlowWidget } from './widgets/LogicFlow';
import { SmartTag } from './widgets/SmartTag';

interface SolutionSetupProps {
    problemName: string;
    problemDesc?: string;
    preferences: UserPreferences;
    language: 'Chinese' | 'English';
    onConfirm: (strategy: SolutionStrategy) => void;
    onCancel: () => void;
    onDataChange?: (highPriority: boolean) => void;
}

export const SolutionSetup: React.FC<SolutionSetupProps> = ({ problemName, problemDesc, preferences, language, onConfirm, onCancel, onDataChange }) => {
    const isZh = language === 'Chinese';
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [solutions, setSolutions] = useState<SolutionStrategy[]>([]);
    const [commonTags, setCommonTags] = useState<SmartTagData[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    
    // Adapter for AI response
    const adaptStrategy = (app: any, lang: string): SolutionStrategy => {
        return {
            id: app.id,
            title: app.title,
            complexity: app.complexity,
            tags: app.tags || [],
            summary: app.summary,
            rationale: app.rationale || app.summary, 
            derivation: app.derivation || "",
            analogy: app.analogy || "",
            memoryTip: app.memoryTip || "",
            code: app.code || "// Code loading...", 
            codeWidgets: app.widgets || [], 
            language: lang,
            isCustom: !!app.isCustom, 
            sections: app.sections,
            keywords: app.keywords || [],
            logicSteps: app.logicSteps || [],
            expandedKnowledge: []
        };
    };

    const loadSolutions = async (forceReset = false) => {
        setIsLoadingList(true);
        const cacheKey = `algolingo_sol_v3_${problemName}_${preferences.targetLanguage}`;
        
        if (!forceReset) {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    
                    if (parsed.commonTags) {
                        setCommonTags(parsed.commonTags || []);
                    }

                    if (parsed && Array.isArray(parsed.approaches) && parsed.approaches.length > 0) {
                        const adapted = parsed.approaches.map((app: any) => adaptStrategy(app, preferences.targetLanguage));
                        setSolutions(adapted);
                        if (adapted.length > 0) setSelectedId(adapted[0].id);
                        setIsLoadingList(false);
                        return;
                    }
                } catch(e) {
                    console.error("Cache Parse Error", e);
                }
            }
        }

        try {
            if (forceReset) localStorage.removeItem(cacheKey);
            const data = await generateProblemStrategies(problemName, problemDesc || problemName, preferences);
            
            if (data.commonTags) setCommonTags(data.commonTags || []);

            const adapted = (data.approaches || []).map((app: any) => adaptStrategy(app, preferences.targetLanguage));
            setSolutions(adapted);
            if (adapted.length > 0) setSelectedId(adapted[0].id);
            localStorage.setItem(cacheKey, JSON.stringify(data));
            
            // Notify high-value data generation
            onDataChange?.(true);

        } catch (e) {
            console.error("Strategy Generation Failed", e);
            alert(isZh ? "生成策略失败，请重试。" : "Failed to generate strategies. Please try again.");
        } finally {
            setIsLoadingList(false);
        }
    };

    useEffect(() => {
        loadSolutions(false);
    }, [problemName, preferences.targetLanguage]); 

    const activeSolution = solutions.find(s => s.id === selectedId);
    const isOptimal = (tags: string[]) => tags.some(t => t.toLowerCase().includes('optimal') || t.toLowerCase().includes('best') || t.includes('最优'));
    const isRecommended = (sol: SolutionStrategy) => sol.tags.includes('Recommended') || sol.tags.includes('推荐');

    // --- RENDER ---
    if (isLoadingList) {
        return (
            <div className="fixed inset-0 z-[100] bg-white/80 dark:bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-fade-in-up">
                <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-brand/20">
                    <Sparkles size={40} className="text-brand animate-pulse" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{isZh ? "AI 正在策划解题策略..." : "AI Brainstorming Strategies..."}</h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium">{isZh ? "正在生成深度解析、比喻与可视化逻辑" : "Generating deep rationale, analogies, and logic flows"}</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-gray-100/90 dark:bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 animate-scale-in">
            <div className="bg-white dark:bg-[#0c0c0c] w-full max-w-[1400px] h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col relative z-10 border border-gray-200 dark:border-gray-800">
                
                {/* Reset Modal */}
                {showResetConfirm && (
                    <div className="absolute inset-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in-up">
                        <div className="bg-white dark:bg-[#151515] w-full max-w-sm rounded-3xl p-8 shadow-2xl border border-gray-200 dark:border-gray-800 text-center">
                            <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-5 text-red-500">
                                <Trash2 size={28} />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3">
                                {isZh ? "确认重置？" : "Confirm Reset?"}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed font-medium">
                                {isZh 
                                 ? "这将清除缓存并消耗 Token 重新生成所有策略。建议仅在内容有误时操作。" 
                                 : "This will wipe cache and use tokens to regenerate all strategies. Use only if content is broken."}
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setShowResetConfirm(false)}
                                    className="flex-1 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    {isZh ? "取消" : "Cancel"}
                                </button>
                                <button 
                                    onClick={() => {
                                        loadSolutions(true);
                                        setShowResetConfirm(false);
                                    }}
                                    className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-500/20 transition-colors"
                                >
                                    {isZh ? "确认重置" : "Reset"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Top Bar */}
                <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-[#0c0c0c] shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{isZh ? "战术控制台" : "Tactical Console"}</h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">{problemName}</p>
                    </div>
                    <button onClick={onCancel} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    
                    {/* LEFT: Strategy List */}
                    <div className="w-[340px] border-r border-gray-100 dark:border-gray-800 flex flex-col bg-gray-50/50 dark:bg-[#111] overflow-hidden shrink-0">
                        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-3">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">
                                {isZh ? "可选策略" : "Available Strategies"}
                            </h3>
                            
                            {solutions.map((sol, index) => {
                                const active = selectedId === sol.id;
                                const optimal = isOptimal(sol.tags);
                                const recommended = isRecommended(sol);

                                return (
                                    <div 
                                        key={sol.id}
                                        onClick={() => setSelectedId(sol.id)}
                                        className={`
                                            relative p-5 rounded-2xl cursor-pointer transition-all duration-300 group
                                            ${active 
                                                ? 'bg-white dark:bg-dark-card shadow-lg ring-1 ring-black/5 dark:ring-white/10 translate-x-1' 
                                                : 'hover:bg-white/60 dark:hover:bg-white/5 hover:translate-x-1'
                                            }
                                        `}
                                    >
                                        {/* Active Indicator */}
                                        {active && <div className="absolute left-0 top-6 bottom-6 w-1 bg-brand rounded-r-full"></div>}

                                        <div className="flex items-center gap-2 mb-2">
                                            {recommended && (
                                                <span className="flex items-center gap-1 text-[9px] font-black uppercase bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-1.5 py-0.5 rounded-md">
                                                    <ThumbsUp size={10} strokeWidth={3} /> {isZh ? "推荐" : "Rec"}
                                                </span>
                                            )}
                                            {optimal && (
                                                <span className="flex items-center gap-1 text-[9px] font-black uppercase bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-1.5 py-0.5 rounded-md">
                                                    <Flame size={10} strokeWidth={3} className="fill-current" /> {isZh ? "最优" : "Optimal"}
                                                </span>
                                            )}
                                            {!recommended && !optimal && (
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                                                    # {index + 1}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className={`font-bold text-base mb-1.5 leading-tight ${active ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                                            {sol.title}
                                        </h3>
                                        
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1 text-xs font-mono text-gray-400">
                                                <Zap size={12} className="text-yellow-500 fill-current"/> 
                                                {sol.complexity}
                                            </div>
                                            {active && <ChevronRight size={16} className="text-brand" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Regenerate Action */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
                            <button 
                                onClick={() => setShowResetConfirm(true)}
                                className="w-full py-3 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                            >
                                <RefreshCw size={14} />
                                {isZh ? "重新生成" : "Regenerate All"}
                            </button>
                        </div>
                    </div>

                    {/* RIGHT: Detail Console */}
                    <div className="flex-1 flex flex-col bg-white dark:bg-[#0c0c0c] overflow-hidden relative">
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {activeSolution && (
                                <div className="max-w-5xl mx-auto p-6 md:p-10 pb-32 space-y-8 animate-fade-in-up">
                                    
                                    {/* Header & Smart Tags (Level 2) */}
                                    <div>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {/* Legacy Tags (e.g. Recommended) */}
                                            {activeSolution.tags.map((tag, i) => (
                                                <span key={i} className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-transparent">
                                                    {tag}
                                                </span>
                                            ))}
                                            {/* Smart Tags (Concepts) */}
                                            {commonTags.map((tag, i) => (
                                                <SmartTag key={`st-${i}`} data={tag} />
                                            ))}
                                        </div>
                                        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-4 leading-tight">
                                            {activeSolution.title}
                                        </h1>
                                        <div className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed border-l-4 border-brand pl-4 font-medium">
                                            {activeSolution.summary || activeSolution.rationale}
                                        </div>
                                    </div>

                                    {/* BENTO GRID LAYOUT (Level 3) */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        
                                        {/* 1. Intuition Card */}
                                        <div className="md:col-span-2 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-3xl p-6 border border-indigo-100 dark:border-indigo-900/30 flex flex-col md:flex-row gap-6 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                                            
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-3 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest">
                                                    <Brain size={16} />
                                                    {isZh ? "核心直觉 (Intuition)" : "Core Intuition"}
                                                </div>
                                                <div className="text-indigo-900 dark:text-indigo-100 text-base font-medium leading-relaxed italic">
                                                    <MarkdownText content={activeSolution.analogy || "Think of it simply..."} />
                                                </div>
                                            </div>
                                            
                                            {activeSolution.memoryTip && (
                                                <div className="shrink-0 bg-white/60 dark:bg-black/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 backdrop-blur-sm md:w-64">
                                                    <div className="flex items-center gap-2 mb-2 text-indigo-500 font-bold text-xs uppercase tracking-wider">
                                                        <ScrollText size={14} />
                                                        {isZh ? "记忆口诀" : "Memory Tip"}
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-800 dark:text-white">
                                                        {activeSolution.memoryTip}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* 2. Syntax Toolbox */}
                                        <div className="md:col-span-2">
                                            <div className="flex items-center gap-2 mb-4 text-gray-400 font-bold text-xs uppercase tracking-widest">
                                                <Key size={16} />
                                                {isZh ? "语法工具箱" : "Syntax Toolbox"}
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                {activeSolution.keywords?.map((kw, i) => (
                                                    <div key={i} className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#151515] rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand dark:hover:border-brand transition-colors group">
                                                        <span className="font-mono text-sm font-bold text-brand">{kw.term}</span>
                                                        <div className="h-4 w-px bg-gray-300 dark:bg-gray-700"></div>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium group-hover:text-gray-800 dark:group-hover:text-gray-200">{kw.definition}</span>
                                                    </div>
                                                ))}
                                                {(!activeSolution.keywords || activeSolution.keywords.length === 0) && (
                                                    <span className="text-xs text-gray-400 italic">No specific syntax highlights.</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* 3. Logic Flow (Full Width) */}
                                        {activeSolution.logicSteps && activeSolution.logicSteps.length > 0 && (
                                            <div className="md:col-span-2">
                                                <div className="flex items-center gap-2 mb-4 text-gray-400 font-bold text-xs uppercase tracking-widest">
                                                    <Workflow size={16} />
                                                    {isZh ? "逻辑蓝图" : "Logic Blueprint"}
                                                </div>
                                                <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-3xl p-6">
                                                    <LogicFlowWidget steps={activeSolution.logicSteps} />
                                                </div>
                                            </div>
                                        )}

                                        {/* 4. Code Preview (Full Width) */}
                                        <div className="md:col-span-2">
                                            <div className="flex items-center gap-2 mb-4 text-gray-400 font-bold text-xs uppercase tracking-widest">
                                                <Code2 size={16} />
                                                {isZh ? "代码实现" : "Implementation"}
                                            </div>
                                            {activeSolution.codeWidgets && activeSolution.codeWidgets.length > 0 ? (
                                                activeSolution.codeWidgets.map((w, i) => (
                                                    w.type === 'interactive-code' ? 
                                                    <InteractiveCodeWidget key={i} widget={w} language={language} /> : null
                                                ))
                                            ) : (
                                                <InteractiveCodeWidget 
                                                    language={language}
                                                    widget={{
                                                        id: `fallback_${activeSolution.id}`,
                                                        type: 'interactive-code',
                                                        interactiveCode: {
                                                            language: preferences.targetLanguage,
                                                            lines: activeSolution.code 
                                                                ? activeSolution.code.split('\n').map(l => ({ code: l, explanation: '' }))
                                                                : [{ code: "// No code provided", explanation: "" }]
                                                        }
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Floating Action Bar (Sticky Footer) */}
                        {activeSolution && (
                            <div className="shrink-0 p-6 border-t border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-[#0c0c0c]/90 backdrop-blur-md z-20 flex justify-center">
                                <Button 
                                    onClick={() => onConfirm(activeSolution)}
                                    size="lg"
                                    className="shadow-2xl shadow-brand/30 w-full max-w-md flex items-center justify-center gap-3 px-10 py-4 text-lg bg-brand hover:bg-brand-dark hover:scale-[1.02] active:scale-95 transition-all rounded-2xl"
                                >
                                    <ArrowRight size={24} strokeWidth={3} />
                                    {isZh ? "开始学习此策略" : "Start with this Strategy"}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
