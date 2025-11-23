
import { useState, useEffect, useCallback } from 'react';
import { 
    UserStats, ProgressMap, LessonPlan, SavedLesson, MistakeRecord, UserPreferences, ApiConfig, RetentionRecord, AppView 
} from '../types';
import { 
    INITIAL_STATS, DEFAULT_API_CONFIG, PROBLEM_CATEGORIES, PROBLEM_MAP 
} from '../constants';
import { 
    generateLessonPlan, generateDailyWorkoutPlan, generateSyntaxClinicPlan, generateVariantLesson
} from '../services/geminiService';
import { syncWithGist } from '../services/githubService';

type ViewState = 'dashboard' | 'unit-map' | 'runner' | 'loading';

export const useAppManager = () => {
    // --- STATE ---
    const [view, setView] = useState<ViewState>('dashboard');
    // Initialize with 'algorithms' instead of 'learn'
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
    const [isSkipAttempt, setIsSkipAttempt] = useState(false);
    
    // Loading & Error State
    const [loadingContext, setLoadingContext] = useState<'lesson' | 'review' | 'clinic' | 'variant'>('lesson');
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

    // Extended to support 'type' and 'time' strategies
    const handleStartReview = async (strategy: 'ai' | 'all' | 'specific' | 'category' | 'type' | 'time' | 'urgent', targetId?: string) => {
        setLoadingContext('review');
        setGenerationError(null);
        setActiveNodeIndex(0); 
        
        // AI Daily Smart Workout (Real AI Generation)
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

        // Filter mostly ACTIVE mistakes for urgent/specific review, but 'vault' shows all
        let allCandidates = mistakes.filter(m => m.widget);
        let activeCandidates = allCandidates.filter(m => !m.isResolved);
        
        let candidates = activeCandidates.length > 0 ? activeCandidates : allCandidates;

        // Strategy Logic
        if (strategy === 'specific' && targetId) {
            candidates = allCandidates.filter(m => m.id === targetId);
        }
        else if (strategy === 'category' && targetId) {
            const unit = PROBLEM_CATEGORIES.find(u => u.id === targetId);
            if (unit) {
                const problemNames = unit.problems.map(pid => PROBLEM_MAP[pid]);
                candidates = candidates.filter(m => problemNames.includes(m.problemName));
            }
        }
        else if (strategy === 'type' && targetId) {
            candidates = candidates.filter(m => m.questionType === targetId);
        }
        else if (strategy === 'time' && targetId) {
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;
            candidates = candidates.filter(m => {
                const diff = now - m.timestamp;
                if (targetId === 'fresh') return diff <= oneDay;
                if (targetId === 'week') return diff > oneDay && diff <= 7 * oneDay;
                if (targetId === 'old') return diff > 7 * oneDay;
                return false;
            });
        }
        else if (strategy === 'urgent') {
            candidates = [...allCandidates]
                .sort((a, b) => {
                    if (a.isResolved !== b.isResolved) return a.isResolved ? 1 : -1;
                    const failA = a.failureCount || 1;
                    const failB = b.failureCount || 1;
                    if (failA !== failB) return failB - failA;
                    return b.timestamp - a.timestamp;
                })
                .slice(0, 5);
        }

        if (candidates.length === 0) {
            const msg = preferences.spokenLanguage === 'Chinese' 
                ? "真棒！当前分类下没有待复习的错题。" 
                : "Excellent! No mistakes found in this category.";
            alert(msg);
            return;
        }

        const isZh = preferences.spokenLanguage === 'Chinese';
        let planTitle = isZh ? "复习会话" : "Review Session";
        
        if (strategy === 'specific' && candidates.length > 0) {
            planTitle = isZh ? `复习: ${candidates[0].problemName}` : `Review: ${candidates[0].problemName}`;
        } else if (strategy === 'category' && targetId) {
            const unit = PROBLEM_CATEGORIES.find(u => u.id === targetId);
            planTitle = unit ? (isZh ? `单元复习: ${unit.title_zh.split('：')[1] || unit.title_zh}` : `Review: ${unit.title}`) : "Unit Review";
        } else if (strategy === 'time') {
            planTitle = isZh ? "记忆曲线强化" : "Retention Drill";
        } else if (strategy === 'urgent') {
            planTitle = isZh ? "⚡ 快速修复 (Top 5)" : "⚡ Quick Repair (Top 5)";
        }

        setCurrentLessonPlan({
            title: planTitle,
            description: `Targeted Practice: ${strategy}`,
            suggestedQuestions: [],
            isLocalReplay: true,
            screens: candidates.map(m => ({
                id: `replay_${m.id}`,
                header: isZh ? `复习: ${m.problemName}` : `Review: ${m.problemName}`,
                widgets: [m.widget!],
                isRetry: true
            }))
        });
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

    const handleRetryLoading = () => {
        if (loadingContext === 'lesson') handleStartNode(activeNodeIndex, isSkipAttempt);
        else if (loadingContext === 'review') handleStartReview('ai');
        else if (loadingContext === 'clinic') handleStartClinic();
        else if (loadingContext === 'variant') setView('dashboard'); 
    };

    const handleLessonComplete = (result: { xp: number; streak: number }, shouldSave: boolean, newMistakes: MistakeRecord[]) => {
        const today = new Date().toISOString().split('T')[0];
        const newHistory = { ...stats.history, [today]: (stats.history[today] || 0) + result.xp };
        
        const lastPlayed = stats.lastPlayed;
        let newStreak = stats.streak;
        if (lastPlayed !== today) {
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            if (lastPlayed === yesterday) newStreak += 1;
            else newStreak = 1;
        }

        // --- SPACED REPETITION UPDATE ---
        const updatedRetention = { ...(stats.retention || {}) };
        if (activeProblem) {
            // If we just completed a lesson for a specific problem
            const pid = activeProblem.id;
            const existing = updatedRetention[pid];
            const hasFailedThisSession = newMistakes.length > 0;

            let nextInterval = 1; // Default 1 day
            let stability = 50;

            if (hasFailedThisSession) {
                // Reset interval on failure
                nextInterval = 1; 
                stability = 20;
            } else if (existing) {
                // Success! Exponential backoff (Spaced Repetition)
                nextInterval = Math.ceil(existing.interval * 2);
                stability = Math.min(100, existing.stability + 15);
            } else {
                // New mastery
                nextInterval = 1;
                stability = 50;
            }

            updatedRetention[pid] = {
                lastReview: Date.now(),
                interval: nextInterval,
                stability: stability,
                nextReview: Date.now() + (nextInterval * 24 * 60 * 60 * 1000)
            };
        }

        const newStats: UserStats = {
            ...stats,
            xp: stats.xp + result.xp,
            streak: newStreak,
            lastPlayed: today,
            history: newHistory,
            retention: updatedRetention
        };
        saveStats(newStats);

        // --- MISTAKE MANAGEMENT LOGIC ---
        const mistakeMap = new Map<string, MistakeRecord>(mistakes.map(m => [m.id, m]));
        const getKey = (m: MistakeRecord) => `${m.problemName}|${m.context}|${m.questionType}`;
        const contentKeyMap = new Map<string, string>(mistakes.map(m => [getKey(m), m.id]));

        newMistakes.forEach(nm => {
            const key = getKey(nm);
            const existingId = contentKeyMap.get(key);

            if (existingId) {
                const existing = mistakeMap.get(existingId);
                if (existing) {
                    mistakeMap.set(existingId, {
                        ...existing,
                        timestamp: Date.now(), 
                        failureCount: (existing.failureCount || 1) + 1,
                        isResolved: false 
                    });
                }
            } else {
                mistakeMap.set(nm.id, { 
                    ...nm, 
                    failureCount: 1, 
                    isResolved: false 
                });
                contentKeyMap.set(key, nm.id);
            }
        });

        if (currentLessonPlan?.isLocalReplay && currentLessonPlan.screens) {
            currentLessonPlan.screens.forEach(screen => {
                if (screen.id.startsWith('replay_')) {
                    const originalId = screen.id.replace('replay_', '');
                    if (mistakeMap.has(originalId)) {
                        const record = mistakeMap.get(originalId)!;
                        const key = getKey(record);
                        const failedInSession = newMistakes.some(nm => getKey(nm) === key);
                        if (!failedInSession) {
                            mistakeMap.set(originalId, { ...record, isResolved: true });
                        }
                    }
                }
            });
        }

        const updatedMistakes = Array.from(mistakeMap.values());
        updatedMistakes.sort((a, b) => {
            if (a.isResolved === b.isResolved) return b.timestamp - a.timestamp;
            return a.isResolved ? 1 : -1; 
        });

        setMistakes(updatedMistakes);
        saveMistakes(updatedMistakes);

        let finalProgress = progressMap;
        if (activeProblem && currentLessonPlan && !currentLessonPlan.isLocalReplay && shouldSave) {
            const lang = preferences.targetLanguage;
            const currentLangProg = progressMap[lang] || {};
            const currentLevel = currentLangProg[activeProblem.id] || 0;

            let newLevel = currentLevel;
            
            if (isSkipAttempt && activeNodeIndex === 5) {
                if (newMistakes.length <= 2) {
                    newLevel = 6; 
                } else {
                    updatePreferences({ failedSkips: { ...(preferences.failedSkips || {}), [activeProblem.name]: true } });
                }
            } else {
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

        if (preferences.syncConfig.enabled && preferences.syncConfig.githubToken) {
            syncWithGist(preferences.syncConfig.githubToken, preferences.syncConfig.gistId, {
                stats: newStats,
                progress: finalProgress,
                mistakes: updatedMistakes,
                preferences
            });
        }

        setView('dashboard');
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
            handleImportData, handleExportData, handleDataLoaded,
            handleSelectProblem,
            handleStartNode,
            handleStartReview,
            handleStartClinic,
            handleGenerateVariant,
            handleRetryLoading,
            handleLessonComplete,
            onResetData: () => { localStorage.clear(); window.location.reload(); }
        }
    };
};
