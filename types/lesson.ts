
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
    title: string; // e.g. "哈希表优化法"
    complexity: string;
    code: string; // Raw code string for copying/display
    language: string;
    
    // Deep Dive Content
    derivation: string; // Markdown: detailed narrative, intuition, prerequisites, thought process
    
    // Structured Code for Interactive Widget
    codeLines: {
        code: string;
        explanation: string;
    }[];

    // Strategy specific concept card for sidebar
    concept?: {
        front: string;
        back: string;
    };

    intuition?: string;
    isCustom?: boolean; 
    tags?: string[]; // Concept tags in Chinese
}

export interface LessonPlan {
  title: string;
  description: string;
  headerImage?: string; 
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
      
      // Solution Context
      targetSolution?: SolutionStrategy; 
      
      // Engineering Context
      pillar?: string;
      topic?: string;
      topicId?: string; 
      levelId?: string;
      stepId?: string;  

      // Career/Forge Context
      roadmapId?: string; 
      stageId?: number;   
      stageTitle?: string; 
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
  xpEarned?: number;     
  mistakeCount?: number; 
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
