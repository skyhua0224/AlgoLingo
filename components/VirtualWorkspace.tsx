
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LeetCodeContext, UserPreferences, Widget } from '../types';
import { Play, RotateCcw, Terminal, Activity, CheckCircle, XCircle, ChevronDown, AlertTriangle, FileText, Code2, Layout, Columns, Rows, Loader2, Flag, BookOpen, Sparkles, Edit3, Save, Lightbulb, Brain, Layers, Share2, PanelLeft, MessageCircleQuestion, GraduationCap } from 'lucide-react';
import { validateUserCode, generateLeetCodeSolutions, refineUserSolution, generateAiAssistance } from '../services/geminiService';
import { InteractiveCodeWidget } from './widgets/InteractiveCode';
import { CalloutWidget } from './widgets/Callout';
import { MermaidVisualWidget } from './widgets/MermaidVisual'; // New import
import { MarkdownText } from './common/MarkdownText';

// ... interface definitions ...
interface VirtualWorkspaceProps {
    context: LeetCodeContext;
    preferences: UserPreferences;
    onSuccess: () => void;
    isSidebarOpen?: boolean;
    onToggleSidebar?: () => void;
}

// ... type definitions ...
type LayoutMode = 'standard' | 'tri-pane' | 'zen';
type LeftTab = 'description' | 'solution';
type ConsoleTab = 'console' | 'analysis';

interface ExecutionResult {
    // ... 
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

interface SolutionApproach {
    // ...
    id: string;
    title: string;
    complexity: string; // "Time: O(n) | Space: O(1)"
    tags?: string[];
    
    // Deep Dive Content
    derivation?: string; // New: Detailed narrative
    mermaid?: string; // New: Flowchart code
    glossary?: { term: string; definition: string }[]; // New: Keyword explanations
    
    intuition?: string; 
    prerequisites?: string[]; 
    strategy?: string; 
    similarPatterns?: string[]; 
    
    widgets: Widget[];
}

// ... SNIPPETS constant ...
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

export const VirtualWorkspace: React.FC<VirtualWorkspaceProps> = ({ context, preferences, onSuccess, isSidebarOpen, onToggleSidebar }) => {
    // ... existing state ...
    const [layoutMode, setLayoutMode] = useState<LayoutMode>('tri-pane'); // Default to Tri-pane
    const [currentLanguage, setCurrentLanguage] = useState(preferences.targetLanguage);
    
    const [activeLeftTab, setActiveLeftTab] = useState<LeftTab>('description'); 
    const [activeConsoleTab, setActiveConsoleTab] = useState<ConsoleTab>('console');
    
    // Solution State
    const [solutions, setSolutions] = useState<SolutionApproach[]>([]);
    const [activeSolutionIdx, setActiveSolutionIdx] = useState(0);
    const [isGeneratingSolution, setIsGeneratingSolution] = useState(false);
    const [customSolutionInput, setCustomSolutionInput] = useState('');
    const [isRefiningCustom, setIsRefiningCustom] = useState(false);
    const [isCustomMode, setIsCustomMode] = useState(false); // NEW: Toggle between standard and custom view

    // ... Interactive Ask AI State ...
    const [selectedText, setSelectedText] = useState('');
    const [selectionPos, setSelectionPos] = useState<{top: number, left: number} | null>(null);
    const [aiPopup, setAiPopup] = useState<{loading: boolean, content: string | null} | null>(null);
    const solutionContainerRef = useRef<HTMLDivElement>(null);

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

    // ... Load Solutions from Cache ...
    useEffect(() => {
        const cacheKey = `algolingo_sol_v3_${safeContext.meta.slug}_${preferences.targetLanguage}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                setSolutions(parsed.approaches || []);
            } catch(e) {}
        }
    }, [safeContext.meta.slug, preferences.targetLanguage]);

    // ... Init Code Effect ...
    useEffect(() => {
        const map = safeContext.starterCodeMap;
        if (map && map[currentLanguage]) {
            setCode(map[currentLanguage]);
        } else if (currentLanguage === preferences.targetLanguage) {
            setCode(safeContext.starterCode);
        } else {
            setCode(`# Write your ${currentLanguage} solution here...\n`);
        }
    }, [currentLanguage, safeContext.starterCode, safeContext.starterCodeMap, preferences.targetLanguage]);

