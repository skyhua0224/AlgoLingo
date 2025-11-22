
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
        } catch (e) {
            console.error("Progress Load Error", e);
            setProgressMap({});
        }
    }
    
    // Hydrate stats and calculate streak
    if (loadedStats) {
        const parsedStats: UserStats = JSON.parse(loadedStats);
        const realStreak = calculateRealStreak(parsedStats.history);
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

    if (loadedSaved) setSavedLessons(JSON.parse(loadedSaved));
    if (loadedMistakes) setMistakes(JSON.parse(loadedMistakes));
    if (loadedPrefs) {
        const parsed = JSON.parse(loadedPrefs);
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
  }, []);

  const calculateRealStreak = (history: Record<string, number>): number => {
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

  const handleSelectProblem = (id: string, name: string, currentLevel: number) => {
    setActiveProblem({ id, name });
    const currentLangProg = getCurrentLangProgress();
    if (currentLangProg[id] === undefined) {
        saveProgressForCurrentLang({ ...currentLangProg, [id]: 0 });
    }
    setView('unit-map');
  };

  // --- MAIN ENTRY: Start a Node ---
  // nodeIndex 0-5 are standard/skip. nodeIndex 6 is LeetCode.
  const handleStartNode = async (nodeIndex: number, isSkip: boolean = false) => {
    if (!activeProblem) return;
    
    setIsSkipAttempt(isSkip); 
    setActiveNodeIndex(nodeIndex);
    setLoadingContext('lesson');
    setGenerationError(null);
    setView('loading');

    try {
      // Generate Logic
      // If nodeIndex 6 (LeetCode), we might want to check if we already have a saved lesson for it?
      // For simplicity, we generate fresh for now or reuse generic.
      
      const problemMistakes = mistakes.filter(m => m.problemName === activeProblem.name || m.problemName.includes(activeProblem.name));
      const plan = await generateLessonPlan(activeProblem.name, nodeIndex, preferences, problemMistakes, savedLessons);
      setCurrentLessonPlan(plan);
      setView('runner');
    } catch (e: any) {
      console.error(e);
      setGenerationError(e.message || "Unknown Error");
      // Keep Loading Screen displayed but in Error State
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
        // Heuristic for quest type matching based on ID/Description
        let newCurrent = q.current;
        if (q.description.includes('Lesson') || q.id === 'q1') {
             newCurrent += 1;
        } else if ((q.description.includes('Mistake') || q.id === 'q2') && loadingContext === 'review') {
             newCurrent += 1; // Treat 1 review session as 1 unit of progress for simplicity
        }
        
        const completed = newCurrent >= q.target;
        return { ...q, current: newCurrent, completed };
    });

    // Award Gems for Quests
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
    
    // Handle New Mistakes
    if (newMistakes.length > 0) {
        const updatedMistakes = [...mistakes, ...newMistakes];
        saveMistakes(updatedMistakes);
    }

    if (activeProblem && activeTab !== 'review' && currentLessonPlan && !currentLessonPlan.isLocalReplay) {
        const currentLangProg = getCurrentLangProgress();
        const currentMax = currentLangProg[activeProblem.id] || 0;
        
        // Progress Logic
        if (shouldSave) {
             if (isSkipAttempt && activeNodeIndex === 5) {
                // SKIP LOGIC CHECK
                const sessionFailures = newMistakes.filter(m => m.problemName === currentLessonPlan.title); 
                
                if (newMistakes.length <= 2) {
                    saveProgressForCurrentLang({ ...currentLangProg, [activeProblem.id]: 6 }); 
                    alert(preferences.spokenLanguage === 'Chinese' ? "挑战成功！该单元已精通。" : "Challenge Accepted! Unit Mastered.");
                } else {
                    const existingFails = preferences.failedSkips || {};
                    updatePreferences({ failedSkips: { ...existingFails, [activeProblem.name]: true } });
                }
            } else {
                if (activeNodeIndex < 6 && activeNodeIndex === currentMax) { 
                    saveProgressForCurrentLang({ ...currentLangProg, [activeProblem.id]: activeNodeIndex + 1 });
                }
            }

            // Save Lesson History
            const newSaved = {
                id: Date.now().toString(),
                problemId: activeProblem.id,
                nodeIndex: activeNodeIndex,
                timestamp: Date.now(),
                plan: currentLessonPlan,
                language: preferences.targetLanguage
            };
            const updatedSaved = [...savedLessons, newSaved];
            setSavedLessons(updatedSaved);
            localStorage.setItem('algolingo_saved_lessons', JSON.stringify(updatedSaved));
        }
    }
    
    setCurrentLessonPlan(null);
    setIsSkipAttempt(false);
    setView(activeTab === 'review' ? 'dashboard' : 'unit-map');
  };

  if (!preferences.hasOnboarded) {
      return (
        <Onboarding 
            preferences={preferences}
            onUpdatePreferences={updatePreferences}
            onComplete={() => updatePreferences({ hasOnboarded: true })}
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
        onExportData={() => {}}
        onImportData={() => {}}
        onResetData={() => {}}
        hideMobileNav={view === 'runner' || view === 'loading'}
    >
        {renderContent()}
    </Layout>
  );
}
