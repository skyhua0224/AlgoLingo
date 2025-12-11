
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LeetCodeContext, UserPreferences, Widget, SolutionStrategy } from '../types';
import { Play, Terminal, CheckCircle, XCircle, ChevronDown, Loader2, Flag, BookOpen, Sparkles, Share2, PanelLeft, MessageCircleQuestion, GraduationCap, Lightbulb, Brain, Plus, RefreshCw, LayoutList, Key, HelpCircle, X, GripVertical, GripHorizontal, FileText, ChevronRight, Tag, Zap } from 'lucide-react';
import { validateUserCode, refineUserSolution, regenerateSolutionStrategy, generateAiAssistance } from '../services/geminiService';
import { InteractiveCodeWidget } from './widgets/InteractiveCode';
import { CalloutWidget } from './widgets/Callout';
import { MermaidVisualWidget } from './widgets/MermaidVisual';
import { MarkdownText } from './common/MarkdownText';

interface VirtualWorkspaceProps {
    context: LeetCodeContext;
    preferences: UserPreferences;
    onSuccess: () => void;
    strategies?: SolutionStrategy[];
    activeStrategyId?: string | null;
    onSelectStrategy?: (id: string) => void;
    onGenerateStrategies?: () => void;
    onAddCustomStrategy?: (strategy: SolutionStrategy) => void;
    onUpdateStrategy?: (strategy: SolutionStrategy) => void; // New Prop for repairing strategies
    isGenerating?: boolean;
}

type ConsoleTab = 'console' | 'analysis';
type LeftPanelTab = 'description' | 'solution';

interface ExecutionResult {
    status: "Accepted" | "Wrong Answer" | "Compile Error" | "Runtime Error" | "Time Limit Exceeded";
    error_message?: string;
    total_correct?: number;
    total_testcases?: number;
    test_cases: {
        input: string;
        expected: string;
        actual: string;
        passed: boolean;
        stdout?: string;
    }[];
    stats?: {
        runtime: string;
        memory: string;
        percentile: string;
    };
    analysis?: {
        pros: string[];
        cons: string[];
        timeComplexity: string;
        spaceComplexity: string;
    };
}

const SNIPPETS: Record<string, { label: string; detail: string; insert: string }[]> = {
    Python: [
        { label: 'for', detail: 'Loop range', insert: 'for i in range(n):\n    ' },
        { label: 'def', detail: 'Function', insert: 'def function_name(args):\n    ' },
        { label: 'if', detail: 'Condition', insert: 'if condition:\n    ' },
        { label: 'class', detail: 'Class', insert: 'class ClassName:\n    def __init__(self):\n        ' },
        { label: 'print', detail: 'Print', insert: 'print()' },
        { label: 'return', detail: 'Return', insert: 'return ' },
        { label: 'map', detail: 'HashMap', insert: 'hash_map = {}' },
        { label: 'set', detail: 'HashSet', insert: 'seen = set()' },
    ],
};

const SUPPORTED_LANGUAGES = ['Python', 'Java', 'C++', 'JavaScript', 'Go', 'C'];

// Strict font style for perfect alignment between textarea and pre
const EDITOR_FONT_STYLE = {
    fontFamily: 'Menlo, Monaco, Consolas, "Andale Mono", "Ubuntu Mono", "Courier New", monospace',
    fontSize: '14px',
    lineHeight: '1.5',
    letterSpacing: '0px',
    fontVariantLigatures: 'none',
    tabSize: 4,
};

