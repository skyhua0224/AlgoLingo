
import React from 'react';
import { Dashboard } from './components/Dashboard';
import { UnitMap } from './components/UnitMap';
import { LessonRunner } from './components/lesson/LessonRunner';
import { Layout } from './components/Layout';
import { ReviewHub } from './components/ReviewHub';
import { LoadingScreen } from './components/LoadingScreen';
import { ProfileView } from './components/ProfileView';
import { Onboarding } from './components/Onboarding';
import { EngineeringHub } from './components/EngineeringHub';
import { Forge } from './components/Forge';
import { CareerLobby } from './components/CareerLobby';
import { useAppManager } from './hooks/useAppManager';
import { AppView } from './types';

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
                onCancel={() => actions.setView('dashboard')}
            />
        );
    }
    
    // Lesson Runner Overlay
    if (view === 'runner' && currentLessonPlan) {
        return null; // Rendered as Overlay below
    }

    // Unit Map View (Sub-view of Algorithms)
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

    // Main Tabs based on activeTab (which is now of type AppView)
    switch (activeTab) {
        case 'review':
            return (
                <ReviewHub 
                    mistakeCount={mistakes.length}
                    mistakes={mistakes}
                    onStartReview={() => actions.handleStartReview('ai')}
                    onStartMistakePractice={actions.handleStartReview}
                    onStartSyntaxClinic={actions.handleStartClinic}
                    onGenerateVariant={actions.handleGenerateVariant}
                    onBack={() => actions.setActiveTab('algorithms')}
                    targetLanguage={preferences.targetLanguage}
                    retentionStats={stats.retention}
                />
            );
        case 'engineering':
            return (
                <EngineeringHub 
                    preferences={preferences} 
                    onUpdatePreferences={actions.updatePreferences}
                    language={preferences.spokenLanguage}
                />
            );
        case 'forge':
            return <Forge language={preferences.spokenLanguage} />;
        case 'career':
            return <CareerLobby language={preferences.spokenLanguage} />;
        case 'profile':
            return (
                <ProfileView 
                    stats={stats} 
                    progressMap={progressMap} 
                    mistakes={mistakes}
                    language={preferences.spokenLanguage} 
                    preferences={preferences} 
                    onUpdateName={(name) => actions.updatePreferences({userName: name})} 
                    onSelectProblem={actions.handleSelectProblem}
                />
            );
        case 'algorithms': // Default Dashboard
        default:
            return (
                <Dashboard 
                    progressMap={progressMap[preferences.targetLanguage] || {}} 
                    stats={stats} 
                    onSelectProblem={actions.handleSelectProblem} 
                    language={preferences.spokenLanguage} 
                />
            );
    }
  };

  // --- 3. Layout Wrapper ---
  // We cast activeTab to 'any' temporarily if strict typing complains about mismatched strings vs enum-like types
  // in the Layout component props, though we updated types. 
  return (
    <>
        {/* Overlay Runner */}
        {view === 'runner' && currentLessonPlan && (
            <LessonRunner 
                plan={currentLessonPlan}
                nodeIndex={activeNodeIndex}
                onComplete={actions.handleLessonComplete}
                onExit={() => actions.setView('dashboard')}
                onRegenerate={actions.handleRetryLoading}
                language={preferences.spokenLanguage}
                preferences={preferences}
                isReviewMode={state.loadingContext === 'review'}
                isSkipContext={isSkipAttempt}
                stats={stats}
            />
        )}

        <Layout 
            activeTab={activeTab as any} 
            onTabChange={(tab) => actions.setActiveTab(tab)}
            preferences={preferences}
            onUpdatePreferences={actions.updatePreferences}
            onExportData={actions.handleExportData}
            onImportData={actions.handleImportData}
            onResetData={actions.onResetData}
            hideMobileNav={view === 'loading'} 
            hideSidebar={view === 'loading'} 
        >
            {renderContent()}
        </Layout>
    </>
  );
}
