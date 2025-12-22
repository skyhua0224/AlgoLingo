
import React, { useState, useMemo } from 'react';
import { Gavel, CheckCircle2, XCircle, Loader2, MessageSquare, ArrowRight, RotateCcw, Eye } from 'lucide-react';
import { Widget } from '../../types';
import { UserPreferences } from '../../types';
import { verifyAnswerDispute } from '../../services/geminiService';
import { WidgetState } from '../../hooks/useWidgetValidator';
import { MarkdownText } from '../common/MarkdownText';

interface DisputeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onResolve: (success: boolean) => void;
    widget: Widget;
    userState: WidgetState;
    context: string;
    preferences: UserPreferences;
    language: 'Chinese' | 'English';
}

export const DisputeModal: React.FC<DisputeModalProps> = ({ 
    isOpen, onClose, onResolve, widget, userState, context, preferences, language 
}) => {
    const [reason, setReason] = useState('');
    const [status, setStatus] = useState<'idle' | 'judging' | 'success' | 'rejected'>('idle');
    const [verdictMsg, setVerdictMsg] = useState('');
    const [history, setHistory] = useState<string[]>([]); // Track previous rejections
    const isZh = language === 'Chinese';

    if (!isOpen) return null;

    // Helper: Extract human-readable answer from state with robust type normalization
    const userAnswerString = useMemo(() => {
        const type = widget.type.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

        if (type === 'quiz' && widget.quiz && userState.quizSelection !== undefined && userState.quizSelection !== null) {
            return `Selected Option: ${widget.quiz.options[userState.quizSelection] || "Unknown"}`;
        }
        
        if (type === 'fill-in' && userState.fillInAnswers && userState.fillInAnswers.length > 0) {
            return `Filled values: [${userState.fillInAnswers.join(', ')}]`;
        }
        
        if (type === 'parsons' && userState.parsonsOrder && userState.parsonsOrder.length > 0) {
            return `User's Code Order:\n${userState.parsonsOrder.join('\n')}`;
        }
        
        if (type === 'mini-editor') {
             return `Code Execution Result: ${userState.miniEditorValid ? 'Valid' : 'Invalid'}`;
        }
        
        if (type === 'steps-list' && userState.stepsOrder && userState.stepsOrder.length > 0) {
            return `User's Step Order: ${userState.stepsOrder.join(' -> ')}`;
        }

        return "User Input (No specific answer state found)";
    }, [widget, userState]);

    const handleJudge = async () => {
        if (!reason.trim()) return;
        setStatus('judging');
        
        try {
            const fullContext = `Problem Context: ${context}. User's Defense: ${reason}. Previous Rejections: ${history.join(' | ')}`;
            
            // Call AI Judge
            const result = await verifyAnswerDispute(widget, userAnswerString, fullContext, preferences);
            
            if (result.verdict === 'correct') {
                setStatus('success');
                setVerdictMsg(result.explanation || (isZh ? "申诉成功！AI 认可了你的答案。" : "Appeal Accepted! AI validated your answer."));
            } else {
                setStatus('rejected');
                const msg = result.explanation || (isZh ? "申诉驳回。AI 维持原判。" : "Appeal Rejected. AI stands by the original verdict.");
                setVerdictMsg(msg);
                setHistory(prev => [...prev, msg]);
            }
        } catch (e) {
            setStatus('rejected');
            setVerdictMsg(isZh ? "AI 法官连接失败。" : "AI Judge connection failed.");
        }
    };

    const handleRetry = () => {
        setStatus('idle');
    };

    const handleSuccessContinue = () => {
        onResolve(true); // Mark correct
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-up">
            <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-md rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 flex items-center gap-3 shrink-0">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl">
                        <Gavel size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
                            {isZh ? "提出异议 (AI 仲裁)" : "Dispute Answer"}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium">
                            {isZh ? "向 AI 解释你的思路" : "Explain your reasoning to AI"}
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {status === 'idle' && (
                        <>
                            {verdictMsg && (
                                <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-xl mb-4 border border-red-100 dark:border-red-900/30 animate-fade-in-down">
                                    <h4 className="text-xs font-bold text-red-600 dark:text-red-400 mb-1 flex items-center gap-1">
                                        <XCircle size={12}/> {isZh ? "上一次驳回理由" : "Previous Rejection Reason"}:
                                    </h4>
                                    <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed font-medium">
                                        <MarkdownText content={verdictMsg} />
                                    </p>
                                </div>
                            )}

                            {/* Captured Answer Preview */}
                            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-xl mb-4 border border-gray-200 dark:border-gray-700">
                                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <Eye size={12}/> {isZh ? "你的提交内容" : "Captured Submission"}:
                                </h4>
                                <div className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all max-h-24 overflow-y-auto">
                                    {userAnswerString}
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl mb-4 border border-blue-100 dark:border-blue-900/30">
                                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
                                    {isZh 
                                     ? "有时候标准答案过于死板。如果你认为自己是对的（或者是题目表述不清），请告诉 AI。" 
                                     : "Sometimes standard answers are too rigid. If you believe you are correct (or the question is ambiguous), tell the AI."}
                                </p>
                            </div>
                            
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                                {isZh ? "你的理由" : "Your Reasoning"}
                            </label>
                            <textarea 
                                className="w-full h-32 p-4 bg-gray-50 dark:bg-black/40 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:border-purple-500 outline-none resize-none text-gray-900 dark:text-white"
                                placeholder={isZh ? "例如：这里用 HashMap 也可以达到 O(n)..." : "e.g., Using a HashMap here is also O(n)..."}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                autoFocus
                            />
                        </>
                    )}

                    {status === 'judging' && (
                        <div className="py-12 flex flex-col items-center justify-center text-center">
                            <Loader2 size={40} className="text-purple-500 animate-spin mb-4" />
                            <h4 className="font-bold text-gray-800 dark:text-white mb-1">
                                {isZh ? "AI 法官正在审理..." : "AI Judge is deliberating..."}
                            </h4>
                            <p className="text-xs text-gray-500">
                                {isZh ? "分析上下文逻辑中" : "Analyzing logic context"}
                            </p>
                        </div>
                    )}

                    {(status === 'success' || status === 'rejected') && (
                        <div className={`p-5 rounded-2xl border-2 text-center animate-scale-in ${status === 'success' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'}`}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {status === 'success' ? <CheckCircle2 size={24}/> : <XCircle size={24}/>}
                            </div>
                            <h4 className={`font-black text-lg mb-2 ${status === 'success' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                {status === 'success' ? (isZh ? "申诉成功" : "Appeal Accepted") : (isZh ? "申诉驳回" : "Appeal Rejected")}
                            </h4>
                            <div className="text-sm opacity-90 leading-relaxed font-medium text-left">
                                <MarkdownText content={verdictMsg} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-gray-700 flex gap-3 shrink-0">
                    {status === 'idle' ? (
                        <>
                            <button onClick={onClose} className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors">
                                {isZh ? "取消" : "Cancel"}
                            </button>
                            <button 
                                onClick={handleJudge}
                                disabled={!reason.trim()}
                                className="flex-[2] py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                <Gavel size={18} />
                                {isZh ? "提交仲裁" : "Submit Appeal"}
                            </button>
                        </>
                    ) : status === 'judging' ? (
                        <div className="w-full py-3 text-center text-xs text-gray-400 font-bold uppercase tracking-widest">Processing...</div>
                    ) : status === 'success' ? (
                        <button onClick={handleSuccessContinue} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">
                            {isZh ? "继续学习" : "Continue"} <ArrowRight size={18}/>
                        </button>
                    ) : (
                        <div className="flex w-full gap-3">
                            <button onClick={onClose} className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600">
                                {isZh ? "接受判决" : "Accept Verdict"}
                            </button>
                            <button 
                                onClick={handleRetry}
                                className="flex-1 py-3 bg-white dark:bg-dark-card border-2 border-brand text-brand rounded-xl font-bold hover:bg-brand hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                                <RotateCcw size={16} />
                                {isZh ? "再次申诉" : "Appeal Again"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
