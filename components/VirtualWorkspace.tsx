
import React, { useState, useEffect } from 'react';
import { LeetCodeContext, UserPreferences } from '../types';
import { Play, RotateCcw, Check, AlertTriangle, Terminal, FileText, Code2, Loader2 } from 'lucide-react';
import { validateUserCode } from '../services/geminiService';

// Declare Prism for highlighting
declare const Prism: any;

interface VirtualWorkspaceProps {
    context: LeetCodeContext;
    preferences: UserPreferences;
    onSuccess: () => void;
}

export const VirtualWorkspace: React.FC<VirtualWorkspaceProps> = ({ context, preferences, onSuccess }) => {
    const [activeTab, setActiveTab] = useState<'description' | 'code'>('description');
    const [code, setCode] = useState(context.starterCode);
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<{correct?: boolean, output?: string, feedback?: string, stats?: string} | null>(null);

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
        setActiveTab('code'); // Ensure code tab is visible

        try {
            const res = await validateUserCode(code, context.problem.description, preferences);
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

    return (
        <div className="flex flex-col h-full bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            
            {/* Header / Tabs */}
            <div className="flex items-center justify-between bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-gray-700 px-4 py-2">
                <div className="flex gap-2">
                    <button 
                        onClick={() => setActiveTab('description')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${activeTab === 'description' ? 'bg-white dark:bg-dark-card text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
                    >
                        <FileText size={14}/> Description
                    </button>
                    <button 
                        onClick={() => setActiveTab('code')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${activeTab === 'code' ? 'bg-white dark:bg-dark-card text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
                    >
                        <Code2 size={14}/> Code
                    </button>
                </div>
                <div className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                    context.meta.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                    context.meta.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                }`}>
                    {context.meta.difficulty}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                
                {/* Description Tab */}
                <div className={`absolute inset-0 overflow-y-auto custom-scrollbar p-6 ${activeTab === 'description' ? 'block' : 'hidden'}`}>
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

                {/* Code Tab */}
                <div className={`absolute inset-0 flex flex-col ${activeTab === 'code' ? 'block' : 'hidden'}`}>
                    <div className="flex-1 bg-[#1e1e1e] relative overflow-hidden">
                        <textarea 
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full h-full bg-transparent text-gray-300 font-mono text-sm p-4 outline-none resize-none absolute inset-0 z-10"
                            spellCheck={false}
                        />
                        {/* Simple line numbers visual hack */}
                        <div className="absolute top-4 right-4 pointer-events-none opacity-20">
                            <Code2 size={100}/>
                        </div>
                    </div>

                    {/* Console / Result Area */}
                    <div className="h-1/3 bg-gray-50 dark:bg-dark-bg border-t border-gray-200 dark:border-gray-700 flex flex-col">
                        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 text-xs font-bold text-gray-500">
                            <Terminal size={12}/> Console
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto font-mono text-xs">
                            {isRunning ? (
                                <div className="flex items-center gap-2 text-brand">
                                    <Loader2 size={14} className="animate-spin"/> Running tests...
                                </div>
                            ) : result ? (
                                <div className={result.correct ? "text-green-600" : "text-red-500"}>
                                    <div className="font-bold text-sm mb-1">{result.correct ? "Accepted" : "Wrong Answer"}</div>
                                    {result.stats && <div className="text-gray-400 mb-2">{result.stats}</div>}
                                    {result.feedback && <div className="mb-2 p-2 bg-white dark:bg-dark-card rounded border border-gray-200 dark:border-gray-700">{result.feedback}</div>}
                                    {result.output && <div className="whitespace-pre-wrap opacity-80">Output: {result.output}</div>}
                                </div>
                            ) : (
                                <div className="text-gray-400 italic">Run your code to see output...</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-white dark:bg-dark-card border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button 
                    onClick={() => setCode(context.starterCode)}
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
};