    // ... Scroll Sync ...
    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (preRef.current) {
            preRef.current.scrollTop = e.currentTarget.scrollTop;
            preRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }
    };

    // ... Editor Logic (Update suggestions, insert, keydown, change) ...
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

    const handleGenerateSolutions = async () => {
        setIsGeneratingSolution(true);
        try {
            const newData = await generateLeetCodeSolutions(safeContext.meta.title, safeContext.problem.description, preferences);
            setSolutions(newData.approaches);
            
            const cacheKey = `algolingo_sol_v3_${safeContext.meta.slug}_${preferences.targetLanguage}`;
            localStorage.setItem(cacheKey, JSON.stringify(newData));
        } catch (e) {
            alert("AI Generation Failed");
        } finally {
            setIsGeneratingSolution(false);
        }
    };

    const handleRefineCustom = async () => {
        if (!customSolutionInput.trim()) return;
        setIsRefiningCustom(true);
        try {
            const refined = await refineUserSolution(customSolutionInput, safeContext.meta.title, preferences);
            // Append as a new approach
            setSolutions(prev => [...prev, refined]);
            setActiveSolutionIdx(solutions.length); // Switch to it
            setIsCustomMode(false); // Switch back to view mode
        } catch(e) {
            alert("Failed to refine custom solution.");
        } finally {
            setIsRefiningCustom(false);
        }
    };

    // ... Interactive Ask AI Logic ...
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

    // --- RENDERERS ---

    const renderHeader = () => (
        <div className="flex items-center justify-between bg-gray-50 dark:bg-[#111] border-b border-gray-200 dark:border-gray-800 px-4 py-2 shrink-0 z-20">
            {/* ... same header code ... */}
            <div className="flex items-center gap-4">
                <div className="relative group">
                    <button className="flex items-center gap-2 text-xs font-bold bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:border-brand transition-colors">
                        {currentLanguage} <ChevronDown size={14} className="opacity-50"/>
                    </button>
                    <div className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden hidden group-hover:block z-50">
                         {Object.keys(safeContext.starterCodeMap).map(lang => (
                             <button key={lang} onClick={() => setCurrentLanguage(lang as any)} className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800">
                                 {lang}
                             </button>
                         ))}
                    </div>
                </div>
                
                <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-lg">
                     <button 
                        onClick={() => setLayoutMode('standard')} 
                        className={`p-1.5 rounded-md flex items-center gap-2 ${layoutMode === 'standard' ? 'bg-white dark:bg-dark-card shadow-sm text-gray-800 dark:text-white' : 'opacity-50 hover:opacity-100'}`}
                     >
                        <Columns size={14} />
                     </button>
                     <button 
                        onClick={() => setLayoutMode('tri-pane')} 
                        className={`p-1.5 rounded-md flex items-center gap-2 ${layoutMode === 'tri-pane' ? 'bg-white dark:bg-dark-card shadow-sm text-gray-800 dark:text-white' : 'opacity-50 hover:opacity-100'}`}
                     >
                        <PanelLeft size={14} />
                     </button>
                     <button 
                        onClick={() => setLayoutMode('zen')} 
                        className={`p-1.5 rounded-md flex items-center gap-2 ${layoutMode === 'zen' ? 'bg-white dark:bg-dark-card shadow-sm text-gray-800 dark:text-white' : 'opacity-50 hover:opacity-100'}`}
                     >
                        <Layout size={14} />
                     </button>
                </div>
            </div>
            
            <div className="flex gap-2">
                {layoutMode === 'standard' && (
                    <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-lg">
                        <button onClick={() => setActiveLeftTab('description')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeLeftTab === 'description' ? 'bg-white dark:bg-dark-card shadow-sm text-brand' : 'text-gray-500'}`}>Description</button>
                        <button onClick={() => setActiveLeftTab('solution')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeLeftTab === 'solution' ? 'bg-white dark:bg-dark-card shadow-sm text-brand' : 'text-gray-500'}`}>Solution</button>
                    </div>
                )}
            </div>
        </div>
    );

    const renderDescription = () => (
        <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-white dark:bg-[#0c0c0c] text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-gray-800">
            {/* ... same description code ... */}
            <h2 className="text-2xl font-black mb-4">{safeContext.meta.title}</h2>
            <div className="flex gap-2 mb-6">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${safeContext.meta.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : safeContext.meta.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {safeContext.meta.difficulty}
                </span>
            </div>
            <div className="prose dark:prose-invert prose-sm max-w-none mb-8">
                <MarkdownText content={safeContext.problem.description} className="whitespace-pre-wrap leading-7" />
            </div>
            
            <h3 className="text-sm font-bold uppercase text-gray-400 mb-3">Examples</h3>
            <div className="space-y-4 mb-8">
                {safeContext.problem.examples.map((ex, i) => (
                    <div key={i} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 font-mono text-xs">
                        <div className="mb-2"><strong className="text-gray-500">Input:</strong> {ex.input}</div>
                        <div className="mb-2"><strong className="text-gray-500">Output:</strong> {ex.output}</div>
                        {ex.explanation && <div><strong className="text-gray-500">Explanation:</strong> {ex.explanation}</div>}
                    </div>
                ))}
            </div>

            <h3 className="text-sm font-bold uppercase text-gray-400 mb-3">Constraints</h3>
            <ul className="list-disc pl-5 space-y-1 text-xs font-mono text-gray-600 dark:text-gray-400">
                {safeContext.problem.constraints.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
        </div>
    );

    const renderSolution = () => {
        if (solutions.length === 0 && !isCustomMode) {
            return (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-[#0c0c0c] border-r border-gray-200 dark:border-gray-800">
                    {/* ... generate button ... */}
                    <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-6 animate-pulse-soft">
                        <Brain size={40} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Detailed Solutions</h3>
                    <p className="text-sm text-gray-500 mb-8 max-w-xs leading-relaxed">
                        Generate comprehensive guides including Derivation, Flowcharts, and Deep Dives using Gemini Pro 3.
                    </p>
                    <div className="flex gap-3">
                        <button 
                            onClick={handleGenerateSolutions}
                            disabled={isGeneratingSolution}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-sm shadow-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGeneratingSolution ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>}
                            {isGeneratingSolution ? "Thinking..." : "Generate AI Solutions"}
                        </button>
                        <button
                            onClick={() => setIsCustomMode(true)}
                            className="px-6 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                        >
                            Add My Own
                        </button>
                    </div>
                </div>
            );
        }

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
            )
        }

        const activeSolution = solutions[activeSolutionIdx];

        return (
            <div className="h-full flex flex-col bg-white dark:bg-[#0c0c0c] border-r border-gray-200 dark:border-gray-800 relative">
                
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

                {/* Solution Tabs */}
                <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-800 p-2 gap-2 shrink-0 bg-gray-50/50 dark:bg-gray-900/50">
                    {solutions.map((sol, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveSolutionIdx(idx)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeSolutionIdx === idx ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        >
                            {sol.title}
                        </button>
                    ))}
                    <button onClick={() => setIsCustomMode(true)} className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap text-brand hover:bg-brand/10 border border-brand/20">
                        + Add Custom
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6" ref={solutionContainerRef}>
                    <div className="space-y-8 animate-fade-in-up">
                        {/* Title & Stats */}
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

                        {/* Derivation (New) */}
                        {activeSolution.derivation && (
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                <h3 className="text-sm font-black text-blue-700 dark:text-blue-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <GraduationCap size={16} /> Professor's Derivation
                                </h3>
                                <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed selection:bg-blue-200 dark:selection:bg-blue-900">
                                    <MarkdownText content={activeSolution.derivation} />
                                </div>
                            </div>
                        )}

                        {/* Intuition (Fallback if derivation missing) */}
                        {!activeSolution.derivation && activeSolution.intuition && (
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                <h3 className="text-sm font-black text-blue-700 dark:text-blue-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Lightbulb size={16} /> Intuition
                                </h3>
                                <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                    <MarkdownText content={activeSolution.intuition} />
                                </div>
                            </div>
                        )}

                        {/* Mermaid Flowchart (New) */}
                        {activeSolution.mermaid && (
                            <div>
                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Share2 size={16} /> Logic Flow
                                </h3>
                                <MermaidVisualWidget widget={{ id: 'sol-flow', type: 'mermaid', mermaid: { chart: activeSolution.mermaid, caption: "Algorithm Visualization" } }} />
                            </div>
                        )}

                        {/* Logic/Strategy Section */}
                        {activeSolution.strategy && (
                            <div>
                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Brain size={16} /> Strategy
                                </h3>
                                <div className="text-sm text-gray-800 dark:text-gray-200 leading-7">
                                    <MarkdownText content={activeSolution.strategy} />
                                </div>
                            </div>
                        )}

                        {/* Glossary (New) */}
                        {activeSolution.glossary && activeSolution.glossary.length > 0 && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/10 p-5 rounded-2xl border border-yellow-100 dark:border-yellow-900/30">
                                <h3 className="text-sm font-black text-yellow-700 dark:text-yellow-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <BookOpen size={16} /> Key Concepts & Syntax
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {activeSolution.glossary.map((item, i) => (
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
                        
                        {/* Code Widgets */}
                        {activeSolution.widgets.map((widget, idx) => (
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
        // ... existing editor logic ...
        // Safe access to Prism logic
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
                <div className="flex-1 flex relative overflow-hidden">
                    {/* Line Numbers */}
                    <div className="w-10 bg-[#1e1e1e] border-r border-gray-700 text-right pr-2 pt-4 text-gray-600 font-mono text-[14px] leading-[1.5] select-none shrink-0 z-10">
                        {code.split('\n').map((_, i) => ( <div key={i} style={{height: '21px'}}>{i + 1}</div> ))}
                    </div>

                    <div className="relative flex-1 overflow-hidden">
                        {/* Highlights Layer (Bottom) */}
                        <pre ref={preRef} className={`absolute inset-0 m-0 p-4 font-mono text-[14px] leading-[1.5] bg-transparent pointer-events-none z-0 overflow-auto whitespace-pre tab-4 text-gray-300 language-${langKey}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                            <code className={`language-${langKey}`} dangerouslySetInnerHTML={{ __html: highlighted }} />
                            <br />
                        </pre>

                        {/* Input Layer (Top) - Transparent text, Visible Caret */}
                        <textarea 
                            ref={textareaRef}
                            value={code}
                            onChange={handleCodeChange}
                            onKeyDown={handleKeyDown}
                            onScroll={handleScroll}
                            className="absolute inset-0 w-full h-full m-0 p-4 font-mono text-[14px] leading-[1.5] bg-transparent text-transparent caret-white resize-none outline-none z-10 whitespace-pre overflow-auto tab-4"
                            style={{ color: 'transparent', fontFamily: '"JetBrains Mono", monospace' }}
                            spellCheck={false}
                            autoCapitalize="off"
                            autoComplete="off"
                            autoCorrect="off"
                        />

                        {/* Autocomplete Popup */}
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

    // ... Layout rendering (Standard, Tri-Pane, Zen) ...
    // Standard: 2 columns (Left is tabs, Right is editor)
    // Tri-Pane: 3 columns (Desc, Sol, Editor)
    // Zen: 1 column (Editor)

    return (
        <div className="flex flex-col h-full w-full bg-white dark:bg-[#0c0c0c] overflow-hidden">
            {renderHeader()}
            
            <div className="flex-1 flex min-h-0 relative">
                
                {/* --- STANDARD MODE --- */}
                {layoutMode === 'standard' && (
                    <>
                        <div className="w-1/2 h-full overflow-hidden border-r border-gray-200 dark:border-gray-800">
                            {activeLeftTab === 'description' ? renderDescription() : renderSolution()}
                        </div>
                        <div className="w-1/2 h-full flex flex-col relative">
                            {renderEditor()}
                        </div>
                    </>
                )}

                {/* --- TRI-PANE MODE --- */}
                {layoutMode === 'tri-pane' && (
                    <>
                        <div className="w-1/3 h-full overflow-hidden border-r border-gray-200 dark:border-gray-800 hidden md:block">
                            {renderDescription()}
                        </div>
                        <div className="w-1/3 h-full overflow-hidden border-r border-gray-200 dark:border-gray-800 hidden md:block">
                            {renderSolution()}
                        </div>
                        {/* Fallback for Mobile: Editor takes full width if space is tight */}
                        <div className="w-full md:w-1/3 h-full flex flex-col relative">
                            {renderEditor()}
                        </div>
                    </>
                )}

                {/* --- ZEN MODE --- */}
                {layoutMode === 'zen' && (
                    <div className="w-full h-full flex flex-col relative">
                        {renderEditor()}
                    </div>
                )}

            </div>

            {/* Bottom Panel (Console) */}
            <div className="h-1/3 min-h-[150px] max-h-[250px] border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] relative shrink-0 flex flex-col">
                <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#161b22]">
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

                <div className="p-2 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2 bg-gray-50 dark:bg-[#161b22]">
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
        </div>
    );
};
