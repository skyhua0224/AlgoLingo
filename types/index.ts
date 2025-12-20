
export * from './user';
export * from './lesson';
export * from './widget';
export * from './api';
export * from './engineering';
export * from './forge';
export * from './career';

// Fix: Add 'dashboard' and 'forge-detail' to AppView to resolve type mismatch in App.tsx and hooks
export type AppView = 'algorithms' | 'review' | 'engineering' | 'forge' | 'career' | 'profile' | 'loading' | 'runner' | 'unit-map' | 'career-runner' | 'dashboard' | 'forge-detail';
