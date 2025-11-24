
import React, { useState, useEffect, useRef } from 'react';
import { Widget } from '../../../types';
import { BaseWidget } from '../BaseWidget';
import { Terminal as TerminalIcon } from 'lucide-react';

interface TerminalProps {
    widget: Widget;
    status?: string;
}

export const TerminalWidget: React.FC<TerminalProps> = ({ widget, status }) => {
    if (!widget.terminal) return null;
    const { initialOutput, command: expectedCmdRegex, feedback, hint } = widget.terminal;
    
    const [history, setHistory] = useState<string[]>(initialOutput ? [initialOutput] : []);
    const [input, setInput] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (!input.trim()) return;
            
            const newHistory = [...history, `user@algolingo:~$ ${input}`];
            
            const regex = new RegExp(expectedCmdRegex, 'i');
            if (regex.test(input)) {
                newHistory.push(feedback);
                setIsSuccess(true);
            } else {
                newHistory.push(`bash: command not found: ${input.split(' ')[0]} (Try: ${hint || 'something else'})`);
            }
            
            setHistory(newHistory);
            setInput('');
        }
    };

    return (
        <BaseWidget>
            <div className="bg-[#1e1e1e] rounded-xl border border-gray-700 overflow-hidden shadow-2xl font-mono text-sm">
                <div className="bg-[#2d2d2d] px-4 py-2 flex items-center gap-2 border-b border-gray-700">
                    <TerminalIcon size={14} className="text-gray-400"/>
                    <span className="text-gray-400 text-xs font-bold">Terminal</span>
                </div>
                <div className="p-4 h-64 overflow-y-auto custom-scrollbar text-gray-300 space-y-1" onClick={() => document.getElementById('term-input')?.focus()}>
                    {history.map((line, i) => (
                        <div key={i} className="whitespace-pre-wrap break-all">{line}</div>
                    ))}
                    
                    {!isSuccess && (
                        <div className="flex items-center gap-2 text-brand-light">
                            <span className="text-green-500">user@algolingo:~$</span>
                            <input 
                                id="term-input"
                                className="bg-transparent outline-none flex-1 text-white caret-white"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                autoComplete="off"
                            />
                        </div>
                    )}
                    <div ref={bottomRef}></div>
                </div>
            </div>
        </BaseWidget>
    );
};
