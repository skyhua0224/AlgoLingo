
import { ApiConfig } from './api';

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

// Updated for SRS Algorithm
export interface RetentionRecord {
    problemId: string; // Explicit ID link
    lastReview: number; // Timestamp
    interval: number;   // Days until next review (1, 3, 7, 30...)
    stability: number;  // 0-100 score (Legacy compat, can use for visual health)
    nextReview: number; // Timestamp
    streak: number;     // Consecutive correct reviews
    history: {          // Audit trail for AI analysis
        date: number;
        qScore: number; // 0-3 Quality Score
        timeSpent: number;
    }[];
}

export interface UserStats {
  streak: number;
  xp: number;
  gems: number;
  lastPlayed: string;
  history: Record<string, number>; // Date (YYYY-MM-DD) -> XP
  
  league?: League;
  quests?: DailyQuest[];
  achievements?: Achievement[];
  
  // Spaced Repetition Data (Key: problemId)
  retention?: Record<string, RetentionRecord>;
}

export type AppTheme = 'light' | 'dark' | 'system';

export interface NotificationConfig {
    enabled: boolean;
    webhookUrl: string;
    type: 'bark' | 'telegram' | 'wechat' | 'custom';
    lastNotified?: number;
}

export type SyncStatus = 'synced' | 'syncing' | 'error' | 'conflict' | 'idle';

export interface SyncConfig {
    enabled: boolean;
    githubToken: string;
    gistId?: string;
    lastSynced?: number;
    autoSync?: boolean;
}

export interface UserPreferences {
  userName: string; 
  hasOnboarded: boolean; 
  targetLanguage: 'Python' | 'Java' | 'C++' | 'C' | 'JavaScript' | 'Go';
  spokenLanguage: 'Chinese' | 'English';
  apiConfig: ApiConfig;
  theme: AppTheme; 
  failedSkips?: Record<string, boolean>;
  notificationConfig: NotificationConfig;
  syncConfig: SyncConfig;
  
  // NEW: Persist active strategy per problem (ProblemID -> StrategyID)
  activeStrategies?: Record<string, string>;
}
