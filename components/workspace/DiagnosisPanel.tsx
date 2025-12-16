
import React, { useState } from 'react';
import { Stethoscope, Bug, ArrowRight, Dumbbell, CheckCircle, Lightbulb, Save, Copy, Check, Loader2, Info } from 'lucide-react';
import { MarkdownText } from '../common/MarkdownText';

interface DiagnosisPanelProps {
    analysis: any; // The analysis object from the judge result
    onDrill?: () => void;
    status: string;
    onSaveStrategy?: () => Promise<{success: boolean, message: string, existingId?: string}>; 
    isZh: boolean;
}

export const DiagnosisPanel: React.FC<DiagnosisPanelProps> = ({ analysis, onDrill, status, onSaveStrategy, isZh }) => {
    const [copied, setCopied] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveFeedback, setSaveFeedback] = useState<{type: 'success' | 'info' | 'error', text: string} | null>(null);

    if (!analysis) return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
            <Stethoscope size={48} className="mb-4 opacity-50"/>
            <p>{isZh ? "暂无诊断报告。请先运行代码。" : "No diagnosis available. Run code first."}</p>
        </div>
    );

    const isSuccess = status === 'Accepted';

    const handleCopy = () => {
        if (analysis.correctCode) {
            navigator.clipboard.writeText(analysis.correctCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSave = async () => {
        if (!onSaveStrategy) return;
        setIsSaving(true);
        setSaveFeedback(null);
        try {
            const result = await onSaveStrategy();
            if (result.success) {
                setSaveFeedback({ type: 'success', text: result.message });
            } else {
                // If existing, it's info/warning, not necessarily a hard error
                setSaveFeedback({ type: result.existingId ? 'info' : 'error', text: result.message });
            }
        } catch(e) {
            setSaveFeedback({ type: 'error', text: isZh ? "保存失败" : "Save Failed" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-[#0c0c0c] overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className={`p-6 border-b border-gray-100 dark:border-gray-800 ${isSuccess ? 'bg-green-50/50 dark:bg-green-900/10' : 'bg-red-50/50 dark:bg-red-900/10'}`}>
                <div className={`flex items-center gap-3 mb-2 ${isSuccess ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    <div className={`p-2 rounded-lg ${isSuccess ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                        {isSuccess ? <CheckCircle size={24} /> : <Bug size={24} />}
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-tight">
                        {isSuccess 
                            ? (isZh ? "通过分析报告" : "Success Analysis") 
                            : (isZh ? "深度诊断报告" : "Clinical Diagnosis")}
                    </h2>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium ml-1">
                    {isSuccess 
                        ? (isZh ? "代码运行完美，效率与策略分析如下" : "Code passed. Efficiency and strategy analysis below")
                        : (isZh ? "AI 已分析您的代码逻辑与思维误区" : "AI has analyzed your logic and mental model gaps")}
                </p>
            </div>

            <div className="p-6 md:p-8 space-y-8">
                
                {/* 1. INTENT & STRATEGY (Common) */}
                <div className="bg-gray-50 dark:bg-[#151515] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4">
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                            {isZh ? "检测到的意图" : "Detected Intent"}
                        </h4>
                        <p className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-relaxed">
                            {analysis.userIntent || (isZh ? "未检测到明确意图" : "No clear intent detected")}
                        </p>
                    </div>
                    {analysis.strategyDetected && (
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                {isZh ? "使用策略" : "Strategy Used"}
                            </h4>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold">
                                <Lightbulb size={12}/> {analysis.strategyDetected}
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. SUCCESS CONTENT */}
                {isSuccess && (
                    <div className="space-y-6 animate-fade-in-up">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30">
                                <div className="text-xs text-green-600 dark:text-green-400 font-bold uppercase tracking-wider mb-1">Time Complexity</div>
                                <div className="text-lg font-black text-green-700 dark:text-green-300 font-mono">{analysis.timeComplexity || "N/A"}</div>
                            </div>
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/30">
                                <div className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider mb-1">Space Complexity</div>
                                <div className="text-lg font-black text-purple-700 dark:text-purple-300 font-mono">{analysis.spaceComplexity || "N/A"}</div>
                            </div>
                        </div>

                        {/* Explanation */}
                        {analysis.explanation && (
                            <div className="prose dark:prose-invert max-w-none text-sm text-gray-600 dark:text-gray-300">
                                <MarkdownText content={analysis.explanation} />
                            </div>
                        )}

                        {/* Save Action */}
                        {onSaveStrategy && (
                            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                                <button 
                                    onClick={handleSave}
                                    disabled={isSaving || (!!saveFeedback && saveFeedback.type !== 'error')}
                                    className={`w-full py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-3 group transition-all
                                        ${saveFeedback && saveFeedback.type === 'info' 
                                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed' 
                                            : (saveFeedback && saveFeedback.type === 'success' 
                                                ? 'bg-green-100 text-green-600 cursor-default'
                                                : 'bg-gradient-to-r from-brand to-brand-dark text-white hover:shadow-xl hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed')
                                        }`}
                                >
                                    {isSaving ? <Loader2 size={20} className="animate-spin"/> : (saveFeedback?.type === 'success' ? <Check size={20}/> : <Save size={20} className={!saveFeedback ? "group-hover:animate-bounce" : ""} />)}
                                    {isSaving 
                                        ? (isZh ? "AI 智能分析中..." : "AI Analyzing...") 
                                        : (saveFeedback ? saveFeedback.text : (isZh ? "智能分析并保存策略" : "Smart Save Strategy"))
                                    }
                                </button>
                                
                                {!saveFeedback && (
                                    <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-400">
                                        <Info size={12} />
                                        <span>
                                            {isZh 
                                            ? "AI 将对比现有策略，仅当发现新思路时才会创建新条目。" 
                                            : "AI will compare with existing strategies and only save if novel."}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* 3. FAILURE CONTENT (Keeping same as before) */}
                {!isSuccess && (
                    <div className="space-y-8 animate-fade-in-up">
                        {/* Detailed Diagnosis */}
                        <div className="prose dark:prose-invert max-w-none text-sm md:text-base leading-relaxed text-gray-700 dark:text-gray-300">
                            <MarkdownText content={analysis.bugDiagnosis || (isZh ? "未提供详细诊断。" : "No diagnosis provided.")} />
                        </div>

                        {/* Correct Code Comparison */}
                        {analysis.correctCode && (
                            <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-[#151515]">
                                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                        <ArrowRight size={14}/> {isZh ? "修正参考 (Correct Approach)" : "Reference Solution"}
                                    </span>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={handleCopy}
                                            className="text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded font-bold hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-1 transition-colors"
                                        >
                                            {copied ? <Check size={10}/> : <Copy size={10}/>} {copied ? (isZh ? "已复制" : "Copied") : (isZh ? "复制" : "Copy")}
                                        </button>
                                        <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded font-mono font-bold">
                                            VERIFIED
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-[#1e1e1e] p-4 overflow-x-auto">
                                    <pre className="text-xs md:text-sm font-mono text-gray-300 leading-relaxed">
                                        <code>{analysis.correctCode}</code>
                                    </pre>
                                </div>
                            </div>
                        )}

                        {/* Action Area */}
                        {onDrill && (
                            <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full shrink-0">
                                    <Dumbbell size={24} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-1">
                                        {isZh ? "针对性强化训练" : "Targeted Reinforcement"}
                                    </h4>
                                    <p className="text-xs text-blue-700 dark:text-blue-300">
                                        {isZh ? "AI 将生成针对此错误模式的 17 屏强化练习。" : "AI will generate a 17-screen drill focused specifically on fixing this error pattern."}
                                    </p>
                                </div>
                                <button 
                                    onClick={onDrill}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-all active:scale-95 whitespace-nowrap"
                                >
                                    {isZh ? "开始特训" : "Start Drill"}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
