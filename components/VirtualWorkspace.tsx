import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LeetCodeContext, UserPreferences } from '../types';
import { Play, RotateCcw, Terminal, Activity, CheckCircle, XCircle, ChevronDown, AlertTriangle, FileText, Code2, Layout, Columns, Rows, Loader2, Box, Check, X, Clock, Cpu } from 'lucide-react';
import { validateUserCode } from '../services/geminiService';

// Declare Prism for highlighting
declare const Prism: any;

interface VirtualWorkspaceProps {
    context: LeetCodeContext;
    preferences: UserPreferences;
    onSuccess: () => void;
}

type LayoutMode = 'tabs' | 'split-v' | 'split-h';
type ConsoleTab = 'console' | 'analysis';
type TabView = 'description' | 'code';

// Type definition for the structured result from Gemini
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

// --- AUTOCOMPLETE SNIPPETS ---
const SNIPPETS: Record<string, { label: string; detail: string; insert: string }[]> = {
    Python: [
        { label: 'for', detail: 'Loop range', insert: 'for i in range(n):\n    ' },
        { label: 'def', detail: 'Function', insert: 'def function_name(args):\n    ' },
        { label: 'if', detail: 'Condition', insert: 'if condition:\n    ' },
        { label: 'elif', detail: 'Else If', insert: 'elif condition:\n    ' },
        { label: 'else', detail: 'Else', insert: 'else:\n    ' },
        { label: 'class', detail: 'Class', insert: 'class ClassName:\n    def __init__(self):\n        ' },
        { label: 'print', detail: 'Print', insert: 'print()' },
        { label: 'while', detail: 'While Loop', insert: 'while condition:\n    ' },
        { label: 'return', detail: 'Return', insert: 'return ' },
        { label: 'import', detail: 'Import', insert: 'import ' },
    ],
    Java: [
        { label: 'for', detail: 'For Loop', insert: 'for (int i = 0; i < n; i++) {\n    \n}' },
        { label: 'public', detail: 'Public', insert: 'public ' },
        { label: 'class', detail: 'Class', insert: 'class ClassName {\n    \n}' },
        { label: 'void', detail: 'Void', insert: 'void ' },
        { label: 'System.out', detail: 'Print', insert: 'System.out.println();' },
        { label: 'if', detail: 'Condition', insert: 'if (condition) {\n    \n}' },
    ],
    "C++": [
        { label: 'for', detail: 'For Loop', insert: 'for (int i = 0; i < n; i++) {\n    \n}' },
        { label: 'include', detail: 'Include', insert: '#include <vector>' },
        { label: 'vector', detail: 'Vector', insert: 'vector<int> v;' },
        { label: 'cout', detail: 'Print', insert: 'cout << "text" << endl;' },
        { label: 'auto', detail: 'Auto', insert: 'auto ' },
    ],
    JavaScript: [
        { label: 'function', detail: 'Function', insert: 'function name(args) {\n    \n}' },
        { label: 'const', detail: 'Constant', insert: 'const ' },
        { label: 'let', detail: 'Variable', insert: 'let ' },
        { label: 'console.log', detail: 'Log', insert: 'console.log();' },
        { label: 'for', detail: 'Loop', insert: 'for (let i = 0; i < n; i++) {\n    \n}' },
        { label: 'map', detail: 'Map', insert: '.map((item) => )' },
    ]
};

