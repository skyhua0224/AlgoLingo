
import React, { useState, useEffect } from 'react';
import { LessonPlan, LeetCodeContext, UserPreferences, SolutionStrategy, MistakeRecord } from '../../types';
import { VirtualWorkspace } from '../VirtualWorkspace';
import { Loader2, Zap, ArrowRight, Layout, X, Home, RotateCcw, AlertTriangle } from 'lucide-react';
import { GlobalAiAssistant } from '../GlobalAiAssistant';
import { generateProblemStrategies, generateSolutionDeepDive, generateMistakeRepairPlan } from '../../services/geminiService'; // CHANGED IMPORTS
import { LessonRunner } from './LessonRunner'; 

interface LeetCodeRunnerProps {
    plan: LessonPlan;
    preferences: UserPreferences;
    language: 'Chinese' | 'English';
    onSuccess: () => void;
    onSaveDrillResult: (stats: { xp: number; streak: number }, shouldSave: boolean, mistakes: MistakeRecord[]) => void;
    context?: LeetCodeContext | null; 
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
        codeWidgets: app.widgets || app.codeWidgets || [],
        language: lang,
        isCustom: app.isCustom || false,
        sections: app.sections 
    };
};

export const LeetCodeRunner: React.FC<LeetCodeRunnerProps> = ({ plan, preferences, language, onSuccess, onSaveDrillResult, context }) => {
    // Steps: 'workspace' (IDE), 'generating' (Solution), 'drill' (Extra practice lesson)
    const [step, setStep] = useState<'strategy-select' | 'generating' | 'workspace' | 'drill'>('workspace');
    const [loadingMsg, setLoadingMsg] = useState("");
    const [strategies, setStrategies] = useState<SolutionStrategy[]>([]);
    const [activeStrategyId, setActiveStrategyId] = useState<string | null>(null);
    const [drillPlan, setDrillPlan] = useState<LessonPlan | null>(null);
    const isZh = language === 'Chinese';

    // Timeout State
    const [loadingTime, setLoadingTime] = useState(0);
    const [targetStrategyId, setTargetStrategyId] = useState<string | null>(null);

    // Timer Logic for Generating State
    useEffect(() => {
        let interval: any;
        if (step === 'generating') {
            setLoadingTime(0);
            interval = setInterval(() => setLoadingTime(t => t + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [step]);

    // 1. Load Strategy List (Lightweight metadata)
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
                    // NEW API CALL
                    const data = await generateProblemStrategies(plan.title, context.problem.description, preferences);
                    const adapted = (data.approaches || []).map((app: any) => adaptStrategy(app, preferences.targetLanguage));
                    setStrategies(adapted);
                    localStorage.setItem(cacheKey, JSON.stringify(data));
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
        setTargetStrategyId(strategyId);
        
        try {
            // NEW API CALL
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
            }

            setStep('workspace');
        } catch (e) {
            alert("Failed to generate official solution. Please try again.");
            setStep('workspace'); 
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

    // ... handleUpdateStrategy, handleDrillStart etc remain same ...
    const handleUpdateStrategy = (updatedStrategy: SolutionStrategy) => {
        setStrategies(prev => {
            const newStrategies = prev.map(s => s.id === updatedStrategy.id ? updatedStrategy : s);
            return newStrategies;
        });
    };

    const handleDrillStart = async (diagnosisContext?: string, referenceCode?: string) => {
        setLoadingMsg(isZh ? "正在构建专属训练计划 (17关)..." : "Building focused drill plan (17 screens)...");
        setStep('generating');
        try {
            const drillContext = diagnosisContext || `Failed to implement correct logic for ${plan.title}. Needs intense repetition.`;
            const drill = await generateMistakeRepairPlan(drillContext, plan.title, preferences, referenceCode);
            setDrillPlan(drill);
            setStep('drill');
        } catch (e) {
            console.error(e);
            alert("Failed to generate drill. Please try again.");
            setStep('workspace');
        }
    };

    const handleDrillComplete = (stats: {xp: number, streak: number}, mistakes: MistakeRecord[]) => {
        onSaveDrillResult(stats, true, mistakes);
        setStep('workspace');
        setDrillPlan(null);
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

    return (
        <div className="flex h-full relative bg-gray-50 dark:bg-dark-bg overflow-hidden">
            <GlobalAiAssistant problemName={plan.title} preferences={preferences} language={language} />

            <div className="w-full h-full flex flex-col transition-all duration-300 ease-in-out relative">
                
                <div className="w-full h-full" style={{ display: (step === 'workspace' || step === 'generating') ? 'block' : 'none' }}>
                    <VirtualWorkspace 
                        context={context} 
                        preferences={preferences} 
                        onSuccess={onSuccess}
                        strategies={strategies}
                        activeStrategyId={activeStrategyId}
                        onSelectStrategy={handleStrategySelect}
                        isGenerating={step === 'generating'}
                        onUpdateStrategy={handleUpdateStrategy}
                        onDrill={handleDrillStart}
                    />
                </div>

                {step === 'generating' && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center text-gray-400 bg-white/95 dark:bg-dark-bg/95 backdrop-blur-sm animate-fade-in-up">
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
