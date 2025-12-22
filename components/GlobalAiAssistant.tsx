
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Bot, Send, X, Maximize2, Minimize2, Sparkles, Loader2, Lightbulb, MessageSquare, FileJson, Copy, Check } from 'lucide-react';
import { UserPreferences, LessonPlan } from '../types';
import { generateAiAssistance } from '../services/geminiService';
import { MarkdownText } from './common/MarkdownText';

interface GlobalAiAssistantProps {
    problemName?: string;
    preferences: UserPreferences;
    language: 'Chinese' | 'English';
    currentPlan?: LessonPlan | null; // Added plan prop for debugging
}

// Helper to safely stringify JSON while truncating long strings (e.g. Base64 Images)
const safeStringify = (obj: any) => {
    return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'string' && value.length > 200 && (value.startsWith('data:image') || key === 'headerImage')) {
            return `<Base64 Image Truncated: ${value.length} chars>`;
        }
        return value;
    }, 2);
};

export const GlobalAiAssistant: React.FC<GlobalAiAssistantProps> = ({ problemName, preferences, language, currentPlan }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showDebug, setShowDebug] = useState(false);
    const [copied, setCopied] = useState(false);
    
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
        { role: 'ai', text: language === 'Chinese' ? "我是你的 AI 助教。有什么关于算法的问题吗？" : "I'm your AI Tutor. Any questions about algorithms?" }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Generate context-aware suggestions
    const suggestions = useMemo(() => {
        const isZh = language === 'Chinese';
        const targetLang = preferences.targetLanguage;
        
        if (problemName) {
            return isZh ? [
                `解释一下 ${problemName} 的核心思路`,
                `${problemName} 的时间复杂度是多少？`,
                `给我一个 ${targetLang} 的代码示例`,
                `这道题有什么常见的“坑”？`,
                `如何优化空间复杂度？`
            ] : [
                `Explain the concept of ${problemName}`,
                `What is the time complexity of ${problemName}?`,
                `Show me a ${targetLang} code example`,
                `Common pitfalls for ${problemName}?`,
                `How to optimize space complexity?`
            ];
        }
        
        return isZh ? [
            "什么是时间复杂度 (Big O)？",
            "哈希表是如何工作的？",
            "递归和迭代有什么区别？",
            "如何高效刷 LeetCode？"
        ] : [
            "What is Big O notation?",
            "How does a Hash Map work?",
            "Recursion vs Iteration",
            "Tips for LeetCode?"
        ];
    }, [problemName, language, preferences.targetLanguage]);

    useEffect(() => {
        if (isOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const handleSend = async (textOverride?: string) => {
        const userMsg = textOverride || input;
        if (!userMsg.trim()) return;
        
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        try {
            const context = `Current Lesson: ${problemName || "General Algorithm Study"}. User Language: ${preferences.targetLanguage}.`;
            const response = await generateAiAssistance(context, userMsg, preferences, preferences.apiConfig.gemini.model);
            setMessages(prev => [...prev, { role: 'ai', text: response || "..." }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'ai', text: "Connection error." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyJSON = () => {
        if (currentPlan) {
            navigator.clipboard.writeText(JSON.stringify(currentPlan, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-[90] w-14 h-14 bg-brand text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform group"
            >
                <Bot size={28} className="group-hover:animate-bounce"/>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            </button>
        );
    }

    return (
        <div className={`fixed bottom-24 right-4 md:bottom-8 md:right-8 z-[90] bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-all duration-300 ${isExpanded ? 'w-[90vw] h-[80vh] md:w-[600px]' : 'w-[350px] h-[500px]'}`}>
            
            {/* Header */}
            <div className="p-4 bg-brand text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2 font-bold">
                    <Sparkles size={18}/>
                    <span>AI Tutor</span>
                    {problemName && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full truncate max-w-[100px]">{problemName}</span>}
                </div>
                <div className="flex items-center gap-2">
                    {currentPlan && (
                        <button 
                            onClick={() => setShowDebug(!showDebug)} 
                            className="p-1 hover:bg-white/20 rounded text-white/80 hover:text-white"
                            title="Debug JSON"
                        >
                            <FileJson size={18}/>
                        </button>
                    )}
                    <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 hover:bg-white/20 rounded">
                        {isExpanded ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}
                    </button>
                    <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded">
                        <X size={18}/>
                    </button>
                </div>
            </div>

            {/* Debug JSON Overlay */}
            {showDebug && currentPlan && (
                <div className="absolute inset-0 top-[60px] bg-gray-900 z-20 p-4 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase">Current Lesson Plan JSON</span>
                        <button 
                            onClick={handleCopyJSON}
                            className="flex items-center gap-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-md text-xs text-white transition-colors"
                        >
                            {copied ? <Check size={12}/> : <Copy size={12}/>}
                            {copied ? "Copied" : "Copy JSON"}
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto bg-black p-2 rounded-xl border border-gray-800">
                        <pre className="text-[10px] font-mono text-green-400 whitespace-pre-wrap break-all">
                            {safeStringify(currentPlan)}
                        </pre>
                    </div>
                    <button 
                        onClick={() => setShowDebug(false)}
                        className="mt-2 w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-bold"
                    >
                        Close Debug
                    </button>
                </div>
            )}

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50 dark:bg-dark-bg">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            msg.role === 'user' 
                            ? 'bg-brand text-white rounded-tr-none' 
                            : 'bg-white dark:bg-dark-card text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-gray-700'
                        }`}>
                            <MarkdownText 
                                content={msg.text} 
                                className={msg.role === 'user' ? 'text-white' : ''} 
                            />
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex justify-start">
                        <div className="bg-white dark:bg-dark-card p-3 rounded-2xl rounded-tl-none border border-gray-200 dark:border-gray-700">
                            <Loader2 size={16} className="animate-spin text-brand"/>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            
            {/* Suggestion Chips (Only show if conversation is short or user hasn't typed recently) */}
            {!isLoading && (
                <div className="px-4 py-2 flex gap-2 overflow-x-auto custom-scrollbar shrink-0 bg-gray-50/50 dark:bg-dark-bg/50 border-t border-gray-100 dark:border-gray-800">
                    {suggestions.map((s, i) => (
                        <button 
                            key={i}
                            onClick={() => handleSend(s)}
                            className="whitespace-nowrap px-3 py-1.5 bg-white dark:bg-dark-card border border-brand/20 rounded-full text-xs font-bold text-brand-dark dark:text-brand-light hover:bg-brand hover:text-white hover:border-brand transition-colors shadow-sm flex items-center gap-1.5 shrink-0"
                        >
                            <Lightbulb size={12} className="shrink-0" />
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card shrink-0 flex gap-2">
                <input 
                    className="flex-1 bg-gray-100 dark:bg-gray-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-brand outline-none text-gray-900 dark:text-white transition-all"
                    placeholder={language === 'Chinese' ? "输入问题..." : "Ask anything..."}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button 
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading}
                    className="p-2 bg-brand text-white rounded-xl disabled:opacity-50 hover:bg-brand-dark transition-colors shadow-sm"
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
};
