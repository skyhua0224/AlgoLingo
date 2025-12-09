
import { useState, useEffect } from 'react';
import {
    UserStats, ProgressMap, LessonPlan, SavedLesson, MistakeRecord, UserPreferences, AppView, SolutionStrategy, Problem, LeetCodeContext, ProblemData
} from '../types';
import { ForgeRoadmap } from '../types/forge';
import { CareerSession } from '../types/career';
import { EngineeringTopic, SkillTrack } from '../types/engineering';
import {
    INITIAL_STATS, DEFAULT_API_CONFIG
} from '../constants';
import {
    generateLessonPlan, generateDailyWorkoutPlan, generateSyntaxClinicPlan, generateVariantLesson, generateLeetCodeContext
} from '../services/geminiService';
import { generateRapidExam } from '../services/ai/career/generator';

export interface EngineeringNavState {
    pillarId: 'system' | 'cs' | 'track' | null;
    topic: EngineeringTopic | null;
    trackData: SkillTrack | null;
}

export const useAppManager = () => {
    // --- STATE ---
    const [view, setView] = useState<AppView>('algorithms');
    const [activeTab, setActiveTab] = useState<AppView>('algorithms');

    // Data
    const [preferences, setPreferences] = useState<UserPreferences>(() => {
        const saved = localStorage.getItem('algolingo_preferences');
        return saved ? JSON.parse(saved) : {
            userName: 'Guest',
            hasOnboarded: false,
            targetLanguage: 'Python',
            spokenLanguage: 'English',
            apiConfig: DEFAULT_API_CONFIG,
            theme: 'system',
            notificationConfig: { enabled: false, webhookUrl: '', type: 'custom' },
            syncConfig: { enabled: false, githubToken: '' }
        };
    });

    const [stats, setStats] = useState<UserStats>(() => {
        const saved = localStorage.getItem('algolingo_stats');
        return saved ? JSON.parse(saved) : INITIAL_STATS;
    });

    const [progressMap, setProgressMap] = useState<ProgressMap>(() => {
        const saved = localStorage.getItem('algolingo_progress_v2');
        return saved ? JSON.parse(saved) : {};
    });

    const [mistakes, setMistakes] = useState<MistakeRecord[]>(() => {
        const saved = localStorage.getItem('algolingo_mistakes');
        return saved ? JSON.parse(saved) : [];
    });

    const [savedLessons, setSavedLessons] = useState<SavedLesson[]>(() => {
        const saved = localStorage.getItem('algolingo_saved_lessons');
        return saved ? JSON.parse(saved) : [];
    });

    const [careerSessions, setCareerSessions] = useState<CareerSession[]>(() => {
        const saved = localStorage.getItem('algolingo_career_sessions');
        return saved ? JSON.parse(saved) : [];
    });

    // NEW: Problem Data Cache (Context + Solutions)
    const [problemDataCache, setProblemDataCache] = useState<Record<string, ProblemData>>(() => {
        const saved = localStorage.getItem('algolingo_problem_data');
        return saved ? JSON.parse(saved) : {};
    });

    // Session / Navigation Context
    const [activeProblem, setActiveProblem] = useState<Problem | null>(null);
    // Derived from cache for convenience
    const activeProblemContext = activeProblem && problemDataCache[activeProblem.id] 
        ? problemDataCache[activeProblem.id].context 
        : null;
    
    const [activeNodeIndex, setActiveNodeIndex] = useState(0);
    const [currentLessonPlan, setCurrentLessonPlan] = useState<LessonPlan | null>(null);
    const [activeForgeItem, setActiveForgeItem] = useState<ForgeRoadmap | null>(null);
    const [activeCareerSession, setActiveCareerSession] = useState<CareerSession | null>(null);
    const [loadingContext, setLoadingContext] = useState<'lesson' | 'review' | 'career_exam'>('lesson');
    const [pendingExamConfig, setPendingExamConfig] = useState<{company: string, role: string, jd: string} | null>(null);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [generationRawError, setGenerationRawError] = useState<string | null>(null);
    const [isSkipAttempt, setIsSkipAttempt] = useState(false);
    const [engineeringNav, setEngineeringNav] = useState<EngineeringNavState>({ pillarId: null, topic: null, trackData: null });

    // --- PERSISTENCE ---
    useEffect(() => { localStorage.setItem('algolingo_preferences', JSON.stringify(preferences)); }, [preferences]);
    useEffect(() => { localStorage.setItem('algolingo_stats', JSON.stringify(stats)); }, [stats]);
    useEffect(() => { localStorage.setItem('algolingo_progress_v2', JSON.stringify(progressMap)); }, [progressMap]);
    useEffect(() => { localStorage.setItem('algolingo_mistakes', JSON.stringify(mistakes)); }, [mistakes]);
    useEffect(() => { localStorage.setItem('algolingo_saved_lessons', JSON.stringify(savedLessons)); }, [savedLessons]);
    useEffect(() => { localStorage.setItem('algolingo_career_sessions', JSON.stringify(careerSessions)); }, [careerSessions]);
    useEffect(() => { localStorage.setItem('algolingo_problem_data', JSON.stringify(problemDataCache)); }, [problemDataCache]);

    // Apply Theme
    useEffect(() => {
        const root = window.document.documentElement;
        if (preferences.theme === 'dark' || (preferences.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [preferences.theme]);

    // --- ACTIONS ---

    const updatePreferences = (p: Partial<UserPreferences>) => {
        setPreferences(prev => ({ ...prev, ...p }));
    };

    const handleSelectProblem = (id: string, name: string, currentLevel: number) => {
        setActiveProblem({ id, name });
        // Ensure progress entry exists
        if (!progressMap[preferences.targetLanguage]) {
            setProgressMap(prev => ({ ...prev, [preferences.targetLanguage]: {} }));
        }
        setView('unit-map');
    };

    const handleSaveProblemData = (problemId: string, data: ProblemData) => {
        setProblemDataCache(prev => ({
            ...prev,
            [problemId]: data
        }));
    };

    const handleStartNode = async (nodeIndex: number, isSkip: boolean = false, targetSolution?: SolutionStrategy) => {
        if (!activeProblem) return;
        setIsSkipAttempt(isSkip);
        setActiveNodeIndex(nodeIndex);
        setLoadingContext('lesson');
        setGenerationError(null);
        setGenerationRawError(null);

        // If we are starting a node, we MUST have the context already generated.
        // The UnitMap ensures this via the modal before calling this.
        // However, for safety in Simulator mode:
        if (nodeIndex === 6) {
            if (!activeProblemContext) {
                // This shouldn't happen if UnitMap works correctly, but handle gracefully
                setGenerationError("Problem context missing. Please regenerate in Unit Map.");
                return;
            }

            setCurrentLessonPlan({
                title: activeProblem.name,
                description: "LeetCode Simulator",
                screens: [], 
                suggestedQuestions: [],
                context: {
                    type: 'algo',
                    // Inject the target solution if selected, or default to first available
                    targetSolution: targetSolution || problemDataCache[activeProblem.id]?.solutions[0]
                }
            });
            setView('runner');
            return;
        }

        setView('loading');
        try {
            const problemMistakes = mistakes.filter(m => m.problemName === activeProblem.name);
            const plan = await generateLessonPlan(activeProblem.name, nodeIndex, preferences, problemMistakes, savedLessons, targetSolution);
            setCurrentLessonPlan(plan);
            setView('runner');
        } catch (e: any) {
            console.error(e);
            setGenerationError(e.message || "Generation Failed");
            if (e.rawOutput) setGenerationRawError(e.rawOutput);
        }
    };

    const handleStartReview = async (strategy: 'ai' | 'all' | 'specific' | 'category' | 'type' | 'time' | 'urgent', targetId?: string) => {
        setLoadingContext('review');
        setView('loading');
        setGenerationError(null);
        
        try {
            let plan: LessonPlan;
            let targetMistakes = mistakes.filter(m => !m.isResolved);

            if (strategy === 'specific' && targetId) {
                targetMistakes = mistakes.filter(m => m.id === targetId);
                const mistake = targetMistakes[0];
                if (mistake) {
                    // Retry specific logic
                    plan = {
                        title: `Review: ${mistake.problemName}`,
                        description: "Single mistake retry",
                        screens: [{ id: 'retry', header: 'Retry', widgets: [mistake.widget!], isRetry: true }],
                        suggestedQuestions: []
                    };
                } else {
                    throw new Error("Mistake not found");
                }
            } else {
                // Bulk review
                const learnedIds = Object.keys(progressMap[preferences.targetLanguage] || {});
                plan = await generateDailyWorkoutPlan(targetMistakes, learnedIds, preferences);
            }
            
            setCurrentLessonPlan(plan);
            setActiveNodeIndex(-1); // Special index for review
            setView('runner');
        } catch (e: any) {
            setGenerationError(e.message);
        }
    };

    const handleStartClinic = async () => {
        setLoadingContext('review');
        setView('loading');
        try {
            const plan = await generateSyntaxClinicPlan(preferences);
            setCurrentLessonPlan(plan);
            setActiveNodeIndex(-1);
            setView('runner');
        } catch (e: any) {
            setGenerationError(e.message);
        }
    };

    const handleGenerateVariant = async (mistakeId: string) => {
        setLoadingContext('review');
        setView('loading');
        try {
            const mistake = mistakes.find(m => m.id === mistakeId);
            if (!mistake) throw new Error("Mistake not found");
            const plan = await generateVariantLesson(mistake, preferences);
            setCurrentLessonPlan(plan);
            setActiveNodeIndex(-1);
            setView('runner');
        } catch (e: any) {
            setGenerationError(e.message);
        }
    };

    const handleStartCustomLesson = (plan: LessonPlan, isSkip: boolean = false) => {
        setCurrentLessonPlan(plan);
        const idx = plan.context?.phaseIndex !== undefined ? plan.context.phaseIndex : (plan.context?.type === 'career_exam' ? 0 : 0);
        setActiveNodeIndex(idx);
        setIsSkipAttempt(isSkip);
        setLoadingContext(plan.context?.type === 'career_exam' ? 'career_exam' : 'lesson');
        setView('runner');
    };

    const handleStartCareerSession = (session: CareerSession) => {
        if (session.mode === 'simulation') {
            setActiveCareerSession(session);
            setCareerSessions(prev => {
                const idx = prev.findIndex(s => s.id === session.id);
                if (idx >= 0) {
                    const updated = [...prev];
                    updated[idx] = session;
                    return updated;
                }
                return [session, ...prev];
            });
            setView('career-runner');
        }
    };

    const handleStartCareerExam = async (company: string, role: string, jdContext: string) => {
        setPendingExamConfig({ company, role, jd: jdContext });
        setLoadingContext('career_exam');
        setView('loading');
        setGenerationError(null);

        try {
            const plan = await generateRapidExam(company, role, jdContext, preferences);
            setCurrentLessonPlan(plan);
            setActiveNodeIndex(0); 
            setView('runner');
        } catch (e: any) {
            setGenerationError(e.message);
        }
    };

    const handleViewForgeItem = (roadmap: ForgeRoadmap) => {
        setActiveForgeItem(roadmap);
        setView('forge-detail');
    };

    const handleLessonComplete = (resultStats: { xp: number; streak: number }, shouldSave: boolean, sessionMistakes: MistakeRecord[]) => {
        const newStats = { ...stats };
        newStats.xp += resultStats.xp;
        newStats.streak = resultStats.streak > 0 ? resultStats.streak : newStats.streak; 
        
        const today = new Date().toISOString().split('T')[0];
        newStats.history = { ...newStats.history, [today]: (newStats.history[today] || 0) + resultStats.xp };
        setStats(newStats);

        if (sessionMistakes.length > 0) {
            setMistakes(prev => [...prev, ...sessionMistakes]);
        }

        if (shouldSave && currentLessonPlan) {
            const newSave: SavedLesson = {
                id: Date.now().toString(),
                problemId: activeProblem?.id || 'custom',
                nodeIndex: activeNodeIndex,
                timestamp: Date.now(),
                plan: currentLessonPlan,
                language: preferences.targetLanguage,
                xpEarned: resultStats.xp,
                mistakeCount: sessionMistakes.length
            };
            setSavedLessons(prev => [newSave, ...prev].slice(0, 50)); 
            
            if (activeProblem && activeNodeIndex !== -1) {
                const currentLevel = progressMap[preferences.targetLanguage]?.[activeProblem.id] || 0;
                const nextLevel = activeNodeIndex + 1;
                if (nextLevel > currentLevel) {
                    const newMap = { ...progressMap };
                    if (!newMap[preferences.targetLanguage]) newMap[preferences.targetLanguage] = {};
                    newMap[preferences.targetLanguage][activeProblem.id] = nextLevel;
                    setProgressMap(newMap);
                }
            }
        }
    };

    const handleRetryLoading = () => {
        if (loadingContext === 'lesson' && activeProblem) {
            handleStartNode(activeNodeIndex, isSkipAttempt);
        } else if (loadingContext === 'review') {
            handleStartReview('ai'); 
        } else if (loadingContext === 'career_exam' && pendingExamConfig) {
            handleStartCareerExam(pendingExamConfig.company, pendingExamConfig.role, pendingExamConfig.jd);
        }
    };

    const handleUpdateCurrentPlan = (newPlan: LessonPlan) => {
        setCurrentLessonPlan(newPlan);
    };

    // Data Import/Export
    const handleExportData = () => {
        const data = {
            stats, progress: progressMap, mistakes, preferences, savedLessons, careerSessions, problemDataCache,
            version: "3.2",
            timestamp: Date.now()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `algolingo_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    const handleImportData = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                handleDataLoaded(data);
            } catch (err) {
                alert("Invalid file format");
            }
        };
        reader.readAsText(file);
    };

    const handleDataLoaded = (data: any) => {
        try {
            if (data.stats) localStorage.setItem('algolingo_stats', JSON.stringify(data.stats));
            if (data.progress) localStorage.setItem('algolingo_progress_v2', JSON.stringify(data.progress));
            if (data.mistakes) localStorage.setItem('algolingo_mistakes', JSON.stringify(data.mistakes));
            if (data.savedLessons) localStorage.setItem('algolingo_saved_lessons', JSON.stringify(data.savedLessons));
            if (data.careerSessions) localStorage.setItem('algolingo_career_sessions', JSON.stringify(data.careerSessions));
            if (data.problemDataCache) localStorage.setItem('algolingo_problem_data', JSON.stringify(data.problemDataCache));
            
            if (data.engineeringData) {
                Object.entries(data.engineeringData).forEach(([key, value]) => {
                    localStorage.setItem(key, JSON.stringify(value));
                });
            }

            const currentPrefs = JSON.parse(localStorage.getItem('algolingo_preferences') || '{}');
            const newPrefs = { 
                ...currentPrefs, 
                ...data.preferences, 
                hasOnboarded: true 
            };
            localStorage.setItem('algolingo_preferences', JSON.stringify(newPrefs));

            if (data.stats) setStats(data.stats);
            if (data.progress) setProgressMap(data.progress);
            if (data.mistakes) setMistakes(data.mistakes);
            if (data.savedLessons) setSavedLessons(data.savedLessons);
            if (data.careerSessions) setCareerSessions(data.careerSessions);
            if (data.problemDataCache) setProblemDataCache(data.problemDataCache);
            
            setView('algorithms');
            setActiveTab('algorithms');
            setPreferences(newPrefs);

        } catch (e) {
            console.error("Data restore failed", e);
            alert("Failed to restore data. Please check the file format.");
        }
    };

    const onResetData = () => {
        if (window.confirm("Reset all data?")) {
            localStorage.clear();
            window.location.reload();
        }
    };

    return {
        state: { 
            view, activeTab, preferences, stats, progressMap, mistakes, savedLessons,
            activeProblem, activeProblemContext, problemDataCache, // Exported for components
            activeNodeIndex, currentLessonPlan, activeForgeItem, activeCareerSession,
            loadingContext, pendingExamConfig, generationError, generationRawError,
            isSkipAttempt, engineeringNav, careerSessions
        },
        actions: { 
            updatePreferences, handleSelectProblem, handleStartNode, handleStartReview, 
            handleStartClinic, handleGenerateVariant, setActiveTab, setView,
            handleImportData, handleDataLoaded, handleExportData, onResetData,
            handleStartCustomLesson, handleRetryLoading, handleLessonComplete,
            handleStartCareerSession, handleStartCareerExam, handleViewForgeItem, 
            handleUpdateCurrentPlan, setEngineeringNav, handleSaveProblemData
        }
    };
};
