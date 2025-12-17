
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

export interface LogicStep {
    title: string;
    detail: string;
    type?: 'init' | 'loop' | 'condition' | 'action' | 'result'; 
}

export interface KeywordMeta {
    term: string;
    definition: string;
}

// NEW: Mission Brief Data Structure
export interface MissionBriefData {
    type: 'visual_io' | 'transformation';
    input: string;  // e.g. "['eat', 'tea', 'tan']"
    output: string; // e.g. "[['eat', 'tea'], ['tan']]"
    
    // The Trap (Why not brute force?)
    trap: {
        title: string; // "Time Limit Exceeded"
        description: string; // "O(N^2) is too slow..."
    };
}

// NEW: Smart Tag Data Structure
export interface SmartTagData {
    name: string;       // "HashMap"
    definition: string; // "Key-Value mapping..."
    codeSnippet: string;// "dict = {}"
}

export interface SolutionStrategy {
    id: string;
    title: string; // e.g. "HashMap Approach"
    complexity: string; // Time/Space
    
    // Rich Content Blocks
    summary?: string; // One-sentence summary for list view
    tags: string[]; // e.g. ["Two Pointers", "Array"]
    
    // The "Thinking Process"
    derivation: string; // How we arrived here (The "Process")
    rationale?: string; // "Why use this?"
    
    // NEW: Pedagogical Fields
    analogy?: string; // Real world analogy
    memoryTip?: string; // "How to remember/understand"
    
    // Visuals
    logicSteps?: LogicStep[]; // Native UI Logic Flow
    mermaid?: string; // Legacy support
    
    // Code & Syntax
    code: string; // Raw code string for reference
    codeWidgets: Widget[]; // Interactive code widget for line-by-line
    
    // Language specifics
    keywords: KeywordMeta[]; // e.g. "enumerate" -> "Why used here?"

    language: string;
    isCustom?: boolean; // Is this user generated?

    // Detailed breakdown sections (from Official Solution deep dive)
    sections?: {
        header: string;
        content: string;
    }[];

    expandedKnowledge?: string[];
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
  proficiency?: number; // 0-5 scale. 0 = new/failed, 1 = reviewed once, 2 = mastered/resolved.
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
            caption?: string;
        };
        assistantSuggestions: string[];
    }
}