export const VirtualWorkspace: React.FC<VirtualWorkspaceProps> = ({ 
    context, preferences, onSuccess, 
    strategies = [], activeStrategyId, onSelectStrategy, onGenerateStrategies, onAddCustomStrategy, onUpdateStrategy, isGenerating = false
}) => {
    const [currentLanguage, setCurrentLanguage] = useState(preferences.targetLanguage);
    const [activeConsoleTab, setActiveConsoleTab] = useState<ConsoleTab>('console');
    const [activeLeftTab, setActiveLeftTab] = useState<LeftPanelTab>('description');
    
    // Layout State
    const [leftPanelWidth, setLeftPanelWidth] = useState(40); // Percentage
    const [consoleHeight, setConsoleHeight] = useState(30); // Percentage of right pane
    const [isDragging, setIsDragging] = useState<'horizontal' | 'vertical' | null>(null);

    // Custom Solution Input State
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [customSolutionInput, setCustomSolutionInput] = useState('');
    const [isRefiningCustom, setIsRefiningCustom] = useState(false);

    // Interactive Ask AI State
    const [selectedText, setSelectedText] = useState('');
    const [selectionPos, setSelectionPos] = useState<{top: number, left: number} | null>(null);
    const [aiPopup, setAiPopup] = useState<{loading: boolean, content: string | null} | null>(null);
    const solutionContainerRef = useRef<HTMLDivElement>(null);

    // Knowledge Expansion State
    const [knowledgePopup, setKnowledgePopup] = useState<{title: string, content: string | null} | null>(null);

    const safeContext = useMemo(() => {
        return {
            meta: context?.meta || { title: 'Untitled Problem', difficulty: 'Medium', slug: 'unknown' },
            problem: context?.problem || { description: 'No description available.', examples: [], constraints: [] },
            starterCode: context?.starterCode || '# Write your code here\n',
            starterCodeMap: context?.starterCodeMap || {}, 
            sidebar: context?.sidebar
        };
    }, [context]);

    const [code, setCode] = useState(safeContext.starterCode);
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<ExecutionResult | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const preRef = useRef<HTMLPreElement>(null);
    const [suggestions, setSuggestions] = useState<{ label: string; detail: string; insert: string }[]>([]);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });

    // Drag Handlers
    const containerRef = useRef<HTMLDivElement>(null);
    const rightPaneRef = useRef<HTMLDivElement>(null);

    // Auto-switch to solution tab if a strategy is active or generating
    useEffect(() => {
        if (activeStrategyId || isGenerating) {
            setActiveLeftTab('solution');
        }
    }, [activeStrategyId, isGenerating]);

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
            } 
            else if (isDragging === 'vertical' && rightPaneRef.current) {
                const paneRect = rightPaneRef.current.getBoundingClientRect();
                // Calculate height from bottom
                const newHeight = ((paneRect.bottom - e.clientY) / paneRect.height) * 100;
                setConsoleHeight(Math.max(10, Math.min(80, newHeight)));
            }
        };

        const handleMouseUp = () => {
            setIsDragging(null);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);


    // Reset code when language changes
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

    // Scroll Sync
    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (preRef.current) {
            preRef.current.scrollTop = e.currentTarget.scrollTop;
            preRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }
    };

    // Editor Logic
    const updateSuggestions = (val: string, cursor: number) => {
        const textBeforeCursor = val.slice(0, cursor);
        const words = textBeforeCursor.split(/[\s\(\)\{\}\[\]\.,;]+/);
        const lastWord = words[words.length - 1];
        if (lastWord && lastWord.length >= 1) {
            const langSnippets = SNIPPETS[currentLanguage] || SNIPPETS['Python'];
            const matches = langSnippets.filter(s => s.label.startsWith(lastWord));
            if (matches.length > 0) {
                setSuggestions(matches);
                setSelectedSuggestionIndex(0);
                const lines = textBeforeCursor.split('\n');
                const lineIndex = lines.length - 1;
                const charIndex = lines[lineIndex].length;
                setSuggestionPosition({ top: (lineIndex + 1) * 24, left: (charIndex * 8.5) + 40 });
                return;
            }
        }
        setSuggestions([]);
    };

    const insertSuggestion = (suggestion: { label: string, insert: string }) => {
        if (!textareaRef.current) return;
        const textBeforeCursor = code.slice(0, cursorPosition);
        const words = textBeforeCursor.split(/[\s\(\)\{\}\[\]\.,;]+/);
        const lastWord = words[words.length - 1];
        const before = code.substring(0, cursorPosition - lastWord.length);
        const after = code.substring(cursorPosition);
        const newCode = before + suggestion.insert + after;
        setCode(newCode);
        setSuggestions([]);
        const newCursorPos = before.length + suggestion.insert.length;
        setTimeout(() => { if(textareaRef.current) { textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newCursorPos; textareaRef.current.focus(); } }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (suggestions.length > 0) {
            if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedSuggestionIndex(prev => (prev + 1) % suggestions.length); return; }
            if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length); return; }
            if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertSuggestion(suggestions[selectedSuggestionIndex]); return; }
            if (e.key === 'Escape') { setSuggestions([]); return; }
        }
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.currentTarget.selectionStart;
            const end = e.currentTarget.selectionEnd;
            const val = e.currentTarget.value;
            setCode(val.substring(0, start) + '    ' + val.substring(end));
            setTimeout(() => { e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 4; }, 0);
            return;
        }
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        const pos = e.target.selectionStart;
        setCode(val);
        setCursorPosition(pos);
        updateSuggestions(val, pos);
    };

    const handleRun = async () => {
        setIsRunning(true);
        setResult(null);
        setActiveConsoleTab('console');
        try {
            const res = await validateUserCode(code, safeContext.problem.description, preferences, currentLanguage);
            setResult(res);
        } catch (e) {
            setResult({ 
                status: "Runtime Error", error_message: "Judge Connection Failed.", test_cases: []
            });
        } finally {
            setIsRunning(false);
        }
    };

    const handleRefineCustom = async () => {
        if (!customSolutionInput.trim()) return;
        setIsRefiningCustom(true);
        try {
            const data = await refineUserSolution(customSolutionInput, safeContext.meta.title, preferences);
            if (onAddCustomStrategy) {
                const customStrategy: SolutionStrategy = {
                    id: `custom_${Date.now()}`,
                    title: "Custom Solution",
                    complexity: data.complexity || "Analysis Pending",
                    tags: ["Custom"],
                    derivation: data.derivation || "Custom logic provided by user.",
                    rationale: data.rationale,
                    analogy: data.analogy,
                    memoryTip: data.memoryTip,
                    mermaid: data.mermaid,
                    code: data.code || customSolutionInput,
                    codeWidgets: data.codeWidgets || [],
                    keywords: data.keywords || [],
                    language: preferences.targetLanguage,
                    isCustom: true
                };
                onAddCustomStrategy(customStrategy);
            }
            setIsCustomMode(false);
            setCustomSolutionInput('');
        } catch(e) {
            alert("Failed to refine custom solution.");
        } finally {
            setIsRefiningCustom(false);
        }
    };

    // Ask AI Logic
    useEffect(() => {
        const handleSelection = () => {
            const selection = window.getSelection();
            if (selection && selection.toString().trim().length > 0 && solutionContainerRef.current?.contains(selection.anchorNode)) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                const containerRect = solutionContainerRef.current.getBoundingClientRect();
                
                setSelectionPos({
                    top: rect.top - containerRect.top - 40,
                    left: rect.left - containerRect.left + (rect.width / 2)
                });
                setSelectedText(selection.toString());
            } else {
                if (!aiPopup) {
                    setSelectionPos(null);
                    setSelectedText('');
                }
            }
        };

        document.addEventListener('selectionchange', handleSelection);
        return () => document.removeEventListener('selectionchange', handleSelection);
    }, [aiPopup]);

    const handleAskAI = async () => {
        if (!selectedText) return;
        setAiPopup({ loading: true, content: null });
        
        try {
            const context = `Problem: ${safeContext.meta.title}. Context: User highlighted text in solution.`;
            const explanation = await generateAiAssistance(context, `Explain this: "${selectedText}"`, preferences, 'gemini-2.5-flash');
            setAiPopup({ loading: false, content: explanation });
        } catch (e) {
            setAiPopup({ loading: false, content: "Error fetching explanation." });
        }
    };

    const handleExpandKnowledge = async (point: string) => {
        setKnowledgePopup({ title: point, content: null });
        try {
            const context = `Problem: ${safeContext.meta.title}. Concept: ${point}.`;
            const explanation = await generateAiAssistance(context, `Explain "${point}" in the context of this algorithm problem briefly.`, preferences, 'gemini-2.5-flash');
            setKnowledgePopup({ title: point, content: explanation });
        } catch (e) {
            setKnowledgePopup({ title: point, content: "Error fetching explanation." });
        }
    };

    // Regenerate Mermaid Diagram logic
    const handleRegenerateDiagram = async (instruction: string) => {
        if (!onUpdateStrategy || !activeStrategyId) return;
        const activeSolution = strategies.find(s => s.id === activeStrategyId);
        if (!activeSolution) return;

        try {
            // Call API to fix the strategy's mermaid part
            const updatedStrategy = await regenerateSolutionStrategy(activeSolution, "Regenerate the Mermaid diagram. " + instruction, preferences);
            onUpdateStrategy(updatedStrategy);
        } catch (e) {
            alert("Failed to regenerate diagram.");
        }
    };

    // --- RENDERERS ---

    const renderDescriptionPanel = () => {
        const difficultyColor = safeContext.meta.difficulty === 'Easy' ? 'text-green-600 bg-green-100 dark:bg-green-900/30' : 
                          safeContext.meta.difficulty === 'Medium' ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' :
                          'text-red-600 bg-red-100 dark:bg-red-900/30';

        return (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white dark:bg-[#0c0c0c] h-full">
                <div className="mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">{safeContext.meta.title}</h2>
                    <div className="flex items-center gap-3 text-xs font-bold">
                        <span className={`px-3 py-1 rounded-full ${difficultyColor}`}>
                            {safeContext.meta.difficulty}
                        </span>
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
                            <div className="bg-gray-100 dark:bg-[#252526] px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
                                Example {i + 1}
                            </div>
                            <div className="p-4 font-mono text-xs md:text-sm space-y-2">
                                <div><span className="text-gray-500 font-bold">Input:</span> <span className="text-gray-800 dark:text-gray-200">{ex.input}</span></div>
                                <div><span className="text-gray-500 font-bold">Output:</span> <span className="text-gray-800 dark:text-gray-200">{ex.output}</span></div>
                                {ex.explanation && (
                                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700 mt-2 text-gray-600 dark:text-gray-400">
                                        <span className="font-bold">Explanation:</span> {ex.explanation}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Constraints:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-xs md:text-sm font-mono text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-[#1a1a1a] p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                        {safeContext.problem.constraints.map((c, i) => (
                            <li key={i}>{c}</li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    }

    const renderSolutionPanel = () => {
        // --- GENERATING STATE (INLINE) ---
        if (isGenerating) {
             return (
                <div className="h-full flex flex-col items-center justify-center bg-white dark:bg-[#0c0c0c] p-8 text-center animate-fade-in-up">
                    <div className="w-16 h-16 relative mb-6">
                        <div className="absolute inset-0 bg-brand/20 rounded-full animate-ping"></div>
                        <div className="relative w-16 h-16 bg-white dark:bg-dark-card rounded-full flex items-center justify-center shadow-xl border-4 border-brand/20">
                            <Zap size={24} className="text-brand animate-pulse" />
                        </div>
                    </div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white mb-2">
                        {preferences.spokenLanguage === 'Chinese' ? "Gemini 正在撰写官方题解..." : "Gemini is writing the Official Solution..."}
                    </h2>
                    <div className="space-y-1 text-center text-gray-400 text-xs font-mono">
                        <p className="animate-fade-in-up delay-100">Analyzing Complexity...</p>
                        <p className="animate-fade-in-up delay-200">Deriving State Equations...</p>
                        <p className="animate-fade-in-up delay-300">Optimizing Code Structure...</p>
                    </div>
                </div>
             );
        }

        // --- CUSTOM ADD MODE ---
        if (isCustomMode) {
            return (
                <div className="h-full flex flex-col bg-white dark:bg-[#0c0c0c] border-r border-gray-200 dark:border-gray-800 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-black">Add Custom Solution</h2>
                        <button onClick={() => setIsCustomMode(false)} className="text-xs text-gray-500 hover:text-gray-900">Cancel</button>
                    </div>
                    <textarea 
                        className="flex-1 w-full bg-gray-50 dark:bg-[#1e1e1e] border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 font-mono text-sm focus:border-brand outline-none resize-none mb-4"
                        placeholder="// Paste your code or explain your approach here..."
                        value={customSolutionInput}
                        onChange={(e) => setCustomSolutionInput(e.target.value)}
                    />
                    <button 
                        onClick={handleRefineCustom}
                        disabled={isRefiningCustom || !customSolutionInput.trim()}
                        className="w-full py-4 bg-brand text-white rounded-xl font-bold shadow-lg hover:bg-brand-dark disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isRefiningCustom ? <Loader2 size={18} className="animate-spin"/> : <Sparkles size={18}/>}
                        {isRefiningCustom ? "AI Refining..." : "Analyze & Save Solution"}
                    </button>
                </div>
            );
        }

        // --- EMPTY STATE ---
        if (!activeStrategyId || strategies.length === 0) {
             return (
                <div className="h-full flex flex-col bg-white dark:bg-[#0c0c0c] overflow-y-auto">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                <BookOpen size={20} className="text-purple-500" />
                                {preferences.spokenLanguage === 'Chinese' ? "选择解题策略" : "Select Strategy"}
                            </h3>
                            <button 
                                onClick={onGenerateStrategies}
                                disabled={isGenerating}
                                className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-bold hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {isGenerating ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14}/>}
                                {isGenerating ? "Generating..." : "Generate More"}
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                            {strategies.map(strat => (
                                <button
                                    key={strat.id}
                                    onClick={() => onSelectStrategy && onSelectStrategy(strat.id)}
                                    className="p-5 rounded-2xl border-2 border-gray-200 dark:border-gray-800 hover:border-purple-500 dark:hover:border-purple-500 bg-white dark:bg-dark-card text-left transition-all group hover:shadow-lg relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Sparkles size={60} />
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{strat.title}</h4>
                                    <div className="flex gap-2 mb-3">
                                        <span className="text-[10px] font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-500">{strat.complexity}</span>
                                        {strat.tags.map((t, i) => (
                                            <span key={i} className="text-[10px] bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 px-2 py-1 rounded font-bold">{t}</span>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{strat.rationale || strat.derivation}</p>
                                </button>
                            ))}
                            
                            <button
                                onClick={() => setIsCustomMode(true)}
                                className="p-5 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-brand hover:text-brand text-gray-400 transition-all flex flex-col items-center justify-center gap-2"
                            >
                                <Plus size={24} />
                                <span className="font-bold text-sm">Add Custom Strategy</span>
                            </button>
                        </div>
                    </div>
                </div>
             );
        }

        // --- ACTIVE STRATEGY VIEW ---
        const activeSolution = strategies.find(s => s.id === activeStrategyId) || strategies[0];

        return (
            <div className="h-full flex flex-col bg-white dark:bg-[#0c0c0c] relative">
                
                {/* Ask AI Popover */}
                {(selectionPos || aiPopup) && (
                    <div 
                        className="absolute z-50 animate-scale-in"
                        style={{ top: selectionPos?.top || 20, left: selectionPos?.left || '50%' }}
                    >
                        {!aiPopup ? (
                            <button 
                                onClick={handleAskAI}
                                className="bg-brand text-white px-3 py-1.5 rounded-full shadow-xl flex items-center gap-2 text-xs font-bold hover:scale-105 transition-transform"
                            >
                                <MessageCircleQuestion size={14}/> Ask AI
                            </button>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600 w-64 text-xs relative">
                                <button onClick={() => { setAiPopup(null); setSelectionPos(null); }} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"><XCircle size={14}/></button>
                                {aiPopup.loading ? (
                                    <div className="flex items-center gap-2 text-gray-500"><Loader2 size={14} className="animate-spin"/> Thinking...</div>
                                ) : (
                                    <div className="text-gray-700 dark:text-gray-300 leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">
                                        <MarkdownText content={aiPopup.content || ""} />
                                    </div>
                                )}
                            </div>
                        )}
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

                {/* Strategy Tabs */}
                <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-800 p-2 gap-2 shrink-0 bg-gray-50/50 dark:bg-gray-900/50 items-center">
                    <button 
                        onClick={() => onSelectStrategy && onSelectStrategy("")}
                        className="px-2 py-1.5 rounded-lg text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 mr-2"
                        title="Back to List"
                    >
                        <LayoutList size={16}/>
                    </button>
                    {strategies.map((sol) => (
                        <button
                            key={sol.id}
                            onClick={() => onSelectStrategy && onSelectStrategy(sol.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${activeSolution?.id === sol.id ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        >
                            {sol.title}
                            {activeSolution?.id === sol.id && <CheckCircle size={12}/>}
                        </button>
                    ))}
                    <button onClick={() => setIsCustomMode(true)} className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap text-brand hover:bg-brand/10 border border-brand/20 flex items-center gap-1">
                        <Plus size={12}/>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6" ref={solutionContainerRef}>
                    <div className="space-y-8 animate-fade-in-up pb-12">
                        <div className="pb-6 border-b border-gray-100 dark:border-gray-800">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">{activeSolution.title}</h2>
                            <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-xs font-mono font-bold text-gray-500 border border-gray-200 dark:border-gray-700">
                                    {activeSolution.complexity}
                                </span>
                                {activeSolution.tags?.map((tag, i) => (
                                    <span key={i} className="px-3 py-1 bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-300 rounded-md text-xs font-bold border border-purple-100 dark:border-purple-900/30">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* --- DETAILED SECTIONS --- */}
                        {activeSolution.sections ? (
                            activeSolution.sections.map((sec, i) => (
                                <div key={i} className="bg-white dark:bg-dark-card p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                                        <BookOpen size={16} className="text-brand"/> {sec.header}
                                    </h3>
                                    <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
                                        <MarkdownText content={sec.content} />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <>
                                {activeSolution.derivation && (
                                    <div className="bg-white dark:bg-dark-card p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                                            <GraduationCap size={16} className="text-brand"/> Logic & Derivation
                                        </h3>
                                        <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
                                            <MarkdownText content={activeSolution.derivation} />
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {activeSolution.analogy && (
                                        <div className="bg-purple-50 dark:bg-purple-900/10 p-5 rounded-2xl border border-purple-100 dark:border-purple-900/30 shadow-sm">
                                            <h3 className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <Sparkles size={14}/> Concept Analogy
                                            </h3>
                                            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                                <MarkdownText content={activeSolution.analogy} />
                                            </div>
                                        </div>
                                    )}
                                    {activeSolution.memoryTip && (
                                        <div className="bg-green-50 dark:bg-green-900/10 p-5 rounded-2xl border border-green-100 dark:border-green-900/30 shadow-sm">
                                            <h3 className="text-xs font-black text-green-600 dark:text-green-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <Brain size={14}/> Memory Tip
                                            </h3>
                                            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                                <MarkdownText content={activeSolution.memoryTip} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {activeSolution.mermaid && (
                            <div>
                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Share2 size={16} /> Logic Flow
                                </h3>
                                <MermaidVisualWidget 
                                    key={activeSolution.id} 
                                    widget={{ id: 'sol-flow', type: 'mermaid', mermaid: { chart: activeSolution.mermaid, caption: "Algorithm Visualization" } }} 
                                    onRegenerate={handleRegenerateDiagram} 
                                />
                            </div>
                        )}

                        {activeSolution.keywords && activeSolution.keywords.length > 0 && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/10 p-5 rounded-2xl border border-yellow-100 dark:border-yellow-900/30">
                                <h3 className="text-sm font-black text-yellow-700 dark:text-yellow-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Key size={16} /> Key Concepts & Syntax
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {activeSolution.keywords.map((item, i) => (
                                        <div key={i} className="flex flex-col gap-1">
                                            <code className="text-xs font-bold text-yellow-800 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/40 px-2 py-1 rounded w-fit">
                                                {item.term}
                                            </code>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed pl-2 border-l-2 border-yellow-200 dark:border-yellow-800">
                                                {item.definition}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {activeSolution.expandedKnowledge && activeSolution.expandedKnowledge.length > 0 && (
                            <div className="bg-gray-100 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <HelpCircle size={14}/> Expanded Knowledge (Tap to learn)
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
                        
                        {(activeSolution.codeWidgets || []).map((widget, idx) => (
                            <div key={idx}>
                                {widget.type === 'callout' && <CalloutWidget widget={widget}/>}
                                {widget.type === 'interactive-code' && <InteractiveCodeWidget widget={widget} language={preferences.spokenLanguage}/>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderEditor = () => {
        const getLangKey = (lang: string) => {
            const lower = lang.toLowerCase();
            if (lower === 'c++') return 'cpp';
            if (lower === 'c#') return 'csharp';
            return lower;
        };
        const langKey = getLangKey(currentLanguage);
        const Prism = (window as any).Prism;
        let highlighted = code;
        if (Prism && Prism.languages[langKey]) {
            highlighted = Prism.highlight(code, Prism.languages[langKey], langKey);
        }

        return (
            <div className="flex flex-col h-full bg-[#1e1e1e] relative">
                <div className="h-10 bg-[#252526] border-b border-gray-700 flex items-center px-4 justify-between shrink-0 relative z-20">
                    <div className="flex items-center gap-2">
                        <Terminal size={14} className="text-gray-400"/>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Editor</span>
                    </div>
                    <div className="relative group">
                        <button className="flex items-center gap-2 text-xs font-bold bg-[#333] hover:bg-[#444] px-3 py-1 rounded text-white transition-colors">
                            {currentLanguage} <ChevronDown size={12}/>
                        </button>
                        <div className="absolute top-full right-0 mt-1 w-32 bg-[#252526] border border-gray-700 rounded-lg shadow-xl overflow-hidden hidden group-hover:block z-50">
                             {SUPPORTED_LANGUAGES.map(lang => (
                                 <button 
                                    key={lang} 
                                    onClick={() => setCurrentLanguage(lang as any)} 
                                    className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-[#37373d] text-gray-300 ${lang === currentLanguage ? 'text-brand' : ''}`}
                                 >
                                     {lang}
                                 </button>
                             ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex relative overflow-hidden">
                    <div className="w-10 bg-[#1e1e1e] border-r border-gray-700 text-right pr-2 pt-4 text-gray-600 font-mono text-[14px] leading-[1.5] select-none shrink-0 z-10">
                        {code.split('\n').map((_, i) => ( <div key={i} style={{height: '21px'}}>{i + 1}</div> ))}
                    </div>

                    <div className="relative flex-1 overflow-hidden">
                        {/* 
                           STRICT ALIGNMENT FIX: 
                           Force exact font stack, size, line-height, and padding 
                           on both PRE and TEXTAREA to ensure cursor matches perfectly.
                        */}
                        <pre 
                            ref={preRef} 
                            className={`absolute inset-0 m-0 p-4 bg-transparent pointer-events-none z-0 overflow-auto whitespace-pre text-gray-300 language-${langKey}`} 
                            style={EDITOR_FONT_STYLE}
                        >
                            <code className={`language-${langKey}`} dangerouslySetInnerHTML={{ __html: highlighted }} />
                            <br />
                        </pre>

                        <textarea 
                            ref={textareaRef}
                            value={code}
                            onChange={handleCodeChange}
                            onKeyDown={handleKeyDown}
                            onScroll={handleScroll}
                            className="absolute inset-0 w-full h-full m-0 p-4 bg-transparent text-transparent caret-white resize-none outline-none z-10 whitespace-pre overflow-auto"
                            style={{ ...EDITOR_FONT_STYLE, color: 'transparent' }}
                            spellCheck={false}
                            autoCapitalize="off"
                            autoComplete="off"
                            autoCorrect="off"
                        />

                        {suggestions.length > 0 && (
                            <div className="absolute z-50 w-64 bg-[#252526] border border-[#454545] shadow-2xl rounded-md overflow-hidden flex flex-col" style={{ top: Math.min(suggestionPosition.top + 24, 300), left: Math.min(suggestionPosition.left, 400) }}>
                                {suggestions.map((s, idx) => (
                                    <button key={idx} onClick={() => insertSuggestion(s)} className={`flex items-center justify-between px-3 py-1.5 text-xs font-mono border-l-2 text-left ${idx === selectedSuggestionIndex ? 'bg-[#094771] text-white border-[#007acc]' : 'text-gray-300 border-transparent hover:bg-[#2a2d2e]'}`}>
                                        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-400 rounded-full"/><span className="font-bold">{s.label}</span></div>
                                        <span className="text-gray-500 text-[10px]">{s.detail}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Render Bottom Console (Now placed inside the Right Pane in the layout)
    const renderConsole = () => {
        return (
            <div className="flex flex-col h-full bg-white dark:bg-[#111]">
                <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#161b22] shrink-0">
                    <button onClick={() => setActiveConsoleTab('console')} className={`px-4 py-1.5 text-xs font-bold border-b-2 transition-all ${activeConsoleTab === 'console' ? 'border-brand text-brand bg-white dark:bg-[#111]' : 'border-transparent text-gray-500'}`}>Console</button>
                    <button onClick={() => setActiveConsoleTab('analysis')} className={`px-4 py-1.5 text-xs font-bold border-b-2 transition-all ${activeConsoleTab === 'analysis' ? 'border-brand text-brand bg-white dark:bg-[#111]' : 'border-transparent text-gray-500'}`}>Analysis</button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
                    {activeConsoleTab === 'console' ? (
                        isRunning ? <div className="flex items-center gap-2 text-gray-500"><Loader2 size={14} className="animate-spin"/> Running...</div> :
                        result ? (
                            <div className="space-y-4">
                                <div className={`text-lg font-bold flex items-center gap-2 ${result.status === 'Accepted' ? 'text-green-500' : 'text-red-500'}`}>
                                    {result.status === 'Accepted' ? <CheckCircle size={18}/> : <XCircle size={18}/>}
                                    {result.status}
                                </div>
                                {result.error_message && <pre className="text-red-400 bg-red-900/10 p-2 rounded">{result.error_message}</pre>}
                                {result.test_cases?.map((tc, i) => (
                                    <div key={i} className="bg-gray-100 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                                        <div className="text-gray-500 mb-1">Case {i+1}: {tc.passed ? 'PASS' : 'FAIL'}</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>In: {tc.input}</div>
                                            <div className={tc.passed ? 'text-green-600' : 'text-red-500'}>Out: {tc.actual}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <div className="text-gray-400 italic">Run code to see output...</div>
                    ) : (
                        result?.analysis ? (
                            <div className="space-y-2">
                                <div className="font-bold text-brand">Time: {result.analysis.timeComplexity}</div>
                                <div className="font-bold text-purple-500">Space: {result.analysis.spaceComplexity}</div>
                                <ul className="list-disc pl-4 text-gray-600 dark:text-gray-300">
                                    {result.analysis.pros.map((p, i) => <li key={i}>{p}</li>)}
                                </ul>
                            </div>
                        ) : <div className="text-gray-400">Run code for analysis.</div>
                    )}
                </div>

                <div className="p-2 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2 bg-gray-50 dark:bg-[#161b22] shrink-0">
                    <button onClick={() => setCode(safeContext.starterCode)} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded">Reset</button>
                    <button onClick={handleRun} disabled={isRunning} className="px-4 py-1.5 bg-brand text-white rounded-lg text-xs font-bold hover:bg-brand-dark flex items-center gap-2 disabled:opacity-50 shadow-sm">
                        {isRunning ? <Loader2 size={14} className="animate-spin"/> : <Play size={14} fill="currentColor"/>} Run
                    </button>
                    {result?.status === "Accepted" && (
                        <button onClick={onSuccess} className="px-4 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 flex items-center gap-2 shadow-sm animate-pulse">
                            <Flag size={14} fill="currentColor"/> Submit
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full bg-white dark:bg-[#0c0c0c] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between bg-gray-50 dark:bg-[#111] border-b border-gray-200 dark:border-gray-800 px-4 py-2 shrink-0 z-20 h-12">
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-gray-500">IDE V3</span>
                </div>
            </div>
            
            {/* Layout Container */}
            <div className="flex-1 flex min-h-0 relative select-none" ref={containerRef}>
                
                {/* Drag Overlay (Prevents iframe/input stealing mouse events) */}
                {isDragging && <div className="absolute inset-0 z-50 cursor-col-resize" style={{ cursor: isDragging === 'horizontal' ? 'col-resize' : 'row-resize' }}></div>}

                {/* LEFT PANE (Tabs: Description / Solution) */}
                <div style={{ width: `${leftPanelWidth}%` }} className="h-full flex flex-col border-r border-gray-200 dark:border-gray-800 overflow-hidden relative bg-gray-50/50 dark:bg-black/10">
                    
                    {/* Top Tab Bar */}
                    <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-[#151515] p-1 gap-1 shrink-0">
                        <button 
                            onClick={() => setActiveLeftTab('description')}
                            className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                activeLeftTab === 'description' 
                                ? 'bg-white dark:bg-dark-card text-brand shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            <FileText size={14}/> 
                            {preferences.spokenLanguage === 'Chinese' ? "题目描述" : "Description"}
                        </button>
                        <button 
                            onClick={() => setActiveLeftTab('solution')}
                            className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                activeLeftTab === 'solution' 
                                ? 'bg-white dark:bg-dark-card text-purple-500 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            <Lightbulb size={14}/> 
                            {preferences.spokenLanguage === 'Chinese' ? "解题策略" : "Solution"}
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden relative">
                        {activeLeftTab === 'description' && renderDescriptionPanel()}
                        {activeLeftTab === 'solution' && renderSolutionPanel()}
                    </div>
                </div>

                {/* HORIZONTAL RESIZER */}
                <div 
                    className="w-1 bg-gray-200 dark:bg-gray-800 hover:bg-brand cursor-col-resize z-40 transition-colors flex items-center justify-center group"
                    onMouseDown={handleMouseDown('horizontal')}
                >
                    <GripVertical size={12} className="text-gray-400 opacity-0 group-hover:opacity-100"/>
                </div>

                {/* RIGHT PANE (Editor + Console) */}
                <div className="flex-1 flex flex-col min-w-0 h-full" ref={rightPaneRef}>
                    
                    {/* Top: Editor */}
                    <div className="flex-1 min-h-0 relative">
                        {renderEditor()}
                    </div>

                    {/* VERTICAL RESIZER */}
                    <div 
                        className="h-1 bg-gray-200 dark:bg-gray-800 hover:bg-brand cursor-row-resize z-40 transition-colors flex items-center justify-center group shrink-0"
                        onMouseDown={handleMouseDown('vertical')}
                    >
                        <GripHorizontal size={12} className="text-gray-400 opacity-0 group-hover:opacity-100"/>
                    </div>

                    {/* Bottom: Console */}
                    <div style={{ height: `${consoleHeight}%` }} className="min-h-[50px] relative">
                        {renderConsole()}
                    </div>
                </div>

            </div>
        </div>
    );
};
