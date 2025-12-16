
import { useState, useEffect } from 'react';
import {
    UserStats, ProgressMap, LessonPlan, SavedLesson, MistakeRecord, UserPreferences, AppView, SolutionStrategy, Problem, LeetCodeContext
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

// Helper for safe parsing
const safeParse = <T>(key: string, fallback: T): T => {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;
    } catch (e) {
        console.warn(`Failed to parse ${key}, using fallback.`, e);
        return fallback;
    }
};

// Fingerprint Helper
const generateFingerprint = (m: MistakeRecord) => {
    const ctx = (m.context || '').trim().toLowerCase();
    const name = (m.problemName || '').trim().toLowerCase();
    const type = m.questionType || 'unknown';
    // Use first 50 chars of context to key, enough to distinguish but not too long
    return `${name}|${type}|${ctx.substring(0, 50)}`; 
};

// Helper: Deduplicate Mistakes Array (Merge Strategy)
const deduplicateMistakes = (rawMistakes: MistakeRecord[]): MistakeRecord[] => {
    const map = new Map<string, MistakeRecord>();
    
    rawMistakes.forEach(m => {
        const fp = generateFingerprint(m);
        const existing = map.get(fp);
        
        if (existing) {
            // Merge strategy: Keep most recent timestamp, sum failures, take best status
            map.set(fp, {
                ...existing,
                timestamp: Math.max(existing.timestamp, m.timestamp),
                failureCount: (existing.failureCount || 1) + (m.failureCount || 1),
                reviewCount: (existing.reviewCount || 0) + (m.reviewCount || 0),
                proficiency: Math.max(existing.proficiency || 0, m.proficiency || 0),
                isResolved: existing.isResolved || m.isResolved // If solved anywhere, it's solved
            });
        } else {
            map.set(fp, m);
        }
    });
    
    return Array.from(map.values());
};

