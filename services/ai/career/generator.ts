
import { GoogleGenAI } from "@google/genai";
import { UserPreferences, LessonPlan } from "../../../types";
import { CareerSession, InterviewTurn, CompanyProfile, RoleDefinition } from "../../../types/career";
import { getInterviewerTurnPrompt, getJDSyllabusPrompt, getCompanyGenPrompt, getRapidExamSystemInstruction } from "./prompts";
import { generateLeetCodeContext } from "../generator"; 
import { ForgeRoadmap } from "../../../types/forge";
import { AIGenerationError } from "../generator";

const getClient = (preferences: UserPreferences) => {
    if (preferences.apiConfig.provider === 'gemini-custom') {
        return new GoogleGenAI({ apiKey: preferences.apiConfig.gemini.apiKey || '' });
    } else {
        return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    }
};

// --- SIMULATION MODE: INTERVIEWER BRAIN ---

export const generateNextTurn = async (
    session: CareerSession,
    preferences: UserPreferences
): Promise<InterviewTurn> => {
    const client = getClient(preferences);
    
    // Compile History for Context
    // Add user's initial role context if history is short to ensure relevance
    let historyStr = session.turns.map(t => {
        if (t.role === 'ai') return `[Turn ${t.id}] Interviewer: ${t.message}`;
        if (t.role === 'user') return `[Turn ${t.id}] Candidate: ${t.userResponse || '(Submitted Task)'}`;
        if (t.role === 'system') return `[Turn ${t.id}] System Log: ${t.userResponse}`; 
        return '';
    }).join('\n');

    if (session.turns.length === 0 && session.jdText) {
        historyStr = `[System Context]: User is applying for ${session.role}. Resume/JD highlights: ${session.jdText.substring(0, 300)}...`;
    }

    const isExam = session.mode === 'rapid_exam';
    const turnCount = session.turns.length;
    const currentStage = session.stage || 'technical_1';

    const prompt = getInterviewerTurnPrompt(
        session.companyName, 
        session.role, 
        historyStr, 
        preferences.spokenLanguage,
        isExam,
        turnCount,
        currentStage
    );

    try {
        const response = await client.models.generateContent({
            model: preferences.apiConfig.gemini.model || 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.7, 
            }
        });
        
        const text = response.text || "{}";
        const data = JSON.parse(text);

        // 2-STEP GENERATION FOR CODING TASKS
        // If the interviewer wants a coding task, we must generate the context separately
        // to ensure the JSON is valid and complete. The interviewer brain just gives the "Topic".
        if (data.nextAction === 'coding' && data.payload && data.payload.codingTopic) {
            try {
                // Generate full coding environment
                const context = await generateLeetCodeContext(data.payload.codingTopic, preferences);
                data.payload.codingContext = context;
            } catch (codingErr) {
                console.error("Failed to generate coding context:", codingErr);
                // Fallback: Switch to text mode if coding env fails, so it doesn't crash
                data.nextAction = 'text';
                data.message += " (System Note: Coding environment unavailable. Let's discuss this theoretically instead.)";
            }
        }

        return {
            id: `turn_${Date.now()}`,
            role: 'ai',
            type: data.nextAction === 'text' ? 'text' : data.nextAction, 
            message: data.message,
            payload: data.payload,
            status: 'pending',
            timeLimit: data.timeLimit || 120,
            timestamp: Date.now()
        };

    } catch (e) {
        console.error("Interviewer Brain Failed", e);
        // Fallback
        return {
            id: `turn_err_${Date.now()}`,
            type: 'text',
            role: 'ai',
            message: "I'm having trouble connecting to the interview server. Let's try again.",
            status: 'pending',
            timestamp: Date.now()
        };
    }
};

// --- JD PREP MODE: SYLLABUS GENERATOR ---

export const generateJDSyllabus = async (
    jd: string,
    preferences: UserPreferences
): Promise<ForgeRoadmap> => {
    const client = getClient(preferences);
    const prompt = getJDSyllabusPrompt(jd, preferences.spokenLanguage);
    
    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-pro', // Use Pro for complex planning
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        
        const text = response.text || "{}";
        const data = JSON.parse(text);
        
        return {
            id: `forge_jd_${Date.now()}`,
            topic: data.title || "JD Customized Plan",
            title: data.title || "Job Prep Plan",
            description: data.description || "Tailored based on your JD.",
            stages: data.stages || [],
            createdAt: Date.now()
        };
    } catch (e) {
        console.error("JD Gen Failed", e);
        throw new Error("Failed to generate JD Roadmap");
    }
};

