
import { LessonPlan } from './lesson';

// Data models for the Engineering Hub

export type SkillLevel = 'Novice' | 'Junior' | 'Mid' | 'Senior' | 'Expert';

// --- SYNTAX CONSOLE TYPES ---

export type SyntaxOrigin = 'null' | 'mapped' | 'rusty' | 'augmented'; 
export type SyntaxObjective = 'backend' | 'data' | 'algo' | 'internals' | 'mastery' | 'academic' | 'custom'; 
export type LearningModality = 'drill' | 'deep' | 'audit' | 'rapid'; 

export interface LearningAttributes {
    handwriting: boolean; 
    visual: boolean;      
    internals: boolean;   
    audit: boolean;       
    repetition: boolean;  
}

export interface LocalizedContent {
    en: string;
    zh: string;
}

export interface StageConfig {
    id: string;
    label: LocalizedContent;
    icon: string;
}

export interface LessonPhase {
    id: string;
    title: LocalizedContent;
    type: 'learn' | 'practice' | 'code' | 'mastery'; 
    description?: LocalizedContent;
}

export interface SyntaxLesson {
    id: string;
    title: LocalizedContent;
    description: LocalizedContent;
    status: 'locked' | 'active' | 'completed';
    type: 'standard' | 'sandbox' | 'exam'; 
    currentPhaseIndex: number; 
    phases?: LessonPhase[];     
}

export interface SyntaxUnit {
    id: string;
    title: LocalizedContent;
    description: LocalizedContent;
    lessons: SyntaxLesson[]; 
    status: 'locked' | 'active' | 'completed';
}

export interface SyntaxProfile {
    language: string; 
    origin: SyntaxOrigin;
    sourceLanguage?: string; 
    objective: SyntaxObjective;
    customObjective?: string;
    modality: LearningModality;
    attributes: LearningAttributes; 
    roadmap: SyntaxUnit[];
    currentUnitId?: string;
    strategyName: string;
    createdAt: number;
}

// --- ENGINEERING PILLARS & TRACKS SHARED TYPES ---

export interface EngineeringStep {
    id: string;
    title: LocalizedContent;
    description: LocalizedContent;
    focus: 'concept' | 'code' | 'debug' | 'design' | 'mastery'; 
    status: 'locked' | 'active' | 'completed';
    tags?: string[]; // e.g. ["Theory", "Quiz", "Mini-Editor", "Terminal"]
    cachedPlan?: LessonPlan; // Store generated lesson for instant replay
}

// User progress profile for a specific topic/lesson
export interface TopicProfile {
    topicId: string;
    pillarId: string; // 'system' | 'cs' | 'track'
    trackId?: string; // If pillarId is 'track'
    generatedAt: number;
    roadmap: EngineeringStep[];
    currentStepIndex: number;
}

export interface EngineeringTopic {
    id: string;
    title: LocalizedContent;
    keywords: string[];
}

export interface EngineeringModule {
    id: string;
    level?: string; 
    title: LocalizedContent;
    description: LocalizedContent;
    topics: EngineeringTopic[];
}

// Structure for Twin Pillars (Static Data)
export interface EngineeringPillar {
    id: string;
    title: LocalizedContent;
    description: LocalizedContent;
    modules: EngineeringModule[];
}

// Structure for Dynamic Tracks (AI Generated Syllabus)
export interface SkillTrack {
    id: string;
    title: LocalizedContent | string; // Support both object and legacy string       
    icon: string;         
    category: 'backend' | 'frontend' | 'mobile' | 'game' | 'ai' | 'data' | 'infra' | 'arch' | 'sec' | 'qa' | 'other';
    description: LocalizedContent | string;
    
    // The Syllabus: Modules -> Topics (Hierarchical)
    // This is populated by AI when the user first opens the track
    modules?: EngineeringModule[]; 
    
    progress: number;     
    isOfficial: boolean;  
    createdAt: number;
    keywords?: string[]; // Context for AI generation
}