export const useAppManager = () => {
    // --- STATE ---
    const [view, setView] = useState<AppView>('algorithms');
    const [activeTab, setActiveTabState] = useState<AppView>('algorithms');
    const [refreshKey, setRefreshKey] = useState(0); 

    // Data 
    const [preferences, setPreferences] = useState<UserPreferences>(() => safeParse('algolingo_preferences', {
        userName: 'Guest',
        hasOnboarded: false,
        targetLanguage: 'Python',
        spokenLanguage: 'English',
        apiConfig: DEFAULT_API_CONFIG,
        theme: 'system',
        notificationConfig: { enabled: false, webhookUrl: '', type: 'custom' },
        syncConfig: { enabled: false, githubToken: '' },
        activeStrategies: {} // Default empty map
    }));

    const [stats, setStats] = useState<UserStats>(() => safeParse('algolingo_stats', INITIAL_STATS));
    const [progressMap, setProgressMap] = useState<ProgressMap>(() => safeParse('algolingo_progress_v2', {}));
    const [mistakes, setMistakes] = useState<MistakeRecord[]>(() => safeParse('algolingo_mistakes', []));
    const [savedLessons, setSavedLessons] = useState<SavedLesson[]>(() => safeParse('algolingo_saved_lessons', []));
    const [careerSessions, setCareerSessions] = useState<CareerSession[]>(() => safeParse('algolingo_career_sessions', []));

    // Session / Navigation Context
    const [activeProblem, setActiveProblem] = useState<Problem | null>(null);
    const [activeProblemContext, setActiveProblemContext] = useState<LeetCodeContext | null>(null);
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
    
    // NEW: Track which mistake is being specifically reviewed to increment proficiency on success
    const [reviewTargetId, setReviewTargetId] = useState<string | null>(null);

    // --- PERSISTENCE ---
    useEffect(() => { localStorage.setItem('algolingo_preferences', JSON.stringify(preferences)); }, [preferences]);
    useEffect(() => { localStorage.setItem('algolingo_stats', JSON.stringify(stats)); }, [stats]);
    useEffect(() => { localStorage.setItem('algolingo_progress_v2', JSON.stringify(progressMap)); }, [progressMap]);
    useEffect(() => { localStorage.setItem('algolingo_mistakes', JSON.stringify(mistakes)); }, [mistakes]);
    useEffect(() => { localStorage.setItem('algolingo_saved_lessons', JSON.stringify(savedLessons)); }, [savedLessons]);
    useEffect(() => { localStorage.setItem('algolingo_career_sessions', JSON.stringify(careerSessions)); }, [careerSessions]);

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

    // Navigation Reset on Tab Change
    const setActiveTab = (tab: AppView) => {
        setActiveTabState(tab);
        // FORCE RESET NAVIGATION STACK
        setView('dashboard');
        setActiveProblem(null);
        setActiveForgeItem(null);
        setActiveCareerSession(null);
        setActiveProblemContext(null);
    };

    const handleSelectProblem = (id: string, name: string, currentLevel: number) => {
        setActiveProblem({ id, name });
        setActiveProblemContext(null); 
        if (!progressMap[preferences.targetLanguage]) {
            setProgressMap(prev => ({ ...prev, [preferences.targetLanguage]: {} }));
        }
        setView('unit-map');
    };

    const handleEnsureProblemContext = async (problemName: string) => {
        const cacheKey = `algolingo_ctx_v3_${problemName}_${preferences.targetLanguage}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                setActiveProblemContext(parsed);
                return;
            } catch(e) {}
        }

        try {
            const context = await generateLeetCodeContext(problemName, preferences);
            setActiveProblemContext(context);
            localStorage.setItem(cacheKey, JSON.stringify(context));
        } catch (e) {
            console.error("Failed to generate problem context", e);
            throw e;
        }
    };

    const handleStartNode = async (nodeIndex: number, isSkip: boolean = false, targetSolution?: SolutionStrategy) => {
        if (!activeProblem) return;
        setIsSkipAttempt(isSkip);
        setActiveNodeIndex(nodeIndex);
        setLoadingContext('lesson');
        setGenerationError(null);
        setGenerationRawError(null);
        setReviewTargetId(null); // Clear review target for new lessons

        if (nodeIndex === 6) {
            setCurrentLessonPlan({
                title: activeProblem.name,
                description: "LeetCode Simulator",
                screens: [], 
                suggestedQuestions: [],
                context: {
                    type: 'algo',
                    targetSolution
                }
            });
            setView('runner');
            return;
        }

        setView('loading');
        try {
            const problemMistakes = mistakes.filter(m => m.problemName === activeProblem.name);
            const plan = await generateLessonPlan(
                activeProblem.name, 
                nodeIndex, 
                preferences, 
                problemMistakes, 
                savedLessons, 
                targetSolution
            );
            
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
        
        // If specific review, set the target ID so we can increment proficiency on success
        if (strategy === 'specific' && targetId) {
            setReviewTargetId(targetId);
        } else {
            setReviewTargetId(null);
        }
        
        try {
            let plan: LessonPlan;
            let targetMistakes = mistakes.filter(m => !m.isResolved);

            if (strategy === 'specific' && targetId) {
                targetMistakes = mistakes.filter(m => m.id === targetId);
                const mistake = targetMistakes[0];
                if (mistake) {
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
                const learnedIds = Object.keys(progressMap[preferences.targetLanguage] || {});
                plan = await generateDailyWorkoutPlan(targetMistakes, learnedIds, preferences);
            }
            
            setCurrentLessonPlan(plan);
            setActiveNodeIndex(-1);
            setView('runner');
        } catch (e: any) {
            setGenerationError(e.message);
        }
    };

    const handleStartClinic = async () => {
        setLoadingContext('review');
        setReviewTargetId(null);
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
        setReviewTargetId(null); // Variant is a new problem effectively
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
        setReviewTargetId(null);
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
        setReviewTargetId(null);
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

        // --- MISTAKE MANAGEMENT ---
        setMistakes(prev => {
            const updated = [...prev];

            // 1. PROFICIENCY INCREMENT (Success Logic)
            if (loadingContext === 'review' && reviewTargetId && sessionMistakes.length === 0) {
                const targetIdx = updated.findIndex(m => m.id === reviewTargetId);
                if (targetIdx !== -1) {
                    const target = updated[targetIdx];
                    const newProf = (target.proficiency || 0) + 1;
                    
                    updated[targetIdx] = {
                        ...target,
                        proficiency: newProf,
                        reviewCount: (target.reviewCount || 0) + 1,
                        isResolved: newProf >= 2 ? true : target.isResolved 
                    };
                }
            }

            // 2. MISTAKE UPSERT (Failure Logic)
            if (sessionMistakes.length > 0) {
                sessionMistakes.forEach(newMistake => {
                    const fp = generateFingerprint(newMistake);
                    const existingIndex = updated.findIndex(m => generateFingerprint(m) === fp);

                    if (existingIndex !== -1) {
                        const existing = updated[existingIndex];
                        updated[existingIndex] = {
                            ...existing,
                            timestamp: Date.now(), 
                            failureCount: (existing.failureCount || 1) + 1,
                            isResolved: false,
                            proficiency: 0 
                        };
                    } else {
                        updated.push({
                            ...newMistake,
                            proficiency: 0,
                            failureCount: 1,
                            isResolved: false
                        });
                    }
                });
            }
            return updated;
        });
        
        setReviewTargetId(null);

        if (shouldSave && currentLessonPlan) {
            const problemId = activeProblem?.id || 'custom';
            
            setSavedLessons(prev => {
                const recentDuplicate = prev.find(l => 
                    l.problemId === problemId && 
                    l.nodeIndex === activeNodeIndex && 
                    (Date.now() - l.timestamp) < 60000
                );

                if (recentDuplicate) return prev;

                const newSave: SavedLesson = {
                    id: Date.now().toString(),
                    problemId: problemId,
                    nodeIndex: activeNodeIndex,
                    timestamp: Date.now(),
                    plan: currentLessonPlan,
                    language: preferences.targetLanguage,
                    xpEarned: resultStats.xp,
                    mistakeCount: sessionMistakes.length
                };
                
                return [newSave, ...prev].slice(0, 50); 
            });
            
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

    const handleExportData = () => {
        const data = {
            stats, progress: progressMap, mistakes, preferences, savedLessons, careerSessions,
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
            if (data.mistakes) {
                const cleanMistakes = deduplicateMistakes(data.mistakes);
                localStorage.setItem('algolingo_mistakes', JSON.stringify(cleanMistakes));
                setMistakes(cleanMistakes);
            }
            if (data.savedLessons) localStorage.setItem('algolingo_saved_lessons', JSON.stringify(data.savedLessons));
            if (data.careerSessions) localStorage.setItem('algolingo_career_sessions', JSON.stringify(data.careerSessions));
            
            if (data.engineeringData) {
                Object.entries(data.engineeringData).forEach(([key, value]) => {
                    localStorage.setItem(key, JSON.stringify(value));
                });
            }

            if (data.stats) setStats(data.stats);
            if (data.progress) setProgressMap(data.progress);
            if (data.savedLessons) setSavedLessons(data.savedLessons);
            if (data.careerSessions) setCareerSessions(data.careerSessions);

            const currentPrefs = safeParse('algolingo_preferences', {});
            const newPrefs = { 
                ...currentPrefs, 
                ...data.preferences, 
                hasOnboarded: true 
            };
            localStorage.setItem('algolingo_preferences', JSON.stringify(newPrefs));
            setPreferences(newPrefs);
            setRefreshKey(prev => prev + 1);
            
        } catch (e) {
            console.error("Data restore failed", e);
            alert("Failed to write data to storage.");
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
            activeProblem, activeNodeIndex, currentLessonPlan, activeForgeItem, activeCareerSession,
            loadingContext, pendingExamConfig, generationError, generationRawError,
            isSkipAttempt, engineeringNav, careerSessions, activeProblemContext, refreshKey
        },
        actions: { 
            updatePreferences, handleSelectProblem, handleStartNode, handleStartReview, 
            handleStartClinic, handleGenerateVariant, setActiveTab, setView,
            handleImportData, handleDataLoaded, handleExportData, onResetData,
            handleStartCustomLesson, handleRetryLoading, handleLessonComplete,
            handleStartCareerSession, handleStartCareerExam, handleViewForgeItem, 
            handleUpdateCurrentPlan, setEngineeringNav, handleEnsureProblemContext
        }
    };
};
