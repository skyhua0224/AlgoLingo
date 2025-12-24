
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LeetCodeContext, UserPreferences, SolutionStrategy } from '../types';
import { GripVertical, GripHorizontal, FileText, Lightbulb, Zap, Tag, ArrowRight, BookOpen, Key, CheckCircle2, History, Stethoscope, Copy, Eye, ArrowLeft, RotateCcw, X, Terminal } from 'lucide-react';
import { validateUserCode, analyzeUserStrategy } from '../services/geminiService';
import { InteractiveCodeWidget } from './widgets/InteractiveCode';
import { MermaidVisualWidget } from './widgets/MermaidVisual';
import { MarkdownText } from './common/MarkdownText';
import { CodeEditor } from './workspace/CodeEditor';
import { ConsolePanel } from './workspace/ConsolePanel';
import { DiagnosisPanel } from './workspace/DiagnosisPanel';
import { SubmissionHistory, SubmissionRecord } from './workspace/SubmissionHistory';
import { useMistakeManager } from '../hooks/useMistakeManager';

interface VirtualWorkspaceProps {
    context: LeetCodeContext;
    preferences: UserPreferences;
    onSuccess: (code: string, attempts: number, time: number) => void; // UPDATED SIGNATURE
    strategies?: SolutionStrategy[];
    activeStrategyId?: string | null;
    onSelectStrategy?: (id: string | null) => void;
    onGenerateStrategies?: () => void;
    onAddCustomStrategy?: (strategy: SolutionStrategy) => void; 
    onUpdateStrategy?: (strategy: SolutionStrategy) => void; 
    isGenerating?: boolean;
    onDrill?: (context: string, referenceCode?: string) => void; 
}

type LeftPanelTab = 'description' | 'solution' | 'diagnosis' | 'submissions';

