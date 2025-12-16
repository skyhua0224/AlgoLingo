
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Code2, CheckCircle, Edit3, ArrowRight, BookOpen, Loader2, Lightbulb, Brain, Key, Share2, Plus, Trash2, RefreshCw, X, MessageSquarePlus, Send, HelpCircle, User, Bot, AlertTriangle, FileJson, Copy, Check, Camera, Image as ImageIcon } from 'lucide-react';
import { SolutionStrategy, UserPreferences } from '../types';
import { generateLeetCodeSolutions, refineUserSolution, regenerateSolutionStrategy, generateAiAssistance, analyzeImageSolution, fixMermaidCode } from '../services/geminiService';
import { MarkdownText } from './common/MarkdownText';
import { Button } from './Button';
import { InteractiveCodeWidget } from './widgets/InteractiveCode';
import { MermaidVisualWidget } from './widgets/MermaidVisual';
import { LogicFlowWidget } from './widgets/LogicFlow'; // NEW IMPORT
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
    
    // Custom Input State
    const [customInput, setCustomInput] = useState('');
    const [refining, setRefining] = useState(false);
    const [viewMode, setViewMode] = useState<'standard' | 'custom'>('standard');
    
    // Whiteboard Image State
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        // Defensive coding: Ensure arrays are actually arrays
        let safeExpandedKnowledge = [];
        if (Array.isArray(app.expandedKnowledge)) {
            safeExpandedKnowledge = app.expandedKnowledge;
        } else if (typeof app.expandedKnowledge === 'string') {
            safeExpandedKnowledge = [app.expandedKnowledge];
        }

        let safeKeywords = [];
        if (Array.isArray(app.keywords)) {
            safeKeywords = app.keywords;
        }

        return {
            id: app.id,
            title: app.title,
            complexity: app.complexity,
            tags: app.tags || [],
            rationale: app.rationale,
            derivation: app.derivation || app.intuition || "No explanation provided.",
            analogy: app.analogy || (isZh ? "暂无类比" : "No analogy provided."),
            // Ensure memoryTip always has content
            memoryTip: app.memoryTip || (isZh ? "回顾推导过程，构建你的专属记忆宫殿。" : "Review the derivation logic to build your own mnemonic."),
            expandedKnowledge: safeExpandedKnowledge,
            mermaid: app.mermaid,
            logicSteps: app.logicSteps, // New field for native UI flow
            keywords: safeKeywords, // [{term, definition, memoryTip}]
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

    // Handle File Selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setImagePreview(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRefineCustom = async () => {
        if (!customInput.trim() && !imagePreview) return;
        setRefining(true);
        try {
            let data;
            
            if (imagePreview) {
                // Multimodal Analysis
                const base64Data = imagePreview.split(',')[1];
                data = await analyzeImageSolution(base64Data, problemName, preferences);
            } else {
                // Text Analysis
                data = await refineUserSolution(customInput, problemName, preferences);
            }

            const customStrategy: SolutionStrategy = {
                id: `custom_${Date.now()}`,
                title: isZh ? "我的自定义解法" : "My Custom Solution",
                complexity: data.complexity || "Analysis Pending",
                tags: ["Custom", imagePreview ? "Whiteboard" : "Text"],
                derivation: data.derivation || "Custom logic provided by user.",
                rationale: data.rationale,
                analogy: data.analogy,
                memoryTip: data.memoryTip || (isZh ? "自定义解法" : "Custom Solution"),
                mermaid: data.mermaid,
                logicSteps: data.logicSteps, // Support new format for custom too
                code: data.code || customInput || "// Code extracted from image",
                codeWidgets: data.codeWidgets || [],
                keywords: data.keywords || [],
                language: preferences.targetLanguage,
                isCustom: true,
                expandedKnowledge: [] // Default empty
            };
            
            setSolutions(prev => {
                const updated = [...prev, customStrategy];
                updateCache(updated);
                return updated;
            });
            
            setSelectedId(customStrategy.id);
            setViewMode('standard');
            setCustomInput('');
            setImagePreview(null);
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
        } finally {
            setIsLoading(false);
        }
    };

    // Shared regeneration logic for FULL STRATEGY regeneration
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

    // Keep this for legacy Mermaid fallback, though we prefer LogicFlow
    const handleWidgetRegenerate = async (errorMsgAndContext: string) => {
        if (!selectedId) return;
        // This is legacy support. If we are using LogicFlow, we don't trigger this.
        // If a strategy ONLY has mermaid and no logicSteps, we might still need this.
        try {
            const codeMatch = errorMsgAndContext.match(/Current Data: (.*)/s);
            let brokenCode = "";
            try {
                if (codeMatch) brokenCode = JSON.parse(codeMatch[1]);
            } catch(e) { brokenCode = "graph TD; A[Error]"; }

            const fixedCode = await fixMermaidCode(brokenCode || "graph TD; A[Empty]", errorMsgAndContext, preferences);
            
            const newSolutions = solutions.map(s => {
                if (s.id === selectedId) {
                    return { ...s, mermaid: fixedCode };
                }
                return s;
            });
            
            setSolutions(newSolutions);
            updateCache(newSolutions);
        } catch (e) {
            alert("Failed to auto-repair visual.");
        }
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
                    lines.push({ code: "", explanation: "", isSpacer: true });
                    continue;
                }

                if (/^(\/\/|#)?\s*\.{3,}$/.test(trimmedLine)) {
                    lines.push({ 
                        code: trimmedLine, 
                        explanation: isZh ? "省略部分代码..." : "Code section omitted..." 
                    });
                    continue;
                }

                const commentMatch = line.match(/^\s*(\/\/|#)\s*(.+)$/);
                
                if (commentMatch) {
                    pendingExpl = pendingExpl ? `${pendingExpl}\n${commentMatch[2]}` : commentMatch[2];
                } else {
                    const inlineMatch = line.match(/^(.*?)(\/\/|#)\s*(.+)$/);
                    let codePart = line;
                    let inlineExpl = "";
                    
                    if (inlineMatch) {
                        codePart = inlineMatch[1].trimEnd();
                        inlineExpl = inlineMatch[3].trim();
                    }

                    let finalExpl = [pendingExpl, inlineExpl].filter(Boolean).join("\n");
                    
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
                        <h3 className="font-extrabold text-gray-800 dark:text-white mb-2 text-lg">
                            {isZh ? "重新生成所有策略？" : "Regenerate All Strategies?"}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                            {isZh 
                             ? "此操作将保留您的自定义解法，但会完全替换 AI 生成的所有其他策略。" 
                             : "This will preserve your custom solutions but completely replace all AI-generated strategies."}
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowRegenAllModal(false)} 
                                className="flex-1 py-3 text-gray-500 font-bold text-sm bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700"
                            >
                                {isZh ? "取消" : "Cancel"}
                            </button>
                            <button 
                                onClick={confirmRegenerateAll}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 shadow-lg"
                            >
                                {isZh ? "确认重置" : "Confirm Reset"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Delete Confirmation */}
            {deleteTargetId && (
                <div className="absolute inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white dark:bg-dark-card w-full max-w-sm p-6 rounded-3xl shadow-xl border-2 border-gray-200 dark:border-gray-800 animate-scale-in text-center">
                        <Trash2 size={40} className="mx-auto text-gray-300 mb-4"/>
                        <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">{isZh ? "删除此解法？" : "Delete Strategy?"}</h3>
                        <div className="flex gap-3 justify-center mt-6">
                            <button onClick={() => setDeleteTargetId(null)} className="px-6 py-2 text-gray-500 font-bold">{isZh ? "取消" : "Cancel"}</button>
                            <button onClick={confirmDelete} className="px-6 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600">{isZh ? "删除" : "Delete"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Knowledge Popup */}
            {knowledgePopup && (
                <div className="absolute inset-0 z-[130] flex items-center justify-center pointer-events-none">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl border border-brand/20 max-w-sm w-full pointer-events-auto animate-scale-in mx-4">
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="text-sm font-black text-brand uppercase tracking-wider flex items-center gap-2">
                                <Lightbulb size={16}/> {knowledgePopup.title}
                            </h3>
                            <button onClick={() => setKnowledgePopup(null)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
                        </div>
                        {knowledgePopup.content ? (
                            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium max-h-60 overflow-y-auto custom-scrollbar">
                                <MarkdownText content={knowledgePopup.content} />
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-gray-500 text-xs"><Loader2 size={14} className="animate-spin"/> AI Explaining...</div>
                        )}
                    </div>
                </div>
            )}

            {/* Debug View */}
            {showDebug && activeSolution && (
                <div className="absolute inset-0 z-[140] bg-gray-900 p-8 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-white font-mono font-bold">DEBUG: Strategy JSON</span>
                        <div className="flex gap-2">
                            <button 
                                onClick={handleCopyJSON} 
                                className="px-3 py-1 bg-gray-700 text-white rounded text-xs flex items-center gap-2"
                            >
                                {copied ? <Check size={14}/> : <Copy size={14}/>} Copy
                            </button>
                            <button onClick={() => setShowDebug(false)} className="px-3 py-1 bg-red-500 text-white rounded text-xs">Close</button>
                        </div>
                    </div>
                    <pre className="flex-1 overflow-auto text-green-400 font-mono text-xs bg-black p-4 rounded-xl border border-gray-700">
                        {JSON.stringify(activeSolution, null, 2)}
                    </pre>
                </div>
            )}

            {/* MAIN CONTENT CONTAINER */}
            <div className="bg-white dark:bg-dark-card w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col relative z-10 border border-gray-200 dark:border-gray-800">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-black/20">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white">{isZh ? "构建解题策略" : "Solution Strategy"}</h2>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">{problemName}</p>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Strategy List */}
                    <div className="w-1/3 border-r border-gray-100 dark:border-gray-800 flex flex-col bg-gray-50/30 dark:bg-black/10">
                        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-3">
                            {/* Add Custom Button */}
                            <button 
                                onClick={() => setViewMode('custom')}
                                className={`w-full p-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 transition-all ${viewMode === 'custom' ? 'border-brand bg-brand/5 text-brand' : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-brand/50 hover:text-brand'}`}
                            >
                                <Plus size={18} />
                                <span className="font-bold text-sm">{isZh ? "添加自定义解法" : "Add Custom Solution"}</span>
                            </button>

                            {/* Strategy Items */}
                            {solutions.map((sol) => (
                                <div 
                                    key={sol.id}
                                    onClick={() => { setSelectedId(sol.id); setViewMode('standard'); }}
                                    className={`relative group p-4 rounded-2xl border-2 text-left cursor-pointer transition-all hover:shadow-md ${selectedId === sol.id && viewMode === 'standard' ? 'border-purple-500 bg-white dark:bg-dark-card shadow-lg ring-1 ring-purple-500/20' : 'border-transparent hover:bg-white dark:hover:bg-dark-card hover:border-gray-200 dark:hover:border-gray-700'}`}
                                >
                                    {/* Actions Overlay */}
                                    <div className={`absolute top-2 right-2 flex gap-1 ${selectedId === sol.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                                        {sol.isCustom && (
                                            <button onClick={(e) => handleDeleteTrigger(sol.id, e)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-300 hover:text-red-500 rounded-lg transition-colors" title="Delete">
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                        {/* Debug Button (Hidden generally) */}
                                        <button onClick={(e) => { e.stopPropagation(); setSelectedId(sol.id); setShowDebug(true); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-300 hover:text-gray-500 rounded-lg transition-colors hidden group-hover:block" title="Debug JSON">
                                            <FileJson size={14} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${sol.isCustom ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                                            {sol.isCustom ? 'CUSTOM' : 'AI GENERATED'}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-gray-800 dark:text-white mb-1 leading-tight">{sol.title}</h3>
                                    <p className="text-xs text-gray-500 font-mono mb-2">{sol.complexity}</p>
                                    <div className="flex flex-wrap gap-1">
                                        {sol.tags.slice(0, 3).map((t, i) => (
                                            <span key={i} className="text-[9px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-500 font-medium border border-gray-200 dark:border-gray-700">{t}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Bottom Actions */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-dark-card">
                            <button 
                                onClick={handleRegenerateAllTrigger}
                                className="w-full py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-brand hover:border-brand transition-all flex items-center justify-center gap-2 text-xs font-bold"
                            >
                                <Sparkles size={14} />
                                {isZh ? "AI 重新生成所有策略" : "Regenerate All with AI"}
                            </button>
                        </div>
                    </div>

                    {/* Right: Content Area */}
                    <div className="flex-1 bg-white dark:bg-dark-card overflow-y-auto custom-scrollbar p-6 relative">
                        {/* CUSTOM EDITOR VIEW */}
                        {viewMode === 'custom' && (
                            <div className="max-w-2xl mx-auto animate-fade-in-up">
                                <h3 className="text-lg font-black text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                                    <Edit3 size={20} className="text-brand"/>
                                    {isZh ? "添加自定义解法" : "Add Custom Solution"}
                                </h3>
                                
                                {/* Image Upload */}
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{isZh ? "上传白板/手写思路 (可选)" : "Upload Whiteboard/Notes (Optional)"}</label>
                                    <div 
                                        className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-6 text-center hover:border-brand hover:bg-brand/5 transition-all cursor-pointer relative"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {imagePreview ? (
                                            <div className="relative">
                                                <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow-sm" />
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setImagePreview(null); }}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600"
                                                >
                                                    <X size={14}/>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-gray-400">
                                                <Camera size={32} />
                                                <span className="text-xs font-bold">{isZh ? "点击上传图片" : "Click to upload image"}</span>
                                            </div>
                                        )}
                                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{isZh ? "代码或思路描述" : "Code or Description"}</label>
                                    <textarea 
                                        className="w-full h-48 p-4 bg-gray-50 dark:bg-black/20 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-brand outline-none resize-none font-mono text-sm leading-relaxed"
                                        placeholder={isZh ? "// 在此粘贴代码，或用文字描述你的解题思路..." : "// Paste code here, or describe your approach..."}
                                        value={customInput}
                                        onChange={(e) => setCustomInput(e.target.value)}
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <button 
                                        onClick={handleRefineCustom}
                                        disabled={refining || (!customInput.trim() && !imagePreview)}
                                        className="px-8 py-3 bg-brand text-white rounded-xl font-bold shadow-lg hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                                    >
                                        {refining ? <Loader2 size={18} className="animate-spin"/> : <Sparkles size={18}/>}
                                        {refining ? (isZh ? "AI 分析中..." : "AI Analyzing...") : (isZh ? "智能分析并添加" : "Analyze & Add")}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STANDARD DETAIL VIEW */}
                        {viewMode === 'standard' && activeSolution && (
                            <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up pb-20">
                                {/* Title Header */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex gap-2">
                                            {activeSolution.tags.map((tag, i) => (
                                                <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded text-xs font-bold uppercase tracking-wider">{tag}</span>
                                            ))}
                                        </div>
                                        <button 
                                            onClick={() => setShowRegenModal(true)}
                                            className="text-gray-400 hover:text-brand transition-colors p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                            title={isZh ? "重新生成内容" : "Regenerate Content"}
                                        >
                                            <RefreshCw size={16} />
                                        </button>
                                    </div>
                                    <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">{activeSolution.title}</h1>
                                    <div className="text-sm font-mono text-gray-500 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg inline-block border border-gray-200 dark:border-gray-800">
                                        {activeSolution.complexity}
                                    </div>
                                </div>

                                {/* Main Content Blocks */}
                                <div className="space-y-6">
                                    {/* Rationale */}
                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                        <h3 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Lightbulb size={16}/> {isZh ? "核心思路" : "Rationale"}
                                        </h3>
                                        <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                            <MarkdownText content={activeSolution.rationale} />
                                        </div>
                                    </div>

                                    {/* Derivation / Logic */}
                                    <div>
                                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <BookOpen size={16} /> {isZh ? "推导过程" : "Derivation"}
                                        </h3>
                                        <div className="prose dark:prose-invert prose-sm max-w-none text-gray-600 dark:text-gray-300 leading-loose">
                                            <MarkdownText content={activeSolution.derivation} />
                                        </div>
                                    </div>

                                    {/* Visualization (Logic Flow or Mermaid Fallback) */}
                                    {activeSolution.logicSteps ? (
                                        <div>
                                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Share2 size={16} /> {isZh ? "逻辑链条" : "Logic Chain"}
                                            </h3>
                                            <LogicFlowWidget steps={activeSolution.logicSteps} />
                                        </div>
                                    ) : (
                                        activeSolution.mermaid && (
                                            <div>
                                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <Share2 size={16} /> {isZh ? "逻辑流程图" : "Logic Flow"}
                                                </h3>
                                                <MermaidVisualWidget 
                                                    key={activeSolution.id} // Force re-render on switch
                                                    widget={{ 
                                                        id: 'vis', 
                                                        type: 'mermaid', 
                                                        mermaid: { chart: activeSolution.mermaid, caption: isZh ? "算法可视化" : "Algorithm Visualization" } 
                                                    }}
                                                    onRegenerate={handleWidgetRegenerate}
                                                />
                                            </div>
                                        )
                                    )}

                                    {/* Memory Tip & Analogy */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-purple-50 dark:bg-purple-900/10 p-5 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                                            <h3 className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <Sparkles size={14}/> {isZh ? "形象类比" : "Analogy"}
                                            </h3>
                                            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                                <MarkdownText content={activeSolution.analogy || (isZh ? "暂无类比" : "No analogy provided.")} />
                                            </div>
                                        </div>
                                        {/* Always Render Memory Tip */}
                                        <div className="bg-green-50 dark:bg-green-900/10 p-5 rounded-2xl border border-green-100 dark:border-green-900/30">
                                            <h3 className="text-xs font-black text-green-600 dark:text-green-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <Brain size={14}/> {isZh ? "记忆口诀" : "Memory Tip"}
                                            </h3>
                                            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                                <MarkdownText content={activeSolution.memoryTip || (isZh ? "AI 未生成口诀" : "No tip provided.")} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Code Block */}
                                    <div>
                                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Code2 size={16} /> {isZh ? "代码实现" : "Implementation"}
                                        </h3>
                                        {renderCodeSection()}
                                    </div>

                                    {/* Keywords */}
                                    {activeSolution.keywords.length > 0 && (
                                        <div className="bg-yellow-50 dark:bg-yellow-900/10 p-6 rounded-2xl border border-yellow-100 dark:border-yellow-900/30">
                                            <h3 className="text-sm font-black text-yellow-700 dark:text-yellow-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <Key size={16} /> {isZh ? "关键语法点" : "Key Syntax"}
                                            </h3>
                                            <div className="grid grid-cols-1 gap-3">
                                                {activeSolution.keywords.map((k, i) => (
                                                    <div key={i} className="flex gap-3 items-start">
                                                        <code className="text-xs font-bold text-yellow-800 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/40 px-2 py-1 rounded shrink-0">{k.term}</code>
                                                        <span className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{k.definition}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Expanded Knowledge Chips */}
                                    {activeSolution.expandedKnowledge && activeSolution.expandedKnowledge.length > 0 && (
                                        <div className="bg-gray-100 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                                            <h3 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <HelpCircle size={14}/> {isZh ? "相关知识 (点击展开)" : "Expanded Knowledge"}
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
                                </div>
                            </div>
                        )}

                        {/* Floating Action Button (Start Lesson) */}
                        {viewMode === 'standard' && activeSolution && (
                            <div className="sticky bottom-6 left-0 right-0 flex justify-center z-20 pointer-events-none">
                                <Button 
                                    onClick={() => onConfirm(activeSolution)}
                                    size="lg"
                                    className="shadow-2xl pointer-events-auto flex items-center gap-2 px-8 py-4 text-lg bg-brand hover:bg-brand-dark animate-bounce-in"
                                >
                                    {isZh ? "选择此策略并开始" : "Select & Start"} <ArrowRight size={24}/>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Global AI Assistant Overlay */}
            <GlobalAiAssistant 
                problemName={problemName} 
                preferences={preferences} 
                language={language}
                currentPlan={null}
            />
        </div>
    );
};
