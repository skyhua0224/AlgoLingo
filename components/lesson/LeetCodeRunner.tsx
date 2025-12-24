
import React, { useState, useEffect } from 'react';
import { LessonPlan, LeetCodeContext, UserPreferences, SolutionStrategy, MistakeRecord, RetentionRecord } from '../../types';
import { VirtualWorkspace } from '../VirtualWorkspace';
import { Loader2, Zap, ArrowRight, Layout, X, Home, RotateCcw, AlertTriangle, RefreshCw, Star, Trophy, Clock, Target, Calendar, History, TrendingUp, AlertCircle, ArrowDown, Bot, ListOrdered } from 'lucide-react';
import { GlobalAiAssistant } from '../GlobalAiAssistant';
import { generateProblemStrategies, generateSolutionDeepDive, generateMistakeRepairPlan, evaluateSubmissionQuality } from '../../services/geminiService'; 
import { LessonRunner } from './LessonRunner'; 

interface LeetCodeRunnerProps {
    plan: LessonPlan;
    preferences: UserPreferences;
    language: 'Chinese' | 'English';
    onSuccess: () => void;
    onSaveDrillResult: (stats: { xp: number; streak: number }, shouldSave: boolean, mistakes: MistakeRecord[], evaluation?: { score: number, time: number }) => void;
    context?: LeetCodeContext | null; 
    onDataChange?: (highPriority: boolean) => void;
    queueTotal?: number; 
    queueIndex?: number;
    currentRetention?: RetentionRecord; 
    allMistakes?: MistakeRecord[];
}

const adaptStrategy = (app: any, lang: string): SolutionStrategy => {
    let safeExpandedKnowledge: string[] = [];
    if (Array.isArray(app.expandedKnowledge)) {
        safeExpandedKnowledge = app.expandedKnowledge;
    } else if (typeof app.expandedKnowledge === 'string') {
        safeExpandedKnowledge = [app.expandedKnowledge];
    }

    let safeKeywords: any[] = [];
    if (Array.isArray(app.keywords)) {
        safeKeywords = app.keywords;
    }

    return {
        id: app.id,
        title: app.title,
        complexity: app.complexity,
        tags: app.tags || [],
        rationale: app.rationale,
        summary: app.summary,
        derivation: app.derivation || app.intuition || "No explanation provided.",
        analogy: app.analogy,
        memoryTip: app.memoryTip,
        expandedKnowledge: safeExpandedKnowledge,
        mermaid: app.mermaid,
        logicSteps: app.logicSteps, 
        keywords: safeKeywords,
        code: app.code || "// Code logic missing", 
        codeWidgets: app.widgets || [],
        language: lang,
        isCustom: app.isCustom || false,
        sections: app.sections 
    };
};

const calculateSRSProjection = (currentInterval: number, qScore: number, isZh: boolean) => {
    let nextInterval = 1;
    let zone = isZh ? "急救区" : "Emergency Zone";
    let logic = "";
    let color = "text-red-500";
    let statusLabel = isZh ? "降级" : "Demoted";

    if (currentInterval <= 1) {
        if (qScore === 3) { nextInterval = 3; zone = "3-7 Days"; logic = isZh ? "表现完美，进入短周期。" : "Perfect. Enter short cycle."; color = "text-green-500"; statusLabel = isZh ? "晋级" : "Promoted"; }
        else if (qScore === 2) { nextInterval = 3; zone = "3-7 Days"; logic = isZh ? "表现良好，晋级。" : "Good. Promoted."; color = "text-green-500"; statusLabel = isZh ? "晋级" : "Promoted"; }
        else { nextInterval = 1; zone = "1 Day"; logic = isZh ? "表现挣扎，保持急救。" : "Struggled. Stay in Emergency."; color = "text-yellow-500"; statusLabel = isZh ? "保持" : "Stagnant"; }
    } else if (currentInterval >= 3 && currentInterval < 7) {
        if (qScore === 3) { nextInterval = 7; zone = "3-7 Days"; logic = isZh ? "完美记忆，延长周期。" : "Perfect. Extend cycle."; color = "text-green-500"; statusLabel = isZh ? "晋级" : "Promoted"; }
        else if (qScore === 2) { nextInterval = 7; zone = "3-7 Days"; logic = isZh ? "正常晋级。" : "Normal Promotion."; color = "text-green-500"; statusLabel = isZh ? "晋级" : "Promoted"; }
        else { nextInterval = 1; zone = "1 Day"; logic = isZh ? "表现不好，打回急救。" : "Failed. Back to Emergency."; color = "text-red-500"; statusLabel = isZh ? "降级" : "Demoted"; }
    } else if (currentInterval >= 7 && currentInterval < 30) {
        if (qScore === 3) { nextInterval = 30; zone = "30 Days"; logic = isZh ? "晋升大师：进入长周期。" : "Mastery. Enter long cycle."; color = "text-purple-500"; statusLabel = isZh ? "大师" : "Master"; }
        else if (qScore === 2) { nextInterval = 15; zone = "30 Days"; logic = isZh ? "晋升，周期稍短。" : "Promoted, shorter cycle."; color = "text-green-500"; statusLabel = isZh ? "晋级" : "Promoted"; }
        else { nextInterval = 3; zone = "3-7 Days"; logic = isZh ? "降级惩罚：退回上一级。" : "Demoted. Return to previous."; color = "text-red-500"; statusLabel = isZh ? "降级" : "Demoted"; }
    } else {
        if (qScore >= 2) { nextInterval = 30; zone = "30 Days (Cap)"; logic = isZh ? "保持大师手感。" : "Maintenance Mode."; color = "text-blue-500"; statusLabel = isZh ? "保持" : "Stable"; }
        else { nextInterval = 7; zone = "3-7 Days"; logic = isZh ? "记忆模糊，惩罚。" : "Fuzzy. Penalty."; color = "text-red-600"; statusLabel = isZh ? "重修" : "Retrain"; }
    }

    return { nextInterval, zone, logic, color, statusLabel };
};

