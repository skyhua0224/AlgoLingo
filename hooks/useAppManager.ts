
import { useState, useEffect, useCallback } from 'react';
import { 
    UserStats, ProgressMap, LessonPlan, SavedLesson, MistakeRecord, UserPreferences, ApiConfig 
} from '../types';
import { 
    INITIAL_STATS, DEFAULT_API_CONFIG 
} from '../constants';
import { 
    generateLessonPlan, generateReviewLesson, generateSyntaxClinicPlan 
} from '../services/geminiService';
import { syncWithGist } from '../services/githubService';

type ViewState = 'dashboard' | 'unit-map' | 'runner' | 'loading';

export const useAppManager = () => {
    // --- STATE ---
    const [view, setView] = useState<ViewState>('dashboard');
    const [activeTab, setActiveTab] = useState<'learn' | 'review' | 'profile'>('learn');
    
    // Data Stores
    const [progressMap, setProgressMap] = useState<ProgressMap>({});
    const [stats, setStats] = useState<UserStats>(INITIAL_STATS);
    const [savedLessons, setSavedLessons] = useState<SavedLesson[]>([]);
    const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
    const [preferences, setPreferences] = useState<UserPreferences>({
        userName: 'Senior Engineer',
        hasOnboarded: false,
        targetLanguage: 'Python',
        spokenLanguage: 'Chinese',
        apiConfig: DEFAULT_API_CONFIG,
        theme: 'system',
        failedSkips: {},
        notificationConfig: { enabled: false, webhookUrl: '', type: 'custom' },
        syncConfig: { enabled: false, githubToken: '' }
    });

    // Session State
    const [activeProblem, setActiveProblem] = useState<{id: string, name: string} | null>(null);
    const [activeNodeIndex, setActiveNodeIndex] = useState<number>(0);
    const [currentLessonPlan, setCurrentLessonPlan] = useState<LessonPlan | null>(null);
    const [isSkipAttempt, setIsSkipAttempt] = useState(false);
    
    // Loading & Error State
    const [loadingContext, setLoadingContext] = useState<'lesson' | 'review' | 'clinic'>('lesson');
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [generationRawError, setGenerationRawError] = useState<string | null>(null);

    // --- PERSISTENCE & INIT ---
    
    // Theme Effect
    useEffect(() => {
        const root = document.documentElement;
        const isDark = preferences.theme === 'dark' || (preferences.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (isDark) root.classList.add('dark');
        else root.classList.remove('dark');
    }, [preferences.theme]);

    // Load Data
    useEffect(() => {
        const loadData = () => {
            try {
                const loadedProgress = localStorage.getItem('algolingo_progress_v2');
                const loadedStats = localStorage.getItem('algolingo_stats');
                const loadedSaved = localStorage.getItem('algolingo_saved_lessons');
                const loadedMistakes = localStorage.getItem('algolingo_mistakes');
                const loadedPrefs = localStorage.getItem('algolingo_prefs');

                if (loadedProgress) {
                    const parsed = JSON.parse(loadedProgress);
                    // Migration Logic: If old flat format, wrap in language
                    const keys = Object.keys(parsed);
                    if (keys.length > 0 && typeof parsed[keys[0]] === 'number') {
                         const lang = loadedPrefs ? JSON.parse(loadedPrefs).targetLanguage || 'Python' : 'Python';
                         setProgressMap({ [lang]: parsed });
                    } else {
                        setProgressMap(parsed);
                    }
                }

                if (loadedStats) setStats({ ...INITIAL_STATS, ...JSON.parse(loadedStats) });
                if (loadedSaved) setSavedLessons(JSON.parse(loadedSaved));
                if (loadedMistakes) setMistakes(JSON.parse(loadedMistakes));
                if (loadedPrefs) {
                    const p = JSON.parse(loadedPrefs);
                    setPreferences(prev => ({
                        ...prev,
                        ...p,
                        // Deep merge crucial nested configs to prevent crashes if missing in old data
                        apiConfig: { ...DEFAULT_API_CONFIG, ...p.apiConfig },
                        syncConfig: { enabled: false, githubToken: '', ...p.syncConfig },
                        notificationConfig: { enabled: false, webhookUrl: '', type: 'custom', ...p.notificationConfig }
                    }));
                }
            } catch (e) {
                console.error("Data Load Error", e);
            }
        };
        loadData();
    }, []);

    // --- ACTIONS: DATA HELPERS ---

    const updatePreferences = (newPrefs: Partial<UserPreferences>) => {
        setPreferences(prev => {
            const updated = { ...prev, ...newPrefs };
            localStorage.setItem('algolingo_prefs', JSON.stringify(updated));
            return updated;
        });
    };

    const saveStats = (newStats: UserStats) => {
        setStats(newStats);
        localStorage.setItem('algolingo_stats', JSON.stringify(newStats));
    };

    const saveMistakes = (newMistakes: MistakeRecord[]) => {
        setMistakes(newMistakes);
        localStorage.setItem('algolingo_mistakes', JSON.stringify(newMistakes));
    };

    const saveProgress = (newMap: ProgressMap) => {
        setProgressMap(newMap);
        localStorage.setItem('algolingo_progress_v2', JSON.stringify(newMap));
    };

    // Unified Data Loader (Used by File Import and Gist Sync)
    const handleDataLoaded = (data: any) => {
        try {
            // 1. Merge and Save Stats
            if (data.stats) {
                const mergedStats = { ...INITIAL_STATS, ...data.stats };
                // Ensure nested objects like league exist
                if (!mergedStats.league) mergedStats.league = INITIAL_STATS.league;
                saveStats(mergedStats);
            }

            // 2. Merge and Save Progress
            if (data.progressMap || data.progress) {
                saveProgress(data.progressMap || data.progress || {});
            }

            // 3. Merge and Save Mistakes
            if (data.mistakes) {
                saveMistakes(data.mistakes);
            }

            // 4. Merge and Save Preferences
            if (data.preferences) {
                const mergedPrefs = { 
                    ...preferences, 
                    ...data.preferences,
                    hasOnboarded: true, // Force onboarding complete
                    // Deep merge configs to prevent breaking new features with old backups
                    apiConfig: { ...DEFAULT_API_CONFIG, ...data.preferences.apiConfig },
                    syncConfig: { ...preferences.syncConfig, ...data.preferences.syncConfig }, // Keep local token if possible or merge carefully
                };
                updatePreferences(mergedPrefs);
            } else {
                // If only stats imported, still mark onboarded
                updatePreferences({ hasOnboarded: true });
            }

            // 5. Reset View State
            setView('dashboard');
            setActiveTab('learn');
            
            // No reload needed, React state updates will trigger re-render
            // alert("Data loaded successfully."); 
        } catch (e) {
            console.error("Data Import Logic Error", e);
            alert("Error processing data. Check console.");
        }
    };

    const handleImportData = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                handleDataLoaded(data);
                alert(preferences.spokenLanguage === 'Chinese' ? "数据导入成功" : "Data imported successfully");
            } catch (err) {
                alert("Import failed: Invalid JSON");
            }
        };
        reader.readAsText(file);
    };

    const handleExportData = () => {
        const data = {
            stats,
            progressMap,
            mistakes,
            savedLessons,
            preferences,
            version: "3.0",
            exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `algolingo_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // --- ACTIONS: LESSON FLOW ---

    const handleSelectProblem = (id: string, name: string, currentLevel: number) => {
        setActiveProblem({ id, name });
        // Initialize progress if missing
        const currentLang = preferences.targetLanguage;
        if (!progressMap[currentLang]) {
            saveProgress({ ...progressMap, [currentLang]: {} });
        }
        setView('unit-map');
    };

    const handleStartNode = async (nodeIndex: number, isSkip: boolean = false) => {
        if (!activeProblem) return;
        setIsSkipAttempt(isSkip);
        setActiveNodeIndex(nodeIndex);
        setLoadingContext('lesson');
        setGenerationError(null);
        setGenerationRawError(null);

        // LeetCode Simulator Mode
        if (nodeIndex === 6) {
            setCurrentLessonPlan({
                title: activeProblem.name,
                description: "LeetCode Simulator",
                screens: [], 
                suggestedQuestions: []
            });
            setView('runner');
            return;
        }

        setView('loading');
        try {
            const problemMistakes = mistakes.filter(m => m.problemName === activeProblem.name);
            const plan = await generateLessonPlan(activeProblem.name, nodeIndex, preferences, problemMistakes, savedLessons);
            setCurrentLessonPlan(plan);
            setView('runner');
        } catch (e: any) {
            console.error(e);
            setGenerationError(e.message || "Generation Failed");
            if (e.rawOutput) setGenerationRawError(e.rawOutput);
        }
    };

    const handleStartReview = async (strategy: 'ai' | 'all' | 'due' = 'ai') => {
        setLoadingContext('review');
        setGenerationError(null);
        
        if (strategy !== 'ai') {
            const candidates = mistakes.filter(m => m.widget);
            if (candidates.length === 0) {
                alert("No mistakes to review!");
                return;
            }
            // Local Replay Mode
            setCurrentLessonPlan({
                title: "Mistake Repair",
                description: "Targeted Practice",
                suggestedQuestions: [],
                isLocalReplay: true,
                screens: candidates.map(m => ({
                    id: `replay_${m.id}`,
                    header: `Review: ${m.problemName}`,
                    widgets: [m.widget!],
                    isRetry: true
                }))
            });
            setView('runner');
            return;
        }

        setView('loading');
        try {
            const plan = await generateReviewLesson(mistakes, preferences);
            setCurrentLessonPlan(plan);
            setView('runner');
        } catch (e: any) {
            setGenerationError(e.message);
            if (e.rawOutput) setGenerationRawError(e.rawOutput);
        }
    };

    const handleStartClinic = async () => {
        setLoadingContext('clinic');
        setGenerationError(null);
        setView('loading');
        try {
            const plan = await generateSyntaxClinicPlan(preferences);
            setCurrentLessonPlan(plan);
            setView('runner');
        } catch (e: any) {
            setGenerationError(e.message);
            if (e.rawOutput) setGenerationRawError(e.rawOutput);
        }
    }

    const handleRetryLoading = () => {
        if (loadingContext === 'lesson') handleStartNode(activeNodeIndex, isSkipAttempt);
        else if (loadingContext === 'review') handleStartReview('ai');
        else handleStartClinic();
    };

    const handleLessonComplete = (result: { xp: number; streak: number }, shouldSave: boolean, newMistakes: MistakeRecord[]) => {
        // 1. Update Stats
        const today = new Date().toISOString().split('T')[0];
        const newHistory = { ...stats.history, [today]: (stats.history[today] || 0) + result.xp };
        
        // Simple streak logic (could be more robust)
        const lastPlayed = stats.lastPlayed;
        let newStreak = stats.streak;
        if (lastPlayed !== today) {
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            if (lastPlayed === yesterday) newStreak += 1;
            else newStreak = 1;
        }

        const newStats = {
            ...stats,
            xp: stats.xp + result.xp,
            streak: newStreak,
            lastPlayed: today,
            history: newHistory
        };
        saveStats(newStats);

        // 2. Save Mistakes
        if (newMistakes.length > 0) {
            saveMistakes([...mistakes, ...newMistakes]);
        }

        // 3. Update Progress (if normal lesson)
        let finalProgress = progressMap;
        if (activeProblem && currentLessonPlan && !currentLessonPlan.isLocalReplay && shouldSave) {
            const lang = preferences.targetLanguage;
            const currentLangProg = progressMap[lang] || {};
            const currentLevel = currentLangProg[activeProblem.id] || 0;

            let newLevel = currentLevel;
            
            // Skip Logic
            if (isSkipAttempt && activeNodeIndex === 5) {
                if (newMistakes.length <= 2) {
                    newLevel = 6; // Mastered
                } else {
                    // Skip Failed
                    updatePreferences({ failedSkips: { ...(preferences.failedSkips || {}), [activeProblem.name]: true } });
                }
            } else {
                // Normal Logic
                if (activeNodeIndex < 6 && activeNodeIndex === currentLevel) {
                    newLevel = activeNodeIndex + 1;
                }
            }

            if (newLevel !== currentLevel) {
                const updatedProg = { ...progressMap, [lang]: { ...currentLangProg, [activeProblem.id]: newLevel } };
                saveProgress(updatedProg);
                finalProgress = updatedProg;
            }
        }

        // 4. Sync
        if (preferences.syncConfig.enabled && preferences.syncConfig.githubToken) {
            syncWithGist(preferences.syncConfig.githubToken, preferences.syncConfig.gistId, {
                stats: newStats,
                progress: finalProgress,
                mistakes: [...mistakes, ...newMistakes],
                preferences
            });
        }

        setView(activeTab === 'review' ? 'dashboard' : 'unit-map');
        setCurrentLessonPlan(null);
        setIsSkipAttempt(false);
    };

    return {
        state: {
            view, activeTab,
            progressMap, stats, mistakes, savedLessons, preferences,
            activeProblem, activeNodeIndex, currentLessonPlan,
            loadingContext, generationError, generationRawError,
            isSkipAttempt
        },
        actions: {
            setView, setActiveTab,
            updatePreferences,
            handleImportData, handleExportData, handleDataLoaded, // Exported handleDataLoaded
            handleSelectProblem,
            handleStartNode,
            handleStartReview,
            handleStartClinic,
            handleRetryLoading,
            handleLessonComplete,
            onResetData: () => { localStorage.clear(); window.location.reload(); }
        }
    };
};
