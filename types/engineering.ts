
// Data models for the Engineering Hub

export type SkillLevel = 'Novice' | 'Junior' | 'Mid' | 'Senior' | 'Expert';

// --- SYNTAX CONSOLE TYPES ---

export type SyntaxOrigin = 'null' | 'mapped' | 'rusty' | 'augmented'; // Beginner, Migrator, Returning, AI-User
export type SyntaxObjective = 'backend' | 'data' | 'algo' | 'internals' | 'mastery' | 'academic' | 'custom'; 

// New: Modality determines the "How", distinct from Origin/Objective
export type LearningModality = 'drill' | 'deep' | 'audit' | 'rapid'; 

export interface LearningAttributes {
    handwriting: boolean; // Enforce typing over selecting
    visual: boolean;      // Use more analogies/diagrams
    internals: boolean;   // Explain memory/bytecode
    audit: boolean;       // Focus on debugging/reviewing
    repetition: boolean;  // More screens for the same concept
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
    
    // Dynamic Progression
    currentPhaseIndex: number; // 0 to 5 (matches the 6-Phase standard)
    phases?: LessonPhase[];     // Legacy support, but now we use fixed 6 phases
}

export interface SyntaxUnit {
    id: string;
    title: LocalizedContent;
    description: LocalizedContent;
    lessons: SyntaxLesson[]; // Nested structure
    status: 'locked' | 'active' | 'completed';
}

export interface SyntaxProfile {
    language: string; 
    
    // Identity Calibration
    origin: SyntaxOrigin;
    sourceLanguage?: string; // For 'mapped' origin
    
    objective: SyntaxObjective;
    customObjective?: string;
    
    modality: LearningModality;
    attributes: LearningAttributes; // Derived from Modality + Tweaks
    
    // The Matrix Roadmap
    roadmap: SyntaxUnit[];
    
    currentUnitId?: string;
    
    strategyName: string;
    createdAt: number;
}

// --- PILLARS TYPES ---

export interface PillarUnit {
    id: string;
    title: string;
    description: string;
    status: 'locked' | 'active' | 'completed';
    progress: number; // 0-100
}

// --- TRACKS TYPES ---

export interface TrackChapter {
    id: string;
    title: string;
    description: string;
    status: 'locked' | 'active' | 'completed';
}

export interface SkillTrack {
    id: string;
    title: string;        
    icon: string;         
    category: 'frontend' | 'backend' | 'game' | 'devops' | 'mobile' | 'other';
    description: string;
    chapters: TrackChapter[];
    progress: number;     
    isOfficial: boolean;  
    createdAt: number;
}
