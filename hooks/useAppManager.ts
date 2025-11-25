
import { useState, useEffect, useCallback } from 'react';
import { 
    UserStats, ProgressMap, LessonPlan, SavedLesson, MistakeRecord, UserPreferences, ApiConfig, RetentionRecord, AppView 
} from '../types';
import { ForgeRoadmap } from '../types/forge'; // Import new type
import { 
    INITIAL_STATS, DEFAULT_API_CONFIG, PROBLEM_CATEGORIES, PROBLEM_MAP 
} from '../constants';
import { 
    generateLessonPlan, generateDailyWorkoutPlan, generateSyntaxClinicPlan, generateVariantLesson
} from '../services/geminiService';
import { syncWithGist } from '../services/githubService';

// Added 'forge-detail' to ViewState
type ViewState = 'dashboard' | 'unit-map' | 'runner' | 'loading' | 'forge-detail';

export const useAppManager = () => {
    // --- STATE ---
    const [view, setView] = useState<ViewState>('dashboard');
    const [activeTab, setActiveTab] = useState<AppView>('algorithms');
    
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
    const [activeForgeItem, setActiveForgeItem] = useState<ForgeRoadmap | null>(null); // NEW
    const [isSkipAttempt, setIsSkipAttempt] = useState(false);
    
    // Loading & Error State
    const [loadingContext, setLoadingContext] = useState<'lesson' | 'review' | 'clinic' | 'variant'>('lesson');
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [generationRawError, setGenerationRawError] = useState<string | null>(null);

    const getEngineeringData = () => {
        const data: Record<string, any> = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('algolingo_syntax_v3_') || key.startsWith('algolingo_eng_v3_'))) {
                try {
                    data[key] = JSON.parse(localStorage.getItem(key)!);
                } catch (e) {}
            }
        }
        // Include Tracks and Forge History
        ['algolingo_my_tracks', 'algolingo_forge_history_v2', 'algolingo_discovered_tracks'].forEach(key => {
            const val = localStorage.getItem(key);
            if (val) {
                try { data[key] = JSON.parse(val); } catch(e) {}
            }
        });
        return data;
    };

    const saveEngineeringData = (data: Record<string, any>) => {
        if (!data) return;
        Object.entries(data).forEach(([key, value]) => {
            if (
                key.startsWith('algolingo_syntax_v3_') || 
                key.startsWith('algolingo_eng_v3_') ||
                ['algolingo_my_tracks', 'algolingo_forge_history_v2', 'algolingo_discovered_tracks'].includes(key)
            ) {
                localStorage.setItem(key, JSON.stringify(value));
            }
        });
    };

    useEffect(() => {
        const root = document.documentElement;
        const isDark = preferences.theme === 'dark' || (preferences.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (isDark) root.classList.add('dark');
        else root.classList.remove('dark');
    }, [preferences.theme]);

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

    const handleDataLoaded = (data: any) => {
        try {
            if (data.stats) {
                const mergedStats = { ...INITIAL_STATS, ...data.stats };
                if (!mergedStats.league) mergedStats.league = INITIAL_STATS.league;
                saveStats(mergedStats);
            }
            if (data.progressMap || data.progress) {
                saveProgress(data.progressMap || data.progress || {});
            }
            if (data.mistakes) {
                saveMistakes(data.mistakes);
            }
            if (data.engineeringData) {
                saveEngineeringData(data.engineeringData);
            }
            if (data.preferences) {
                const mergedPrefs = { 
                    ...preferences, 
                    ...data.preferences,
                    hasOnboarded: true, 
                    apiConfig: { ...DEFAULT_API_CONFIG, ...data.preferences.apiConfig },
                    syncConfig: { ...preferences.syncConfig, ...data.preferences.syncConfig }, 
                };
                updatePreferences(mergedPrefs);
            } else {
                updatePreferences({ hasOnboarded: true });
            }
            setView('dashboard');
            setActiveTab('algorithms');
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
            engineeringData: getEngineeringData(),
            version: "3.3",
            exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `algolingo_backup.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleSelectProblem = (id: string, name: string, currentLevel: number) => {
        setActiveProblem({ id, name });
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

    const handleStartReview = async (strategy: 'ai' | 'all' | 'specific' | 'category' | 'type' | 'time' | 'urgent', targetId?: string) => {
        setLoadingContext('review');
        setGenerationError(null);
        setActiveNodeIndex(0); 
        
        if (strategy === 'ai') {
            setView('loading');
            try {
                const currentLang = preferences.targetLanguage;
                const learnedProblems = Object.keys(progressMap[currentLang] || {}).filter(pid => progressMap[currentLang][pid] > 0);
                
                const plan = await generateDailyWorkoutPlan(mistakes, learnedProblems, preferences);
                setCurrentLessonPlan(plan);
                setView('runner');
            } catch (e: any) {
                setGenerationError(e.message);
                if (e.rawOutput) setGenerationRawError(e.rawOutput);
            }
            return;
        }
        // Simplified generic review
        setCurrentLessonPlan({ title: "Review", description: "Review", screens: [], suggestedQuestions: [] });
        setView('runner');
    };

    const handleStartClinic = async () => {
        setLoadingContext('clinic');
        setGenerationError(null);
        setActiveNodeIndex(0); 
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

    const handleGenerateVariant = async (mistakeId: string) => {
        const targetMistake = mistakes.find(m => m.id === mistakeId);
        if (!targetMistake) return;
        setLoadingContext('variant');
        setGenerationError(null);
        setActiveNodeIndex(0); 
        setView('loading');
        try {
            const plan = await generateVariantLesson(targetMistake, preferences);
            setCurrentLessonPlan(plan);
            setView('runner');
        } catch (e: any) {
            setGenerationError(e.message);
            if (e.rawOutput) setGenerationRawError(e.rawOutput);
        }
    };

    const handleStartCustomLesson = (plan: LessonPlan, isSkip: boolean = false) => {
        setCurrentLessonPlan(plan);
        setActiveNodeIndex(0);
        setIsSkipAttempt(isSkip);
        setView('runner');
    };

    // NEW: Handle viewing a Forge Roadmap
    const handleViewForgeItem = (roadmap: ForgeRoadmap) => {
        setActiveForgeItem(roadmap);
        setView('forge-detail');
    };

    const handleRetryLoading = () => {
        if (loadingContext === 'lesson') handleStartNode(activeNodeIndex, isSkipAttempt);
        else if (loadingContext === 'review') handleStartReview('ai');
        else if (loadingContext === 'clinic') handleStartClinic();
        else if (loadingContext === 'variant') setView('dashboard'); 
    };

    const handleLessonComplete = (result: { xp: number; streak: number }, shouldSave: boolean, newMistakes: MistakeRecord[]) => {
        const newStats = { ...stats, xp: stats.xp + result.xp, streak: stats.streak + result.streak };
        saveStats(newStats);
        
        // If returning from Forge Runner, go back to Forge Detail
        if (view === 'runner' && activeForgeItem) {
            setView('forge-detail');
            setCurrentLessonPlan(null);
            return;
        }

        setView('dashboard');
        setCurrentLessonPlan(null);
    };

    return {
        state: {
            view, activeTab,
            progressMap, stats, mistakes, savedLessons, preferences,
            activeProblem, activeNodeIndex, currentLessonPlan,
            loadingContext, generationError, generationRawError,
            isSkipAttempt, activeForgeItem
        },
        actions: {
            setView, setActiveTab,
            updatePreferences,
            handleImportData, handleExportData, handleDataLoaded,
            handleSelectProblem,
            handleStartNode,
            handleStartReview,
            handleStartClinic,
            handleGenerateVariant,
            handleStartCustomLesson,
            handleViewForgeItem, // Exported new action
            handleRetryLoading,
            handleLessonComplete,
            onResetData: () => { localStorage.clear(); window.location.reload(); }
        }
    };
};