// --- RAPID EXAM GENERATOR ---

export const generateRapidExam = async (
    company: string,
    role: string,
    jd: string,
    preferences: UserPreferences
): Promise<LessonPlan> => {
    const client = getClient(preferences);
    const systemInstruction = getRapidExamSystemInstruction(company, role, jd, preferences.spokenLanguage);
    const prompt = "Generate the exam now. Ensure strict JSON output matching LessonPlan schema.";

    let text = "";
    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { 
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                temperature: 0.5 // Lower temp for consistent exam questions
            }
        });
        
        text = response.text || "{}";
        let plan: any = JSON.parse(text);
        
        // --- ROBUSTNESS FIX: Handle Flat Array Output ---
        if (Array.isArray(plan)) {
            const widgets = plan;
            plan = {
                title: `${company} Exam`,
                description: `Rapid assessment for ${role}`,
                screens: widgets.map((w: any, idx: number) => ({
                    id: `screen_${idx}`,
                    header: w.callout?.title || `Question ${idx + 1}`,
                    widgets: [w]
                }))
            };
        }

        // --- ROBUSTNESS FIX: Fix property mapping (kebab-case to camelCase) ---
        if (plan.screens && Array.isArray(plan.screens)) {
            plan.screens.forEach((screen: any) => {
                if (screen.widgets && Array.isArray(screen.widgets)) {
                    screen.widgets.forEach((widget: any) => {
                        // Fix fill-in key
                        if (widget.type === 'fill-in' && widget['fill-in']) {
                            widget.fillIn = widget['fill-in'];
                            delete widget['fill-in'];
                        }
                        // Add id if missing
                        if (!widget.id) widget.id = `w_${Math.random().toString(36).substr(2, 9)}`;
                    });
                }
            });
        }
        
        // Validation to prevent black screen
        if (!plan.screens || !Array.isArray(plan.screens) || plan.screens.length === 0) {
            throw new AIGenerationError("AI returned an empty exam plan.", text);
        }

        // Ensure widgets exist
        plan.screens = plan.screens.filter((s: any) => s.widgets && s.widgets.length > 0);
        if (plan.screens.length === 0) {
             throw new AIGenerationError("AI returned screens with no widgets.", text);
        }

        plan.title = plan.title || `${company} Entrance Exam`;
        plan.description = plan.description || `Rapid fire assessment for ${role}`;
        // Tag context for history filtering and Time Limit
        plan.context = {
            type: 'career_exam',
            companyName: company,
            roleName: role,
            timeLimit: 600 // 10 Minutes default for exam
        };
        return plan as LessonPlan;
    } catch (e: any) {
        console.error("Exam Gen Failed", e);
        if (e instanceof AIGenerationError) throw e;
        throw new AIGenerationError("Failed to generate Exam: " + e.message, text);
    }
};

// --- COMPANY GENERATOR ---

export const generateAICompanies = async (
    category: string,
    existingNames: string[],
    preferences: UserPreferences
): Promise<CompanyProfile[]> => {
    const client = getClient(preferences);
    const prompt = getCompanyGenPrompt(category, existingNames, preferences.spokenLanguage);

    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        
        const text = response.text || "{}";
        const data = JSON.parse(text);
        
        return (data.companies || []).map((c: any) => {
            // Map raw strings to RoleDefinition objects
            const richRoles: RoleDefinition[] = (c.roles || []).map((r: string, idx: number) => ({
                id: `gen_role_${idx}`,
                title: r,
                requirements: c.tags ? c.tags.slice(0, 3) : ['General'],
                languages: ['Python', 'Java', 'JavaScript'] // Default set
            }));

            return {
                id: `gen_${Date.now()}_${Math.random()}`,
                name: c.name,
                description: c.description,
                region: c.region || 'global',
                domain: c.domain || category,
                roles: richRoles,
                tags: c.tags || [],
                category: category as any,
                color: 'from-gray-700 to-gray-900', // Default dark
                icon: 'Building2'
            };
        });

    } catch (e) {
        console.error("Company Gen Failed", e);
        return [];
    }
};
