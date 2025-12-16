
import React, { useState } from 'react';
import { CheckCircle, XCircle, Play, Loader2, Flag, Terminal, Stethoscope, Check } from 'lucide-react';
import { UserPreferences } from '../../types';

interface ConsolePanelProps {
    result: any; // ExecutionResult
    isRunning: boolean;
    onRun: () => void;
    onSubmit: () => void;
    onDrill?: () => void; 
    code: string;
    language: string;
    preferences: UserPreferences;
    onRecordMistake: (context: string) => void;
    isZh: boolean;
}

export const ConsolePanel: React.FC<ConsolePanelProps> = ({ 
    result, isRunning, onRun, onSubmit, isZh 
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = () => {
        setIsSubmitting(true);
        // Simulate a brief submission process for feedback
        setTimeout(() => {
            onSubmit();
            setIsSubmitting(false); // Clean up though component might unmount
        }, 800);
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#111]">
            {/* Tabs (Visual Only now, effectively) */}
            <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#161b22] shrink-0">
                <button className="px-4 py-2 text-xs font-bold border-b-2 border-brand text-brand bg-white dark:bg-[#111] transition-all">
                    Console
                </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto relative custom-scrollbar">
                <div className="p-4 font-mono text-xs h-full flex flex-col">
                    {isRunning ? <div className="flex items-center gap-2 text-gray-500 mt-4 justify-center"><Loader2 size={16} className="animate-spin"/> Running test cases...</div> :
                    result ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                                <div className={`text-lg font-black flex items-center gap-2 ${result.status === 'Accepted' ? 'text-green-500' : 'text-red-500'}`}>
                                    {result.status === 'Accepted' ? <CheckCircle size={20}/> : <XCircle size={20}/>}
                                    {result.status}
                                </div>
                                
                                {/* Link to Diagnosis if Failed */}
                                {result.status !== 'Accepted' && (
                                    <div className="text-xs text-red-500 flex items-center gap-1 animate-pulse">
                                        <Stethoscope size={14} />
                                        {isZh ? "诊断报告已生成 (见左侧)" : "Diagnosis Generated (See Left)"}
                                    </div>
                                )}
                                
                                {result.status === 'Accepted' && (
                                    <div className="text-xs text-green-500 flex items-center gap-1 animate-pulse">
                                        <Stethoscope size={14} />
                                        {isZh ? "分析报告已生成 (见左侧)" : "Analysis Generated (See Left)"}
                                    </div>
                                )}
                            </div>

                            {result.error_message && <pre className="text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/10 p-3 rounded-xl whitespace-pre-wrap border border-red-100 dark:border-red-900/30 font-medium">{result.error_message}</pre>}
                            
                            <div className="space-y-2">
                                {result.test_cases?.map((tc: any, i: number) => (
                                    <div key={i} className={`p-3 rounded-xl border shadow-sm transition-all ${tc.passed ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700' : 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30'}`}>
                                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                                            <span className="font-bold text-gray-500">Case {i+1}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${tc.passed ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>{tc.passed ? 'PASS' : 'FAIL'}</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 text-gray-600 dark:text-gray-400">
                                            <div className="flex gap-2">
                                                <span className="w-12 shrink-0 font-bold text-gray-400 text-right">In:</span> 
                                                <code className="font-medium bg-gray-100 dark:bg-gray-800 px-1 rounded flex-1">{tc.input}</code>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="w-12 shrink-0 font-bold text-gray-400 text-right">Exp:</span> 
                                                <code className="font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10 px-1 rounded flex-1">{tc.expected}</code>
                                            </div>
                                            {!tc.passed && (
                                                <div className="flex gap-2">
                                                    <span className="w-12 shrink-0 font-bold text-gray-400 text-right">Out:</span> 
                                                    <code className="font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 px-1 rounded flex-1">{tc.actual}</code>
                                                </div>
                                            )}
                                            {tc.stdout && (
                                                <div className="flex gap-2 mt-1">
                                                    <span className="w-12 shrink-0 font-bold text-gray-400 text-right">Log:</span>
                                                    <code className="text-gray-500 italic bg-gray-50 dark:bg-black/20 px-1 rounded flex-1">{tc.stdout}</code>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : <div className="text-gray-400 italic flex flex-col items-center justify-center h-full gap-2 opacity-50"><Terminal size={32}/> {isZh ? "点击运行查看结果..." : "Run code to see output..."}</div>
                    }
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-[#161b22] shrink-0">
                <button onClick={onRun} disabled={isRunning || isSubmitting} className="px-6 py-2.5 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand-dark flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-brand/20 transition-all active:scale-95">
                    {isRunning ? <Loader2 size={16} className="animate-spin"/> : <Play size={16} fill="currentColor"/>} Run Code
                </button>
                {result?.status === "Accepted" && (
                    <button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-green-500/20 active:scale-95 transition-all ${isSubmitting ? 'bg-green-600 text-white cursor-wait' : 'bg-green-500 text-white hover:bg-green-600 animate-pulse'}`}
                    >
                        {isSubmitting ? <Check size={16}/> : <Flag size={16} fill="currentColor"/>} 
                        {isSubmitting ? (isZh ? "提交中..." : "Submitting...") : (isZh ? "提交通过" : "Submit")}
                    </button>
                )}
            </div>
        </div>
    );
};
