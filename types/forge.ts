
import { LessonPlan } from './lesson';

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
    coverImage?: string;
    createdAt: number;
}

export type ForgeHistoryItem = ForgeRoadmap;
