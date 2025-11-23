
import React from 'react';
import { Dashboard } from './components/Dashboard';
import { UnitMap } from './components/UnitMap';
import { LessonRunner } from './components/lesson/LessonRunner';
import { Layout } from './components/Layout';
import { ReviewHub } from './components/ReviewHub';
import { LoadingScreen } from './components/LoadingScreen';
import { ProfileView } from './components/ProfileView';
import { Onboarding } from './components/Onboarding';
import { useAppManager } from './hooks/useAppManager';

export default function App() {
  const { state, actions } = useAppManager();
  const { 
      view, activeTab, 
      preferences, stats, progressMap, mistakes, savedLessons,
      activeProblem, activeNodeIndex, currentLessonPlan,
      generationError, generationRawError, isSkipAttempt
  } = state;

  // --- 1. Onboarding Flow ---
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

  // --- 2. Content Rendering ---
  const renderContent = () => {
    // Loading Screen
    if (view === 'loading') {
        return (
            <LoadingScreen 
                problemName={activeProblem?.name} 
                phase={activeNodeIndex} 
                language={preferences.spokenLanguage} 
                onRetry={actions.handleRetryLoading}
                error={generationError}
                rawErrorOutput={generationRawError}
                onCancel={() => actions.setView(activeTab === 'review' ? 'dashboard' : 'unit-map')}
            />
        );
    }
    
    // Lesson Runner
    if (view === 'runner' && currentLessonPlan) {
        return (
            <LessonRunner 
                plan={currentLessonPlan}
                nodeIndex={activeNodeIndex}
                onComplete={actions.handleLessonComplete}
                onExit={() => actions.setView(activeTab === 'review' ? 'dashboard' : 'unit-map')}
                onRegenerate={actions.handleRetryLoading}
                language={preferences.spokenLanguage}
                preferences={preferences}
                isReviewMode={state.loadingContext === 'review'}
                isSkipContext={isSkipAttempt}
                stats={stats}
            />
        );
    }

    // Main Tabs
    if (activeTab === 'profile') {
        return (
            <ProfileView 
                stats={stats} 
                progressMap={progressMap} 
                mistakes={mistakes}
                language={preferences.spokenLanguage} 
                preferences={preferences} 
                onUpdateName={(name) => actions.updatePreferences({userName: name})} 
            />
        );
    }
    
    if (activeTab === 'review') {
        return (
            <ReviewHub 
                mistakeCount={mistakes.length} 
                mistakes={mistakes}
                onStartReview={() => actions.handleStartReview('ai')} 
                onStartMistakePractice={(mode) => actions.handleStartReview(mode)} 
                onStartSyntaxClinic={actions.handleStartClinic}
                onBack={() => actions.setActiveTab('learn')} 
                targetLanguage={preferences.targetLanguage} 
            />
        );
    }
    
    // Learning Views (Default Fallback)
    // Use 'dashboard' as catch-all if not in specific sub-views
    if (view === 'unit-map' && activeProblem) {
        return (
            <UnitMap 
                problemName={activeProblem.name}
                currentLevel={progressMap[preferences.targetLanguage]?.[activeProblem.id] || 0}
                savedLessons={savedLessons.filter(l => l.problemId === activeProblem?.id && l.language === preferences.targetLanguage)}
                onStartLevel={actions.handleStartNode}
                onLoadSaved={(l) => { /* Load Saved logic */ }}
                onBack={() => actions.setView('dashboard')}
                language={preferences.spokenLanguage}
                failedSkips={preferences.failedSkips}
            />
        );
    }

    // Default to Dashboard if no other view matches
    return (
        <Dashboard 
            progressMap={progressMap[preferences.targetLanguage] || {}} 
            stats={stats} 
            onSelectProblem={actions.handleSelectProblem} 
            language={preferences.spokenLanguage} 
        />
    );
  };

  // --- 3. Layout Wrapper ---
  return (
    <Layout 
        activeTab={activeTab} 
        onTabChange={actions.setActiveTab}
        preferences={preferences}
        onUpdatePreferences={actions.updatePreferences}
        onExportData={actions.handleExportData}
        onImportData={actions.handleImportData}
        onResetData={actions.onResetData}
        hideMobileNav={view === 'runner' || view === 'loading'}
    >
        {renderContent()}
    </Layout>
  );
}
