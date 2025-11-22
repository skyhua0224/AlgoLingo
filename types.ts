
export interface Problem {
  id: string;
  name: string;
  category?: string;
}

// Progress is now nested: Language -> ProblemID -> Level
export type ProgressMap = Record<string, Record<string, number>>;

export type LeagueTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

export interface League {
    currentTier: LeagueTier;
    rank: number;
    weeklyXp: number;
}

export interface DailyQuest {
    id: string;
    description: string;
    target: number;
    current: number;
    rewardGems: number;
    completed: boolean;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt?: number;
}

export interface UserStats {
  streak: number;
  xp: number;
  gems: number;
  lastPlayed: string;
  history: Record<string, number>; // Date (YYYY-MM-DD) -> XP
  
  // v3.0 Gamification
  league?: League;
  quests?: DailyQuest[];
  achievements?: Achievement[];
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

export interface NotificationConfig {
    enabled: boolean;
    webhookUrl: string; // Telegram URL or Bark URL
    type: 'bark' | 'telegram' | 'wechat' | 'custom';
    lastNotified?: number;
}

export interface SyncConfig {
    enabled: boolean;
    githubToken: string;
    gistId?: string; // If empty, we create one
    lastSynced?: number;
}

export interface UserPreferences {
  userName: string; 
  hasOnboarded: boolean; 
  targetLanguage: 'Python' | 'Java' | 'C++' | 'C' | 'JavaScript' | 'Go';
  spokenLanguage: 'Chinese' | 'English';
  apiConfig: ApiConfig;
  theme: AppTheme; 
  failedSkips?: Record<string, boolean>;
  
  // New Configurations
  notificationConfig: NotificationConfig;
  syncConfig: SyncConfig;
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
    | 'leetcode' 
    | 'steps-list'
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
    mode?: 'learn' | 'assessment'; 
    model3d?: string; // v3.0: URL to 3D model/GLB
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
      lines: string[]; 
      explanation?: string;
      indentation?: boolean; // v3.0: Enable horizontal dragging for Python scope
  };

  stepsList?: {
      items: string[]; 
      mode: 'static' | 'interactive'; 
      correctOrder?: string[]; 
  };

  fillIn?: {
      code: string; 
      options?: string[]; 
      correctValues: string[]; 
      explanation?: string;
      inputMode?: 'select' | 'type'; 
  };

  leetcode?: {
      problemSlug: string;
      concept: { front: string; back: string };
      exampleCode: {
          language: string;
          lines: {
              code: string;
              explanation: string;
          }[];
          caption?: string;
      };
  };

  callout?: {
    title: string;
    text: string;
    variant: 'info' | 'warning' | 'success' | 'tip';
  };
}

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

// Dedicated response type for the LeetCode Sidebar & Simulator
export interface LeetCodeContext {
    meta: {
        title: string;
        difficulty: 'Easy' | 'Medium' | 'Hard';
        slug: string;
    };
    problem: {
        description: string; // Markdown
        examples: { input: string; output: string; explanation?: string }[];
        constraints: string[];
    };
    starterCode: string; // Template code for the user to start with
    
    // Existing Sidebar Content
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