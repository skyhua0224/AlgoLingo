
import { LeetCodeContext } from './lesson';
import { Widget } from './widget';

export type CareerMode = 'simulation' | 'jd_prep' | 'rapid_exam';

export type TurnType = 'text' | 'coding' | 'system_design' | 'quiz' | 'end';

// New: Define specific stages of a tech interview
export type CareerStage = 'technical_1' | 'technical_2' | 'system_design' | 'manager' | 'hr';

// New: Define interviewer personality/focus
export type InterviewerPersona = 'grinder' | 'architect' | 'empath' | 'exec';

export interface InterviewTurn {
    id: string;
    type: TurnType;
    role: 'ai' | 'user' | 'system';
    
    // Content
    message?: string; // Chat bubble text (AI's spoken words)
    
    // If type is NOT text, this contains the interactive payload for the active stage
    payload?: {
        codingContext?: LeetCodeContext;
        widgets?: Widget[]; // For Quiz/FillIn
        systemDesign?: {
            goal: string;
            requirements: string[];
            initialComponents: string[];
        };
    };

    // State
    userResponse?: string; // Text reply or code snapshot
    score?: number;
    status: 'pending' | 'completed' | 'timeout';
    timeLimit?: number; // Seconds allowed for this turn
    timestamp: number;
}

export interface RoleDefinition {
    id: string;
    title: string;
    salary?: string; // e.g. "$150k - $220k"
    requirements: string[]; // e.g. ["React", "Node.js", "System Design"]
    languages: string[]; // e.g. ["JavaScript", "TypeScript"] - Allowed languages for interview
}

export interface CompanyProfile {
    id: string;
    name: string;
    region: string;
    domain: string;
    description: string;
    icon?: string; // icon name or url
    color: string;
    roles: RoleDefinition[]; // Updated from string[]
    tags: string[];
    category: 'backend' | 'frontend' | 'fullstack' | 'mobile' | 'game' | 'ai' | 'data' | 'infra' | 'arch';
}

export interface CareerSession {
    id: string;
    mode: CareerMode;
    
    // New: Stage config
    stage?: CareerStage; 
    interviewerPersona?: InterviewerPersona;

    companyId: string;
    companyName: string;
    role: string;
    
    // For JD Prep
    jdText?: string;
    syllabusId?: string; // Link to a ForgeRoadmap if in JD Prep mode

    // For Simulation
    turns: InterviewTurn[];
    status: 'active' | 'completed' | 'archived';
    
    createdAt: number;
    updatedAt: number;
    
    // Persona
    culture: 'engineering' | 'product' | 'academic' | 'startup' | 'corporate';
}
