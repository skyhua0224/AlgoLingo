
import { LessonPlan } from './lesson';

export type ForgeMode = 'technical' | 'general' | 'conceptual';
export type ForgeDifficultyStart = 'novice' | 'intermediate' | 'expert'; // "My Level"
export type ForgeLength = 3 | 6 | 9 | 12; // Number of stages
export type ForgeDensity = 6 | 12 | 18 | 24 | 32; // Screens per stage

export interface ForgeGenConfig {
    mode: ForgeMode;
    difficultyStart: ForgeDifficultyStart;
    stageCount: ForgeLength;
    screensPerStage: ForgeDensity;
}

export interface ForgeStage {
    id: number;
    title: string;
    description: string;
    focus: 'concept' | 'structure' | 'process' | 'nuance' | 'application' | 'insight';
    icon: string; // Lucide icon name
    status: 'locked' | 'unlocked' | 'completed';
    lessonPlan?: LessonPlan; // Cached plan after generation
}

export interface ForgeRoadmap {
    id: string;
    topic: string;
    title: string;
    description: string;
    stages: ForgeStage[];
    config: ForgeGenConfig; // Persist the settings used to generate this
    coverImage?: string;
    createdAt: number;
}

export type ForgeHistoryItem = ForgeRoadmap;