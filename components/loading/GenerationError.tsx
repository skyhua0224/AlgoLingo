
import React, { useState } from 'react';
import { RotateCcw, ArrowLeft, XCircle, Copy, FileJson, Bug, Eye, EyeOff } from 'lucide-react';
import { Button } from '../Button';

interface GenerationErrorProps {
    error: string;
    rawOutput: string | null;
    onRetry: () => void;
    onCancel: () => void;
    language: 'Chinese' | 'English';
}

export const GenerationError: React.FC<GenerationErrorProps> = ({ error, rawOutput, onRetry, onCancel, language }) => {
    const [showRaw, setShowRaw] = useState(false);
    const [copied, setCopied] = useState(false);
    const isZh = language === 'Chinese';

    const handleCopy = () => {
        if (rawOutput) {
            navigator.clipboard.writeText(rawOutput);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Calculate stats from raw output if available
    const rawLength = rawOutput?.length || 0;
    const seemsTruncated = rawOutput ? !rawOutput.trim().endsWith('}') : false;

    return (
        <div className="fixed inset-0 z-[100] w-full h-full bg-gray-50 dark:bg-dark-bg flex flex-col items-center justify-center p-6 animate-fade-in-up transition-colors overflow-y-auto">
            <div className="max-w-2xl w-full bg-white dark:bg-dark-card rounded-3xl shadow-2xl border-2 border-red-100 dark:border-red-900/50 p-8 text-center relative overflow-hidden my-auto">
                {/* Header Pattern */}
                <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
                
                <div className="w-20 h-20 mx-auto mb-6 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center animate-bounce">
                    <Bug size={40} className="text-red-500" />
                </div>
                
                <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white mb-2">
                    {isZh ? "生成遇到了问题" : "Generation Halted"}
                </h2>
                
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl mb-6 border border-red-100 dark:border-red-900/30 text-left">
                    <div className="flex items-center gap-2 mb-2">
                        <XCircle size={16} className="text-red-600 dark:text-red-400"/>
                        <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Error Log</span>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300 font-mono break-words leading-relaxed">
                        {error}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                     <Button 
                        onClick={onRetry}
                        variant="primary"
                        className="w-full shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <RotateCcw size={18} />
                        {isZh ? "重新生成 (推荐)" : "Regenerate (Recommended)"}
                    </Button>
                    
                    <button 
                        onClick={onCancel}
                        className="w-full py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-2 border-2 border-transparent"
                    >
                        <ArrowLeft size={18} />
                        {isZh ? "放弃并返回" : "Cancel & Go Back"}
                    </button>
                </div>

                {/* Advanced Tools */}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                    <button 
                        onClick={() => setShowRaw(!showRaw)}
                        className="mx-auto flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-brand transition-colors mb-4"
                    >
                        {showRaw ? <EyeOff size={14} /> : <Eye size={14} />}
                        {isZh ? (showRaw ? "隐藏原始数据" : "查看 AI 返回的原始数据") : (showRaw ? "Hide Raw Data" : "View Raw AI Response")}
                    </button>

                    {showRaw && (
                        <div className="animate-fade-in-down text-left bg-gray-900 rounded-xl p-4 shadow-inner relative group">
                            <div className="absolute top-2 right-2 flex gap-2">
                                <span className="text-[10px] text-gray-500 font-mono px-2 py-1 bg-black/50 rounded">
                                    {rawLength} chars {seemsTruncated && "(Truncated)"}
                                </span>
                                <button 
                                    onClick={handleCopy}
                                    className="p-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                                    title="Copy raw JSON"
                                >
                                    {copied ? <span className="text-green-400 text-xs font-bold">Copied!</span> : <Copy size={14} />}
                                </button>
                            </div>
                            <div className="flex items-center gap-2 mb-2 text-gray-500 border-b border-gray-800 pb-2">
                                <FileJson size={14} />
                                <span className="text-xs font-bold uppercase">Debug Data Stream</span>
                            </div>
                            <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap break-all h-64 overflow-y-auto custom-scrollbar">
                                {rawOutput || "// No data received from API."}
                            </pre>
                            <p className="mt-2 text-[10px] text-gray-600 text-center">
                                {isZh ? "您可以复制此数据向开发者反馈，或尝试修复 JSON 格式。" : "You can copy this data to report a bug or try to fix the JSON manually."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
