
import React, { useState, useEffect } from 'react';
import { Sparkles, Code2, CheckCircle, Edit3, ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import { SolutionStrategy, UserPreferences } from '../types';
import { generateLeetCodeSolutions, refineUserSolution } from '../services/geminiService';
import { MarkdownText } from './common/MarkdownText';
import { Button } from './Button';

interface SolutionSetupProps {
    problemName: string;
    problemDesc?: string;
    preferences: UserPreferences;
    language: 'Chinese' | 'English';
    onConfirm: (strategy: SolutionStrategy) => void;
    onCancel: () => void;
}

export const SolutionSetup: React.FC<SolutionSetupProps> = ({ problemName, problemDesc, preferences, language, onConfirm, onCancel }) => {
    const isZh = language === 'Chinese';
    const [isLoading, setIsLoading] = useState(false);
    const [solutions, setSolutions] = useState<SolutionStrategy[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [customInput, setCustomInput] = useState('');
    const [refining, setRefining] = useState(false);
    const [viewMode, setViewMode] = useState<'standard' | 'custom'>('standard');

    // Load or Generate on Mount
    useEffect(() => {
        const loadSolutions = async () => {
            setIsLoading(true);
            const cacheKey = `algolingo_sol_v3_${problemName}_${preferences.targetLanguage}`;
            const cached = localStorage.getItem(cacheKey);
            
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    // Ensure compatibility with SolutionStrategy interface
                    const adapted = (parsed.approaches || []).map((app: any) => ({
                        id: app.id,
                        title: app.title,
                        complexity: app.complexity,
                        code: app.widgets?.find((w: any) => w.type === 'interactive-code')?.interactiveCode?.lines?.map((l: any) => l.code).join('\n') || "// Code not found",
                        language: preferences.targetLanguage,
                        derivation: app.derivation || app.intuition || "No explanation provided.",
                        isCustom: false
                    }));
                    setSolutions(adapted);
                    if (adapted.length > 0) setSelectedId(adapted[0].id);
                    setIsLoading(false);
                    return;
                } catch(e) {
                    console.error("Cache Parse Error", e);
                }
            }

            // Fetch New
            try {
                const data = await generateLeetCodeSolutions(problemName, problemDesc || "Standard problem", preferences);
                const adapted = (data.approaches || []).map((app: any) => ({
                        id: app.id,
                        title: app.title,
                        complexity: app.complexity,
                        code: app.widgets?.find((w: any) => w.type === 'interactive-code')?.interactiveCode?.lines?.map((l: any) => l.code).join('\n') || "// Code not found",
                        language: preferences.targetLanguage,
                        derivation: app.derivation || app.intuition || "No explanation provided.",
                        isCustom: false
                }));
                setSolutions(adapted);
                if (adapted.length > 0) setSelectedId(adapted[0].id);
                localStorage.setItem(cacheKey, JSON.stringify(data));
            } catch (e) {
                alert("AI Generation Failed");
            } finally {
                setIsLoading(false);
            }
        };
        
        loadSolutions();
    }, [problemName]);

    const handleRefineCustom = async () => {
        if (!customInput.trim()) return;
        setRefining(true);
        try {
            const data = await refineUserSolution(customInput, problemName, preferences);
            const customStrategy: SolutionStrategy = {
                id: `custom_${Date.now()}`,
                title: isZh ? "我的自定义解法" : "My Custom Solution",
                complexity: data.complexity || "Analysis Pending",
                code: data.code || customInput, // AI should return clean code in 'code' field or we fallback
                language: preferences.targetLanguage,
                derivation: data.derivation || "Custom logic provided by user.",
                isCustom: true
            };
            setSolutions(prev => [...prev, customStrategy]);
            setSelectedId(customStrategy.id);
            setViewMode('standard');
        } catch (e) {
            alert("Refinement Failed");
        } finally {
            setRefining(false);
        }
    };

    const activeSolution = solutions.find(s => s.id === selectedId);

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-[100] bg-white dark:bg-dark-bg flex flex-col items-center justify-center p-8 animate-fade-in-up">
                <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center mb-6">
                    <Sparkles size={40} className="text-brand animate-pulse" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{isZh ? "AI 正在分析解题策略..." : "AI Analyzing Strategies..."}</h2>
                <p className="text-gray-500 dark:text-gray-400">{isZh ? "我们将为你生成多个维度的解法" : "Forging optimal approaches for you"}</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-gray-50 dark:bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-scale-in">
            <div className="w-full max-w-5xl bg-white dark:bg-dark-card rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col md:flex-row h-[85vh]">
                
                {/* Sidebar: List */}
                <div className="w-full md:w-1/3 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dark-bg/50 p-6 flex flex-col">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <BookOpen size={16} /> {isZh ? "选择你的武器" : "Choose Your Weapon"}
                    </h3>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                        {solutions.map(sol => (
                            <button
                                key={sol.id}
                                onClick={() => { setSelectedId(sol.id); setViewMode('standard'); }}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selectedId === sol.id ? 'border-brand bg-white dark:bg-dark-card shadow-md' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`font-bold ${selectedId === sol.id ? 'text-brand' : 'text-gray-700 dark:text-gray-300'}`}>{sol.title}</span>
                                    {selectedId === sol.id && <CheckCircle size={16} className="text-brand"/>}
                                </div>
                                <div className="text-xs text-gray-500 font-mono">{sol.complexity}</div>
                            </button>
                        ))}

                        <button 
                            onClick={() => setViewMode('custom')}
                            className={`w-full p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-500 hover:text-brand hover:border-brand transition-all flex items-center justify-center gap-2 ${viewMode === 'custom' ? 'bg-brand/5 border-brand text-brand' : ''}`}
                        >
                            <Edit3 size={16} /> {isZh ? "添加自定义解法" : "Add Custom Solution"}
                        </button>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                        <Button 
                            variant="primary" 
                            className="w-full py-4 shadow-lg flex items-center justify-center gap-2"
                            disabled={!selectedId || viewMode === 'custom'}
                            onClick={() => activeSolution && onConfirm(activeSolution)}
                        >
                            {isZh ? "以此解法开始学习" : "Learn This Approach"} <ArrowRight size={18}/>
                        </Button>
                        <button onClick={onCancel} className="w-full mt-3 py-2 text-xs font-bold text-gray-400 hover:text-gray-600">
                            {isZh ? "返回" : "Cancel"}
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar bg-white dark:bg-dark-card relative">
                    {viewMode === 'standard' && activeSolution ? (
                        <div className="space-y-8 animate-fade-in-up">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">{activeSolution.title}</h1>
                                <div className="inline-block bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg text-xs font-mono font-bold text-gray-600 dark:text-gray-300">
                                    {activeSolution.complexity}
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                <h3 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4">
                                    {isZh ? "核心思路" : "Derivation"}
                                </h3>
                                <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                                    <MarkdownText content={activeSolution.derivation} />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4">
                                    {isZh ? "代码实现" : "Implementation"}
                                </h3>
                                <div className="bg-[#1e1e1e] p-6 rounded-2xl overflow-x-auto shadow-inner">
                                    <pre className="font-mono text-sm text-gray-300 leading-relaxed">
                                        {activeSolution.code}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col animate-fade-in-up">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{isZh ? "自定义解法" : "Custom Solution"}</h2>
                            <p className="text-sm text-gray-500 mb-6">{isZh ? "粘贴你的代码或思路，AI 将为你生成结构化课程。" : "Paste your code or logic. AI will structure a lesson around it."}</p>
                            
                            <textarea 
                                className="flex-1 bg-gray-50 dark:bg-[#1e1e1e] border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 font-mono text-sm focus:border-brand outline-none resize-none mb-6 text-gray-800 dark:text-gray-200"
                                placeholder={isZh ? "// 在此粘贴代码或描述..." : "// Paste code or description here..."}
                                value={customInput}
                                onChange={(e) => setCustomInput(e.target.value)}
                            />
                            
                            <div className="flex justify-end">
                                <button 
                                    onClick={handleRefineCustom}
                                    disabled={!customInput.trim() || refining}
                                    className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2"
                                >
                                    {refining ? <Loader2 size={18} className="animate-spin"/> : <Sparkles size={18}/>}
                                    {isZh ? "AI 优化并使用" : "Refine & Use"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
