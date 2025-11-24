
import { getClient } from "./ai/client";
import { getLessonPlanSystemInstruction, getLeetCodeContextSystemInstruction, getJudgeSystemInstruction, getVariantSystemInstruction, getDailyWorkoutSystemInstruction } from "./ai/prompts";
import { getSystemArchitectPrompt } from "./ai/prompts/engineering/system_architect";
import { getCSKernelPrompt } from "./ai/prompts/engineering/cs_kernel";
import { getSyntaxRoadmapPrompt } from "./ai/prompts/engineering/syntax_roadmap";
import { getSyntaxTrainerPrompt } from "./ai/prompts/engineering/syntax_trainer";
import { getTrackSyllabusPrompt } from "./ai/prompts/engineering/track_generator";
import { getTopicRoadmapPrompt } from "./ai/prompts/engineering/topic_roadmap";
import { getTrackSuggestionPrompt } from "./ai/prompts/engineering/track_suggestions"; // Import new prompt
import { lessonPlanSchema, leetCodeContextSchema, judgeResultSchema } from "./ai/schemas";
import { UserPreferences, MistakeRecord, LessonPlan, Widget, LeetCodeContext, SavedLesson } from "../../types";
import { PROBLEM_MAP } from "../../constants";
import { SyntaxProfile, SyntaxUnit, SyntaxLesson, SkillTrack, EngineeringStep, EngineeringModule } from "../../types/engineering";
import { Type } from "@google/genai";
import { AIGenerationError } from "./ai/generator";

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

// --- ENGINEERING HUB GENERATORS ---

export const generateEngineeringLesson = async (
    pillar: 'system' | 'cs',
    topic: string,
    keywords: string[],
    level: string, 
    preferences: UserPreferences,
    extraContext?: string
): Promise<LessonPlan> => {
    const systemInstruction = pillar === 'system' 
        ? getSystemArchitectPrompt(topic, keywords, level, extraContext)
        : getCSKernelPrompt(topic, keywords, level);
        
    const prompt = `Generate a comprehensive engineering lesson for: ${topic}. Level: ${level}. Context: ${extraContext || 'General'}`;

    try {
        const text = await callAI(preferences, systemInstruction, prompt, lessonPlanSchema, true);
        const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
        const plan = JSON.parse(cleanText);
        plan.context = { type: 'pillar', pillar, topic, phaseIndex: 0, levelId: level }; 
        return plan;
    } catch (e: any) {
        console.error("Engineering Lesson Generation Failed", e);
        throw new AIGenerationError("Failed to generate engineering lesson.");
    }
};

export const generateEngineeringRoadmap = async (
    topic: string,
    pillar: 'system' | 'cs' | 'track',
    keywords: string[],
    preferences: UserPreferences
): Promise<EngineeringStep[]> => {
    const systemInstruction = getTopicRoadmapPrompt(topic, pillar, keywords, preferences.spokenLanguage);
    const prompt = `Generate syllabus for ${topic}`;
    
    const roadmapSchema = {
        type: Type.OBJECT,
        properties: {
            roadmap: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        title: { 
                            type: Type.OBJECT,
                            properties: { en: { type: Type.STRING }, zh: { type: Type.STRING } },
                            required: ["en", "zh"]
                        },
                        description: {
                            type: Type.OBJECT,
                            properties: { en: { type: Type.STRING }, zh: { type: Type.STRING } },
                            required: ["en", "zh"]
                        },
                        focus: { type: Type.STRING, enum: ["concept", "code", "debug", "design", "mastery"] }
                    },
                    required: ["id", "title", "description", "focus"]
                }
            }
        },
        required: ["roadmap"]
    };

    try {
        const text = await callAI(preferences, systemInstruction, prompt, roadmapSchema, true);
        const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
        const data = JSON.parse(cleanText);
        
        return data.roadmap.map((step: any, idx: number) => ({
            ...step,
            status: idx === 0 ? 'active' : 'locked'
        }));
    } catch (e) {
        console.error("Roadmap Generation Failed", e);
        throw new AIGenerationError("Failed to generate topic roadmap.");
    }
};

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
        
        return data.units.map((u: any, idx: number) => ({
            ...u,
            status: idx === 0 ? 'active' : 'locked',
            lessons: u.lessons.map((l: any, lIdx: number) => ({
                ...l,
                status: (idx === 0 && lIdx === 0) ? 'active' : 'locked',
                currentPhaseIndex: 0
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
    const systemInstruction = getSyntaxTrainerPrompt(profile, unit, lesson, stageId, preferences.spokenLanguage); 
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

// --- TRACK GENERATOR (Hierarchical) ---
export const generateCustomTrack = async (
    trackName: string, 
    context: string, 
    preferences: UserPreferences
): Promise<SkillTrack> => {
    const prompt = getTrackSyllabusPrompt(trackName, context, preferences.spokenLanguage);
    
    const localizedStringSchema = {
        type: Type.OBJECT,
        properties: {
            en: { type: Type.STRING },
            zh: { type: Type.STRING }
        },
        required: ["en", "zh"]
    };

    const trackSchema = {
        type: Type.OBJECT,
        properties: {
            modules: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        title: localizedStringSchema,
                        description: localizedStringSchema,
                        topics: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING },
                                    title: localizedStringSchema,
                                    keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
                                },
                                required: ["id", "title", "keywords"]
                            }
                        }
                    },
                    required: ["id", "title", "description", "topics"]
                }
            }
        },
        required: ["modules"]
    };

    try {
        const text = await callAI(preferences, "Curriculum Architect", prompt, trackSchema, true);
        const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
        const data = JSON.parse(cleanText);
        
        return {
            id: `track_${Date.now()}`,
            // Ensure localized structure for title/description
            title: { en: trackName, zh: trackName }, 
            description: { en: context.substring(0, 50) + "...", zh: context.substring(0, 50) + "..." },
            icon: "Terminal",
            category: 'other',
            progress: 0,
            isOfficial: false,
            createdAt: Date.now(),
            modules: data.modules // Populated via AI
        };
    } catch (e) {
        console.error("Track Generation Failed", e);
        throw new AIGenerationError("Failed to generate custom track.");
    }
};

// --- NEW: Suggest Tracks (AI Refresh) ---
export const generateTrackSuggestions = async (
    category: string,
    existingTitles: string[],
    preferences: UserPreferences
): Promise<SkillTrack[]> => {
    const prompt = getTrackSuggestionPrompt(category, existingTitles);
    const localizedStringSchema = {
        type: Type.OBJECT,
        properties: { en: { type: Type.STRING }, zh: { type: Type.STRING } },
        required: ["en", "zh"]
    };
    const schema = {
        type: Type.OBJECT,
        properties: {
            tracks: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: localizedStringSchema,
                        description: localizedStringSchema,
                        icon: { type: Type.STRING },
                        keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["title", "description", "icon", "keywords"]
                }
            }
        },
        required: ["tracks"]
    };

    try {
        const text = await callAI(preferences, "Tech Career Mentor", prompt, schema, true);
        const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
        const data = JSON.parse(cleanText);
        
        return data.tracks.map((t: any, i: number) => ({
            id: `suggested_${Date.now()}_${i}`,
            category: category === 'all' ? 'other' : category,
            progress: 0,
            isOfficial: true, // Treat AI suggestions as semi-official
            createdAt: Date.now(),
            ...t
        }));
    } catch (e) {
        console.error("Suggestion Failed", e);
        throw new Error("Failed to generate suggestions");
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
