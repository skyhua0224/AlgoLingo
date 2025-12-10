
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

export interface SolutionStrategy {
    id: string;
    title: string; // e.g. "HashMap Approach"
    complexity: string;
    code: string; // The core logic code
    language: string;
    derivation: string; // How to derive it
    intuition?: string;
    isCustom?: boolean; // Is this user generated?
}

export interface LessonPlan {
  title: string;
  description: string;
  headerImage?: string; // Support for Forge generated covers
  unitId?: string; 
  screens: LessonScreen[];
  suggestedQuestions: string[]; 
  isLocalReplay?: boolean; 
  context?: {
      type: 'syntax' | 'algo' | 'pillar' | 'career_exam' | 'forge';
      language?: string;
      unitId?: string;
      lessonId?: string;
      phaseIndex?: number;
      
      // Solution Context (New)
      targetSolution?: SolutionStrategy; // The specific solution we are teaching
      
      // Engineering Context
      pillar?: string;
      topic?: string;
      topicId?: string; // NEW: For saving progress
      levelId?: string;
      stepId?: string;  // NEW: For saving progress

      // Career/Forge Context
      roadmapId?: string; // NEW
      stageId?: number;   // NEW
      stageTitle?: string; // NEW: For regeneration context
      companyName?: string; 
      roleName?: string;
      timeLimit?: number;
  };
}

export interface SavedLesson {
  id: string;
  problemId: string;
  nodeIndex: number;
  timestamp: number;
  plan: LessonPlan;
  language: string;
  xpEarned?: number;     // Added: XP gained in this session
  mistakeCount?: number; // Added: Number of mistakes made
}

export interface MistakeRecord {
  id: string;
  problemName: string;
  nodeIndex: number; 
  questionType: string; 
  context: string; 
  widget?: Widget; 
  timestamp: number;
  reviewCount?: number; 
  failureCount?: number; 
  isResolved?: boolean;  
}

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
