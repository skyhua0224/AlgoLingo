
import React, { useRef, useEffect, useState } from 'react';
import { Terminal, ChevronDown, ChevronUp, Cpu } from 'lucide-react';

interface ChainOfThoughtProps {
    visible: boolean;
    onToggle: () => void;
    logs: string[];
    isChinese: boolean;
    progress: number;
}

export const ChainOfThought: React.FC<ChainOfThoughtProps> = ({ visible, onToggle, logs, isChinese, progress }) => {
    const logsEndRef = useRef<HTMLDivElement>(null);
    
    // Auto-scroll logs
    useEffect(() => {
        if (visible && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, visible]);

    // Analyze the last log to simulate "current page" awareness
    // In a real stream, we would parse the JSON chunk. Here we simulate based on progress/logs.
    const lastLog = logs[logs.length - 1] || "";
    const isGeneratingCode = lastLog.includes("Code") || lastLog.includes("代码");
    const isGeneratingStructure = lastLog.includes("Structure") || lastLog.includes("JSON") || lastLog.includes("结构");

    return (
        <div className="flex flex-col items-center w-full max-w-md relative z-20">
            <button 
                onClick={onToggle}
                className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-white/80 dark:bg-dark-card/80 px-4 py-2 rounded-full shadow-sm border border-gray-200 dark:border-gray-700 backdrop-blur-sm"
            >
                <Terminal size={14} />
                {visible 
                    ? (isChinese ? "隐藏思维链" : "Hide Chain-of-Thought") 
                    : (isChinese ? "查看 AI 思维链" : "View AI Chain-of-Thought")
                }
                {visible ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {visible && (
                <div className="w-full mt-4 bg-[#0d1117] rounded-xl overflow-hidden shadow-2xl border border-gray-800 font-mono text-xs flex flex-col animate-scale-in transition-all duration-300 relative">
                    {/* Fake Header */}
                    <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-gray-800">
                        <div className="flex items-center gap-2 text-gray-500">
                            <Cpu size={12} />
                            <span className="text-[10px] font-bold">GEMINI-CORE-PROCESS</span>
                        </div>
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"/>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"/>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"/>
                        </div>
                    </div>

                    {/* Active Activity Indicator */}
                    <div className="px-4 py-2 border-b border-gray-800/50 bg-[#161b22]/50 flex justify-between items-center">
                         <div className="flex items-center gap-2">
                             <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-green-400 font-bold truncate max-w-[200px]">
                                {isGeneratingCode ? "Synthesizing Python..." : (isGeneratingStructure ? "Constructing Graph..." : "Reasoning...")}
                            </span>
                         </div>
                         <span className="text-gray-600 font-mono">{Math.floor(progress)}%</span>
                    </div>

                    {/* Logs Area */}
                    <div className="h-64 overflow-y-auto custom-scrollbar p-4 space-y-1.5">
                        {logs.map((log, i) => {
                            // Syntax highlighting simulation
                            let color = "text-gray-400";
                            if (log.includes("[GEMINI]")) color = "text-blue-400 font-bold";
                            else if (log.includes("[SYSTEM]")) color = "text-purple-400";
                            else if (log.includes("ERROR")) color = "text-red-400";
                            else if (log.includes("Code")) color = "text-yellow-400";

                            return (
                                <div key={i} className={`flex gap-2 ${color} opacity-90 hover:opacity-100 transition-opacity`}>
                                    <span className="text-gray-700 shrink-0 select-none">
                                        {new Date().toLocaleTimeString('en-US', {hour12: false}).split(' ')[0]}
                                    </span>
                                    <span className="break-all">{log}</span>
                                </div>
                            );
                        })}
                        <div ref={logsEndRef} />
                        
                        {/* Cursor */}
                        <div className="animate-pulse flex items-center gap-1 mt-2">
                            <span className="text-brand font-bold">{'>'}</span>
                            <span className="w-2 h-4 bg-brand block"></span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
