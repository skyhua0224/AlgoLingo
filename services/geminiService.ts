
import { getClient } from "./ai/client";
import { getLessonPlanSystemInstruction, getLeetCodeContextSystemInstruction, getJudgeSystemInstruction, getVariantSystemInstruction, getDailyWorkoutSystemInstruction } from "./ai/prompts";
import { getSyntaxRoadmapPrompt } from "./ai/prompts/engineering/syntax_roadmap";
import { getSyntaxTrainerPrompt } from "./ai/prompts/engineering/syntax_trainer";
import { lessonPlanSchema, leetCodeContextSchema, judgeResultSchema } from "./ai/schemas";
import { UserPreferences, MistakeRecord, LessonPlan, Widget, LeetCodeContext, SavedLesson } from "../types";
import { SyntaxProfile, SyntaxUnit, SyntaxLesson } from "../types/engineering";
import { PROBLEM_MAP } from "../constants";
import { Type } from "@google/genai";

// --- CUSTOM ERROR CLASS ---
export class AIGenerationError extends Error {
    rawOutput?: string;
    constructor(message: string, rawOutput?: string) {
        super(message);
        this.name = "AIGenerationError";
        this.rawOutput = rawOutput;
    }
}

// --- HELPER: GENERIC API CALL ---
const callAI = async (
    preferences: UserPreferences,
    systemInstruction: string,
    prompt: string,
    schema?: any,
    jsonMode: boolean = false
): Promise<string> => {
    const client = getClient(preferences);
    const modelId = preferences.apiConfig.gemini.model || 'gemini-2.5-flash';
    
    // OpenAI Fallback logic would go here if configured
    
    try {
        const response = await client.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: jsonMode ? "application/json" : undefined,
                responseSchema: jsonMode ? schema : undefined,
                temperature: 0.4,
            }
        });
        return response.text || "";
    } catch (e) {
        console.error("Gemini API Error", e);
        throw e;
    }
};

// --- EXISTING GENERATORS (LessonPlan, DailyWorkout, etc...) ---
// ... (Keeping existing exports below) ...

export const generateLessonPlan = async (
  problemName: string, 
  phaseIndex: number, 
  preferences: UserPreferences,
  mistakes: MistakeRecord[] = [],
  savedLessons: SavedLesson[] = []
): Promise<LessonPlan> => {
  const targetLang = preferences.targetLanguage;
  const speakLang = preferences.spokenLanguage;
  const systemInstruction = getLessonPlanSystemInstruction(problemName, targetLang, speakLang, phaseIndex);
  
  let userPrompt = `Generate the lesson plan for Phase ${phaseIndex + 1} of ${problemName}.`;
  if (mistakes.length > 0) {
      userPrompt += `\nContext: The user previously struggled with: ${mistakes.map(m => m.context).join(', ')}. Please reinforce these concepts.`;
  }

  try {
      const text = await callAI(preferences, systemInstruction, userPrompt, lessonPlanSchema, true);
      const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
      return JSON.parse(cleanText);
  } catch (error: any) {
      throw new AIGenerationError(error.message || "Unknown Generation Error", "");
  }
};

export const generateDailyWorkoutPlan = async (
    mistakes: MistakeRecord[],
    learnedProblemIds: string[],
    preferences: UserPreferences
): Promise<LessonPlan> => {
    const learnedProblemNames = learnedProblemIds.map(id => PROBLEM_MAP[id]).filter(n => !!n);
    if (learnedProblemNames.length === 0) return generateLessonPlan("Two Sum", 0, preferences);

    const systemInstruction = getDailyWorkoutSystemInstruction(preferences.targetLanguage, preferences.spokenLanguage);
    const prompt = `GENERATE DAILY WORKOUT. Learned: ${learnedProblemNames.join(', ')}. Mistakes: ${mistakes.map(m => m.context).join(', ')}`;

    const text = await callAI(preferences, systemInstruction, prompt, lessonPlanSchema, true);
    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
    const plan = JSON.parse(cleanText);
    plan.title = preferences.spokenLanguage === 'Chinese' ? "📅 今日智能特训" : "📅 Daily Smart Workout";
    return plan;
};

export const generateVariantLesson = async (mistake: MistakeRecord, preferences: UserPreferences): Promise<LessonPlan> => {
    const systemInstruction = getVariantSystemInstruction(preferences.targetLanguage, preferences.spokenLanguage);
    const prompt = `Create VARIANT of mistake: ${mistake.problemName}, Widget: ${JSON.stringify(mistake.widget)}`;
    const text = await callAI(preferences, systemInstruction, prompt, lessonPlanSchema, true);
    return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
};

