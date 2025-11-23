
import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { UnitMap } from './components/UnitMap';
import { LessonRunner } from './components/lesson/LessonRunner';
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
  const [generationRawError, setGenerationRawError] = useState<string | null>(null);

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

    if (loadedProgress) {
        try {
            const parsed = JSON.parse(loadedProgress);
            if (parsed && typeof parsed === 'object') {
                const keys = Object.keys(parsed);
                if (keys.length > 0) {
                    const sampleKey = keys[0];
                    if (typeof parsed[sampleKey] === 'number') {
                        const defaultLang = loadedPrefs ? JSON.parse(loadedPrefs).targetLanguage || 'Python' : 'Python';
                        const nested = { [defaultLang]: parsed };
                        setProgressMap(nested);
                        localStorage.setItem('algolingo_progress_v2', JSON.stringify(nested));
                    } else {
                        setProgressMap(parsed);
                    }
                } else {
                    setProgressMap({});
                }
            } else {
                setProgressMap({});
            }
        } catch (e) {
            console.error("Progress Load Error", e);
            setProgressMap({});
        }
    }
    
    if (loadedStats) {
        try {
            const parsedStats: UserStats = JSON.parse(loadedStats);
            if (parsedStats && typeof parsedStats === 'object') {
                const realStreak = calculateRealStreak(parsedStats.history || {});
                const mergedStats = { 
                    ...INITIAL_STATS, 
                    ...parsedStats, 
                    streak: realStreak,
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

  const handleDataLoad = (data: any) => {
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
      
      if (data.preferences) {
          const mergedPrefs = { 
              ...preferences, 
              ...data.preferences,
              hasOnboarded: true 
          };
          
          if (!mergedPrefs.apiConfig?.gemini?.apiKey && preferences.apiConfig.gemini.apiKey) {
              mergedPrefs.apiConfig.gemini.apiKey = preferences.apiConfig.gemini.apiKey;
          }
          
          setPreferences(mergedPrefs);
          localStorage.setItem('algolingo_prefs', JSON.stringify(mergedPrefs));
      } else {
          updatePreferences({ hasOnboarded: true });
      }

      setView('dashboard');
  };

  const handleImportData = async (file: File) => {
      try {
          const text = await file.text();
          const data = JSON.parse(text);
          handleDataLoad(data);
      } catch (e) {
          console.error(e);
          alert(preferences.spokenLanguage === 'Chinese' ? "导入失败：文件格式错误" : "Import failed: Invalid file format");
      }
  };

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

  const handleStartNode = async (nodeIndex: number, isSkip: boolean = false) => {
    if (!activeProblem) return;
    
    setIsSkipAttempt(isSkip); 
    setActiveNodeIndex(nodeIndex);
    setLoadingContext('lesson');
    setGenerationError(null);
    setGenerationRawError(null);
    
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
                         problemSlug: "two-sum",
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
      // Check for rawOutput from our custom error class
      if (e.rawOutput) {
          setGenerationRawError(e.rawOutput);
      }
    }
  };

  const handleStartReview = async (isUnitContext: boolean = false, strategy: 'ai' | 'all' | 'due' = 'ai') => {
    setLoadingContext('review');
    setGenerationError(null);
    setGenerationRawError(null);
    setActiveNodeIndex(0); // Reset index to prevent LeetCode view override
    
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
                 header: m.problemName ? `Review: ${m.problemName}` : 'Review Mistake',
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
        if (e.rawOutput) setGenerationRawError(e.rawOutput);
    }
  };

  const handleStartSyntaxClinic = async () => {
      setLoadingContext('clinic');
      setGenerationError(null);
      setGenerationRawError(null);
      setActiveNodeIndex(0); // Reset index
      setView('loading');
      try {
          const plan = await generateSyntaxClinicPlan(preferences);
          setCurrentLessonPlan(plan);
          setView('runner');
      } catch (e: any) {
          console.error(e);
          setGenerationError(e.message || "Clinic Generation Failed");
          if (e.rawOutput) setGenerationRawError(e.rawOutput);
      }
  }

  const handleRetryLoading = () => {
      setGenerationError(null);
      setGenerationRawError(null);
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
                if (activeNodeIndex < 6 && activeNodeIndex === currentMax) { 
                    const updatedProg = { ...currentLangProg, [activeProblem.id]: activeNodeIndex + 1 };
                    saveProgressForCurrentLang(updatedProg);
                    finalProgress = { ...progressMap, [preferences.targetLanguage]: updatedProg };
                }
            }

            if (activeNodeIndex === 6 || activeNodeIndex < 6) {
                 const newSaved = {
                    id: Date.now().toString(),
                    problemId: activeProblem.id,
                    nodeIndex: activeNodeIndex,
                    timestamp: Date.now(),
                    plan: currentLessonPlan,
                    language: preferences.targetLanguage
                };
                
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
                rawErrorOutput={generationRawError}
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
                stats={stats}
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
