
export * from './user';
export * from './lesson';
export * from './widget';
export * from './api';
export * from './engineering';
export * from './forge';
export * from './career';

import { LeetCodeContext, SolutionStrategy } from './lesson';

export type AppView = 'algorithms' | 'review' | 'engineering' | 'forge' | 'career' | 'profile' | 'loading' | 'runner' | 'unit-map' | 'career-runner' | 'dashboard' | 'forge-detail';

export interface ProblemData {
    context: LeetCodeContext;
    solutions: SolutionStrategy[];
    timestamp: number;
}
