
export interface Problem {
  id: string;
  name: string;
  category?: string;
}

// Progress is now nested: Language -> ProblemID -> Level
export type ProgressMap = Record<string, Record<string, number>>;

export interface UserStats {
  streak: number;
  xp: number;
  gems: number;
  lastPlayed: string;
  history: Record<string, number>; // Date (YYYY-MM-DD) -> XP
}

export type ApiProvider = 'gemini-official' | 'gemini-custom' | 'openai';

export interface ApiConfig {
    provider: ApiProvider;
    gemini: {
        model: string;
        apiKey?: string;
        baseUrl?: string; // For proxy
    };
    openai: {
        baseUrl: string;
        apiKey: string;
        model: string;
    };
}

export type AppTheme = 'light' | 'dark' | 'system';

export interface UserPreferences {
  userName: string; // New: User's name
  hasOnboarded: boolean; // New: First time flag
  targetLanguage: 'Python' | 'Java' | 'C++' | 'C' | 'JavaScript';
  spokenLanguage: 'Chinese' | 'English';
  apiConfig: ApiConfig;
  theme: AppTheme; 
}

// --- NEW WIDGET TYPES ---

export type WidgetType = 
    | 'dialogue' 
    | 'flipcard' 
    | 'quiz' 
    | 'code' 
    | 'interactive-code'
    | 'parsons'
    | 'fill-in'
    | 'code-editor' // New: Full code simulation
    | 'steps-list'  // New: Algorithm steps
    | 'callout';

export interface Widget {
  id: string;
  type: WidgetType;
  
  dialogue?: {
    text: string;
    speaker: 'coach' | 'user';
    emotion?: 'neutral' | 'happy' | 'thinking' | 'excited';
  };
  
  flipcard?: {
    front: string;
    back: string;
    hint?: string;
    mode?: 'learn' | 'assessment'; // Assessment adds "Got it / Forgot" buttons
  };
  
  quiz?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  
  code?: {
    content: string;
    language: string;
    caption?: string;
  };

  interactiveCode?: {
      language: string;
      lines: {
          code: string;
          explanation: string;
      }[];
      caption?: string;
  };

  parsons?: {
      lines: string[]; // Scrambled lines
      explanation?: string;
  };

  // New Widget Data
  stepsList?: {
      items: string[]; // The steps text
      mode: 'static' | 'interactive'; // Static display or sortable
      correctOrder?: string[]; // For interactive mode validation
  };

  fillIn?: {
      code: string; // Contains __BLANK__
      options?: string[]; // Correct and distractors (Optional if mode is text)
      correctValues: string[]; // Order of correct values
      explanation?: string;
      inputMode?: 'select' | 'type'; // New: Select from options or Type manually
  };

  codeEditor?: {
      title?: string; // LeetCode Title e.g. "1. Two Sum"
      initialCode: string; // The boilerplate e.g. "class Solution: def..."
      problemDescription: string; // The main text
      examples: {
          input: string;
          output: string;
          explanation?: string;
      }[];
      constraints: string[];
      hints?: string[];
  };

  callout?: {
    title: string;
    text: string;
    variant: 'info' | 'warning' | 'success' | 'tip';
  };
}

export interface LessonScreen {
    id: string;
    header?: string; // Title of the screen (e.g. "Concept: Hash Maps")
    widgets: Widget[];
    isRetry?: boolean; // New: Marks if this screen is a mistake remediation
}

export interface LessonPlan {
  title: string;
  description: string;
  unitId?: string; // To track unit mastery
  screens: LessonScreen[];
  suggestedQuestions: string[]; // New: 5 suggestions for AI chat
  isLocalReplay?: boolean; // New: Marks if this is a purely local review (no AI)
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
  nodeIndex: number; // New: Track which phase the mistake happened in
  questionType: string; // e.g., 'quiz', 'parsons'
  context: string; // The specific question or code snippet failed
  widget?: Widget; // Store the full widget for faithful replay without AI
  timestamp: number;
}

export interface GameContent {
    // Legacy support
    levelTitle: string;
    
    // FillInGame properties
    missingWords?: string[];
    codeSnippet?: string;

    // ParsonsGame properties
    scrambledLines?: string[];

    // TheoryGame properties
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
