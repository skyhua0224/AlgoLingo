
import React, { useState, useEffect } from 'react';
import { LessonPlan, LeetCodeContext, UserPreferences, SolutionStrategy } from '../../types';
import { VirtualWorkspace } from '../VirtualWorkspace';
import { Loader2, Zap, ArrowRight, Layout } from 'lucide-react';
import { GlobalAiAssistant } from '../GlobalAiAssistant';
import { generateLeetCodeSolutions, generateOfficialLeetCodeSolution } from '../../services/geminiService';

interface LeetCodeRunnerProps {
    plan: LessonPlan;
    preferences: UserPreferences;
    language: 'Chinese' | 'English';
    onSuccess: () => void;
    context?: LeetCodeContext | null; 
}

const adaptStrategy = (app: any, lang: string): SolutionStrategy => {
    return {
        id: app.id,
        title: app.title,
        complexity: app.complexity,
        tags: app.tags || [],
        rationale: app.rationale,
        derivation: app.derivation || app.intuition || "No explanation provided.",
        analogy: app.analogy,
        memoryTip: app.memoryTip,
        expandedKnowledge: app.expandedKnowledge || [],
        mermaid: app.mermaid,
        keywords: app.keywords || [],
        code: app.code || "// Code logic missing", 
        codeWidgets: app.widgets || app.codeWidgets || [],
        language: lang,
        isCustom: app.isCustom || false,
        sections: app.sections // Pass through detailed sections if available (from cache)
    };
};

export const LeetCodeRunner: React.FC<LeetCodeRunnerProps> = ({ plan, preferences, language, onSuccess, context }) => {
    // Default to workspace directly
    const [step, setStep] = useState<'strategy-select' | 'generating' | 'workspace'>('workspace');
    const [strategies, setStrategies] = useState<SolutionStrategy[]>([]);
    const [activeStrategyId, setActiveStrategyId] = useState<string | null>(null);
    const isZh = language === 'Chinese';

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
                // Generate Initial List if not present (Silent background generation or prompt user)
                try {
                    const data = await generateLeetCodeSolutions(plan.title, context.problem.description, preferences);
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

    const handleStrategySelect = async (strategyId: string) => {
        const strategy = strategies.find(s => s.id === strategyId);
        if (!strategy) return;

        // If we already have detailed sections (from cache), just switch
        if (strategy.sections && strategy.codeWidgets && strategy.codeWidgets.length > 0) {
            setActiveStrategyId(strategyId);
            return;
        }

        // Otherwise, generate the detailed "Official Solution"
        setStep('generating');
        
        try {
            // Call Gemini 3 Pro for the deep dive official solution
            // Pass strategy.code so the AI analyzes existing code instead of rewriting
            const officialData = await generateOfficialLeetCodeSolution(
                plan.title, 
                strategy.title, 
                preferences,
                strategy.code 
            );
            
            // Construct the FULL code string from lines to ensure consistency
            const fullCode = officialData.codeLines?.map((l: any) => l.code).join('\n') || officialData.code || "";
            
            // Create Interactive Code Widget structure
            const codeWidget = {
                id: `official_code_${Date.now()}`,
                type: 'interactive-code',
                interactiveCode: {
                    language: preferences.targetLanguage,
                    lines: officialData.codeLines?.map((a: any) => ({ code: a.code, explanation: a.explanation })) || [],
                    caption: "Optimal Solution"
                }
            };

            // Merge into the strategy object
            const updatedStrategy: SolutionStrategy = {
                ...strategy,
                derivation: officialData.mathLogic || strategy.derivation,
                rationale: officialData.summary || strategy.rationale,
                sections: officialData.sections, // New structured content
                code: fullCode || strategy.code, // Use new full code if available
                codeWidgets: [codeWidget as any] // Force override
            };

            // Update State
            const updatedStrategies = strategies.map(s => s.id === strategyId ? updatedStrategy : s);
            setStrategies(updatedStrategies);
            setActiveStrategyId(strategyId);
            
            // Update Cache (Persist the detailed solution)
            const cacheKey = `algolingo_sol_v3_${plan.title}_${preferences.targetLanguage}`;
            const cachedRaw = localStorage.getItem(cacheKey);
            if (cachedRaw) {
                const parsed = JSON.parse(cachedRaw);
                // Find and update the specific approach in the raw cache structure
                parsed.approaches = parsed.approaches.map((app: any) => {
                    if (app.id === strategyId) {
                        return {
                            ...app,
                            // Persist the new detailed fields
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
            setStep('workspace'); // Go back to workspace to allow retry or selection of other
        }
    };

    const handleUpdateStrategy = (updatedStrategy: SolutionStrategy) => {
        setStrategies(prev => {
            const newStrategies = prev.map(s => s.id === updatedStrategy.id ? updatedStrategy : s);
            
            // Update Cache
            const cacheKey = `algolingo_sol_v3_${plan.title}_${preferences.targetLanguage}`;
            const cachedRaw = localStorage.getItem(cacheKey);
            if (cachedRaw) {
                try {
                    const parsed = JSON.parse(cachedRaw);
                    // This is a simplified cache update, it assumes 'updatedStrategy' matches the JSON structure
                    // In a real app, might need inverse adaptation
                    // For now, assume it's fine or rely on runtime state until reload
                } catch(e) {}
            }
            return newStrategies;
        });
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

    // WORKSPACE
    return (
        <div className="flex h-full relative bg-gray-50 dark:bg-dark-bg overflow-hidden">
            <GlobalAiAssistant problemName={plan.title} preferences={preferences} language={language} />

            <div className="w-full h-full flex flex-col transition-all duration-300 ease-in-out">
                <VirtualWorkspace 
                    context={context} 
                    preferences={preferences} 
                    onSuccess={onSuccess}
                    strategies={strategies}
                    activeStrategyId={activeStrategyId}
                    onSelectStrategy={handleStrategySelect}
                    isGenerating={step === 'generating'}
                    onUpdateStrategy={handleUpdateStrategy}
                />
            </div>
        </div>
    );
};