export const generateLeetCodeContext = async (problemName: string, preferences: UserPreferences): Promise<LeetCodeContext> => {
    const systemInstruction = getLeetCodeContextSystemInstruction(problemName, preferences.spokenLanguage, preferences.targetLanguage);
    const text = await callAI(preferences, systemInstruction, `Generate simulation for ${problemName}`, leetCodeContextSchema, true);
    return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
};

export const validateUserCode = async (code: string, problemDesc: string, preferences: UserPreferences, languageOverride?: string) => {
    const targetLang = languageOverride || preferences.targetLanguage;
    const systemInstruction = getJudgeSystemInstruction(targetLang, preferences.spokenLanguage);
    const prompt = `Problem: ${problemDesc}\nUser Code:\n\`\`\`${targetLang}\n${code}\n\`\`\``;
    try {
        const text = await callAI(preferences, systemInstruction, prompt, judgeResultSchema, true);
        return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    } catch (e) {
        return { status: "Runtime Error", error_message: "Judge Connection Failed.", test_cases: [] };
    }
};

// --- NEW: ENGINEERING HUB GENERATORS ---

export const generateSyntaxRoadmap = async (profile: SyntaxProfile, preferences: UserPreferences): Promise<SyntaxUnit[]> => {
    const prompt = getSyntaxRoadmapPrompt(profile);
    
    const localizedStringSchema = {
        type: Type.OBJECT,
        properties: {
            en: { type: Type.STRING },
            zh: { type: Type.STRING }
        },
        required: ["en", "zh"]
    };

    const lessonSchema = {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING },
            title: localizedStringSchema,
            description: localizedStringSchema
        },
        required: ["id", "title", "description"]
    };

    const roadmapSchema = {
        type: Type.OBJECT,
        properties: {
            units: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        title: localizedStringSchema,
                        description: localizedStringSchema,
                        lessons: {
                            type: Type.ARRAY,
                            items: lessonSchema
                        }
                    },
                    required: ["id", "title", "description", "lessons"]
                }
            }
        }
    };

    try {
        const text = await callAI(preferences, "You are a curriculum designer.", prompt, roadmapSchema, true);
        const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
        const data = JSON.parse(cleanText);
        
        // Hydrate with local state defaults
        return data.units.map((u: any, idx: number) => ({
            ...u,
            status: idx === 0 ? 'active' : 'locked',
            lessons: u.lessons.map((l: any, lIdx: number) => ({
                ...l,
                status: (idx === 0 && lIdx === 0) ? 'active' : 'locked',
                currentStageIndex: 0
            }))
        }));
    } catch (e: any) {
        console.error("Roadmap Generation Failed", e);
        throw new Error("Failed to generate roadmap");
    }
};

export const generateSyntaxLesson = async (
    unit: SyntaxUnit, 
    lesson: SyntaxLesson,
    stageId: string,
    profile: SyntaxProfile, 
    preferences: UserPreferences
): Promise<LessonPlan> => {
    // We now pass stageId (e.g. 'visual_concept') instead of just index
    const systemInstruction = getSyntaxTrainerPrompt(profile, unit, lesson, stageId); 
    const langKey = preferences.spokenLanguage === 'Chinese' ? 'zh' : 'en';
    
    const prompt = `
    Generate the lesson plan for: "${lesson.title[langKey]}" (Module: ${unit.title[langKey]}).
    Stage Type: ${stageId}.
    User Profile: Origin=${profile.origin}, Objective=${profile.objective}.
    `;

    try {
        const text = await callAI(preferences, systemInstruction, prompt, lessonPlanSchema, true);
        const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
        const plan: LessonPlan = JSON.parse(cleanText);
        
        // --- INJECT CONTEXT FOR PROGRESS TRACKING ---
        plan.context = {
            type: 'syntax',
            language: profile.language,
            unitId: unit.id,
            lessonId: lesson.id,
            phaseIndex: stageId === 'sandbox' ? 6 : parseInt(stageId, 10)
        };

        return plan;
    } catch (error: any) {
        console.error("Lesson Generation Failed", error);
        throw new AIGenerationError("Failed to generate lesson plan.", "");
    }
};

export const generateReviewLesson = async (mistakes: MistakeRecord[], preferences: UserPreferences): Promise<LessonPlan> => {
    return generateDailyWorkoutPlan(mistakes, ["p_1"], preferences);
};

export const generateSyntaxClinicPlan = async (preferences: UserPreferences): Promise<LessonPlan> => {
    return generateLessonPlan("Syntax Clinic", 1, preferences); 
};

export const generateAiAssistance = async (context: string, userQuery: string, preferences: UserPreferences, model: string) => {
    try {
        return await callAI(preferences, "You are a helpful coding assistant. Be brief.", `Context:\n${context}\n\nUser Question: ${userQuery}\n\nAnswer briefly.`, undefined, false);
    } catch (e) {
        return "AI is offline.";
    }
};
