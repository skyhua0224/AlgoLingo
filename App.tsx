
import React, { useEffect, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { UnitMap } from './components/UnitMap';
import { LessonRunner } from './components/lesson/LessonRunner';
import { Layout } from './components/Layout';
import { ReviewHub } from './components/ReviewHub';
import { LoadingScreen } from './components/LoadingScreen';
import { ProfileView } from './components/ProfileView';
import { Onboarding } from './components/Onboarding';
import { EngineeringHub } from './components/EngineeringHub/index';
import { Forge } from './components/Forge';
import { ForgeDetailView } from './components/Forge/ForgeDetailView';
import { CareerLobby } from './components/CareerLobby';
import { InterviewRunner } from './components/Career/InterviewRunner';
import { useAppManager } from './hooks/useAppManager';
import { ForgeRoadmap } from './types/forge';
import { DailyStandupModal } from './components/DailyStandupModal';

export default function App() {
  const { state, actions } = useAppManager();
  const { 
      view, activeTab, 
      preferences, stats, progressMap, mistakes, savedLessons,
      activeProblem, activeNodeIndex, currentLessonPlan, activeForgeItem,
      generationError, generationRawError, isSkipAttempt, activeCareerSession, careerSessions,
      activeProblemContext, refreshKey, syncStatus
  } = state;

  const [showDailyStandup, setShowDailyStandup] = useState(false);

  useEffect(() => {
      if (!preferences.hasOnboarded) return;
      const today = new Date().toISOString().split('T')[0];
      const lastCheckIn = localStorage.getItem('algolingo_last_standup_date');
      if (lastCheckIn !== today) setShowDailyStandup(true);
  }, [preferences.hasOnboarded]);

  const handleStandupComplete = (startWarmup: boolean) => {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('algolingo_last_standup_date', today);
      setShowDailyStandup(false);
      if (startWarmup) actions.handleStartReview('ai');
  };

  if (!preferences.hasOnboarded) {
      return (
        <Onboarding 
            preferences={preferences}
            onUpdatePreferences={actions.updatePreferences}
            onComplete={() => actions.updatePreferences({ hasOnboarded: true })}
            onImportData={(f) => actions.handleImportData(f)}
            onDataLoaded={(d) => actions.handleDataLoaded(d)}
        />
      );
  }

  if (view === 'career-runner' && activeCareerSession) {
      if (activeCareerSession.mode === 'jd_prep' && activeCareerSession.syllabusId) {
          const history = JSON.parse(localStorage.getItem('algolingo_forge_history_v2') || '[]');
          const roadmap = history.find((r: ForgeRoadmap) => r.id === activeCareerSession.syllabusId);
          if (roadmap) {
              actions.handleViewForgeItem(roadmap); 
              return <ForgeDetailView roadmap={roadmap} onBack={() => actions.setView('dashboard')} onStartStage={(plan) => actions.handleStartCustomLesson(plan)} preferences={preferences} language={preferences.spokenLanguage} />;
          }
      }
      return <InterviewRunner session={activeCareerSession} onUpdateSession={actions.handleStartCareerSession} onExit={() => actions.setView('dashboard')} preferences={preferences} language={preferences.spokenLanguage} />;
  }

  const renderContent = () => {
    if (view === 'loading') return <LoadingScreen problemName={activeProblem?.name} phase={activeNodeIndex} language={preferences.spokenLanguage} onRetry={actions.handleRetryLoading} error={generationError} rawErrorOutput={generationRawError} onCancel={() => actions.setView('dashboard')} />;
    if (view === 'runner' && currentLessonPlan) return <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur flex items-center justify-center p-0 md:p-4"><div className="w-full h-full md:w-[95vw] md:h-[95vh] bg-white dark:bg-dark-bg rounded-none md:rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800"><LessonRunner plan={currentLessonPlan} nodeIndex={activeNodeIndex} onComplete={actions.handleLessonComplete} onExit={() => actions.setView(activeForgeItem ? 'forge-detail' : 'dashboard')} language={preferences.spokenLanguage} preferences={preferences} isReviewMode={state.loadingContext === 'review'} isSkipContext={isSkipAttempt} stats={stats} problemContext={activeProblemContext} onDataChange={actions.notifyDataChange} /></div></div>;
    if (view === 'unit-map' && activeProblem) return <UnitMap problemName={activeProblem.name} currentLevel={progressMap[preferences.targetLanguage]?.[activeProblem.id] || 0} savedLessons={savedLessons.filter(l => l.problemId === activeProblem?.id && l.language === preferences.targetLanguage)} onStartLevel={actions.handleStartNode} onLoadSaved={(l) => actions.handleStartCustomLesson(l.plan)} onBack={() => actions.setView('dashboard')} language={preferences.spokenLanguage} failedSkips={preferences.failedSkips} preferences={preferences} problemContext={activeProblemContext} onEnsureContext={actions.handleEnsureProblemContext} onDataChange={actions.notifyDataChange} />;
    if (view === 'forge-detail' && activeForgeItem) return <ForgeDetailView roadmap={activeForgeItem} onBack={() => actions.setView('dashboard')} onStartStage={(plan) => actions.handleStartCustomLesson(plan)} preferences={preferences} language={preferences.spokenLanguage} />;

    switch (activeTab) {
        case 'review': return <ReviewHub mistakeCount={mistakes.length} mistakes={mistakes} onStartReview={() => actions.handleStartReview('ai')} onStartMistakePractice={actions.handleStartReview} onStartSyntaxClinic={actions.handleStartClinic} onGenerateVariant={actions.handleGenerateVariant} onBack={() => actions.setActiveTab('algorithms')} targetLanguage={preferences.targetLanguage} retentionStats={stats.retention} language={preferences.spokenLanguage} />;
        case 'engineering': return <EngineeringHub preferences={preferences} onUpdatePreferences={actions.updatePreferences} language={preferences.spokenLanguage} onStartLesson={(p) => actions.handleStartCustomLesson(p)} onDataChange={actions.notifyDataChange} />;
        case 'forge': return <Forge language={preferences.spokenLanguage} onViewItem={actions.handleViewForgeItem} preferences={preferences} onDataChange={actions.notifyDataChange} />;
        case 'career': return <CareerLobby language={preferences.spokenLanguage} onStartSession={actions.handleStartCareerSession} onStartLesson={(p) => actions.handleStartCustomLesson(p)} onStartExam={actions.handleStartCareerExam} onViewRoadmap={actions.handleViewForgeItem} preferences={preferences} savedLessons={savedLessons} careerSessions={careerSessions} />;
        case 'profile': return <ProfileView stats={stats} progressMap={progressMap} mistakes={mistakes} language={preferences.spokenLanguage} preferences={preferences} onUpdateName={(name) => actions.updatePreferences({userName: name})} onSelectProblem={actions.handleSelectProblem} />;
        default: return <Dashboard progressMap={progressMap[preferences.targetLanguage] || {}} stats={stats} savedLessons={savedLessons} mistakes={mistakes} onSelectProblem={actions.handleSelectProblem} onLoadSaved={(l) => actions.handleStartCustomLesson(l.plan)} onStartReview={() => actions.handleStartReview('ai')} language={preferences.spokenLanguage} />;
    }
  };

  return (
    <>
        {showDailyStandup && <DailyStandupModal streak={stats.streak} onClose={() => handleStandupComplete(false)} onStartWarmup={() => handleStandupComplete(true)} isZh={preferences.spokenLanguage === 'Chinese'} />}
        <Layout 
            key={refreshKey} 
            activeTab={activeTab} 
            onTabChange={actions.setActiveTab} 
            preferences={preferences} 
            onUpdatePreferences={actions.updatePreferences} 
            onExportData={actions.handleExportData} 
            onImportData={actions.handleImportData} 
            onDataLoaded={actions.handleDataLoaded} 
            onResetData={actions.onResetData} 
            syncStatus={syncStatus} 
            hideMobileNav={view === 'loading' || view === 'runner' || view === 'career-runner'} 
            hideSidebar={view === 'loading' || view === 'runner' || view === 'career-runner'}
            collectFullState={actions.collectFullState}
        >
            {renderContent()}
        </Layout>
    </>
  );
}