export const LeetCodeRunner: React.FC<LeetCodeRunnerProps> = ({ 
    plan, preferences, language, onSuccess, onSaveDrillResult, context, onDataChange,
    queueTotal = 1, queueIndex = 0, currentRetention, allMistakes = []
}) => {
    const [step, setStep] = useState<'strategy-select' | 'generating' | 'workspace' | 'drill' | 'evaluating'>('workspace');
    const [loadingMsg, setLoadingMsg] = useState("");
    const [strategies, setStrategies] = useState<SolutionStrategy[]>([]);
    const [activeStrategyId, setActiveStrategyId] = useState<string | null>(null);
    const [drillPlan, setDrillPlan] = useState<LessonPlan | null>(null);
    const [generationError, setGenerationError] = useState<string | null>(null); 
    const isZh = language === 'Chinese';

    const [evalResult, setEvalResult] = useState<{ score: number, reason: string, nextIntervalRecommendation: string, time: number, attempts: number } | null>(null);
    const [loadingTime, setLoadingTime] = useState(0);
    const [targetStrategyId, setTargetStrategyId] = useState<string | null>(null);

    const problemId = plan.context?.problemId;
    
    useEffect(() => {
        let interval: any;
        if (step === 'generating' || step === 'evaluating') {
            setLoadingTime(0);
            interval = setInterval(() => setLoadingTime(t => t + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [step]);

    useEffect(() => {
        const loadList = async () => {
            if (!plan.title) return;
            const cacheKey = `algolingo_sol_v3_${plan.title}_${preferences.targetLanguage}`;
            const cached = localStorage.getItem(cacheKey);
            
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    const adapted = (parsed.approaches || []).map((app: any) => adaptStrategy(app, preferences.targetLanguage));
                    setStrategies(adapted);
                } catch(e) { console.error("Cache Parse Error", e); }
            } else if (context) {
                try {
                    const data = await generateProblemStrategies(plan.title, context.problem.description, preferences);
                    const adapted = (data.approaches || []).map((app: any) => adaptStrategy(app, preferences.targetLanguage));
                    setStrategies(adapted);
                    localStorage.setItem(cacheKey, JSON.stringify(data));
                    onDataChange?.(true);
                } catch (e) {
                    console.error("Strategy Gen Failed");
                }
            }
        };
        loadList();
    }, [plan.title, preferences.targetLanguage]);

    const executeStrategyGeneration = async (strategyId: string) => {
        const strategy = strategies.find(s => s.id === strategyId);
        if (!strategy) return;

        setLoadingMsg(isZh ? "正在生成深度题解..." : "Generating deep dive...");
        setStep('generating');
        setGenerationError(null); 
        setTargetStrategyId(strategyId);
        
        try {
            const officialData = await generateSolutionDeepDive(
                plan.title, 
                strategy.title, 
                preferences,
                strategy.code 
            );
            
            const fullCode = officialData.codeLines?.map((l: any) => l.code).join('\n') || officialData.code || "";
            
            const codeWidget = {
                id: `official_code_${Date.now()}`,
                type: 'interactive-code',
                interactiveCode: {
                    language: preferences.targetLanguage,
                    lines: officialData.codeLines?.map((a: any) => ({ code: a.code, explanation: a.explanation })) || [],
                    caption: "Optimal Solution"
                }
            };

            const updatedStrategy: SolutionStrategy = {
                ...strategy,
                derivation: officialData.mathLogic || strategy.derivation,
                rationale: officialData.summary || strategy.rationale,
                sections: officialData.sections, 
                code: fullCode || strategy.code, 
                codeWidgets: [codeWidget as any] 
            };

            const updatedStrategies = strategies.map(s => s.id === strategyId ? updatedStrategy : s);
            setStrategies(updatedStrategies);
            setActiveStrategyId(strategyId);
            
            const cacheKey = `algolingo_sol_v3_${plan.title}_${preferences.targetLanguage}`;
            const cachedRaw = localStorage.getItem(cacheKey);
            if (cachedRaw) {
                const parsed = JSON.parse(cachedRaw);
                parsed.approaches = parsed.approaches.map((app: any) => {
                    if (app.id === strategyId) {
                        return {
                            ...app,
                            sections: officialData.sections,
                            mathLogic: officialData.mathLogic,
                            summary: officialData.summary,
                            code: fullCode || app.code,
                            widgets: [codeWidget] 
                        };
                    }
                    return app;
                });
                localStorage.setItem(cacheKey, JSON.stringify(parsed));
                onDataChange?.(true); 
            }

            setStep('workspace');
        } catch (e: any) {
            console.error("Strategy Gen Failed", e);
            setGenerationError(e.message || "Unknown generation error. The AI might be busy.");
        }
    };

    const handleStrategySelect = async (strategyId: string | null) => {
        if (!strategyId) {
            setActiveStrategyId(null);
            return;
        }

        const strategy = strategies.find(s => s.id === strategyId);
        if (!strategy) return;

        if (strategy.sections && strategy.codeWidgets && strategy.codeWidgets.length > 0) {
            setActiveStrategyId(strategyId);
            return;
        }
        executeStrategyGeneration(strategyId);
    };

    const handleUpdateStrategy = (updatedStrategy: SolutionStrategy) => {
        setStrategies(prev => {
            const newStrategies = prev.map(s => s.id === updatedStrategy.id ? updatedStrategy : s);
            return newStrategies;
        });
    };

    const handleDrillStart = async (diagnosisContext?: string, referenceCode?: string) => {
        setLoadingMsg(isZh ? "正在构建专属训练计划 (17关)..." : "Building focused drill plan (17 screens)...");
        setStep('generating');
        setGenerationError(null);
        try {
            const drillContext = diagnosisContext || `Failed to implement correct logic for ${plan.title}. Needs intense repetition.`;
            const drill = await generateMistakeRepairPlan(drillContext, plan.title, preferences, referenceCode);
            setDrillPlan(drill);
            setStep('drill');
        } catch (e: any) {
            console.error(e);
            setGenerationError(e.message || "Failed to generate drill.");
        }
    };

    const handleDrillComplete = (stats: {xp: number, streak: number}, mistakes: MistakeRecord[]) => {
        onSaveDrillResult(stats, true, mistakes);
        setStep('workspace');
        setDrillPlan(null);
    };

    const handleWorkspaceSuccess = async (code: string, attempts: number, time: number) => {
        setStep('evaluating');
        setLoadingMsg(isZh ? "AI 正在评估代码质量 (快速通道)..." : "AI evaluating (Fast Lane)...");
        
        try {
            const result = await evaluateSubmissionQuality(
                code, 
                time, 
                attempts, 
                context?.problem.description || plan.title,
                preferences
            );
            
            setEvalResult({
                ...result,
                time,
                attempts
            });
        } catch(e) {
            setEvalResult({ score: 2, reason: "Manual pass.", nextIntervalRecommendation: "3 days", time, attempts });
        }
    };

    const confirmEvaluation = () => {
        if (!evalResult) return;
        
        onSaveDrillResult(
            { xp: 50 + (evalResult.score * 10), streak: 1 }, 
            true, 
            [], 
            { score: evalResult.score, time: evalResult.time || 60 }
        );
        
        onSuccess();
    };

    if (!context) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50 dark:bg-dark-bg">
                <Loader2 size={48} className="animate-spin text-brand mb-4"/>
                <p className="font-bold text-sm uppercase tracking-wider">
                    {isZh ? "正在初始化环境..." : "Initializing Environment..."}
                </p>
            </div>
        );
    }

    const drillActions = [
        {
            label: isZh ? "回到力扣学习" : "Back to LeetCode",
            icon: RotateCcw,
            onClick: () => { setStep('workspace'); setDrillPlan(null); },
            variant: 'secondary' as const
        },
        {
            label: isZh ? "回到主页" : "Return Home",
            icon: Home,
            onClick: onSuccess, 
            variant: 'primary' as const
        }
    ];

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    const currentInterval = currentRetention?.interval || 1;
    const srsData = evalResult ? calculateSRSProjection(currentInterval, evalResult.score, isZh) : null;

    return (
        <div className="flex h-full relative bg-gray-50 dark:bg-dark-bg overflow-hidden">
            <GlobalAiAssistant problemName={plan.title} preferences={preferences} language={language} />

            <div className="w-full h-full flex flex-col transition-all duration-300 ease-in-out relative">
                
                <div className="w-full h-full" style={{ display: (step === 'workspace' || step === 'generating') ? 'block' : 'none' }}>
                    <VirtualWorkspace 
                        context={context} 
                        preferences={preferences} 
                        onSuccess={handleWorkspaceSuccess}
                        strategies={strategies}
                        activeStrategyId={activeStrategyId}
                        onSelectStrategy={handleStrategySelect}
                        isGenerating={step === 'generating'}
                        onUpdateStrategy={handleUpdateStrategy}
                        onDrill={handleDrillStart}
                    />
                </div>

                {step === 'evaluating' && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center text-gray-800 dark:text-white bg-white/95 dark:bg-dark-bg/95 backdrop-blur-md animate-fade-in-up overflow-y-auto p-4">
                        {!evalResult ? (
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 size={48} className="animate-spin text-brand"/>
                                <p className="font-bold text-sm uppercase tracking-wider animate-pulse">
                                    {loadingMsg}
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-[#111] w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 relative overflow-hidden flex flex-col">
                                <div className={`h-24 bg-gradient-to-r ${srsData?.color === 'text-red-500' ? 'from-red-500/20 to-red-900/20' : 'from-brand/20 to-emerald-500/20'} flex items-center justify-center relative overflow-hidden`}>
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                                    <div className={`text-4xl font-black ${srsData?.color} drop-shadow-sm flex items-center gap-3`}>
                                        {evalResult.score === 3 ? "PERFECT" : (evalResult.score === 2 ? "GOOD" : "PASSED")}
                                        <div className="bg-white dark:bg-black rounded-full p-2 text-xl shadow-lg border-2 border-current">
                                            {evalResult.score}/3
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 space-y-8">
                                    <div className="bg-white dark:bg-black/30 rounded-2xl border-2 border-gray-100 dark:border-gray-800 overflow-hidden relative">
                                        <div className="bg-gray-50 dark:bg-gray-800/80 px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                            <span className="text-xs font-black uppercase text-gray-500 flex items-center gap-2">
                                                <TrendingUp size={14}/> {isZh ? "记忆曲线演变" : "Memory Curve Evolution"}
                                            </span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${srsData?.color} bg-white dark:bg-black border border-current`}>
                                                {srsData?.statusLabel}
                                            </span>
                                        </div>
                                        
                                        <div className="p-6 flex items-center justify-between relative">
                                            <div className="text-center z-10">
                                                <div className="text-xs font-bold text-gray-400 uppercase mb-1">{isZh ? "当前间隔" : "Current"}</div>
                                                <div className="text-2xl font-black text-gray-700 dark:text-gray-300">{currentInterval} <span className="text-xs">Days</span></div>
                                            </div>

                                            <div className="flex-1 flex flex-col items-center px-4 relative z-0">
                                                <div className="h-0.5 w-full bg-gray-200 dark:bg-gray-700 absolute top-1/2 -translate-y-1/2"></div>
                                                <div className={`relative z-10 bg-white dark:bg-[#111] px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm text-xs font-bold ${srsData?.color}`}>
                                                    Q-Score: {evalResult.score}
                                                </div>
                                                <ArrowRight size={16} className={`mt-1 ${srsData?.color}`} />
                                            </div>

                                            <div className="text-center z-10">
                                                <div className="text-xs font-bold text-gray-400 uppercase mb-1">{isZh ? "下次复习" : "Next Review"}</div>
                                                <div className={`text-3xl font-black ${srsData?.color}`}>{srsData?.nextInterval} <span className="text-sm">Days</span></div>
                                                <div className="text-[10px] font-bold text-gray-400 mt-1 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                                    {srsData?.zone}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50/50 dark:bg-gray-800/30 px-4 py-2 text-center border-t border-gray-100 dark:border-gray-800">
                                            <p className="text-xs text-gray-500 font-medium flex items-center justify-center gap-1">
                                                <Target size={12}/>
                                                {srsData?.logic}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-left bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                        <h4 className="text-xs font-bold text-blue-500 uppercase mb-2 flex items-center gap-1">
                                            <Bot size={14}/> {isZh ? "AI 评语" : "AI Feedback"}
                                        </h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                                            {evalResult.reason}
                                        </p>
                                    </div>

                                    <button 
                                        onClick={confirmEvaluation}
                                        className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold text-lg shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                                    >
                                        {queueIndex < queueTotal - 1 
                                            ? (isZh ? "继续下一题 (队列中)" : "Next Problem in Queue") 
                                            : (isZh ? "完成复习" : "Finish Session")
                                        }
                                        <ArrowRight size={20}/>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === 'generating' && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center text-gray-400 bg-white/95 dark:bg-dark-bg/95 backdrop-blur-sm animate-fade-in-up">
                        {generationError ? (
                            <div className="text-center p-8 max-w-md">
                                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                                    <AlertTriangle size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                    {isZh ? "生成遇到了阻碍" : "Generation Halted"}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-mono bg-gray-100 dark:bg-black/20 p-3 rounded-lg break-words">
                                    {generationError}
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <button 
                                        onClick={() => setStep('workspace')}
                                        className="px-6 py-2.5 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        {isZh ? "返回" : "Back"}
                                    </button>
                                    <button 
                                        onClick={() => targetStrategyId ? executeStrategyGeneration(targetStrategyId) : handleDrillStart()}
                                        className="px-6 py-2.5 bg-brand text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-brand-dark transition-colors shadow-lg"
                                    >
                                        <RefreshCw size={16}/> {isZh ? "重试" : "Retry"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Loader2 size={48} className="animate-spin text-brand mb-4"/>
                                <p className="font-bold text-sm uppercase tracking-wider animate-pulse mb-6">
                                    {loadingMsg} ({loadingTime}s)
                                </p>

                                <div className="flex flex-col gap-3 min-w-[200px]">
                                    {loadingTime > 60 && (
                                        <button 
                                            onClick={() => targetStrategyId && executeStrategyGeneration(targetStrategyId)}
                                            className="px-6 py-2.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-yellow-200 transition-colors"
                                        >
                                            <RotateCcw size={14}/> {isZh ? "生成较慢，重试?" : "Taking long, Retry?"}
                                        </button>
                                    )}
                                    
                                    {loadingTime > 120 && (
                                        <button 
                                            onClick={() => setStep('workspace')}
                                            className="px-6 py-2.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-200 transition-colors"
                                        >
                                            <AlertTriangle size={14}/> {isZh ? "强制停止" : "Force Stop"}
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {step === 'drill' && drillPlan && (
                    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur flex items-center justify-center p-4">
                        <div className="w-full h-full md:w-[95vw] md:h-[95vh] bg-white dark:bg-dark-bg rounded-3xl overflow-hidden shadow-2xl relative border border-gray-200 dark:border-gray-800">
                            <div className="absolute top-4 right-4 z-50">
                                <button onClick={() => setStep('workspace')} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                                    <X size={20} className="text-gray-500 hover:text-red-500"/>
                                </button>
                            </div>
                            <LessonRunner 
                                plan={drillPlan} 
                                nodeIndex={-1} 
                                onComplete={(stats, _, mistakes) => handleDrillComplete(stats, mistakes)}
                                onExit={() => setStep('workspace')}
                                language={language}
                                preferences={preferences}
                                stats={{ streak: 0, xp: 0, gems: 0, lastPlayed: '', history: {} }}
                                isReviewMode={true} 
                                allowMistakeLoop={true} 
                                customSummaryActions={drillActions}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
