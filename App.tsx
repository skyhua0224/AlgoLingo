
import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { UnitMap } from './components/UnitMap';
import { LessonRunner } from './components/LessonRunner';
import { Layout } from './components/Layout';
import { ReviewHub } from './components/ReviewHub';
import { LoadingScreen } from './components/LoadingScreen';
import { ProfileView } from './components/ProfileView';
import { Onboarding } from './components/Onboarding';
import { generateLessonPlan, generateReviewLesson, generateSyntaxClinicPlan } from './services/geminiService';
import { syncWithGist } from './services/githubService';
import { UserStats, LessonPlan, SavedLesson, MistakeRecord, UserPreferences, ProgressMap, Widget } from './types';
import { INITIAL_STATS, DEFAULT_API_CONFIG, PROBLEM_CATEGORIES } from './constants';

type ViewState = 'dashboard' | 'unit-map' | 'runner' | 'loading';

export default function App() {
  const [view, setView] = useState<ViewState>('dashboard');
  
  // State
  const [progressMap, setProgressMap] = useState<ProgressMap>({});
  const [stats, setStats] = useState<UserStats>(INITIAL_STATS);
  const [savedLessons, setSavedLessons] = useState<SavedLesson[]>([]);
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({
      userName: 'Sky Hua',
      hasOnboarded: false,
      targetLanguage: 'Python',
      spokenLanguage: 'Chinese',
      apiConfig: DEFAULT_API_CONFIG,
      theme: 'system',
      failedSkips: {},
      notificationConfig: { enabled: false, webhookUrl: '', type: 'custom' },
      syncConfig: { enabled: false, githubToken: '' }
  });

  const [activeProblem, setActiveProblem] = useState<{id: string, name: string} | null>(null);
  const [activeNodeIndex, setActiveNodeIndex] = useState<number>(0);
  const [currentLessonPlan, setCurrentLessonPlan] = useState<LessonPlan | null>(null);
  const [activeTab, setActiveTab] = useState<'learn' | 'review' | 'profile'>('learn');
  
  // Skip Logic State
  const [isSkipAttempt, setIsSkipAttempt] = useState(false);

  // Track what we are loading to support retry
  const [loadingContext, setLoadingContext] = useState<'lesson' | 'review' | 'clinic'>('lesson');
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Theme Effect
  useEffect(() => {
      const root = document.documentElement;
      const isDark = preferences.theme === 'dark' || (preferences.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) root.classList.add('dark');
      else root.classList.remove('dark');
  }, [preferences.theme]);

  useEffect(() => {
    // MIGRATION & LOADING
    const loadedProgress = localStorage.getItem('algolingo_progress_v2');
    const loadedStats = localStorage.getItem('algolingo_stats');
    const loadedSaved = localStorage.getItem('algolingo_saved_lessons');
    const loadedMistakes = localStorage.getItem('algolingo_mistakes');
    const loadedPrefs = localStorage.getItem('algolingo_prefs');

    // Progress Migration: Flat -> Nested
    if (loadedProgress) {
        try {
            const parsed = JSON.parse(loadedProgress);
            // FIX: Ensure parsed is a valid object (not null) before using Object.keys
            if (parsed && typeof parsed === 'object') {
                const keys = Object.keys(parsed);
                if (keys.length > 0) {
                    // Detect if it's the old flat structure (Value is number)
                    const sampleKey = keys[0];
                    if (typeof parsed[sampleKey] === 'number') {
                        // Migrate to nested structure under default target language (Python)
                        const defaultLang = loadedPrefs ? JSON.parse(loadedPrefs).targetLanguage || 'Python' : 'Python';
                        console.log(`[Migration] Converting flat progress to nested for ${defaultLang}`);
                        const nested = { [defaultLang]: parsed };
                        setProgressMap(nested);
                        // Update local storage immediately
                        localStorage.setItem('algolingo_progress_v2', JSON.stringify(nested));
                    } else {
                        setProgressMap(parsed);
                    }
                } else {
                    setProgressMap({});
                }
            } else {
                // Fallback for null/invalid loaded progress
                setProgressMap({});
            }
        } catch (e) {
            console.error("Progress Load Error", e);
            setProgressMap({});
        }
    }
    
    // Hydrate stats and calculate streak
    if (loadedStats) {
        try {
            const parsedStats: UserStats = JSON.parse(loadedStats);
            // FIX: Ensure parsedStats is not null
            if (parsedStats && typeof parsedStats === 'object') {
                const realStreak = calculateRealStreak(parsedStats.history || {});
                // Merge with INITIAL_STATS to ensure new fields (League, Quests) exist
                const mergedStats = { 
                    ...INITIAL_STATS, 
                    ...parsedStats, 
                    streak: realStreak,
                    // Ensure quests exist if missing
                    quests: parsedStats.quests && parsedStats.quests.length ? parsedStats.quests : [
                        { id: 'q1', description: 'Complete 1 Lesson', target: 1, current: 0, rewardGems: 10, completed: false },
                        { id: 'q2', description: 'Fix 3 Mistakes', target: 3, current: 0, rewardGems: 20, completed: false }
                    ]
                };
                setStats(mergedStats);
            }
        } catch (e) {
            console.error("Stats Load Error", e);
            setStats(INITIAL_STATS);
        }
    }

    if (loadedSaved) {
        try {
            setSavedLessons(JSON.parse(loadedSaved) || []);
        } catch(e) { setSavedLessons([]); }
    }
    if (loadedMistakes) {
        try {
            setMistakes(JSON.parse(loadedMistakes) || []);
        } catch(e) { setMistakes([]); }
    }
    if (loadedPrefs) {
        try {
            const parsed = JSON.parse(loadedPrefs);
            if (parsed && typeof parsed === 'object') {
                const mergedConfig = { ...DEFAULT_API_CONFIG, ...parsed.apiConfig };
                if (!mergedConfig.openai) mergedConfig.openai = DEFAULT_API_CONFIG.openai;
                if (!mergedConfig.gemini) mergedConfig.gemini = DEFAULT_API_CONFIG.gemini;
                
                const safePrefs = {
                     ...preferences,
                     ...parsed,
                     apiConfig: mergedConfig,
                     userName: parsed.userName || 'Sky Hua',
                     hasOnboarded: parsed.hasOnboarded !== undefined ? parsed.hasOnboarded : true 
                };
        
                setPreferences(safePrefs);
            }
        } catch (e) {
            console.error("Prefs Load Error", e);
        }
    }
  }, []);

  const calculateRealStreak = (history: Record<string, number>): number => {
      if (!history) return 0;
      const sortedDates = Object.keys(history).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      if (sortedDates.length === 0) return 0;

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
          return 0;
      }

      let streak = 0;
      let currentDate = new Date(sortedDates[0]);
      
      for (const dateStr of sortedDates) {
          const d = new Date(dateStr);
          if (streak === 0) {
              streak = 1;
              currentDate = d;
              continue;
          }

          const expectedDate = new Date(currentDate);
          expectedDate.setDate(currentDate.getDate() - 1);
          
          if (d.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
              streak++;
              currentDate = d;
          } else {
              break;
          }
      }
      return streak;
  };

  const getCurrentLangProgress = () => {
      return progressMap[preferences.targetLanguage] || {};
  }

  const saveProgressForCurrentLang = (newLangProgress: Record<string, number>) => {
      const updated = { ...progressMap, [preferences.targetLanguage]: newLangProgress };
      setProgressMap(updated);
      localStorage.setItem('algolingo_progress_v2', JSON.stringify(updated));
  };
  
  const saveStats = (newStats: UserStats) => {
    setStats(newStats);
    localStorage.setItem('algolingo_stats', JSON.stringify(newStats));
  };

  const saveMistakes = (newMistakes: MistakeRecord[]) => {
    setMistakes(newMistakes);
    localStorage.setItem('algolingo_mistakes', JSON.stringify(newMistakes));
  }

  const updatePreferences = (newPrefs: Partial<UserPreferences>) => {
      const updated = { ...preferences, ...newPrefs };
      setPreferences(updated);
      localStorage.setItem('algolingo_prefs', JSON.stringify(updated));
  }

  // --- UNIVERSAL DATA LOADER ---
  const handleDataLoad = (data: any) => {
      // Basic Validation
      if (!data.version) {
          alert("Invalid data format.");
          return;
      }

      if (data.stats) {
          setStats(data.stats);
          localStorage.setItem('algolingo_stats', JSON.stringify(data.stats));
      }
      if (data.progressMap) {
          setProgressMap(data.progressMap);
          localStorage.setItem('algolingo_progress_v2', JSON.stringify(data.progressMap));
      }
      if (data.mistakes) {
          setMistakes(data.mistakes);
          localStorage.setItem('algolingo_mistakes', JSON.stringify(data.mistakes));
      }
      if (data.savedLessons) {
          setSavedLessons(data.savedLessons);
          localStorage.setItem('algolingo_saved_lessons', JSON.stringify(data.savedLessons));
      }
      
      // Update prefs if available
      if (data.preferences) {
          // Merge but prioritize existing API keys if restored ones are empty (safety)
          const mergedPrefs = { 
              ...preferences, 
              ...data.preferences,
              // IMPORTANT: Force onboarded true so we skip/exit onboarding immediately
              hasOnboarded: true 
          };
          
          if (!mergedPrefs.apiConfig?.gemini?.apiKey && preferences.apiConfig.gemini.apiKey) {
              mergedPrefs.apiConfig.gemini.apiKey = preferences.apiConfig.gemini.apiKey;
          }
          
          setPreferences(mergedPrefs);
          localStorage.setItem('algolingo_prefs', JSON.stringify(mergedPrefs));
      } else {
          // If no prefs in data, still mark as onboarded
          updatePreferences({ hasOnboarded: true });
      }

      // NO RELOAD: Direct State Update
      setView('dashboard');
  };

  // --- IMPORT FUNCTIONALITY (FILE) ---
  const handleImportData = async (file: File) => {
      try {
          const text = await file.text();
          const data = JSON.parse(text);
          handleDataLoad(data);
          // Removed alert to prevent blocking UI which might feel like a crash to some users
          // The state update in handleDataLoad will switch the view, which is feedback enough.
      } catch (e) {
          console.error(e);
          alert(preferences.spokenLanguage === 'Chinese' ? "导入失败：文件格式错误" : "Import failed: Invalid file format");
      }
  };

  // --- EXPORT FUNCTIONALITY ---
  const handleExportData = () => {
      const data = {
          stats,
          progressMap,
          savedLessons,
          mistakes,
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
      URL.revokeObjectURL(url);
  };

  const handleSelectProblem = (id: string, name: string, currentLevel: number) => {
    setActiveProblem({ id, name });
    const currentLangProg = getCurrentLangProgress();
    if (currentLangProg[id] === undefined) {
        saveProgressForCurrentLang({ ...currentLangProg, [id]: 0 });
    }
    setView('unit-map');
  };

  // --- MAIN ENTRY: Start a Node ---
  const handleStartNode = async (nodeIndex: number, isSkip: boolean = false) => {
    if (!activeProblem) return;
    
    setIsSkipAttempt(isSkip); 
    setActiveNodeIndex(nodeIndex);
    setLoadingContext('lesson');
    setGenerationError(null);
    
    // --- SPECIAL CASE: LEETCODE MODE (Phase 7 / Index 6) ---
    // Do NOT go to loading screen. Go straight to runner with a dummy plan.
    // The LessonRunner will handle the async fetch of the sidebar content.
    if (nodeIndex === 6) {
         const dummyPlan: LessonPlan = {
             title: activeProblem.name,
             description: "LeetCode Study Mode",
             suggestedQuestions: [],
             screens: [{
                 id: 'leetcode-main',
                 widgets: [{
                     id: 'lc-widget',
                     type: 'leetcode',
                     leetcode: {
                         // Generate slug from name (basic heuristic, backup logic in runner or service)
                         problemSlug: "two-sum", // This is a placeholder, sidebar generator will fix or use prop
                         concept: { front: "Loading...", back: "..." },
                         exampleCode: { language: preferences.targetLanguage, lines: [] }
                     }
                 }]
             }]
         };
         
         setCurrentLessonPlan(dummyPlan);
         setView('runner');
         return;
    }

    setView('loading');

    try {
      const problemMistakes = mistakes.filter(m => m.problemName === activeProblem.name || m.problemName.includes(activeProblem.name));
      const plan = await generateLessonPlan(activeProblem.name, nodeIndex, preferences, problemMistakes, savedLessons);
      setCurrentLessonPlan(plan);
      setView('runner');
    } catch (e: any) {
      console.error(e);
      setGenerationError(e.message || "Unknown Error");
    }
  };

  const handleStartReview = async (isUnitContext: boolean = false, strategy: 'ai' | 'all' | 'due' = 'ai') => {
    setLoadingContext('review');
    setGenerationError(null);
    
    if (strategy === 'all' || strategy === 'due') {
        const candidates = mistakes.filter(m => m.widget);
        if (candidates.length === 0) {
            alert(preferences.spokenLanguage === 'Chinese' ? "暂无错题" : "No mistakes found.");
            setView(activeTab === 'review' ? 'dashboard' : 'unit-map');
            return;
        }
        const manualPlan: LessonPlan = {
             title: "Review",
             description: "Local Replay",
             suggestedQuestions: [],
             isLocalReplay: true, 
             screens: candidates.map((m) => ({
                 id: `replay_${m.id}`,
                 widgets: [m.widget as Widget],
                 isRetry: true
             }))
         };
         setCurrentLessonPlan(manualPlan);
         setView('runner');
         return;
    }

    setView('loading');
    try {
        const plan = await generateReviewLesson(mistakes, preferences);
        setCurrentLessonPlan(plan);
        setView('runner');
    } catch (e: any) {
        console.error(e);
        setGenerationError(e.message || "Review Generation Failed");
    }
  };

  const handleStartSyntaxClinic = async () => {
      setLoadingContext('clinic');
      setGenerationError(null);
      setView('loading');
      try {
          const plan = await generateSyntaxClinicPlan(preferences);
          setCurrentLessonPlan(plan);
          setView('runner');
      } catch (e: any) {
          console.error(e);
          setGenerationError(e.message || "Clinic Generation Failed");
      }
  }

  const handleRetryLoading = () => {
      setGenerationError(null);
      if (loadingContext === 'lesson') {
          handleStartNode(activeNodeIndex, isSkipAttempt);
      } else if (loadingContext === 'review') {
          handleStartReview(false, 'ai');
      } else if (loadingContext === 'clinic') {
          handleStartSyntaxClinic();
      }
  };

  const handleLessonComplete = (result: { xp: number; streak: number }, shouldSave: boolean, newMistakes: MistakeRecord[]) => {
    const today = new Date().toISOString().split('T')[0];
    const currentHistory = stats.history || {};
    const newHistory = { ...currentHistory, [today]: (currentHistory[today] || 0) + result.xp };

    const newStreak = calculateRealStreak(newHistory);

    // Update Quests
    const updatedQuests = (stats.quests || []).map(q => {
        if (q.completed) return q;
        let newCurrent = q.current;
        if (q.description.includes('Lesson') || q.id === 'q1') {
             newCurrent += 1;
        } else if ((q.description.includes('Mistake') || q.id === 'q2') && loadingContext === 'review') {
             newCurrent += 1;
        }
        
        const completed = newCurrent >= q.target;
        return { ...q, current: newCurrent, completed };
    });

    const questGems = updatedQuests.reduce((acc, q) => acc + (q.completed && !stats.quests?.find(old => old.id === q.id)?.completed ? q.rewardGems : 0), 0);

    const newStats = { 
        ...stats, 
        xp: stats.xp + result.xp, 
        gems: stats.gems + questGems,
        streak: newStreak,
        lastPlayed: today,
        history: newHistory,
        quests: updatedQuests
    };
    
    saveStats(newStats);
    
    if (newMistakes.length > 0) {
        const updatedMistakes = [...mistakes, ...newMistakes];
        saveMistakes(updatedMistakes);
    }

    let finalProgress = progressMap;

    if (activeProblem && activeTab !== 'review' && currentLessonPlan && !currentLessonPlan.isLocalReplay) {
        const currentLangProg = getCurrentLangProgress();
        const currentMax = currentLangProg[activeProblem.id] || 0;
        
        if (shouldSave) {
             // Skip logic or Progression
             if (isSkipAttempt && activeNodeIndex === 5) {
                if (newMistakes.length <= 2) {
                    const updatedProg = { ...currentLangProg, [activeProblem.id]: 6 };
                    saveProgressForCurrentLang(updatedProg);
                    finalProgress = { ...progressMap, [preferences.targetLanguage]: updatedProg }; 
                    alert(preferences.spokenLanguage === 'Chinese' ? "挑战成功！该单元已精通。" : "Challenge Accepted! Unit Mastered.");
                } else {
                    const existingFails = preferences.failedSkips || {};
                    updatePreferences({ failedSkips: { ...existingFails, [activeProblem.name]: true } });
                }
            } else {
                // Normal Progression: Advance if current level was the max level
                if (activeNodeIndex < 6 && activeNodeIndex === currentMax) { 
                    const updatedProg = { ...currentLangProg, [activeProblem.id]: activeNodeIndex + 1 };
                    saveProgressForCurrentLang(updatedProg);
                    finalProgress = { ...progressMap, [preferences.targetLanguage]: updatedProg };
                }
            }

            // Save Lesson for History (and LeetCode Caching)
            // We save if it's LeetCode (Index 6) OR if it's a passed standard lesson
            if (activeNodeIndex === 6 || activeNodeIndex < 6) {
                 const newSaved = {
                    id: Date.now().toString(),
                    problemId: activeProblem.id,
                    nodeIndex: activeNodeIndex,
                    timestamp: Date.now(),
                    plan: currentLessonPlan,
                    language: preferences.targetLanguage
                };
                
                // Avoid duplicates if saving multiple times (e.g. LeetCode re-run)
                const filteredSaved = savedLessons.filter(l => 
                    !(l.problemId === activeProblem.id && l.nodeIndex === activeNodeIndex && l.language === preferences.targetLanguage)
                );
                
                const updatedSaved = [...filteredSaved, newSaved];
                setSavedLessons(updatedSaved);
                localStorage.setItem('algolingo_saved_lessons', JSON.stringify(updatedSaved));
            }
        }
    }
    
    setCurrentLessonPlan(null);
    setIsSkipAttempt(false);
    setView(activeTab === 'review' ? 'dashboard' : 'unit-map');

    // Auto-Sync Hook (Triggered on ANY completion)
    if (preferences.syncConfig?.enabled && preferences.syncConfig.githubToken && preferences.syncConfig.gistId) {
        console.log("Auto-syncing...");
        const syncData = {
            stats: newStats,
            progress: finalProgress,
            mistakes: [...mistakes, ...newMistakes],
            preferences: preferences
        };
        
        syncWithGist(preferences.syncConfig.githubToken, preferences.syncConfig.gistId, syncData).then(res => {
            if (res.success) console.log("Auto-sync success");
            else console.warn("Auto-sync failed", res.error);
        });
    }
  };

  if (!preferences.hasOnboarded) {
      return (
        <Onboarding 
            preferences={preferences}
            onUpdatePreferences={updatePreferences}
            onComplete={() => updatePreferences({ hasOnboarded: true })}
            onImportData={handleImportData}
            onDataLoaded={handleDataLoad}
        />
      );
  }

  const renderContent = () => {
    if (view === 'loading') {
        return (
            <LoadingScreen 
                problemName={activeProblem?.name} 
                phase={activeNodeIndex} 
                language={preferences.spokenLanguage} 
                onRetry={handleRetryLoading}
                error={generationError}
                onCancel={() => setView(activeTab === 'review' ? 'dashboard' : 'unit-map')}
            />
        );
    }
    
    if (view === 'runner' && currentLessonPlan) {
        return (
            <LessonRunner 
                plan={currentLessonPlan}
                nodeIndex={activeNodeIndex}
                onComplete={handleLessonComplete}
                onExit={() => setView(activeTab === 'review' ? 'dashboard' : 'unit-map')}
                onRegenerate={handleRetryLoading}
                language={preferences.spokenLanguage}
                preferences={preferences}
                isReviewMode={loadingContext === 'review'}
                isSkipContext={isSkipAttempt}
            />
        );
    }
    if (activeTab === 'profile') return <ProfileView stats={stats} language={preferences.spokenLanguage} preferences={preferences} onUpdateName={(name) => updatePreferences({userName: name})} />;
    
    if (activeTab === 'review') {
        return (
            <ReviewHub 
                mistakeCount={mistakes.length} 
                mistakes={mistakes}
                onStartReview={() => handleStartReview(false, 'ai')} 
                onStartMistakePractice={(mode) => handleStartReview(false, mode)} 
                onStartSyntaxClinic={handleStartSyntaxClinic}
                onBack={() => setActiveTab('learn')} 
                targetLanguage={preferences.targetLanguage} 
            />
        );
    }
    
    if (view === 'dashboard') return <Dashboard progressMap={getCurrentLangProgress()} stats={stats} onSelectProblem={handleSelectProblem} language={preferences.spokenLanguage} />;
    
    if (view === 'unit-map' && activeProblem) {
        return (
            <UnitMap 
                problemName={activeProblem.name}
                currentLevel={getCurrentLangProgress()[activeProblem.id] || 0}
                savedLessons={savedLessons.filter(l => l.problemId === activeProblem?.id && l.language === preferences.targetLanguage)}
                onStartLevel={handleStartNode}
                onLoadSaved={(l) => { setCurrentLessonPlan(l.plan); setView('runner'); }}
                onBack={() => setView('dashboard')}
                language={preferences.spokenLanguage}
                failedSkips={preferences.failedSkips}
            />
        );
    }
    return null;
  };

  return (
    <Layout 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        preferences={preferences}
        onUpdatePreferences={updatePreferences}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onResetData={() => {}}
        hideMobileNav={view === 'runner' || view === 'loading'}
    >
        {renderContent()}
    </Layout>
  );
}
