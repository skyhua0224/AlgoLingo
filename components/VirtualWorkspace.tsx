
import React, { useState, useEffect } from 'react';
import { LeetCodeContext, UserPreferences } from '../types';
import { Play, RotateCcw, Terminal, FileText, Code2, Loader2, Columns, Rows, Layout, CheckCircle, Activity, XCircle, ChevronDown, AlertTriangle } from 'lucide-react';
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

export const VirtualWorkspace: React.FC<VirtualWorkspaceProps> = ({ context, preferences, onSuccess }) => {
    // State: Layout & Language
    const [layoutMode, setLayoutMode] = useState<LayoutMode>('tabs');
    const [currentLanguage, setCurrentLanguage] = useState(preferences.targetLanguage);
    
    // State: Content
    const [activeTab, setActiveTab] = useState<TabView>('description'); // For Tabs Layout
    const [activeConsoleTab, setActiveConsoleTab] = useState<ConsoleTab>('console');
    const [code, setCode] = useState(context.starterCode);
    
    // State: Execution
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<{
        correct?: boolean, 
        output?: string, 
        feedback?: string, 
        stats?: string,
        analysis?: {
            pros: string[],
            cons: string[],
            timeComplexity: string,
            spaceComplexity: string
        }
    } | null>(null);

    // Update code starter if language changes
    useEffect(() => {
        const map = context.starterCodeMap;
        if (map && map[currentLanguage]) {
            setCode(map[currentLanguage]);
        } else if (currentLanguage === preferences.targetLanguage) {
            setCode(context.starterCode);
        } else {
            // Fallback generic
            setCode(`# Write your ${currentLanguage} solution here...\n`);
        }
    }, [currentLanguage, context.starterCode, context.starterCodeMap, preferences.targetLanguage]);

    // Simple auto-indent handler
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.currentTarget.selectionStart;
            const end = e.currentTarget.selectionEnd;
            setCode(code.substring(0, start) + '    ' + code.substring(end));
            // Need a timeout to set cursor position after render
            setTimeout(() => {
                if (e.currentTarget) {
                    e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 4;
                }
            }, 0);
        }
    };

    const handleRun = async () => {
        setIsRunning(true);
        setResult(null);
        
        setActiveConsoleTab('console');

        try {
            const res = await validateUserCode(code, context.problem.description, preferences, currentLanguage);
            setResult(res);
            if (res.correct) {
                onSuccess();
            }
        } catch (e) {
            setResult({ correct: false, output: "System Error", feedback: "Could not connect to Judge AI." });
        } finally {
            setIsRunning(false);
        }
    };

    // --- RENDER HELPERS (INLINED JSX TO PREVENT FOCUS LOSS) ---

    const renderHeader = () => (
        <div className="flex items-center justify-between bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-gray-700 px-4 py-2 shrink-0">
            <div className="flex items-center gap-4">
                {/* Language Switcher */}
                <div className="relative group">
                    <button className="flex items-center gap-2 text-xs font-bold bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-600 px-3 py-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:border-brand">
                        {currentLanguage}
                        <ChevronDown size={14} className="opacity-50"/>
                    </button>
                    <div className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden hidden group-hover:block z-50">
                         {['Python', 'Java', 'C++', 'C', 'JavaScript', 'Go'].map(lang => (
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

                {/* Layout Switcher */}
                <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-lg">
                     <button 
                        onClick={() => setLayoutMode('tabs')}
                        title="Tabbed View"
                        className={`p-1.5 rounded-md transition-all ${layoutMode === 'tabs' ? 'bg-white dark:bg-dark-card text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Layout size={14} />
                     </button>
                     <button 
                        onClick={() => setLayoutMode('split-v')}
                        title="Split Vertical (Left/Right)"
                        className={`p-1.5 rounded-md transition-all ${layoutMode === 'split-v' ? 'bg-white dark:bg-dark-card text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Columns size={14} />
                     </button>
                     <button 
                        onClick={() => setLayoutMode('split-h')}
                        title="Split Horizontal (Top/Bottom)"
                        className={`p-1.5 rounded-md transition-all ${layoutMode === 'split-h' ? 'bg-white dark:bg-dark-card text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Rows size={14} />
                     </button>
                </div>
            </div>

            {/* Tabs (Only visible in Tab Mode) */}
            {layoutMode === 'tabs' && (
                 <div className="flex gap-1 bg-gray-200 dark:bg-gray-800 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('description')}
                        className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-bold transition-colors ${activeTab === 'description' ? 'bg-white dark:bg-dark-card text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <FileText size={12}/> Desc
                    </button>
                    <button 
                        onClick={() => setActiveTab('code')}
                        className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-bold transition-colors ${activeTab === 'code' ? 'bg-white dark:bg-dark-card text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Code2 size={12}/> Code
                    </button>
                </div>
            )}

            <div className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                context.meta.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                context.meta.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
            }`}>
                {context.meta.difficulty}
            </div>
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

                <h3 className="text-sm font-bold uppercase text-gray-400 mt-6 mb-3">Constraints</h3>
                <ul className="list-disc pl-5 space-y-1 text-xs font-mono text-gray-500">
                    {context.problem.constraints.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
            </div>
        </div>
    );

    const renderCodePanel = () => (
        <div className="flex flex-col h-full bg-[#1e1e1e] relative overflow-hidden">
             <div className="absolute top-2 right-4 pointer-events-none opacity-10 z-20">
                <Code2 size={80}/>
            </div>
            <textarea 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-full bg-transparent text-gray-300 font-mono text-sm p-4 outline-none resize-none z-10 relative leading-relaxed"
                spellCheck={false}
            />
        </div>
    );

    const renderBottomPanel = () => (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-dark-bg border-t border-gray-200 dark:border-gray-700">
            {/* Console Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button 
                    onClick={() => setActiveConsoleTab('console')}
                    className={`px-4 py-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${activeConsoleTab === 'console' ? 'border-brand text-brand bg-brand-bg/10' : 'border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                    <Terminal size={12}/> Console
                </button>
                <button 
                    onClick={() => setActiveConsoleTab('analysis')}
                    className={`px-4 py-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${activeConsoleTab === 'analysis' ? 'border-brand text-brand bg-brand-bg/10' : 'border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                    <Activity size={12}/> Analysis {result?.analysis && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                </button>
            </div>

            {/* Console Content */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
                {activeConsoleTab === 'console' ? (
                    <>
                         {isRunning ? (
                            <div className="flex items-center gap-2 text-brand">
                                <Loader2 size={14} className="animate-spin"/> Running tests on {currentLanguage}...
                            </div>
                        ) : result ? (
                            <div className={result.correct ? "text-green-600" : "text-red-500"}>
                                <div className="font-bold text-sm mb-1 flex items-center gap-2">
                                    {result.correct ? <CheckCircle size={16}/> : <XCircle size={16}/>}
                                    {result.correct ? "Accepted" : "Wrong Answer"}
                                </div>
                                {result.stats && <div className="text-gray-400 mb-2">{result.stats}</div>}
                                {result.feedback && <div className="mb-2 p-2 bg-white dark:bg-dark-card rounded border border-gray-200 dark:border-gray-700">{result.feedback}</div>}
                                {result.output && <div className="whitespace-pre-wrap opacity-80 mt-2 p-2 bg-black/5 rounded">Output: {result.output}</div>}
                            </div>
                        ) : (
                            <div className="text-gray-400 italic">Run your code to see output...</div>
                        )}
                    </>
                ) : (
                    // Analysis Tab
                    <div className="space-y-4 text-gray-700 dark:text-gray-300">
                        {!result?.analysis ? (
                            <div className="text-gray-400 italic flex flex-col items-center justify-center pt-4">
                                <Activity size={24} className="mb-2 opacity-50"/>
                                Run your code to get AI Analysis.
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
                                    <ul className="list-disc pl-4 space-y-1">
                                        {result.analysis.pros.map((p, i) => <li key={i}>{p}</li>)}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-bold text-red-500 mb-2 text-xs uppercase flex items-center gap-1"><AlertTriangle size={12}/> Cons / Risks</h4>
                                    <ul className="list-disc pl-4 space-y-1">
                                        {result.analysis.cons.map((c, i) => <li key={i}>{c}</li>)}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-3 bg-white dark:bg-dark-card border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 shrink-0">
                <button 
                    onClick={() => setCode(context.starterCodeMap?.[currentLanguage] || context.starterCode)}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700 text-xs font-bold flex items-center gap-2"
                >
                    <RotateCcw size={14}/> Reset
                </button>
                <button 
                    onClick={handleRun}
                    disabled={isRunning}
                    className={`px-6 py-2 rounded-xl text-sm font-bold text-white flex items-center gap-2 shadow-lg transition-all active:scale-95 ${isRunning ? 'bg-gray-400' : 'bg-brand hover:bg-brand-dark'}`}
                >
                    {isRunning ? <Loader2 size={16} className="animate-spin"/> : <Play size={16} fill="currentColor"/>}
                    Run Code
                </button>
            </div>
        </div>
    );

    // --- Main Render based on Layout ---
    return (
        <div className="flex flex-col h-full bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            {renderHeader()}

            <div className="flex-1 overflow-hidden relative">
                {layoutMode === 'tabs' && (
                    <div className="absolute inset-0 flex flex-col">
                        <div className="flex-1 relative overflow-hidden">
                            {activeTab === 'description' ? renderDescriptionPanel() : renderCodePanel()}
                        </div>
                        <div className="h-1/3 border-t border-gray-200 dark:border-gray-700">
                             {renderBottomPanel()}
                        </div>
                    </div>
                )}

                {layoutMode === 'split-v' && (
                    <div className="flex h-full">
                        <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 overflow-hidden">
                            {renderDescriptionPanel()}
                        </div>
                        <div className="w-1/2 flex flex-col">
                            <div className="flex-1 overflow-hidden">
                                {renderCodePanel()}
                            </div>
                            <div className="h-1/3 min-h-[150px] border-t border-gray-200 dark:border-gray-700">
                                {renderBottomPanel()}
                            </div>
                        </div>
                    </div>
                )}

                {layoutMode === 'split-h' && (
                    <div className="flex flex-col h-full">
                         <div className="h-1/2 border-b border-gray-200 dark:border-gray-700 overflow-hidden">
                            {renderDescriptionPanel()}
                        </div>
                        <div className="h-1/2 flex flex-col">
                            <div className="flex-1 flex border-b border-gray-200 dark:border-gray-700">
                                <div className="w-1/2 border-r border-gray-200 dark:border-gray-700">
                                    {renderCodePanel()}
                                </div>
                                <div className="w-1/2">
                                     {renderBottomPanel()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
