
import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { UnitMap } from './components/UnitMap';
import { LessonRunner } from './components/LessonRunner';
import { Layout } from './components/Layout';
import { ReviewHub } from './components/ReviewHub';
import { LoadingScreen } from './components/LoadingScreen';
import { ProfileView } from './components/ProfileView';
import { Onboarding } from './components/Onboarding';
import { ErrorBoundary } from './components/ErrorBoundary';
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
      failedSkips: {}
  });

  const [activeProblem, setActiveProblem] = useState<{id: string, name: string} | null>(null);
  const [activeNodeIndex, setActiveNodeIndex] = useState<number>(0);
  const [currentLessonPlan, setCurrentLessonPlan] = useState<LessonPlan | null>(null);
  const [activeTab, setActiveTab] = useState<'learn' | 'review' | 'profile'>('learn');
  
  // Skip Logic State
  const [isSkipAttempt, setIsSkipAttempt] = useState(false);

  // Track what we are loading to support retry
  const [loadingContext, setLoadingContext] = useState<'lesson' | 'review' | 'clinic'>('lesson');
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Theme Effect
  useEffect(() => {
      const root = document.documentElement;
      const isDark = preferences.theme === 'dark' || (preferences.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) root.classList.add('dark');
      else root.classList.remove('dark');
  }, [preferences.theme]);

  useEffect(() => {
    const loadedProgress = localStorage.getItem('algolingo_progress_v2');
    const loadedStats = localStorage.getItem('algolingo_stats');
    const loadedSaved = localStorage.getItem('algolingo_saved_lessons');
    const loadedMistakes = localStorage.getItem('algolingo_mistakes');
    const loadedPrefs = localStorage.getItem('algolingo_prefs');

    if (loadedProgress) setProgressMap(JSON.parse(loadedProgress));
    
    // Hydrate stats and calculate streak
    if (loadedStats) {
        const parsedStats: UserStats = JSON.parse(loadedStats);
        const realStreak = calculateRealStreak(parsedStats.history);
        setStats({ ...parsedStats, streak: realStreak });
    }

    if (loadedSaved) setSavedLessons(JSON.parse(loadedSaved));
    if (loadedMistakes) setMistakes(JSON.parse(loadedMistakes));
    if (loadedPrefs) {
        const parsed = JSON.parse(loadedPrefs);
        // Robust merge for nested API config and new fields
        const mergedConfig = { ...DEFAULT_API_CONFIG, ...parsed.apiConfig };
        if (!mergedConfig.openai) mergedConfig.openai = DEFAULT_API_CONFIG.openai;
        if (!mergedConfig.gemini) mergedConfig.gemini = DEFAULT_API_CONFIG.gemini;
        
        // Backwards compatibility for name/onboarded
        const safePrefs = {
             ...preferences,
             ...parsed,
             apiConfig: mergedConfig,
             userName: parsed.userName || 'Sky Hua',
             hasOnboarded: parsed.hasOnboarded !== undefined ? parsed.hasOnboarded : true // Assume old users onboarded
        };

        setPreferences(safePrefs);
    }
  }, []);

  // Helper: Calculate Streak
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

  const handleLog = (msg: string) => {
      setGenerationLogs(prev => [...prev, msg]);
  };

  // --- MAIN ENTRY: Start a Node ---
  const handleStartNode = async (nodeIndex: number, isSkip: boolean = false) => {
    if (!activeProblem) return;
    
    setIsSkipAttempt(isSkip); // Set skip flag
    setActiveNodeIndex(nodeIndex);
    setLoadingContext('lesson');
    setGenerationLogs([]);
    setLoadingError(null);
    setView('loading');

    try {
      const problemMistakes = mistakes.filter(m => m.problemName === activeProblem.name || m.problemName.includes(activeProblem.name));
      const plan = await generateLessonPlan(activeProblem.name, nodeIndex, preferences, problemMistakes, savedLessons, handleLog);
      setCurrentLessonPlan(plan);
      setView('runner');
    } catch (e: any) {
      console.error(e);
      setLoadingError(e.message || "Failed to generate lesson.");
      // We stay on loading screen to show error
    }
  };

  // --- START REVIEW LOGIC ---
  const handleStartReview = async (isUnitContext: boolean = false, strategy: 'ai' | 'all' | 'due' = 'ai') => {
    setLoadingContext('review');
    setGenerationLogs([]);
    setLoadingError(null);

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
        const plan = await generateReviewLesson(mistakes, preferences, handleLog);
        setCurrentLessonPlan(plan);
        setView('runner');
    } catch (e: any) {
        console.error(e);
        setLoadingError(e.message || "Failed to generate review.");
    }
  };

  const handleStartSyntaxClinic = async () => {
      setLoadingContext('clinic');
      setGenerationLogs([]);
      setLoadingError(null);
      setView('loading');
      try {
          const plan = await generateSyntaxClinicPlan(preferences, handleLog);
          setCurrentLessonPlan(plan);
          setView('runner');
      } catch (e: any) {
          console.error(e);
          setLoadingError(e.message || "Failed to generate clinic.");
      }
  }

  const handleRetryLoading = () => {
      if (loadingContext === 'lesson') {
          handleStartNode(activeNodeIndex, isSkipAttempt);
      } else if (loadingContext === 'review') {
          handleStartReview(false, 'ai');
      } else if (loadingContext === 'clinic') {
          handleStartSyntaxClinic();
      }
  };

  const handleLessonComplete = (result: { xp: number; streak: number }, shouldSave: boolean, newMistakes: MistakeRecord[], failedSkip: boolean = false) => {
    const today = new Date().toISOString().split('T')[0];
    const currentHistory = stats.history || {};
    const newHistory = { ...currentHistory, [today]: (currentHistory[today] || 0) + result.xp };

    const newStreak = calculateRealStreak(newHistory);

    const newStats = { 
        ...stats, 
        xp: stats.xp + result.xp, 
        streak: newStreak,
        lastPlayed: today,
        history: newHistory 
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
                // SKIP LOGIC
                if (!failedSkip) {
                    // Passed Skip
                    saveProgressForCurrentLang({ ...currentLangProg, [activeProblem.id]: 6 }); // Mark all done (0-5 passed, so level is 6)
                    alert(preferences.spokenLanguage === 'Chinese' ? "挑战成功！该单元已精通。" : "Challenge Accepted! Unit Mastered.");
                } else {
                    // Failed Skip (Now handled via flag from LessonRunner)
                    const existingFails = preferences.failedSkips || {};
                    updatePreferences({ failedSkips: { ...existingFails, [activeProblem.name]: true } });
                    // Alert handled in LessonRunner already
                }
            } else {
                // Normal Progression
                // Only advance if we are at the cutting edge of progress
                if (activeNodeIndex < 6 && activeNodeIndex === currentMax) { 
                    saveProgressForCurrentLang({ ...currentLangProg, [activeProblem.id]: activeNodeIndex + 1 });
                }
            }

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

  // --- Onboarding Check ---
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
                error={loadingError}
                debugLogs={generationLogs}
                onBack={() => setView(activeTab === 'review' ? 'dashboard' : 'unit-map')}
            />
        );
    }
    
    if (view === 'runner' && currentLessonPlan) {
        return (
            <ErrorBoundary onRetry={handleRetryLoading}>
                <LessonRunner 
                    plan={currentLessonPlan}
                    nodeIndex={activeNodeIndex}
                    onComplete={handleLessonComplete}
                    onExit={() => setView(activeTab === 'review' ? 'dashboard' : 'unit-map')}
                    onRegenerate={handleRetryLoading}
                    language={preferences.spokenLanguage}
                    preferences={preferences}
                    isReviewMode={loadingContext === 'review'}
                    isSkipAttempt={isSkipAttempt}
                />
            </ErrorBoundary>
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
