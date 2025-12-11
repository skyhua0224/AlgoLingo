
import React, { useState, useEffect } from 'react';
import { Sparkles, Code2, CheckCircle, Edit3, ArrowRight, BookOpen, Loader2, Lightbulb, Brain, Key, Share2, Plus, Trash2, RefreshCw, X, MessageSquarePlus, Send, HelpCircle, User, Bot, AlertTriangle, FileJson, Copy, Check } from 'lucide-react';
import { SolutionStrategy, UserPreferences } from '../types';
import { generateLeetCodeSolutions, refineUserSolution, regenerateSolutionStrategy, generateAiAssistance } from '../services/geminiService';
import { MarkdownText } from './common/MarkdownText';
import { Button } from './Button';
import { InteractiveCodeWidget } from './widgets/InteractiveCode';
import { MermaidVisualWidget } from './widgets/MermaidVisual';
import { GlobalAiAssistant } from './GlobalAiAssistant';

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
    
    // Modals State
    const [showRegenModal, setShowRegenModal] = useState(false); // Single strategy regen
    const [showRegenAllModal, setShowRegenAllModal] = useState(false); // All strategies regen
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null); // Delete confirmation

    const [regenPrompt, setRegenPrompt] = useState('');
    const [isRegenerating, setIsRegenerating] = useState(false);

    // Knowledge Expansion State
    const [knowledgePopup, setKnowledgePopup] = useState<{title: string, content: string | null} | null>(null);

    // Debug State
    const [showDebug, setShowDebug] = useState(false);
    const [copied, setCopied] = useState(false);

    // Adapter for backward compatibility or different JSON shapes
    const adaptStrategy = (app: any, lang: string): SolutionStrategy => {
        return {
            id: app.id,
            title: app.title,
            complexity: app.complexity,
            tags: app.tags || [],
            rationale: app.rationale,
            derivation: app.derivation || app.intuition || "No explanation provided.",
            analogy: app.analogy,
            memoryTip: app.memoryTip,
            expandedKnowledge: app.expandedKnowledge || [],
            mermaid: app.mermaid,
            keywords: app.keywords || [], // [{term, definition, memoryTip}]
            code: app.code || "// Code logic missing", // Raw string
            codeWidgets: app.widgets || app.codeWidgets || [], // Interactive Widgets
            language: lang,
            isCustom: !!app.isCustom, // Ensure boolean
            sections: app.sections
        };
    };

    // Helper to persist current solutions state
    const updateCache = (newSolutions: SolutionStrategy[]) => {
        const cacheKey = `algolingo_sol_v3_${problemName}_${preferences.targetLanguage}`;
        localStorage.setItem(cacheKey, JSON.stringify({ approaches: newSolutions }));
    };

    // Load or Generate on Mount
    useEffect(() => {
        const loadSolutions = async () => {
            setIsLoading(true);
            const cacheKey = `algolingo_sol_v3_${problemName}_${preferences.targetLanguage}`;
            const cached = localStorage.getItem(cacheKey);
            
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    const adapted = (parsed.approaches || []).map((app: any) => adaptStrategy(app, preferences.targetLanguage));
                    setSolutions(adapted);
                    if (adapted.length > 0) setSelectedId(adapted[0].id);
                    setIsLoading(false);
                    return;
                } catch(e) {
                    console.error("Cache Parse Error", e);
                }
            }

            // Fetch New (Chained with Context)
            try {
                const data = await generateLeetCodeSolutions(problemName, problemDesc || problemName, preferences);
                const adapted = (data.approaches || []).map((app: any) => adaptStrategy(app, preferences.targetLanguage));
                setSolutions(adapted);
                if (adapted.length > 0) setSelectedId(adapted[0].id);
                localStorage.setItem(cacheKey, JSON.stringify(data));
            } catch (e) {
                console.error("Initial Generation Failed", e);
            } finally {
                setIsLoading(false);
            }
        };
        
        loadSolutions();
    }, [problemName, preferences.targetLanguage]); 

    const handleRefineCustom = async () => {
        if (!customInput.trim()) return;
        setRefining(true);
        try {
            const data = await refineUserSolution(customInput, problemName, preferences);
            const customStrategy: SolutionStrategy = {
                id: `custom_${Date.now()}`,
                title: isZh ? "我的自定义解法" : "My Custom Solution",
                complexity: data.complexity || "Analysis Pending",
                tags: ["Custom"],
                derivation: data.derivation || "Custom logic provided by user.",
                rationale: data.rationale,
                analogy: data.analogy,
                memoryTip: data.memoryTip,
                mermaid: data.mermaid,
                code: data.code || customInput,
                codeWidgets: data.codeWidgets || [],
                keywords: data.keywords || [],
                language: preferences.targetLanguage,
                isCustom: true
            };
            
            setSolutions(prev => {
                const updated = [...prev, customStrategy];
                updateCache(updated);
                return updated;
            });
            
            setSelectedId(customStrategy.id);
            setViewMode('standard');
            setCustomInput(''); // Clear input after success
        } catch (e) {
            alert("Refinement Failed");
        } finally {
            setRefining(false);
        }
    };

    const handleDeleteTrigger = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setDeleteTargetId(id);
    };

    const confirmDelete = () => {
        if (!deleteTargetId) return;
        
        const newSolutions = solutions.filter(s => s.id !== deleteTargetId);
        setSolutions(newSolutions);
        
        // If we deleted the active one, select the first available, or none
        if (selectedId === deleteTargetId) {
            const nextId = newSolutions.length > 0 ? newSolutions[0].id : null;
            setSelectedId(nextId);
            setViewMode('standard'); 
        }
        
        updateCache(newSolutions);
        setDeleteTargetId(null);
    };

    const handleRegenerateAllTrigger = () => {
        setShowRegenAllModal(true);
    };

    const confirmRegenerateAll = async () => {
        setShowRegenAllModal(false);
        setIsLoading(true); // Enter Loading Screen Immediately
        
        try {
            // 1. Identify Custom Strategies to Keep
            const customStrategies = solutions.filter(s => s.isCustom);
            
            // Clear current list visually to indicate reset (optional, but isLoading covers it)
            setSolutions([]); 

            // 2. Generate fresh AI strategies
            const data = await generateLeetCodeSolutions(problemName, problemDesc || problemName, preferences);
            const newAiStrategies = (data.approaches || []).map((app: any) => adaptStrategy(app, preferences.targetLanguage));
            
            // 3. Merge: New AI strategies (top) + Preserved Custom strategies (bottom)
            const merged = [...newAiStrategies, ...customStrategies];
            
            setSolutions(merged);
            
            // 4. Select the first new AI strategy if available, else first custom
            if (newAiStrategies.length > 0) {
                setSelectedId(newAiStrategies[0].id);
            } else if (customStrategies.length > 0) {
                setSelectedId(customStrategies[0].id);
            }
            
            updateCache(merged);
        } catch (e) {
            console.error(e);
            alert(isZh ? "生成失败，请检查网络" : "AI Generation Failed");
            // Restore previous state if failed (optional, but good UX)
        } finally {
            setIsLoading(false);
        }
    };

    // Shared regeneration logic
    const executeRegenerateStrategy = async (strategyId: string, prompt: string) => {
        const activeSol = solutions.find(s => s.id === strategyId);
        if (!activeSol) return;

        try {
            const updated = await regenerateSolutionStrategy(activeSol, prompt, preferences);
            const adapted = adaptStrategy(updated, preferences.targetLanguage);
            
            // Preserve isCustom flag if it was custom
            adapted.isCustom = activeSol.isCustom;

            const newSolutions = solutions.map(s => s.id === activeSol.id ? adapted : s);
            setSolutions(newSolutions);
            updateCache(newSolutions); 
            return true;
        } catch (e) {
            alert(isZh ? "重新生成失败" : "Regeneration failed");
            return false;
        }
    };

    // Handler for Modal (Whole Strategy)
    const handleRegenerateSingleModal = async () => {
        if (!selectedId || !regenPrompt.trim()) return;
        setIsRegenerating(true);
        await executeRegenerateStrategy(selectedId, regenPrompt);
        setIsRegenerating(false);
        setShowRegenModal(false);
        setRegenPrompt('');
    };

    // Handler for Widgets (e.g. Mermaid Repair)
    const handleWidgetRegenerate = async (instruction: string) => {
        if (!selectedId) return;
        // Silent update (or we could show a loader toast)
        await executeRegenerateStrategy(selectedId, instruction);
    };

    const handleExpandKnowledge = async (point: string) => {
        setKnowledgePopup({ title: point, content: null });
        try {
            const context = `Problem: ${problemName}. Concept: ${point}.`;
            const prompt = isZh 
                ? `请简要解释算法概念 "${point}" (在 ${problemName} 的上下文中)。` 
                : `Explain "${point}" in the context of this algorithm problem briefly.`;
                
            const explanation = await generateAiAssistance(context, prompt, preferences, 'gemini-2.5-flash');
            setKnowledgePopup({ title: point, content: explanation });
        } catch (e) {
            setKnowledgePopup({ title: point, content: "Error fetching explanation." });
        }
    };

    const handleCopyJSON = () => {
        if (activeSolution) {
            navigator.clipboard.writeText(JSON.stringify(activeSolution, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const activeSolution = solutions.find(s => s.id === selectedId);

    // Helper to render code block using interactive widget even if raw
    const renderCodeSection = () => {
        if (!activeSolution) return null;

        // 1. If explicit widgets exist, use them
        if (activeSolution.codeWidgets && activeSolution.codeWidgets.length > 0) {
            return (
                <div className="space-y-4">
                    {activeSolution.codeWidgets.map((w, i) => (
                        w.type === 'interactive-code' ? 
                        <InteractiveCodeWidget key={i} widget={w} language={language} /> : null
                    ))}
                </div>
            );
        }

        // 2. Fallback: Parse raw code string intelligently
        if (activeSolution.code) {
            const rawLines = activeSolution.code.split('\n');
            const lines: {code: string, explanation: string, isSpacer?: boolean}[] = [];
            let pendingExpl = "";

            for (const line of rawLines) {
                const trimmedLine = line.trim();
                
                // Determine if it's a visual spacer line
                if (trimmedLine === "") {
                    // Push a spacer line. It carries no logic, just layout.
                    // IMPORTANT: Keep pendingExpl! It should jump OVER the empty line to the next code block.
                    lines.push({ code: "", explanation: "", isSpacer: true });
                    continue;
                }

                // Detect comment (allowing indentation)
                const commentMatch = line.match(/^\s*(\/\/|#)\s*(.+)$/);
                
                if (commentMatch) {
                    // It is a comment line. Accumulate explanation for the next real code line.
                    pendingExpl = pendingExpl ? `${pendingExpl}\n${commentMatch[2]}` : commentMatch[2];
                } else {
                    // It is code.
                    // Also check for inline comment
                    const inlineMatch = line.match(/^(.*?)(\/\/|#)\s*(.+)$/);
                    let codePart = line;
                    let inlineExpl = "";
                    
                    if (inlineMatch) {
                        codePart = inlineMatch[1].trimEnd();
                        inlineExpl = inlineMatch[3].trim();
                    }

                    // Combine pending explanation with inline explanation
                    let finalExpl = [pendingExpl, inlineExpl].filter(Boolean).join("\n");
                    
                    // --- FALLBACK EXPLANATION LOGIC ---
                    if (!finalExpl) {
                        if (trimmedLine === '}' || trimmedLine === '};' || trimmedLine === '});') {
                            finalExpl = isZh ? "结束当前代码块 / 作用域。" : "End of current block/scope.";
                        } else if (trimmedLine.endsWith('{')) {
                            finalExpl = isZh ? "开启新的逻辑块。" : "Begin new logic block.";
                        } else if (trimmedLine.startsWith('return')) {
                            finalExpl = isZh ? "返回最终结果。" : "Return result.";
                        } else if (trimmedLine.startsWith('class ')) {
                            finalExpl = isZh ? "定义类结构。" : "Define Class structure.";
                        } else if (trimmedLine.includes('(') && trimmedLine.includes(')')) {
                            finalExpl = isZh ? "方法调用或定义。" : "Method call or definition.";
                        } else {
                            finalExpl = isZh ? "逻辑执行步骤。" : "Logic execution step.";
                        }
                    }
                    
                    lines.push({
                        code: codePart,
                        explanation: finalExpl
                    });
                    
                    // Clear pending
                    pendingExpl = "";
                }
            }

            const syntheticWidget: any = {
                id: `synth_${activeSolution.id}`,
                type: 'interactive-code',
                interactiveCode: {
                    language: activeSolution.language || preferences.targetLanguage,
                    lines: lines,
                    caption: lines.every(l => !l.explanation) ? (isZh ? "点击生成的课程以获取深度逐行解析。" : "Start lesson to see deep line-by-line analysis.") : undefined
                }
            };
            return <InteractiveCodeWidget widget={syntheticWidget} language={language} />;
        }

        return null;
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-[100] bg-white dark:bg-dark-bg flex flex-col items-center justify-center p-8 animate-fade-in-up">
                <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center mb-6">
                    <Sparkles size={40} className="text-brand animate-pulse" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{isZh ? "AI 正在深度思考..." : "AI Thinking Deeply..."}</h2>
                <p className="text-gray-500 dark:text-gray-400">{isZh ? "正在推导解题思路与可视化图表" : "Deriving logic and visualizations"}</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-gray-50 dark:bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-scale-in">
            
            {/* Modal: Single Strategy Regenerate */}
            {showRegenModal && (
                <div className="absolute inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white dark:bg-dark-card w-full max-w-md p-6 rounded-2xl shadow-xl border-2 border-brand/20 animate-scale-in">
                        <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <RefreshCw size={18} /> {isZh ? "重新生成此策略" : "Regenerate This Strategy"}
                        </h3>
                        <textarea 
                            className="w-full h-32 p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-xl mb-4 focus:border-brand outline-none resize-none text-sm"
                            placeholder={isZh ? "输入修改要求 (例如: 解释更通俗一点)..." : "Instructions (e.g. Make analogy simpler)..."}
                            value={regenPrompt}
                            onChange={(e) => setRegenPrompt(e.target.value)}
                            autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setShowRegenModal(false)} className="px-4 py-2 text-gray-500 font-bold text-xs">{isZh ? "取消" : "Cancel"}</button>
                            <button 
                                onClick={handleRegenerateSingleModal}
                                disabled={isRegenerating || !regenPrompt.trim()}
                                className="px-6 py-2 bg-brand text-white rounded-lg font-bold text-xs flex items-center gap-2 disabled:opacity-50"
                            >
                                {isRegenerating ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>}
                                {isZh ? "确认" : "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Regenerate ALL Strategies */}
            {showRegenAllModal && (
                <div className="absolute inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white dark:bg-dark-card w-full max-w-md p-6 rounded-2xl shadow-xl border-2 border-red-100 dark:border-red-900/50 animate-scale-in">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4 text-red-500">
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">
                            {isZh ? "确定要重新生成所有 AI 策略吗？" : "Regenerate all AI strategies?"}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                            {isZh 
                                ? "您的【自定义策略】将会被保留，但其他所有 AI 生成的策略将被清空并重新生成。" 
                                : "Your CUSTOM strategies will be preserved, but all standard AI strategies will be cleared and regenerated."}
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowRegenAllModal(false)} className="px-4 py-2 text-gray-500 font-bold text-sm hover:text-gray-700 dark:hover:text-gray-300">
                                {isZh ? "取消" : "Cancel"}
                            </button>
                            <button 
                                onClick={confirmRegenerateAll}
                                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg"
                            >
                                <RefreshCw size={16}/>
                                {isZh ? "清空并重新生成" : "Clear & Regenerate"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Delete Confirmation */}
            {deleteTargetId && (
                <div className="absolute inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white dark:bg-dark-card w-full max-w-sm p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 animate-scale-in">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            {isZh ? "删除此策略？" : "Delete Strategy?"}
                        </h3>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setDeleteTargetId(null)} className="px-4 py-2 text-gray-500 font-bold text-sm hover:text-gray-700 dark:hover:text-gray-300">
                                {isZh ? "取消" : "Cancel"}
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm"
                            >
                                <Trash2 size={16}/>
                                {isZh ? "删除" : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Knowledge Popup */}
            {knowledgePopup && (
                <div className="absolute inset-0 z-[120] flex items-center justify-center pointer-events-none">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl border border-brand/20 max-w-sm w-full pointer-events-auto animate-scale-in mx-4">
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="text-sm font-black text-brand uppercase tracking-wider flex items-center gap-2">
                                <Lightbulb size={16}/> {knowledgePopup.title}
                            </h3>
                            <button onClick={() => setKnowledgePopup(null)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
                        </div>
                        {knowledgePopup.content ? (
                            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                <MarkdownText content={knowledgePopup.content} />
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-gray-500 text-xs"><Loader2 size={14} className="animate-spin"/> AI Explaining...</div>
                        )}
                    </div>
                </div>
            )}

            {/* Debug JSON Modal */}
            {showDebug && activeSolution && (
                <div className="absolute inset-0 z-[150] bg-gray-900/90 backdrop-blur flex items-center justify-center p-6">
                    <div className="bg-gray-900 w-full max-w-2xl h-[70vh] rounded-xl border border-gray-700 shadow-2xl flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b border-gray-700">
                            <div className="flex items-center gap-2 text-green-400 font-mono text-sm font-bold">
                                <FileJson size={16}/> JSON DEBUGGER
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleCopyJSON}
                                    className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-xs"
                                >
                                    {copied ? <Check size={14}/> : <Copy size={14}/>} {copied ? 'Copied' : 'Copy'}
                                </button>
                                <button onClick={() => setShowDebug(false)} className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-white">
                                    <X size={16}/>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                            <pre className="text-xs font-mono text-green-300/80 whitespace-pre-wrap">
                                {JSON.stringify(activeSolution, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full max-w-6xl bg-white dark:bg-dark-card rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col md:flex-row h-[90vh] relative">
                
                {/* Global Assistant Hook */}
                <GlobalAiAssistant problemName={problemName} preferences={preferences} language={language} />

                {/* Sidebar: List */}
                <div className="w-full md:w-1/4 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dark-bg/50 p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <BookOpen size={14} /> {isZh ? "选择策略" : "Select Strategy"}
                        </h3>
                        <button 
                            onClick={handleRegenerateAllTrigger}
                            disabled={isLoading}
                            className={`px-3 py-1.5 rounded-lg shadow-sm border transition-all flex items-center gap-1.5 ${
                                isLoading 
                                ? 'bg-gray-100 text-gray-300 cursor-not-allowed border-gray-200' 
                                : 'text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-brand bg-white dark:bg-dark-card border-gray-200 dark:border-gray-700 hover:border-brand'
                            }`}
                            title={isZh ? "完全重新生成所有 AI 策略" : "Regenerate All AI Strategies"}
                        >
                            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                            <span>{isZh ? "全部重试" : "Retry All"}</span>
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                        {solutions.map(sol => (
                            <div
                                key={sol.id}
                                onClick={() => { setSelectedId(sol.id); setViewMode('standard'); }}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all cursor-pointer relative group ${selectedId === sol.id ? 'border-brand bg-white dark:bg-dark-card shadow-md' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`font-bold text-sm truncate pr-4 ${selectedId === sol.id ? 'text-brand' : 'text-gray-700 dark:text-gray-300'}`}>{sol.title}</span>
                                    {selectedId === sol.id && <CheckCircle size={16} className="text-brand shrink-0"/>}
                                </div>
                                <div className="text-[10px] text-gray-500 font-mono mb-2">{sol.complexity}</div>
                                
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {/* Source Tag: AI vs Custom */}
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border flex items-center gap-1 ${sol.isCustom ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 border-blue-100 dark:border-blue-800'}`}>
                                        {sol.isCustom ? <User size={8}/> : <Bot size={8}/>}
                                        {sol.isCustom ? (isZh ? "自定义" : "Custom") : "AI"}
                                    </span>
                                    {/* Other Tags */}
                                    {sol.tags.slice(0, 2).map(tag => (
                                        <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-500">{tag}</span>
                                    ))}
                                </div>

                                <button 
                                    onClick={(e) => handleDeleteTrigger(sol.id, e)}
                                    className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                    title={isZh ? "删除策略" : "Delete Strategy"}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}

                        <button 
                            onClick={() => setViewMode('custom')}
                            className={`w-full p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-500 hover:text-brand hover:border-brand transition-all flex items-center justify-center gap-2 ${viewMode === 'custom' ? 'bg-brand/5 border-brand text-brand' : ''}`}
                        >
                            <Plus size={16} /> {isZh ? "添加自定义" : "Add Custom"}
                        </button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                        <Button 
                            variant="primary" 
                            className="w-full py-4 shadow-lg flex items-center justify-center gap-2"
                            disabled={!selectedId || viewMode === 'custom'}
                            onClick={() => activeSolution && onConfirm(activeSolution)}
                        >
                            {isZh ? "学习此策略" : "Learn Strategy"} <ArrowRight size={18}/>
                        </Button>
                        <button onClick={onCancel} className="w-full mt-3 py-2 text-xs font-bold text-gray-400 hover:text-gray-600">
                            {isZh ? "返回" : "Cancel"}
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar bg-white dark:bg-dark-card relative">
                    {viewMode === 'standard' && activeSolution ? (
                        <div className="space-y-8 animate-fade-in-up max-w-3xl mx-auto pb-12">
                            
                            {/* Header */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-3xl font-black text-gray-900 dark:text-white">{activeSolution.title}</h1>
                                        {activeSolution.isCustom ? (
                                            <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded font-bold border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                                                <User size={12}/> CUSTOM
                                            </span>
                                        ) : (
                                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded font-bold border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                                                <Bot size={12}/> AI GEN
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="inline-block bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg text-xs font-mono font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                            {activeSolution.complexity}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setShowDebug(true)}
                                        className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 transition-colors"
                                        title="Debug JSON"
                                    >
                                        <FileJson size={20}/>
                                    </button>
                                    <button 
                                        onClick={() => setShowRegenModal(true)}
                                        className="p-2 text-gray-400 hover:text-brand bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-brand/10 transition-colors"
                                        title={isZh ? "重新生成此策略" : "Regenerate This Strategy"}
                                    >
                                        <RefreshCw size={20}/>
                                    </button>
                                </div>
                            </div>

                            {/* BLOCK 1: WHY (Rationale) */}
                            {activeSolution.rationale && (
                                <div className="bg-orange-50 dark:bg-orange-900/10 p-6 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                                    <h3 className="text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <Lightbulb size={16}/> {isZh ? "为什么用这个方法？" : "Why this approach?"}
                                    </h3>
                                    <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                                        <MarkdownText content={activeSolution.rationale} />
                                    </div>
                                </div>
                            )}

                            {/* BLOCK 2: PROCESS (Derivation) */}
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30 relative">
                                <div className="absolute top-4 right-4 text-blue-200 dark:text-blue-900"><Brain size={48} className="opacity-20"/></div>
                                <h3 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Share2 size={16}/> {isZh ? "思考过程 (Derivation)" : "Thinking Process"}
                                </h3>
                                <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-sans">
                                    <MarkdownText content={activeSolution.derivation} />
                                </div>
                            </div>

                            {/* BLOCK 3: MEMORY & ANALOGY */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activeSolution.analogy && (
                                    <div className="bg-purple-50 dark:bg-purple-900/10 p-5 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                                        <h3 className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <Sparkles size={14}/> {isZh ? "形象比喻" : "Analogy"}
                                        </h3>
                                        <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                            <MarkdownText content={activeSolution.analogy} />
                                        </div>
                                    </div>
                                )}
                                {activeSolution.memoryTip && (
                                    <div className="bg-green-50 dark:bg-green-900/10 p-5 rounded-2xl border border-green-100 dark:border-green-900/30">
                                        <h3 className="text-xs font-black text-green-600 dark:text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <Brain size={14}/> {isZh ? "记忆口诀" : "Memory Tip"}
                                        </h3>
                                        <div className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                                            <MarkdownText content={activeSolution.memoryTip} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* BLOCK 4: VISUAL (Mermaid) */}
                            {activeSolution.mermaid && (
                                <div>
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Share2 size={14}/> {isZh ? "逻辑图解" : "Logic Flow"}
                                    </h3>
                                    <MermaidVisualWidget 
                                        widget={{ id: 'flow', type: 'mermaid', mermaid: { chart: activeSolution.mermaid } }} 
                                        onRegenerate={handleWidgetRegenerate}
                                    />
                                </div>
                            )}

                            {/* BLOCK 5: SYNTAX & KEYWORDS */}
                            {activeSolution.keywords && activeSolution.keywords.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Key size={14}/> {isZh ? "关键语法" : "Key Syntax"}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {activeSolution.keywords.map((kw, i) => (
                                            <div key={i} className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-xl hover:shadow-md transition-all">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <code className="text-xs font-bold bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-1.5 py-0.5 rounded">
                                                        {kw.term}
                                                    </code>
                                                </div>
                                                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
                                                    {kw.definition}
                                                </p>
                                                {kw.memoryTip && (
                                                    <div className="text-[10px] text-yellow-600/80 dark:text-yellow-400/80 font-medium italic">
                                                        💡 Tip: {kw.memoryTip}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* BLOCK 6: EXPANDED KNOWLEDGE (INTERACTIVE) */}
                            {activeSolution.expandedKnowledge && activeSolution.expandedKnowledge.length > 0 && (
                                <div className="bg-gray-100 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                                    <h3 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <HelpCircle size={14}/> {isZh ? "拓展知识点 (点击查看详情)" : "Expanded Knowledge (Tap to learn)"}
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {activeSolution.expandedKnowledge.map((point, i) => {
                                            const pointText = typeof point === 'string' ? point : (point as any).content || JSON.stringify(point);
                                            return (
                                                <button 
                                                    key={i} 
                                                    onClick={() => handleExpandKnowledge(pointText)}
                                                    className="px-3 py-1.5 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:border-brand hover:text-brand transition-all shadow-sm text-left"
                                                >
                                                    <MarkdownText content={point} />
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* BLOCK 7: CODE IMPLEMENTATION */}
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Code2 size={14}/> {isZh ? "代码实现" : "Implementation"}
                                </h3>
                                {/* Use Interactive Widget for consistent styling */}
                                {renderCodeSection()}
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
