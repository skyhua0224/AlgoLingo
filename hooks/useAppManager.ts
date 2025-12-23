
import { useState, useEffect, useRef, useCallback } from 'react';
import {
    UserStats, ProgressMap, LessonPlan, SavedLesson, MistakeRecord, UserPreferences, AppView, SolutionStrategy, Problem, LeetCodeContext, SyncStatus
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

// Helper: Get today's date string (UTC) to match history keys
const getTodayKey = () => new Date().toISOString().split('T')[0];

// Helper: Calculate streak from history
const calculateStreak = (history: Record<string, number>): number => {
    const today = getTodayKey();
    
    // Check if played today
    const playedToday = (history[today] || 0) > 0;
    
    // Check if played yesterday
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = d.toISOString().split('T')[0];
    const playedYesterday = (history[yesterday] || 0) > 0;

    // If neither, streak is broken (0)
    if (!playedToday && !playedYesterday) return 0;

    let streak = 0;
    // Start counting backwards
    // If played today, start from today. If not, start from yesterday (streak is still valid/frozen).
    let current = new Date(playedToday ? new Date() : d); 
    
    while (true) {
        const key = current.toISOString().split('T')[0];
        if ((history[key] || 0) > 0) {
            streak++;
            current.setDate(current.getDate() - 1); // Go back one day
        } else {
            break;
        }
    }
    return streak;
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

    const [engineeringNav, setEngineeringNav] = useState<EngineeringNavState>({
        pillarId: null,
        topic: null,
        trackData: null
    });

    // --- STATE REFS (For Sync Freshness) ---
    // We maintain a ref that always holds the latest state, so the sync callback 
    // (which might be delayed) can access the truly current data without closure staleness.
    const stateRef = useRef({
        stats, progressMap, mistakes, savedLessons, careerSessions, preferences
    });

    useEffect(() => {
        stateRef.current = { stats, progressMap, mistakes, savedLessons, careerSessions, preferences };
        // Sync to LocalStorage immediately on change
        localStorage.setItem('algolingo_preferences', JSON.stringify(preferences));
        localStorage.setItem('algolingo_stats', JSON.stringify(stats));
        localStorage.setItem('algolingo_progress_v2', JSON.stringify(progressMap));
        localStorage.setItem('algolingo_mistakes', JSON.stringify(mistakes));
        localStorage.setItem('algolingo_saved_lessons', JSON.stringify(savedLessons));
        localStorage.setItem('algolingo_career_sessions', JSON.stringify(careerSessions));
    }, [stats, progressMap, mistakes, savedLessons, careerSessions, preferences]);

    // --- AUTO-CORRECT STREAK ---
    // Whenever stats history changes, verify streak matches history.
    // This fixes the bug where streak is 1 but history has 5 days.
    useEffect(() => {
        const correctStreak = calculateStreak(stats.history);
        if (stats.streak !== correctStreak) {
            setStats(prev => ({ ...prev, streak: correctStreak }));
        }
    }, [stats.history]);

    // --- DATA COLLECTION ---
    const collectFullState = useCallback(() => {
        // 1. Gather dynamic localStorage keys (Engineering, Forge, Cache)
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

        // 2. Combine with Core State from Ref
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
    }, []); // No deps needed as it uses ref

    // --- SYNC ENGINE ---
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

    // Helper Action: Component calls this when it modifies important data
    const notifyDataChange = (highPriority = false) => {
        if (!preferences.syncConfig.autoSync) return;
        requestSync({ force: highPriority, delay: highPriority ? 0 : 5000 });
    };

    const updatePreferences = (p: Partial<UserPreferences>) => {
        setPreferences(prev => ({ ...prev, ...p }));
        // Preferences changes are usually medium priority, debounce 2s
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
        // Context generation is expensive, sync it casually
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

    const handleLessonComplete = (resultStats: { xp: number; streak: number }, shouldSave: boolean, sessionMistakes: MistakeRecord[]) => {
        setStats(prev => {
            const today = getTodayKey();
            
            // Just update XP and History here. 
            // The useEffect will handle streak recalculation automatically based on the new history.
            const newHistory = { 
                ...prev.history, 
                [today]: (prev.history[today] || 0) + resultStats.xp 
            };

            return {
                ...prev,
                xp: prev.xp + resultStats.xp,
                // Streak is auto-calculated by effect, but we can optimistically update if we want.
                // We'll let the effect do it to ensure consistency.
                lastPlayed: today,
                history: newHistory
            };
        });

        setMistakes(prev => {
            const updated = [...prev];
            const pId = currentLessonPlan?.context?.problemId;

            if (loadingContext === 'review' && sessionMistakes.length === 0) {
                if (reviewTargetId) {
                    const idx = updated.findIndex(m => m.id === reviewTargetId);
                    if (idx !== -1) updated[idx] = { ...updated[idx], isResolved: true, proficiency: 2 };
                } else {
                    currentLessonPlan?.screens.forEach(s => {
                        const mIdx = updated.findIndex(m => m.problemName === currentLessonPlan.title && m.context === s.header);
                        if (mIdx !== -1) updated[mIdx].isResolved = true;
                    });
                }
            }

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
            const problemId = currentLessonPlan.context?.problemId || 'custom';
            setSavedLessons(prev => [{
                id: Date.now().toString(),
                problemId,
                nodeIndex: activeNodeIndex,
                timestamp: Date.now(),
                plan: currentLessonPlan,
                language: preferences.targetLanguage,
                xpEarned: resultStats.xp,
                mistakeCount: sessionMistakes.length
            }, ...prev].slice(0, 50));

            if (problemId !== 'custom' && activeNodeIndex !== -1) {
                const nextLevel = activeNodeIndex + 1;
                const currentLevel = progressMap[preferences.targetLanguage]?.[problemId] || 0;
                if (nextLevel > currentLevel) {
                    setProgressMap(prev => ({ ...prev, [preferences.targetLanguage]: { ...prev[preferences.targetLanguage], [problemId]: nextLevel } }));
                }
            }
        }
        
        notifyDataChange(true);
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
                if (key.startsWith('algolingo_')) {
                    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
                }
            });
        }
        
        setRefreshKey(k => k + 1);
        requestSync({ force: true });
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
            } catch (err) {
                alert("Invalid JSON file");
            }
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

    const handleRetryLoading = () => {
        handleStartNode(activeNodeIndex, isSkipAttempt);
    };

    return {
        state: { 
            view, activeTab, preferences, stats, progressMap, mistakes, savedLessons, syncStatus,
            activeProblem, activeNodeIndex, currentLessonPlan, activeForgeItem, activeCareerSession,
            loadingContext, generationError, generationRawError,
            isSkipAttempt, careerSessions, activeProblemContext, refreshKey, engineeringNav
        },
        actions: { 
            updatePreferences, handleSelectProblem, handleStartNode, handleStartReview, 
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