export const VirtualWorkspace: React.FC<VirtualWorkspaceProps> = ({ 
    context, preferences, onSuccess, 
    strategies = [], activeStrategyId, onSelectStrategy, onGenerateStrategies, onAddCustomStrategy, onUpdateStrategy, isGenerating = false,
    onDrill
}) => {
    const isZh = preferences.spokenLanguage === 'Chinese';
    const [currentLanguage, setCurrentLanguage] = useState(preferences.targetLanguage);
    const [activeLeftTab, setActiveLeftTab] = useState<LeftPanelTab>('description');
    
    // Layout State
    const [leftPanelWidth, setLeftPanelWidth] = useState(40); 
    const [consoleHeight, setConsoleHeight] = useState(30); 
    const [isDragging, setIsDragging] = useState<'horizontal' | 'vertical' | null>(null);

    // Timing State
    const [sessionStartTime] = useState(Date.now());

    // Safe Context
    const safeContext = useMemo(() => {
        return {
            meta: context?.meta || { title: 'Untitled Problem', difficulty: 'Medium', slug: 'unknown' },
            problem: context?.problem || { description: 'No description available.', examples: [], constraints: [] },
            starterCode: context?.starterCode || '# Write your code here\n',
            starterCodeMap: context?.starterCodeMap || {}, 
            sidebar: context?.sidebar
        };
    }, [context]);

    // Submission History (Persisted)
    const [history, setHistory] = useState<SubmissionRecord[]>([]);
    const [viewingSubmission, setViewingSubmission] = useState<SubmissionRecord | null>(null);
    
    // Load history on mount
    useEffect(() => {
        const key = `algolingo_history_${safeContext.meta.slug}_${currentLanguage}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            try { setHistory(JSON.parse(saved)); } catch(e) {}
        } else {
            setHistory([]);
        }
    }, [safeContext.meta.slug, currentLanguage]);

    // Active Result state
    const [result, setResult] = useState<any | null>(null);
    const [isRunning, setIsRunning] = useState(false);

    const [code, setCode] = useState(safeContext.starterCode);

    // Drag Handlers
    const containerRef = useRef<HTMLDivElement>(null);
    const rightPaneRef = useRef<HTMLDivElement>(null);

    // Auto-switch tabs based on props or state
    useEffect(() => {
        if (activeStrategyId || isGenerating) {
            setActiveLeftTab('solution');
        }
    }, [activeStrategyId, isGenerating]);

    // Handle Layout Dragging
    const handleMouseDown = (type: 'horizontal' | 'vertical') => (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(type);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            if (isDragging === 'horizontal' && containerRef.current) {
                const containerRect = containerRef.current.getBoundingClientRect();
                const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
                setLeftPanelWidth(Math.max(20, Math.min(80, newWidth)));
            } else if (isDragging === 'vertical' && rightPaneRef.current) {
                const paneRect = rightPaneRef.current.getBoundingClientRect();
                const newHeight = ((paneRect.bottom - e.clientY) / paneRect.height) * 100;
                setConsoleHeight(Math.max(10, Math.min(80, newHeight)));
            }
        };
        const handleMouseUp = () => setIsDragging(null);
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    // Reset code on language change
    useEffect(() => {
        const map = safeContext.starterCodeMap || {};
        if (map && map[currentLanguage]) {
            setCode(map[currentLanguage]);
        } else if (currentLanguage === preferences.targetLanguage) {
            setCode(safeContext.starterCode);
        } else {
            setCode(`// Write your ${currentLanguage} solution here...\n`);
        }
    }, [currentLanguage, safeContext.starterCode, safeContext.starterCodeMap, preferences.targetLanguage]);

    const handleRun = async () => {
        setIsRunning(true);
        setResult(null);
        setViewingSubmission(null); 
        
        try {
            const res = await validateUserCode(code, safeContext.problem.description, preferences, currentLanguage);
            setResult(res);
            
            const record: SubmissionRecord = {
                id: Date.now().toString(),
                timestamp: Date.now(),
                status: res.status,
                runtime: res.stats?.runtime,
                memory: res.stats?.memory,
                error_message: res.error_message,
                code: code,
                resultData: res
            };
            
            const updatedHistory = [...history, record];
            setHistory(updatedHistory);
            localStorage.setItem(`algolingo_history_${safeContext.meta.slug}_${currentLanguage}`, JSON.stringify(updatedHistory));

            setActiveLeftTab('diagnosis');
            if (leftPanelWidth < 40) setLeftPanelWidth(50);

        } catch (e) {
            setResult({ status: "Runtime Error", error_message: "Judge Connection Failed.", test_cases: [] });
        } finally {
            setIsRunning(false);
        }
    };

    const handleSubmit = () => {
        // Calculate metrics for evaluator
        const duration = Math.round((Date.now() - sessionStartTime) / 1000);
        
        // Filter history to count only failures from THIS specific session
        // This prevents old history (which might be preserved) from counting as current failures
        const sessionFailures = history.filter(h => 
            h.timestamp >= sessionStartTime && h.status !== 'Accepted'
        ).length;
        
        onSuccess(code, sessionFailures, duration);
    };

    const handleHistorySelect = (rec: SubmissionRecord) => {
        setViewingSubmission(rec);
        setActiveLeftTab('diagnosis'); 
    };

    const handleRestoreSubmission = () => {
        if (!viewingSubmission) return;
        setCode(viewingSubmission.code);
        setResult(viewingSubmission.resultData);
        setViewingSubmission(null); 
        setActiveLeftTab('diagnosis');
    };

    const handleSmartSaveStrategy = async (): Promise<{success: boolean, message: string, existingId?: string}> => {
        const targetResult = viewingSubmission ? viewingSubmission.resultData : result;
        const targetCode = viewingSubmission ? viewingSubmission.code : code;
        
        if (!targetResult || !targetResult.analysis) return { success: false, message: "Analysis data missing" };

        try {
            const existingTitles = strategies.map(s => s.title);
            const analysis = await analyzeUserStrategy(targetCode, safeContext.meta.title, existingTitles, preferences);

            if (!analysis.isNew) {
                return { success: false, message: isZh ? `重复：策略 "${analysis.match}" 已存在` : `Duplicate: Matches strategy "${analysis.match}"`, existingId: analysis.match };
            }

            const aiStrat = analysis.strategy;
            const newStrategy: SolutionStrategy = {
                id: `smart_${Date.now()}`,
                title: aiStrat.title || "Optimized Solution",
                complexity: aiStrat.complexity || "Analysis Pending",
                tags: [...(aiStrat.tags || []), "Smart Save"],
                derivation: aiStrat.derivation || "Generated from user code analysis.",
                rationale: aiStrat.rationale || "Auto-derived rationale.",
                analogy: aiStrat.analogy || (isZh ? "此解法的直观理解" : "Intuitive understanding"),
                memoryTip: aiStrat.memoryTip || "Review logic.",
                keywords: aiStrat.keywords || [],
                code: targetCode,
                language: currentLanguage,
                isCustom: true,
                codeWidgets: [],
                expandedKnowledge: []
            };

            if (onAddCustomStrategy) {
                onAddCustomStrategy(newStrategy);
                return { success: true, message: isZh ? "策略已成功保存" : "Strategy saved successfully" };
            }
            return { success: false, message: "Save handler missing" };

        } catch (e) {
            console.error(e);
            return { success: false, message: isZh ? "AI 分析服务错误" : "AI Service Error" };
        }
    };

    const handleDrillTrigger = () => {
        if (!onDrill) return;
        const targetResult = viewingSubmission ? viewingSubmission.resultData : result;
        const targetCode = viewingSubmission ? viewingSubmission.code : code;
        if (!targetResult) return;
        
        const drillPayload = {
            source: 'snapshot',
            status: targetResult.status,
            userCode: targetCode,
            error: targetResult.error_message,
            analysis: targetResult.analysis, 
            problemDesc: safeContext.problem.description
        };
        const drillContext = JSON.stringify(drillPayload);
        const correctCode = targetResult.analysis?.correctCode; 
        onDrill(drillContext, correctCode);
    };

    const handleRecordSyntaxMistake = (contextInfo: string) => { /* No-op */ };

    // ... (Description/Solution renderers omitted for brevity, identical to previous) ...
    // Assume renderDescriptionPanel and renderSolutionPanel are here as before

    const renderDescriptionPanel = () => {
        const difficultyColor = safeContext.meta.difficulty === 'Easy' ? 'text-green-600 bg-green-100 dark:bg-green-900/30' : 
                          safeContext.meta.difficulty === 'Medium' ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' :
                          'text-red-600 bg-red-100 dark:bg-red-900/30';

        return (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white dark:bg-[#0c0c0c] h-full">
                <div className="mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">{safeContext.meta.title}</h2>
                    <div className="flex items-center gap-3 text-xs font-bold">
                        <span className={`px-3 py-1 rounded-full ${difficultyColor}`}>{safeContext.meta.difficulty}</span>
                        <div className="flex gap-2">
                            <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-1 rounded flex items-center gap-1"><Tag size={10}/> Algorithm</span>
                        </div>
                    </div>
                </div>
                <div className="prose dark:prose-invert prose-sm max-w-none text-gray-700 dark:text-gray-300 leading-relaxed font-sans mb-8">
                    <MarkdownText content={safeContext.problem.description} />
                </div>
                <div className="space-y-4">
                    {safeContext.problem.examples.map((ex, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-[#1a1a1a] rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                            <div className="bg-gray-100 dark:bg-[#252526] px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide">Example {i + 1}</div>
                            <div className="p-4 font-mono text-xs md:text-sm space-y-2">
                                <div><span className="text-gray-500 font-bold">Input:</span> <span className="text-gray-800 dark:text-gray-200">{ex.input}</span></div>
                                <div><span className="text-gray-500 font-bold">Output:</span> <span className="text-gray-800 dark:text-gray-200">{ex.output}</span></div>
                                {ex.explanation && <div className="pt-2 border-t border-gray-200 dark:border-gray-700 mt-2 text-gray-600 dark:text-gray-400"><span className="font-bold">Explanation:</span> {ex.explanation}</div>}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-8">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Constraints:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-xs md:text-sm font-mono text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-[#1a1a1a] p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                        {safeContext.problem.constraints.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                </div>
            </div>
        );
    }

    const renderSolutionPanel = () => {
        if (isGenerating) {
             return (
                <div className="h-full flex flex-col items-center justify-center bg-white dark:bg-[#0c0c0c] p-8 text-center animate-fade-in-up">
                    <div className="animate-spin mb-4"><Zap size={32} className="text-brand"/></div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white mb-2">{isZh ? "Gemini 正在撰写官方题解..." : "Gemini is writing Official Solution..."}</h2>
                    <p className="text-xs text-gray-500">{isZh ? "深度解析可能需要几秒钟" : "Deep dive analysis in progress"}</p>
                </div>
             );
        }

        if (!activeStrategyId) {
             return (
                <div className="h-full flex flex-col bg-gray-50 dark:bg-[#0c0c0c] overflow-y-auto">
                    <div className="p-6 pb-2">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
                                <Lightbulb size={20} />
                            </div>
                            <h2 className="text-lg font-black text-gray-900 dark:text-white">{isZh ? "解题策略库" : "Strategy Library"}</h2>
                        </div>
                        <p className="text-gray-500 text-xs font-medium leading-relaxed">
                            {isZh 
                             ? "选择一个策略，AI 将为你生成该解法的深度逐行解析与官方题解。" 
                             : "Select a strategy to generate a deep, line-by-line official solution."}
                        </p>
                    </div>

                    <div className="px-6 pb-6 space-y-3 flex-1">
                        {strategies.length > 0 ? (
                            strategies.map(strat => (
                                <button
                                    key={strat.id}
                                    onClick={() => onSelectStrategy && onSelectStrategy(strat.id)}
                                    className="w-full p-4 bg-white dark:bg-[#151515] border-2 border-gray-200 dark:border-gray-800 rounded-xl text-left hover:border-purple-500 dark:hover:border-purple-500 transition-all shadow-sm group relative overflow-hidden active:scale-[0.98]"
                                >
                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-base text-gray-800 dark:text-gray-200 group-hover:text-purple-500 transition-colors">{strat.title}</span>
                                        </div>
                                        <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded uppercase font-bold tracking-wider">{strat.complexity}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 relative z-10 font-medium leading-relaxed">
                                        {strat.summary || strat.derivation || strat.rationale}
                                    </p>
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex gap-1.5 flex-wrap">
                                            {strat.tags.slice(0,3).map((t, i) => (
                                                <span key={i} className="text-[9px] text-gray-500 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 px-1.5 py-0.5 rounded font-bold uppercase">{t}</span>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                                            {isZh ? "生成解析" : "Generate"} <ArrowRight size={12}/>
                                        </div>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                                <p className="text-gray-400 text-xs mb-4">{isZh ? "暂无策略" : "No strategies found"}</p>
                                <button onClick={onGenerateStrategies} className="px-6 py-2.5 bg-brand text-white rounded-xl text-xs font-bold shadow-lg hover:bg-brand-dark transition-all">
                                    {isZh ? "生成策略" : "Generate Strategies"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
             );
        }

        const strategy = strategies.find(s => s.id === activeStrategyId);
        if (!strategy) return null;

        return (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white dark:bg-[#0c0c0c] h-full relative">
               <div className="mb-6">
                   <div className="flex items-start justify-between mb-3">
                       <div className="flex flex-wrap gap-2">
                           {strategy.tags.map((tag, i) => (
                               <span key={i} className="text-[10px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded uppercase">{tag}</span>
                           ))}
                       </div>
                       <button 
                           onClick={() => onSelectStrategy && onSelectStrategy(null)}
                           className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                       >
                           <ArrowLeft size={14}/> {isZh ? "返回列表" : "Back to List"}
                       </button>
                   </div>
                   <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 leading-tight">{strategy.title}</h2>
                   <div className="flex items-center gap-2 text-xs font-mono text-gray-500 bg-gray-100 dark:bg-gray-800/50 px-2 py-1 rounded w-fit">
                       <Zap size={12} className="text-yellow-500 fill-current"/>
                       {strategy.complexity}
                   </div>
               </div>

               {strategy.sections ? (
                   <div className="space-y-8 animate-fade-in-up">
                       {strategy.sections.map((sec, i) => (
                           <div key={i} className="group">
                               <h3 className="font-bold text-base text-gray-800 dark:text-white mb-3 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                                   <BookOpen size={16} className="text-brand"/>
                                   {sec.header}
                               </h3>
                               <div className="prose dark:prose-invert prose-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                                   <MarkdownText content={sec.content} />
                                </div>
                           </div>
                       ))}
                   </div>
               ) : (
                   <div className="space-y-6">
                       <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                           <h4 className="font-bold text-blue-700 dark:text-blue-400 mb-2 text-sm uppercase tracking-wider">{isZh ? "核心思路" : "Rationale"}</h4>
                           <MarkdownText content={strategy.rationale || strategy.derivation} className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed"/>
                       </div>
                       
                       {strategy.keywords?.length > 0 && (
                           <div className="grid grid-cols-1 gap-2">
                               {strategy.keywords.map((kw, i) => (
                                   <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                       <Key size={14} className="text-orange-500 shrink-0"/>
                                       <div>
                                           <span className="font-mono text-xs font-bold text-gray-800 dark:text-white mr-2">{kw.term}</span>
                                           <span className="text-xs text-gray-500">{kw.definition}</span>
                                       </div>
                                   </div>
                               ))}
                           </div>
                       )}
                   </div>
               )}
               
               <div className="h-px bg-gray-100 dark:bg-gray-800 my-8"></div>

               {strategy.codeWidgets && strategy.codeWidgets.length > 0 && (
                   <div className="space-y-4">
                       <h3 className="font-bold text-base text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                           <CheckCircle2 size={16} className="text-green-500"/>
                           {isZh ? "代码实现" : "Implementation"}
                       </h3>
                       {strategy.codeWidgets.map((w, i) => (
                           w.type === 'interactive-code' ? 
                           <InteractiveCodeWidget key={i} widget={w} language={isZh ? 'Chinese' : 'English'} /> : null
                       ))}
                   </div>
               )}
            </div>
        );
    };

    const renderSubmissionSnapshot = () => {
        if (!viewingSubmission) return null;
        const rec = viewingSubmission;
        const statusColor = rec.status === 'Accepted' ? 'text-green-500' : 'text-red-500';
        
        return (
            <div className="absolute inset-0 bg-[#1e1e1e] z-50 flex flex-col animate-fade-in-up">
                <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-[#252526]">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setViewingSubmission(null)} className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors">
                            <ArrowRight size={20} className="rotate-180"/>
                        </button>
                        <div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                {isZh ? "提交记录回放" : "Submission Snapshot"}
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`font-black text-sm ${statusColor} flex items-center gap-1`}>
                                    {rec.status === 'Accepted' ? <CheckCircle2 size={16}/> : <X size={16}/>}
                                    {rec.status}
                                </span>
                                <span className="text-xs text-gray-500 font-mono">
                                    {new Date(rec.timestamp).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={handleRestoreSubmission}
                        className="px-4 py-2 bg-brand text-white text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-brand-dark transition-colors shadow-lg"
                    >
                        <RotateCcw size={14}/>
                        {isZh ? "恢复到编辑器" : "Restore to Editor"}
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-4 font-mono text-sm relative">
                    <pre className="text-gray-300 whitespace-pre-wrap leading-relaxed">{rec.code}</pre>
                    <button 
                        onClick={() => navigator.clipboard.writeText(rec.code)}
                        className="absolute top-4 right-4 p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors"
                        title="Copy Code"
                    >
                        <Copy size={16}/>
                    </button>
                </div>

                <div className="h-32 border-t border-gray-700 bg-[#1e1e1e] p-4 overflow-y-auto">
                    {rec.error_message ? (
                        <div className="text-red-400 font-mono text-xs whitespace-pre-wrap">{rec.error_message}</div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 text-xs font-mono text-gray-400">
                            <div className="bg-gray-800 p-2 rounded border border-gray-700">
                                <span className="block text-gray-500 mb-1">Runtime</span>
                                <span className="text-green-400 font-bold">{rec.runtime || "N/A"}</span>
                            </div>
                            <div className="bg-gray-800 p-2 rounded border border-gray-700">
                                <span className="block text-gray-500 mb-1">Memory</span>
                                <span className="text-purple-400 font-bold">{rec.memory || "N/A"}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const activeAnalysis = viewingSubmission ? viewingSubmission.resultData?.analysis : result?.analysis;
    const activeStatus = viewingSubmission ? viewingSubmission.status : result?.status;

    return (
        <div className="flex flex-col h-full w-full bg-white dark:bg-[#0c0c0c] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between bg-gray-50 dark:bg-[#111] border-b border-gray-200 dark:border-gray-800 px-4 py-2 shrink-0 z-20 h-12">
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-gray-500">IDE V3.2</span>
                </div>
            </div>
            
            {/* Layout Container */}
            <div className="flex-1 flex min-h-0 relative select-none" ref={containerRef}>
                
                {/* Drag Overlay */}
                {isDragging && <div className="absolute inset-0 z-50 cursor-col-resize" style={{ cursor: isDragging === 'horizontal' ? 'col-resize' : 'row-resize' }}></div>}

                {/* LEFT PANE */}
                <div style={{ width: `${leftPanelWidth}%` }} className="h-full flex flex-col border-r border-gray-200 dark:border-gray-800 overflow-hidden relative bg-gray-50/50 dark:bg-black/10">
                    <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-[#151515] p-1 gap-1 shrink-0 overflow-x-auto no-scrollbar">
                        <button onClick={() => setActiveLeftTab('description')} className={`flex-1 py-1.5 px-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeLeftTab === 'description' ? 'bg-white dark:bg-dark-card text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                            <FileText size={14}/> {isZh ? "题目描述" : "Desc"}
                        </button>
                        <button onClick={() => setActiveLeftTab('solution')} className={`flex-1 py-1.5 px-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeLeftTab === 'solution' ? 'bg-white dark:bg-dark-card text-purple-500 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                            <Lightbulb size={14}/> {isZh ? "解题策略" : "Sol"}
                        </button>
                        <button onClick={() => setActiveLeftTab('submissions')} className={`flex-1 py-1.5 px-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeLeftTab === 'submissions' ? 'bg-white dark:bg-dark-card text-blue-500 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                            <History size={14}/> {isZh ? "提交记录" : "Subs"}
                        </button>
                        <button 
                            onClick={() => setActiveLeftTab('diagnosis')} 
                            className={`flex-1 py-1.5 px-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeLeftTab === 'diagnosis' ? 'bg-white dark:bg-dark-card text-red-500 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            <Stethoscope size={14}/> 
                            {isZh ? "诊断" : "Diag"}
                            {viewingSubmission && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full ml-1"></div>}
                            {!viewingSubmission && result && result.status !== 'Accepted' && <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse ml-1"></div>}
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-hidden relative">
                        {activeLeftTab === 'diagnosis' && viewingSubmission && (
                            <div className="absolute top-0 left-0 right-0 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 p-2 text-center text-xs font-bold text-blue-600 dark:text-blue-300 z-20 flex items-center justify-center gap-2">
                                <History size={12}/>
                                {isZh ? "正在查看历史快照分析" : "Viewing Historic Analysis"}
                            </div>
                        )}

                        {activeLeftTab === 'description' && renderDescriptionPanel()}
                        {activeLeftTab === 'solution' && renderSolutionPanel()}
                        {activeLeftTab === 'submissions' && (
                            <SubmissionHistory 
                                history={history} 
                                onSelect={handleHistorySelect} 
                                isZh={isZh} 
                            />
                        )}
                        {activeLeftTab === 'diagnosis' && (
                            <div className={`h-full ${viewingSubmission ? 'pt-8' : ''}`}>
                                <DiagnosisPanel 
                                    analysis={activeAnalysis} 
                                    onDrill={handleDrillTrigger} 
                                    status={activeStatus}
                                    onSaveStrategy={handleSmartSaveStrategy} 
                                    isZh={isZh}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* HORIZONTAL RESIZER */}
                <div className="w-1 bg-gray-200 dark:bg-gray-800 hover:bg-brand cursor-col-resize z-40 transition-colors flex items-center justify-center group" onMouseDown={handleMouseDown('horizontal')}>
                    <GripVertical size={12} className="text-gray-400 opacity-0 group-hover:opacity-100"/>
                </div>

                {/* RIGHT PANE (Editor + Console) */}
                <div className="flex-1 flex flex-col min-w-0 h-full relative" ref={rightPaneRef}>
                    {viewingSubmission && renderSubmissionSnapshot()}

                    <div className="flex-1 min-h-0 relative">
                        <CodeEditor 
                            code={code} 
                            language={currentLanguage} 
                            onChange={setCode} 
                            onLanguageChange={(lang: any) => setCurrentLanguage(lang)} 
                        />
                    </div>

                    {/* VERTICAL RESIZER */}
                    <div className="h-1 bg-gray-200 dark:bg-gray-800 hover:bg-brand cursor-row-resize z-40 transition-colors flex items-center justify-center group shrink-0" onMouseDown={handleMouseDown('vertical')}>
                        <GripHorizontal size={12} className="text-gray-400 opacity-0 group-hover:opacity-100"/>
                    </div>

                    {/* Console Panel */}
                    <div style={{ height: `${consoleHeight}%` }} className="min-h-[50px] relative">
                        <ConsolePanel 
                            result={result}
                            isRunning={isRunning}
                            onRun={handleRun}
                            onSubmit={handleSubmit} // Trigger Evaluation
                            onDrill={handleDrillTrigger}
                            code={code}
                            language={currentLanguage}
                            preferences={preferences}
                            onRecordMistake={handleRecordSyntaxMistake}
                            isZh={isZh}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
