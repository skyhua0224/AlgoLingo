
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
      theme: 'system'
  });

  const [activeProblem, setActiveProblem] = useState<{id: string, name: string} | null>(null);
  const [activeNodeIndex, setActiveNodeIndex] = useState<number>(0);
  const [currentLessonPlan, setCurrentLessonPlan] = useState<LessonPlan | null>(null);
  const [activeTab, setActiveTab] = useState<'learn' | 'review' | 'profile'>('learn');

  // Track what we are loading to support retry
  const [loadingContext, setLoadingContext] = useState<'lesson' | 'review' | 'clinic'>('lesson');
  
  // New: State for Real-Time Streaming Logs
  const [streamingLog, setStreamingLog] = useState<string>("");

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

  // --- Helper: Ebbinghaus / Due Date Logic ---
  const getDueMistakes = (allMistakes: MistakeRecord[], filterProblemIds?: string[]): MistakeRecord[] => {
      const now = Date.now();
      const ONE_DAY = 24 * 60 * 60 * 1000;
      // Intervals in days when a mistake should be reviewed
      const INTERVALS = [0, 1, 3, 7, 14, 30, 60]; 

      return allMistakes.filter(m => {
          if (filterProblemIds) {
              // Filter logic if needed
          }
          
          if (!m.widget) return false;

          const diffDays = (now - m.timestamp) / ONE_DAY;
          // Show any mistake made today (immediate review) OR roughly matches an interval
          const isDue = INTERVALS.some(interval => Math.abs(diffDays - interval) < 0.5);
          return isDue;
      });
  };

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

  // --- MAIN ENTRY: Start a Node ---
  const handleStartNode = async (nodeIndex: number, isSkipChallenge: boolean = false) => {
    if (!activeProblem) return;
    
    setActiveNodeIndex(nodeIndex);
    setLoadingContext('lesson');
    setStreamingLog(""); // Reset log
    setView('loading');

    try {
      const problemMistakes = mistakes.filter(m => m.problemName === activeProblem.name || m.problemName.includes(activeProblem.name));
      const plan = await generateLessonPlan(
          activeProblem.name, 
          nodeIndex, 
          preferences, 
          problemMistakes, 
          savedLessons, 
          (chunk) => setStreamingLog(prev => prev + chunk) // Stream update
      );
      
      if (isSkipChallenge) {
          plan.isSkipChallenge = true;
          plan.title += " (Skip Challenge)";
      }

      setCurrentLessonPlan(plan);
      setView('runner');
    } catch (e) {
      console.error(e);
      setView('unit-map'); 
    }
  };

  // --- START REVIEW LOGIC ---
  const handleStartReview = async (isUnitContext: boolean = false, strategy: 'ai' | 'all' | 'due' = 'ai') => {
    setLoadingContext('review');
    setStreamingLog("");

    if (strategy === 'all' || strategy === 'due') {
        let candidates = mistakes.filter(m => m.widget);
        candidates.sort((a, b) => b.timestamp - a.timestamp);

        if (strategy === 'due') {
            candidates = getDueMistakes(candidates);
        }

        if (candidates.length === 0) {
            const msg = preferences.spokenLanguage === 'Chinese' 
                ? (strategy === 'due' ? "太棒了！今天没有需要复习的错题。" : "没有可用的错题记录。")
                : (strategy === 'due' ? "Great job! No reviews due today." : "No playable mistake records found.");
            alert(msg);
            return;
        }

        const title = strategy === 'due' 
            ? (preferences.spokenLanguage === 'Chinese' ? "记忆曲线复习" : "Memory Curve Review")
            : (preferences.spokenLanguage === 'Chinese' ? "错题集 (全部)" : "Mistake History (All)");

        const manualPlan: LessonPlan = {
             title: title,
             description: "Local Replay Mode",
             suggestedQuestions: ["Explain this code", "Why did I fail?"],
             isLocalReplay: true, 
             screens: candidates.map((m, i) => ({
                 id: `replay_${m.id}`,
                 header: `${m.problemName} • ${new Date(m.timestamp).toLocaleDateString()}`,
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
        let subsetMistakes = mistakes;
        if (isUnitContext && activeProblem) {
            subsetMistakes = mistakes.filter(m => m.problemName === activeProblem.name);
        }
        
        const plan = await generateReviewLesson(
            subsetMistakes, 
            preferences, 
            [], 
            (chunk) => setStreamingLog(prev => prev + chunk)
        );
        setCurrentLessonPlan(plan);
        setView('runner');
    } catch (e) {
        console.error(e);
        setView(isUnitContext ? 'unit-map' : 'dashboard'); 
    }
  };

  const handleStartSyntaxClinic = async () => {
      setLoadingContext('clinic');
      setStreamingLog("");
      setView('loading');
      try {
          const plan = await generateSyntaxClinicPlan(
              preferences,
              (chunk) => setStreamingLog(prev => prev + chunk)
          );
          setCurrentLessonPlan(plan);
          setView('runner');
      } catch (e) {
          console.error(e);
          setView('dashboard');
      }
  }

  const handleRetryLoading = () => {
      if (loadingContext === 'lesson') {
          handleStartNode(activeNodeIndex);
      } else if (loadingContext === 'review') {
          handleStartReview(false, 'ai');
      } else if (loadingContext === 'clinic') {
          handleStartSyntaxClinic();
      }
  };

  const handleRegenerate = () => {
      handleRetryLoading();
  }

  const handleLessonComplete = (result: { xp: number; streak: number }, shouldSave: boolean, newMistakes: MistakeRecord[]) => {
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
    
    if (newMistakes.length > 0) {
        const updatedMistakes = [...mistakes, ...newMistakes];
        saveMistakes(updatedMistakes);
    }

    if (activeProblem && activeTab !== 'review' && currentLessonPlan && !currentLessonPlan.isLocalReplay) {
        const currentLangProg = getCurrentLangProgress();
        const currentMax = currentLangProg[activeProblem.id] || 0;
        
        // Logic for Skip Challenge or Normal Progression
        if (currentLessonPlan.isSkipChallenge) {
            // Skip Challenge Logic
            if (newMistakes.length <= 2) {
                // Success! Mark as fully complete (Level 6 = Done with mastery)
                saveProgressForCurrentLang({ ...currentLangProg, [activeProblem.id]: 6 });
                alert(preferences.spokenLanguage === 'Chinese' ? "挑战成功！本题已全部精通！" : "Challenge Accepted! Problem marked as mastered.");
            } else {
                // Failed! Mark this problem as failed skip
                const skipFailedKey = `skip_failed_${activeProblem.name}`;
                localStorage.setItem(skipFailedKey, 'true');
                alert(preferences.spokenLanguage === 'Chinese' ? "挑战失败 (错误 > 2)。跳过功能已禁用。" : "Challenge Failed (Errors > 2). Skip option disabled.");
            }
        } else {
            // Normal Logic: Advance 1 level if at current max and < 6
            if (activeNodeIndex === currentMax && activeNodeIndex < 6 && shouldSave) { 
                saveProgressForCurrentLang({ ...currentLangProg, [activeProblem.id]: activeNodeIndex + 1 });
            }
        }
        
        if (shouldSave && !currentLessonPlan.isSkipChallenge) {
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
                realLogs={streamingLog}
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
                onRegenerate={handleRegenerate}
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
            />
        );
    }
    return null;
  };

  // Mega JSON Export
  const handleExportData = () => {
      const data = { 
          version: "2.1",
          progressMap, 
          stats, 
          savedLessons, 
          mistakes, 
          preferences, 
          timestamp: new Date().toISOString() 
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

  // Mega JSON Import
  const handleImportData = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const json = JSON.parse(e.target?.result as string);
              
              if (json.progressMap) {
                  setProgressMap(json.progressMap);
                  localStorage.setItem('algolingo_progress_v2', JSON.stringify(json.progressMap));
              }
              if (json.stats) {
                  setStats(json.stats);
                  localStorage.setItem('algolingo_stats', JSON.stringify(json.stats));
              }
              if (json.savedLessons) {
                  setSavedLessons(json.savedLessons);
                  localStorage.setItem('algolingo_saved_lessons', JSON.stringify(json.savedLessons));
              }
              if (json.mistakes) {
                  const validMistakes = Array.isArray(json.mistakes) ? json.mistakes : [];
                  setMistakes(validMistakes);
                  localStorage.setItem('algolingo_mistakes', JSON.stringify(validMistakes));
              }
              if (json.preferences) {
                  const mergedPrefs = {
                       ...preferences,
                       ...json.preferences,
                       apiConfig: { ...preferences.apiConfig, ...json.preferences.apiConfig }
                  };
                  setPreferences(mergedPrefs);
                  localStorage.setItem('algolingo_prefs', JSON.stringify(mergedPrefs));
              }
              
              alert(preferences.spokenLanguage === 'Chinese' ? '数据导入成功！' : 'Data imported successfully!');
              setView('dashboard'); 
          } catch (err) {
              console.error(err);
              alert('Invalid file format or corrupted data.');
          }
      };
      reader.readAsText(file);
  };

  const handleResetData = () => {
      if (window.confirm('Reset all data? This cannot be undone.')) {
          localStorage.clear();
          window.location.reload();
      }
  };

  return (
    <Layout 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        preferences={preferences}
        onUpdatePreferences={updatePreferences}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onResetData={handleResetData}
        hideMobileNav={view === 'runner' || view === 'loading'}
    >
        {renderContent()}
    </Layout>
  );
}
