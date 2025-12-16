
import React, { useState } from 'react';
import { AlertTriangle, Lightbulb, ArrowRight, Loader2, BookOpen } from 'lucide-react';
import { generateAiAssistance } from '../../services/geminiService';
import { UserPreferences } from '../../types';
import { Button } from '../Button';
import { MarkdownText } from '../common/MarkdownText';

interface SyntaxAnalysisPanelProps {
    errorLog: string;
    codeSnippet: string;
    language: string;
    preferences: UserPreferences;
    onClose: () => void;
    onRecordMistake: (tag: string) => void;
}

export const SyntaxAnalysisPanel: React.FC<SyntaxAnalysisPanelProps> = ({ 
    errorLog, codeSnippet, language, preferences, onClose, onRecordMistake 
}) => {
    const [explanation, setExplanation] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const isZh = preferences.spokenLanguage === 'Chinese';

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const context = `
            Language: ${language}
            Error: ${errorLog}
            Code: ${codeSnippet.substring(0, 300)}...
            User Goal: Algorithm Study (LeetCode).
            `;
            
            const prompt = isZh 
                ? "请简要解释这个报错的原因（专注于语法层面，而非算法逻辑），并给出一个正确的写法示例。请使用 Markdown 格式（代码块）返回。"
                : "Briefly explain this syntax error (focus on syntax, not algorithm logic) and provide a corrected example. Use Markdown for code blocks.";

            const res = await generateAiAssistance(context, prompt, preferences, 'gemini-2.5-flash');
            setExplanation(res);
            
            onRecordMistake('Syntax Error');
        } catch (e) {
            setExplanation("Analysis failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-red-50/50 dark:bg-red-900/10 border-l border-red-200 dark:border-red-800 p-4 overflow-y-auto">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold mb-4">
                <AlertTriangle size={18} />
                <h3>{isZh ? "语法阻断分析" : "Syntax Blocker Analysis"}</h3>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                {isZh 
                 ? "检测到语法错误而非逻辑错误。这类问题会影响手写代码的通过率，建议立即修复。" 
                 : "Syntax error detected. This blocks execution but isn't an algorithm logic flaw. Fix this to proceed."}
            </p>

            <div className="bg-white dark:bg-black/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30 mb-4 font-mono text-xs text-red-700 dark:text-red-300 break-all max-h-32 overflow-y-auto">
                {errorLog}
            </div>

            {!explanation ? (
                <Button onClick={handleAnalyze} disabled={loading} size="sm" className="w-full flex items-center justify-center gap-2">
                    {loading ? <Loader2 size={14} className="animate-spin"/> : <Lightbulb size={14}/>}
                    {isZh ? "AI 分析原因" : "Analyze Syntax"}
                </Button>
            ) : (
                <div className="animate-fade-in-up">
                    <div className="bg-white dark:bg-dark-card p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-4">
                        <div className="text-sm text-gray-700 dark:text-gray-200 prose dark:prose-invert max-w-none">
                            <MarkdownText content={explanation} />
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <button onClick={onClose} className="flex-1 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300">
                            {isZh ? "已了解，关闭" : "Got it, Close"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
