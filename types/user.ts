
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

export interface RetentionRecord {
    lastReview: number; // Timestamp
    interval: number;   // Days until next review
    stability: number;  // 0-100 score
    nextReview: number; // Timestamp
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
  
  // Spaced Repetition Data
  retention?: Record<string, RetentionRecord>;
}

export type AppTheme = 'light' | 'dark' | 'system';

export interface NotificationConfig {
    enabled: boolean;
    webhookUrl: string;
    type: 'bark' | 'telegram' | 'wechat' | 'custom';
    lastNotified?: number;
}

export interface SyncConfig {
    enabled: boolean;
    githubToken: string;
    gistId?: string;
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
  notificationConfig: NotificationConfig;
  syncConfig: SyncConfig;
}