export const VirtualWorkspace: React.FC<VirtualWorkspaceProps> = ({ context, preferences, onSuccess }) => {
    // State: Layout & Language
    const [layoutMode, setLayoutMode] = useState<LayoutMode>('tabs');
    const [currentLanguage, setCurrentLanguage] = useState(preferences.targetLanguage);
    
    // State: Content
    const [activeTab, setActiveTab] = useState<TabView>('description'); 
    const [activeConsoleTab, setActiveConsoleTab] = useState<ConsoleTab>('console');
    const [selectedTestCaseIndex, setSelectedTestCaseIndex] = useState(0);
    const [code, setCode] = useState(context.starterCode);
    
    // State: Execution
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<ExecutionResult | null>(null);

    // --- EDITOR STATE ---
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const preRef = useRef<HTMLPreElement>(null);
    const [suggestions, setSuggestions] = useState<{ label: string; detail: string; insert: string }[]>([]);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });

    // Update starter code
    useEffect(() => {
        const map = context.starterCodeMap;
        if (map && map[currentLanguage]) {
            setCode(map[currentLanguage]);
        } else if (currentLanguage === preferences.targetLanguage) {
            setCode(context.starterCode);
        } else {
            setCode(`# Write your ${currentLanguage} solution here...\n`);
        }
    }, [currentLanguage, context.starterCode, context.starterCodeMap, preferences.targetLanguage]);

    // --- EDITOR LOGIC ---

    // Sync scrolling between textarea and pre (highlighter)
    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (preRef.current) {
            preRef.current.scrollTop = e.currentTarget.scrollTop;
            preRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }
    };

    // Autocomplete Logic
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
                
                // Calculate popup position (approximate based on lines/chars)
                // A real implementation would measure spans, but for this single-file strictness, we estimate
                const lines = textBeforeCursor.split('\n');
                const lineIndex = lines.length - 1;
                const charIndex = lines[lineIndex].length;
                
                // Base line height ~ 24px, char width ~ 8.5px (monospace 14px)
                // Adjust based on your CSS values
                setSuggestionPosition({
                    top: (lineIndex + 1) * 24, 
                    left: (charIndex * 8.5) + 40 // +40 for gutter
                });
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
        
        // Move cursor
        const newCursorPos = before.length + suggestion.insert.length;
        setTimeout(() => {
            if(textareaRef.current) {
                textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newCursorPos;
                textareaRef.current.focus();
            }
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // 1. Handle Suggestions Navigation
        if (suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedSuggestionIndex(prev => (prev + 1) % suggestions.length);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
                return;
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                insertSuggestion(suggestions[selectedSuggestionIndex]);
                return;
            }
            if (e.key === 'Escape') {
                setSuggestions([]);
                return;
            }
        }

        // 2. Handle Indentation (Tab)
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.currentTarget.selectionStart;
            const end = e.currentTarget.selectionEnd;
            const val = e.currentTarget.value;
            setCode(val.substring(0, start) + '    ' + val.substring(end));
            setTimeout(() => {
                e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 4;
            }, 0);
            return;
        }

        // 3. Handle Auto-Indent on Enter
        if (e.key === 'Enter') {
            const start = e.currentTarget.selectionStart;
            const val = e.currentTarget.value;
            
            // Get current line indentation
            const currentLineStart = val.lastIndexOf('\n', start - 1) + 1;
            const currentLine = val.substring(currentLineStart, start);
            const indentMatch = currentLine.match(/^\s*/);
            const indent = indentMatch ? indentMatch[0] : '';
            
            // Check if previous line ended with colon (Python) or { (Java/C++)
            const trimmedLine = currentLine.trim();
            const extraIndent = (trimmedLine.endsWith(':') || trimmedLine.endsWith('{')) ? '    ' : '';
            
            const insertion = '\n' + indent + extraIndent;
            
            e.preventDefault();
            const newCode = val.substring(0, start) + insertion + val.substring(start);
            setCode(newCode);
            
            setTimeout(() => {
                e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + insertion.length;
                updateSuggestions(newCode, start + insertion.length);
            }, 0);
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
        setSelectedTestCaseIndex(0); // Reset selected tab

        try {
            const res = await validateUserCode(code, context.problem.description, preferences, currentLanguage);
            setResult(res);
            if (res.status === "Accepted") {
                onSuccess();
            }
        } catch (e) {
            // Fallback error
            setResult({ 
                status: "Runtime Error", 
                error_message: "System Error: Could not connect to Judge AI.", 
                test_cases: [],
                stats: { runtime: "0ms", memory: "0MB", percentile: "0%" },
                analysis: { pros: [], cons: [], timeComplexity: "", spaceComplexity: "" }
            });
        } finally {
            setIsRunning(false);
        }
    };

    // --- RENDERERS ---

    const renderHeader = () => (
        <div className="flex items-center justify-between bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-gray-700 px-4 py-2 shrink-0 z-20 relative">
            <div className="flex items-center gap-4">
                <div className="relative group">
                    <button className="flex items-center gap-2 text-xs font-bold bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-600 px-3 py-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:border-brand">
                        {currentLanguage}
                        <ChevronDown size={14} className="opacity-50"/>
                    </button>
                    <div className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden hidden group-hover:block z-50">
                         {Object.keys(context.starterCodeMap || { 'Python': '' }).map(lang => (
                             <button 
                                key={lang}
                                onClick={() => setCurrentLanguage(lang as any)}
                                className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800 ${currentLanguage === lang ? 'text-brand' : 'text-gray-600 dark:text-gray-400'}`}
                             >
                                 {lang}
                             </button>
                         ))}
                    </div>
                </div>

                <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-lg">
                     <button onClick={() => setLayoutMode('tabs')} className={`p-1.5 rounded-md transition-all ${layoutMode === 'tabs' ? 'bg-white dark:bg-dark-card text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Layout size={14} /></button>
                     <button onClick={() => setLayoutMode('split-v')} className={`p-1.5 rounded-md transition-all ${layoutMode === 'split-v' ? 'bg-white dark:bg-dark-card text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Columns size={14} /></button>
                     <button onClick={() => setLayoutMode('split-h')} className={`p-1.5 rounded-md transition-all ${layoutMode === 'split-h' ? 'bg-white dark:bg-dark-card text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Rows size={14} /></button>
                </div>
            </div>

            {layoutMode === 'tabs' && (
                 <div className="flex gap-1 bg-gray-200 dark:bg-gray-800 p-1 rounded-lg">
                    <button onClick={() => setActiveTab('description')} className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-bold transition-colors ${activeTab === 'description' ? 'bg-white dark:bg-dark-card text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><FileText size={12}/> Desc</button>
                    <button onClick={() => setActiveTab('code')} className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-bold transition-colors ${activeTab === 'code' ? 'bg-white dark:bg-dark-card text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Code2 size={12}/> Code</button>
                </div>
            )}
        </div>
    );

    const renderDescriptionPanel = () => (
        <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-white dark:bg-dark-card">
            <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white mb-4">{context.meta.title}</h2>
            <div className="prose dark:prose-invert prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                    {context.problem.description}
                </div>
                
                <h3 className="text-sm font-bold uppercase text-gray-400 mt-6 mb-3">Examples</h3>
                <div className="space-y-4">
                    {context.problem.examples.map((ex, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-dark-bg p-4 rounded-xl border border-gray-100 dark:border-gray-700 font-mono text-xs">
                            <div className="mb-1"><span className="font-bold text-gray-500">Input:</span> {ex.input}</div>
                            <div className="mb-1"><span className="font-bold text-gray-500">Output:</span> {ex.output}</div>
                            {ex.explanation && <div><span className="font-bold text-gray-500">Explanation:</span> {ex.explanation}</div>}
                        </div>
                    ))}
                </div>
                
                {context.problem.constraints && (
                    <>
                        <h3 className="text-sm font-bold uppercase text-gray-400 mt-6 mb-3">Constraints</h3>
                        <ul className="list-disc pl-5 space-y-1 text-xs font-mono text-gray-500">
                            {context.problem.constraints.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                    </>
                )}
            </div>
        </div>
    );

    const renderCodePanel = () => {
        const lines = code.split('\n');
        return (
            <div className="flex flex-col h-full bg-[#1e1e1e] relative">
                {/* Line Numbers */}
                <div className="flex-1 flex relative overflow-hidden">
                    <div className="w-10 bg-[#1e1e1e] border-r border-gray-700 text-right pr-2 pt-4 text-gray-600 font-mono text-[14px] leading-[1.5] select-none overflow-hidden shrink-0 z-10">
                        {lines.map((_, i) => (
                            <div key={i} style={{height: '21px'}}>{i + 1}</div>
                        ))}
                    </div>

                    {/* Editor Area */}
                    <div className="relative flex-1 overflow-hidden">
                        {/* Highlighting Layer */}
                        <pre
                            ref={preRef}
                            aria-hidden="true"
                            className="absolute inset-0 m-0 p-4 font-mono text-[14px] leading-[1.5] bg-transparent pointer-events-none z-0 overflow-auto whitespace-pre tab-4"
                        >
                            <code 
                                className={`language-${currentLanguage.toLowerCase().replace('++', 'cpp')}`}
                                dangerouslySetInnerHTML={{
                                    __html: typeof Prism !== 'undefined' 
                                        ? Prism.highlight(code, Prism.languages[currentLanguage.toLowerCase().replace('++', 'cpp')] || Prism.languages.python, currentLanguage.toLowerCase())
                                        : code
                                }}
                            />
                            <br /> 
                        </pre>

                        {/* Input Layer */}
                        <textarea 
                            ref={textareaRef}
                            value={code}
                            onChange={handleCodeChange}
                            onKeyDown={handleKeyDown}
                            onScroll={handleScroll}
                            className="absolute inset-0 w-full h-full m-0 p-4 font-mono text-[14px] leading-[1.5] bg-transparent text-transparent caret-white resize-none outline-none z-10 whitespace-pre overflow-auto tab-4"
                            spellCheck={false}
                            autoCapitalize="off"
                            autoComplete="off"
                            autoCorrect="off"
                        />

                        {/* Autocomplete Dropdown */}
                        {suggestions.length > 0 && (
                            <div 
                                className="absolute z-50 w-64 bg-[#252526] border border-[#454545] shadow-2xl rounded-md overflow-hidden flex flex-col"
                                style={{
                                    top: Math.min(suggestionPosition.top + 24, 300), 
                                    left: Math.min(suggestionPosition.left, 400) 
                                }}
                            >
                                {suggestions.map((s, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => insertSuggestion(s)}
                                        className={`flex items-center justify-between px-3 py-1.5 text-xs font-mono border-l-2 text-left ${idx === selectedSuggestionIndex ? 'bg-[#094771] text-white border-[#007acc]' : 'text-gray-300 border-transparent hover:bg-[#2a2d2e]'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Box size={12} className="text-blue-400"/>
                                            <span className="font-bold">{s.label}</span>
                                        </div>
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

    // --- NEW CONSOLE RENDERER ---
    const renderConsole = () => {
        if (isRunning) {
             return (
                 <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
                     <Loader2 size={32} className="animate-spin text-brand"/>
                     <p className="font-bold text-sm">Running Tests...</p>
                 </div>
             );
        }

        if (!result) {
             return (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                    <Terminal size={32} className="opacity-30"/>
                    <p className="text-xs font-bold italic">Run code to see output</p>
                </div>
             );
        }

        // Case: Compilation Error
        if (result.status === "Compile Error") {
            return (
                <div className="h-full flex flex-col p-4">
                    <div className="text-red-500 font-bold text-lg mb-2 flex items-center gap-2">
                        <XCircle size={20}/> Compile Error
                    </div>
                    <div className="bg-[#2b1d1d] border border-red-900/50 p-4 rounded-lg flex-1 overflow-auto custom-scrollbar">
                         <pre className="text-red-400 font-mono text-xs whitespace-pre-wrap">
                             {result.error_message}
                         </pre>
                    </div>
                </div>
            );
        }

        // Case: Accepted / Wrong Answer / Runtime Error
        const isAccepted = result.status === "Accepted";
        const statusColor = isAccepted ? "text-green-500" : "text-red-500";
        const StatusIcon = isAccepted ? CheckCircle : XCircle;
        const selectedCase = result.test_cases[selectedTestCaseIndex];

        return (
            <div className="h-full flex flex-col p-4 overflow-hidden">
                {/* Status Header */}
                <div className={`font-extrabold text-xl mb-4 flex items-center gap-2 ${statusColor}`}>
                    <StatusIcon size={24}/>
                    {result.status}
                    {result.total_correct !== undefined && (
                        <span className="text-sm font-mono bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-1 rounded ml-2">
                            {result.total_correct}/{result.total_testcases} testcases passed
                        </span>
                    )}
                </div>
                
                {/* Test Case Tabs */}
                <div className="flex gap-2 mb-4 overflow-x-auto">
                    {result.test_cases.map((testCase, i) => (
                        <button 
                            key={i}
                            onClick={() => setSelectedTestCaseIndex(i)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-2 ${selectedTestCaseIndex === i 
                                ? 'bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-500 text-gray-900 dark:text-white' 
                                : 'bg-transparent border-gray-200 dark:border-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                        >
                            Case {i + 1}
                            {testCase.passed ? <Check size={12} className="text-green-500"/> : <X size={12} className="text-red-500"/>}
                        </button>
                    ))}
                </div>

                {/* Selected Case Details */}
                {selectedCase && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 font-mono text-xs">
                        <div>
                            <div className="text-gray-400 font-bold mb-1">Input</div>
                            <div className="bg-gray-100 dark:bg-[#1e1e1e] p-3 rounded-lg text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                {selectedCase.input}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-gray-400 font-bold mb-1">Output</div>
                                <div className={`p-3 rounded-lg border ${selectedCase.passed ? 'bg-gray-100 dark:bg-[#1e1e1e] text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900 text-red-800 dark:text-red-200'}`}>
                                    {selectedCase.actual || <span className="opacity-50 italic">null</span>}
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-400 font-bold mb-1">Expected</div>
                                <div className="bg-gray-100 dark:bg-[#1e1e1e] p-3 rounded-lg text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                    {selectedCase.expected}
                                </div>
                            </div>
                        </div>

                        {selectedCase.stdout && (
                            <div>
                                <div className="text-gray-400 font-bold mb-1">Stdout</div>
                                <div className="bg-black/5 dark:bg-black/30 p-3 rounded-lg text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 whitespace-pre-wrap">
                                    {selectedCase.stdout}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Runtime Stats */}
                {result.stats && isAccepted && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-6">
                         <div className="flex items-center gap-2 text-xs">
                             <Clock size={14} className="text-gray-400"/>
                             <span className="font-bold text-gray-800 dark:text-white">{result.stats.runtime}</span>
                         </div>
                         <div className="flex items-center gap-2 text-xs">
                             <Cpu size={14} className="text-gray-400"/>
                             <span className="font-bold text-gray-800 dark:text-white">{result.stats.memory}</span>
                         </div>
                         <div className="text-xs text-brand font-bold">
                             {result.stats.percentile}
                         </div>
                    </div>
                )}
            </div>
        );
    };

    const renderBottomPanel = () => (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-dark-bg border-t border-gray-200 dark:border-gray-700">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button onClick={() => setActiveConsoleTab('console')} className={`px-4 py-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${activeConsoleTab === 'console' ? 'border-brand text-brand bg-brand-bg/10' : 'border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}><Terminal size={12}/> Console</button>
                <button onClick={() => setActiveConsoleTab('analysis')} className={`px-4 py-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${activeConsoleTab === 'analysis' ? 'border-brand text-brand bg-brand-bg/10' : 'border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}><Activity size={12}/> Analysis {result?.analysis && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}</button>
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-xs">
                {activeConsoleTab === 'console' ? (
                    renderConsole()
                ) : (
                    <div className="p-4 space-y-4 text-gray-700 dark:text-gray-300">
                        {!result?.analysis ? (
                            <div className="text-gray-400 italic flex flex-col items-center justify-center pt-12 h-full">
                                <Activity size={32} className="mb-2 opacity-30"/>
                                <p>Run your code to get detailed AI Analysis.</p>
                            </div>
                        ) : (
                            <div className="animate-fade-in-up">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-white dark:bg-dark-card p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <h4 className="font-bold text-xs uppercase text-gray-400 mb-1">Time Complexity</h4>
                                        <div className="text-sm font-bold text-brand">{result.analysis.timeComplexity}</div>
                                    </div>
                                    <div className="bg-white dark:bg-dark-card p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <h4 className="font-bold text-xs uppercase text-gray-400 mb-1">Space Complexity</h4>
                                        <div className="text-sm font-bold text-purple-500">{result.analysis.spaceComplexity}</div>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <h4 className="font-bold text-green-600 mb-2 text-xs uppercase flex items-center gap-1"><CheckCircle size={12}/> Pros</h4>
                                    <ul className="list-disc pl-4 space-y-1">{result.analysis.pros.map((p, i) => <li key={i}>{p}</li>)}</ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-red-500 mb-2 text-xs uppercase flex items-center gap-1"><AlertTriangle size={12}/> Cons / Risks</h4>
                                    <ul className="list-disc pl-4 space-y-1">{result.analysis.cons.map((c, i) => <li key={i}>{c}</li>)}</ul>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="p-3 bg-white dark:bg-dark-card border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 shrink-0">
                <button onClick={() => setCode(context.starterCodeMap?.[currentLanguage] || context.starterCode)} className="px-4 py-2 text-gray-500 hover:text-gray-700 text-xs font-bold flex items-center gap-2"><RotateCcw size={14}/> Reset</button>
                <button onClick={handleRun} disabled={isRunning} className={`px-6 py-2 rounded-xl text-sm font-bold text-white flex items-center gap-2 shadow-lg transition-all active:scale-95 ${isRunning ? 'bg-gray-400' : 'bg-brand hover:bg-brand-dark'}`}>{isRunning ? <Loader2 size={16} className="animate-spin"/> : <Play size={16} fill="currentColor"/>} Run Code</button>
            </div>
        </div>
    );

    // --- Main Render ---
    return (
        <div className="flex flex-col h-full bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            {renderHeader()}
            <div className="flex-1 overflow-hidden relative">
                {layoutMode === 'tabs' && (
                    <div className="absolute inset-0 flex flex-col">
                        <div className="flex-1 relative overflow-hidden">
                            {activeTab === 'description' ? renderDescriptionPanel() : renderCodePanel()}
                        </div>
                        <div className="h-1/3 min-h-[250px] border-t border-gray-200 dark:border-gray-700">{renderBottomPanel()}</div>
                    </div>
                )}
                {layoutMode === 'split-v' && (
                    <div className="flex h-full">
                        <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 overflow-hidden">{renderDescriptionPanel()}</div>
                        <div className="w-1/2 flex flex-col">
                            <div className="flex-1 overflow-hidden">{renderCodePanel()}</div>
                            <div className="h-1/3 min-h-[250px] border-t border-gray-200 dark:border-gray-700">{renderBottomPanel()}</div>
                        </div>
                    </div>
                )}
                {layoutMode === 'split-h' && (
                    <div className="flex flex-col h-full">
                         <div className="h-1/2 border-b border-gray-200 dark:border-gray-700 overflow-hidden">{renderDescriptionPanel()}</div>
                        <div className="h-1/2 flex flex-col">
                            <div className="flex-1 flex border-b border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="w-1/2 border-r border-gray-200 dark:border-gray-700">{renderCodePanel()}</div>
                                <div className="w-1/2 h-full overflow-hidden">{renderBottomPanel()}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};