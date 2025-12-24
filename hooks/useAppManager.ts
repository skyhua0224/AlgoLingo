
import { useState, useEffect, useRef, useCallback } from 'react';
import {
    UserStats, ProgressMap, LessonPlan, SavedLesson, MistakeRecord, UserPreferences, AppView, SolutionStrategy, Problem, LeetCodeContext, SyncStatus, RetentionRecord
} from '../types';
import { ForgeRoadmap } from '../types/forge';
import { CareerSession, CareerStage } from '../types/career';
import { EngineeringTopic, SkillTrack } from '../types/engineering';
import {
    INITIAL_STATS, DEFAULT_API_CONFIG, PROBLEM_MAP
} from '../constants';
import {
    generateLessonPlan, generateDailyWorkoutPlan, generateSyntaxClinicPlan, generateVariantLesson, generateLeetCodeContext
} from '../services/geminiService';
import { generateRapidExam } from '../services/ai/career/generator';
import { useSync } from './useSync';

export interface EngineeringNavState {
    pillarId: 'system' | 'cs' | 'track' | null;
    topic: EngineeringTopic | null;
    trackData: SkillTrack | null;
}

const safeParse = <T>(key: string, fallback: T): T => {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;
    } catch (e) {
        return fallback;
    }
};

const generateFingerprint = (m: MistakeRecord) => {
    const pId = m.problemId || 'unknown';
    const type = m.questionType || 'unknown';
    const ctx = (m.context || '').trim().toLowerCase().substring(0, 50);
    return `${pId}|${type}|${ctx}`;
};

