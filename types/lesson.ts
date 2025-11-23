
import { Widget } from './widget';

export interface Problem {
  id: string;
  name: string;
  category?: string;
}

export type ProgressMap = Record<string, Record<string, number>>;

export interface LessonScreen {
    id: string;
    header?: string; 
    widgets: Widget[];
    isRetry?: boolean; 
}

export interface LessonPlan {
  title: string;
  description: string;
  unitId?: string; 
  screens: LessonScreen[];
  suggestedQuestions: string[]; 
  isLocalReplay?: boolean; 
}

export interface SavedLesson {
  id: string;
  problemId: string;
  nodeIndex: number;
  timestamp: number;
  plan: LessonPlan;
  language: string;
}

export interface MistakeRecord {
  id: string;
  problemName: string;
  nodeIndex: number; 
  questionType: string; 
  context: string; 
  widget?: Widget; 
  timestamp: number;
}

// Deprecated legacy type, keeping for compatibility during refactor
export interface GameContent {
    levelTitle: string;
    missingWords?: string[];
    codeSnippet?: string;
    scrambledLines?: string[];
    levelType?: 'syntax' | 'concept' | string;
    theory?: {
        analogy: string;
        concept: string;
        explanation: string;
    };
    quiz?: {
        question: string;
        options: string[];
        correctIndex: number;
        explanation?: string;
    };
}

export interface LeetCodeContext {
    meta: {
        title: string;
        difficulty: 'Easy' | 'Medium' | 'Hard';
        slug: string;
    };
    problem: {
        description: string;
        examples: { input: string; output: string; explanation?: string }[];
        constraints: string[];
    };
    starterCode: string;
    starterCodeMap?: Record<string, string>;
    sidebar: {
        concept: {
            front: string;
            back: string;
        };
        codeSolution: {
            language: string;
            lines: {
                code: string;
                explanation: string;
            }[];
        };
        assistantSuggestions: string[];
    }
}
    