export const useAppManager = () => {
    const [view, setView] = useState<AppView>('algorithms');
    const [activeTab, setActiveTab] = useState<AppView>('algorithms');
    const [refreshKey, setRefreshKey] = useState(0); 

    // Data states
    const [preferences, setPreferences] = useState<UserPreferences>(() => safeParse('algolingo_preferences', {
        userName: 'Senior Engineer',
        hasOnboarded: false,
        targetLanguage: 'Python',
        spokenLanguage: 'Chinese',
        apiConfig: DEFAULT_API_CONFIG,
        theme: 'system',
        notificationConfig: { enabled: false, webhookUrl: '', type: 'custom' },
        syncConfig: { enabled: true, githubToken: '', autoSync: true },
        activeStrategies: {}
    }));

    const [stats, setStats] = useState<UserStats>(() => safeParse('algolingo_stats', INITIAL_STATS));
    const [progressMap, setProgressMap] = useState<ProgressMap>(() => safeParse('algolingo_progress_v2', {}));
    const [mistakes, setMistakes] = useState<MistakeRecord[]>(() => safeParse('algolingo_mistakes', []));
    const [savedLessons, setSavedLessons] = useState<SavedLesson[]>(() => safeParse('algolingo_saved_lessons', []));
    const [careerSessions, setCareerSessions] = useState<CareerSession[]>(() => safeParse('algolingo_career_sessions', []));

    // UI States
    const [activeProblem, setActiveProblem] = useState<Problem | null>(null);
    const [activeProblemContext, setActiveProblemContext] = useState<LeetCodeContext | null>(null);
    const [activeNodeIndex, setActiveNodeIndex] = useState(0);
    const [currentLessonPlan, setCurrentLessonPlan] = useState<LessonPlan | null>(null);
    const [activeForgeItem, setActiveForgeItem] = useState<ForgeRoadmap | null>(null);
    const [activeCareerSession, setActiveCareerSession] = useState<CareerSession | null>(null);
    const [loadingContext, setLoadingContext] = useState<'lesson' | 'review' | 'career_exam'>('lesson');
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [generationRawError, setGenerationRawError] = useState<string | null>(null);
    const [isSkipAttempt, setIsSkipAttempt] = useState(false);
    const [reviewTargetId, setReviewTargetId] = useState<string | null>(null);
    
    // Review Queue State
    const [reviewQueue, setReviewQueue] = useState<string[]>([]);

    const [engineeringNav, setEngineeringNav] = useState<EngineeringNavState>({
        pillarId: null,
        topic: null,
        trackData: null
    });

    const stateRef = useRef({
        stats, progressMap, mistakes, savedLessons, careerSessions, preferences
    });

    useEffect(() => {
        stateRef.current = { stats, progressMap, mistakes, savedLessons, careerSessions, preferences };
        localStorage.setItem('algolingo_preferences', JSON.stringify(preferences));
        localStorage.setItem('algolingo_stats', JSON.stringify(stats));
        localStorage.setItem('algolingo_progress_v2', JSON.stringify(progressMap));
        localStorage.setItem('algolingo_mistakes', JSON.stringify(mistakes));
        localStorage.setItem('algolingo_saved_lessons', JSON.stringify(savedLessons));
        localStorage.setItem('algolingo_career_sessions', JSON.stringify(careerSessions));
    }, [stats, progressMap, mistakes, savedLessons, careerSessions, preferences]);

    const collectFullState = useCallback(() => {
        const engineeringData: Record<string, any> = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('algolingo_')) {
                const skipKeys = [
                    'algolingo_preferences', 'algolingo_stats', 'algolingo_progress_v2', 
                    'algolingo_mistakes', 'algolingo_saved_lessons', 'algolingo_career_sessions'
                ];
                if (!skipKeys.includes(key)) {
                    try {
                        engineeringData[key] = JSON.parse(localStorage.getItem(key)!);
                    } catch (e) {
                        engineeringData[key] = localStorage.getItem(key);
                    }
                }
            }
        }

        const current = stateRef.current;
        return {
            stats: current.stats,
            progress: current.progressMap,
            mistakes: current.mistakes,
            savedLessons: current.savedLessons,
            careerSessions: current.careerSessions,
            preferences: current.preferences,
            engineeringData,
            version: "3.6"
        };
    }, []);

    const { status: syncStatus, requestSync } = useSync({
        config: preferences.syncConfig,
        onGetFreshData: collectFullState,
        onSyncComplete: (newConfig) => {
            setPreferences(prev => ({
                ...prev,
                syncConfig: { ...prev.syncConfig, ...newConfig }
            }));
        }
    });

    const notifyDataChange = (highPriority = false) => {
        if (!preferences.syncConfig.autoSync) return;
        requestSync({ force: highPriority, delay: highPriority ? 0 : 5000 });
    };

    const updatePreferences = (p: Partial<UserPreferences>) => {
        setPreferences(prev => ({ ...prev, ...p }));
        if (preferences.syncConfig.autoSync) requestSync({ delay: 2000 });
    };

    const handleSelectProblem = (id: string, name: string, currentLevel: number) => {
        setActiveProblem({ id, name });
        setActiveProblemContext(null); 
        setView('unit-map');
    };

    const handleEnsureProblemContext = async (problemName: string) => {
        const cacheKey = `algolingo_ctx_v3_${problemName}_${preferences.targetLanguage}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try { setActiveProblemContext(JSON.parse(cached)); return; } catch(e) {}
        }
        const context = await generateLeetCodeContext(problemName, preferences);
        setActiveProblemContext(context);
        localStorage.setItem(cacheKey, JSON.stringify(context));
        notifyDataChange(false);
    };

    const handleStartNode = async (nodeIndex: number, isSkip: boolean = false, targetSolution?: SolutionStrategy) => {
        if (!activeProblem) return;
        setIsSkipAttempt(isSkip);
        setActiveNodeIndex(nodeIndex);
        setLoadingContext('lesson');
        setGenerationError(null);
        setReviewTargetId(null);

        if (nodeIndex === 6) {
            setCurrentLessonPlan({
                title: activeProblem.name,
                description: "IDE Simulator",
                screens: [], 
                suggestedQuestions: [],
                context: { type: 'algo', targetSolution, problemId: activeProblem.id }
            });
            setView('runner');
            return;
        }

        setView('loading');
        try {
            const problemMistakes = mistakes.filter(m => m.problemId === activeProblem.id);
            const plan = await generateLessonPlan(activeProblem.name, nodeIndex, preferences, problemMistakes, savedLessons, targetSolution);
            plan.context = { ...plan.context, problemId: activeProblem.id, type: 'algo' };
            setCurrentLessonPlan(plan);
            setView('runner');
        } catch (e: any) {
            setGenerationError(e.message);
        }
    };

    const handleOpenIDE = async (problemId: string) => {
        const problemData = PROBLEM_MAP[problemId];
        const problemName = problemData ? problemData[preferences.spokenLanguage === 'Chinese' ? 'zh' : 'en'] : problemId;
        
        setActiveProblem({ id: problemId, name: problemName });
        setActiveNodeIndex(6); // Force IDE Mode
        setLoadingContext('review'); // Tag as review context
        
        const cacheKey = `algolingo_ctx_v3_${problemName}_${preferences.targetLanguage}`;
        const cached = localStorage.getItem(cacheKey);
        
        let contextToUse: LeetCodeContext | null = null;

        if (cached) {
            try { 
                contextToUse = JSON.parse(cached);
            } catch(e) {}
        } 
        
        if (!contextToUse) {
            setView('loading');
            try {
                contextToUse = await generateLeetCodeContext(problemName, preferences);
                localStorage.setItem(cacheKey, JSON.stringify(contextToUse));
                notifyDataChange(false);
            } catch (e: any) {
                setGenerationError(e.message || "Failed to load problem context.");
                return;
            }
        }

        setActiveProblemContext(contextToUse);

        setCurrentLessonPlan({
            title: problemName,
            description: "Review Session",
            screens: [],
            suggestedQuestions: [],
            context: { type: 'algo', problemId: problemId }
        });
        
        setView('runner');
    };

    const handleStartReviewSession = (problemIds: string[]) => {
        if (problemIds.length === 0) return;
        setReviewQueue(problemIds);
        handleOpenIDE(problemIds[0]); 
    };

    // --- UPDATED SRS LOGIC (Problem 4) ---
    const handleLessonComplete = (resultStats: { xp: number; streak: number }, shouldSave: boolean, sessionMistakes: MistakeRecord[], evaluation?: { score: number; time: number }) => {
        
        const now = Date.now();
        const pId = currentLessonPlan?.context?.problemId;

        setStats(prev => ({
            ...prev,
            xp: prev.xp + resultStats.xp,
            streak: resultStats.streak > 0 ? resultStats.streak : prev.streak,
            history: { ...prev.history, [new Date().toISOString().split('T')[0]]: (prev.history[new Date().toISOString().split('T')[0]] || 0) + resultStats.xp },
            
            // --- SRS V2 ALGORITHM ---
            retention: (() => {
                if (!pId || !evaluation) return prev.retention; 
                
                const existing = prev.retention?.[pId] || { 
                    problemId: pId, lastReview: 0, nextReview: 0, interval: 0, streak: 0, stability: 0, history: [] 
                };

                const score = evaluation.score; // 0-3
                let newInterval = existing.interval; // Default to current
                let newStreak = existing.streak;
                let nextReviewDate = existing.nextReview;

                // --- CHECK: EARLY REVIEW GUARD ---
                // Only update interval logic if the item is actually DUE (or if it's a new item)
                const isDue = existing.nextReview <= now;
                const isNew = existing.interval === 0;

                if (isDue || isNew) {
                    // Standard SRS Logic
                    const currentInterval = existing.interval;

                    // "1 Day" zone (Current <= 1)
                    if (currentInterval <= 1) {
                        if (score >= 2) { newInterval = 3; newStreak++; } 
                        else { newInterval = 1; newStreak = 0; } 
                    } 
                    // "3 Days" zone (Current >= 3 && < 7)
                    else if (currentInterval >= 3 && currentInterval < 7) {
                        if (score >= 2) { newInterval = 7; newStreak++; } 
                        else { newInterval = 1; newStreak = 0; } 
                    }
                    // "7 Days" zone (Current >= 7 && < 30)
                    else if (currentInterval >= 7 && currentInterval < 30) {
                        if (score >= 2) { newInterval = 15; newStreak++; } 
                        else { newInterval = 3; newStreak = 0; } 
                    }
                    // "30 Days+" zone (Current >= 30)
                    else {
                        if (score >= 2) { newInterval = 30; newStreak++; } // Cap at 30
                        else { newInterval = 7; newStreak = 0; } 
                    }

                    // HARD CAP: Max 30 days
                    if (newInterval > 30) newInterval = 30;

                    nextReviewDate = now + (newInterval * 24 * 60 * 60 * 1000);
                } else {
                    // EARLY REVIEW: Keep interval/nextReview same. Just record history.
                    // Effectively "Practice Mode"
                    newInterval = existing.interval;
                    nextReviewDate = existing.nextReview; // Keep original due date
                }

                // Append History
                const newHistory = [...(existing.history || []), {
                    date: now,
                    qScore: score,
                    timeSpent: evaluation.time
                }].slice(-10); // Keep last 10

                return {
                    ...prev.retention,
                    [pId]: {
                        ...existing,
                        lastReview: now,
                        nextReview: nextReviewDate,
                        interval: newInterval,
                        streak: newStreak,
                        history: newHistory
                    }
                };
            })()
        }));

        setMistakes(prev => {
            const updated = [...prev];
            sessionMistakes.forEach(m => {
                const finger = generateFingerprint({ ...m, problemId: pId });
                const existingIdx = updated.findIndex(ex => generateFingerprint(ex) === finger);
                if (existingIdx !== -1) {
                    updated[existingIdx] = { ...updated[existingIdx], timestamp: Date.now(), failureCount: (updated[existingIdx].failureCount || 1) + 1, isResolved: false, proficiency: 0 };
                } else {
                    updated.push({ ...m, problemId: pId, isResolved: false, failureCount: 1, proficiency: 0 });
                }
            });
            return updated;
        });

        if (shouldSave && currentLessonPlan) {
             setSavedLessons(prev => [{
                id: Date.now().toString(),
                problemId: pId || 'custom',
                nodeIndex: activeNodeIndex,
                timestamp: Date.now(),
                plan: currentLessonPlan,
                language: preferences.targetLanguage,
                xpEarned: resultStats.xp,
                mistakeCount: sessionMistakes.length
            }, ...prev].slice(0, 50));
            
            if (pId && pId !== 'custom' && activeNodeIndex !== -1 && activeNodeIndex < 6) {
                const nextLevel = activeNodeIndex + 1;
                const currentLevel = progressMap[preferences.targetLanguage]?.[pId] || 0;
                if (nextLevel > currentLevel) {
                    setProgressMap(prev => ({ ...prev, [preferences.targetLanguage]: { ...prev[preferences.targetLanguage], [pId]: nextLevel } }));
                }
            }
        }
        
        notifyDataChange(true);

        if (reviewQueue.length > 1) {
            const nextQueue = reviewQueue.slice(1);
            setReviewQueue(nextQueue);
            setTimeout(() => handleOpenIDE(nextQueue[0]), 500);
        } else {
            setReviewQueue([]);
        }
    };

    const handleStartReview = async (strategy: 'ai' | 'all' | 'specific' | 'category' | 'type' | 'time' | 'urgent', targetId?: string) => {
        setLoadingContext('review');
        setView('loading');
        setReviewTargetId(strategy === 'specific' ? targetId || null : null);
        try {
            let plan: LessonPlan;
            if (strategy === 'specific' && targetId) {
                const mistake = mistakes.find(m => m.id === targetId);
                if (!mistake) throw new Error("Not found");
                plan = {
                    title: `Review: ${mistake.problemName}`,
                    description: "Retry",
                    screens: [{ id: 'retry', header: 'Retry', widgets: [mistake.widget!], isRetry: true }],
                    suggestedQuestions: [],
                    context: { type: 'algo', problemId: mistake.problemId }
                };
            } else {
                const learnedIds = Object.keys(progressMap[preferences.targetLanguage] || {});
                plan = await generateDailyWorkoutPlan(mistakes.filter(m => !m.isResolved), learnedIds, preferences);
            }
            setCurrentLessonPlan(plan);
            setActiveNodeIndex(-1);
            setView('runner');
        } catch (e: any) {
            setGenerationError(e.message);
        }
    };

    const handleDataLoaded = (data: any) => {
        if (data.stats) setStats(data.stats);
        if (data.progress) setProgressMap(data.progress);
        if (data.mistakes) setMistakes(data.mistakes);
        if (data.savedLessons) setSavedLessons(data.savedLessons);
        if (data.careerSessions) setCareerSessions(data.careerSessions);
        if (data.preferences) setPreferences(prev => ({ ...prev, ...data.preferences, hasOnboarded: true }));
        if (data.engineeringData) {
            Object.entries(data.engineeringData).forEach(([key, value]) => {
                if (key.startsWith('algolingo_')) localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
            });
        }
        setRefreshKey(k => k + 1);
        requestSync({ force: true });
    };

    const handleRetryLoading = () => {
        handleStartNode(activeNodeIndex, isSkipAttempt);
    };

    const handleExportData = () => {
        const data = collectFullState();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `algolingo_full_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    const handleImportData = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                handleDataLoaded(data);
            } catch (err) { alert("Invalid JSON file"); }
        };
        reader.readAsText(file);
    };

    const onResetData = () => {
        localStorage.clear();
        setStats(INITIAL_STATS);
        setProgressMap({});
        setMistakes([]);
        setSavedLessons([]);
        setCareerSessions([]);
        setPreferences({
            userName: 'Senior Engineer',
            hasOnboarded: false,
            targetLanguage: 'Python',
            spokenLanguage: 'Chinese',
            apiConfig: DEFAULT_API_CONFIG,
            theme: 'system',
            notificationConfig: { enabled: false, webhookUrl: '', type: 'custom' },
            syncConfig: { enabled: true, githubToken: '', autoSync: true },
            activeStrategies: {}
        });
        setRefreshKey(k => k + 1);
        setView('algorithms'); 
    };

    const handleViewForgeItem = (item: ForgeRoadmap) => {
        setActiveForgeItem(item);
        setView('forge-detail');
    };

    const handleStartCareerSession = (session: CareerSession) => {
        setActiveCareerSession(session);
        setCareerSessions(prev => {
            const exists = prev.find(s => s.id === session.id);
            if (exists) return prev.map(s => s.id === session.id ? session : s);
            return [session, ...prev];
        });
        setView('career-runner');
        notifyDataChange(false);
    };

    const handleStartCareerExam = async (company: string, role: string, jd: string) => {
        setLoadingContext('career_exam');
        setView('loading');
        try {
            const plan = await generateRapidExam(company, role, jd, preferences);
            setCurrentLessonPlan(plan);
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
            setView('runner');
        } catch (e: any) {
            setGenerationError(e.message);
        }
    };

    const handleGenerateVariant = async (mistakeId: string) => {
        const mistake = mistakes.find(m => m.id === mistakeId);
        if (!mistake) return;
        setLoadingContext('review');
        setView('loading');
        try {
            const plan = await generateVariantLesson(mistake, preferences);
            setCurrentLessonPlan(plan);
            setView('runner');
        } catch (e: any) {
            setGenerationError(e.message);
        }
    };

    return {
        state: { 
            view, activeTab, preferences, stats, progressMap, mistakes, savedLessons, syncStatus,
            activeProblem, activeNodeIndex, currentLessonPlan, activeForgeItem, activeCareerSession,
            loadingContext, generationError, generationRawError,
            isSkipAttempt, careerSessions, activeProblemContext, refreshKey, engineeringNav, reviewQueue
        },
        actions: { 
            updatePreferences, handleSelectProblem, handleStartNode, handleStartReview, handleOpenIDE, startReviewSession: handleStartReviewSession,
            setActiveTab, setView, handleDataLoaded, handleLessonComplete, 
            triggerSync: () => requestSync({ force: true }),
            notifyDataChange,
            handleEnsureProblemContext, 
            handleStartCustomLesson: (plan: any) => { setCurrentLessonPlan(plan); setView('runner'); },
            handleRetryLoading,
            handleExportData, handleImportData, onResetData, handleViewForgeItem, 
            handleStartCareerSession, handleStartCareerExam, handleStartClinic, handleGenerateVariant,
            setEngineeringNav, collectFullState
        }
    };
};
