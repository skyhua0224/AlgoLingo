import { GoogleGenAI } from "@google/genai";
import { getClient } from "./ai/client";
import { UserPreferences, LessonPlan, Widget } from "../types";
import { ForgeRoadmap } from "../types/forge";
import { SkillTrack, EngineeringStep } from "../types/engineering";
import { AIGenerationError } from "./ai/generator";

import { getForgeRoadmapPrompt, getForgeStagePrompt } from "./ai/prompts/forge";
import { getTrackSyllabusPrompt } from "./ai/prompts/engineering/track_generator";
import { getTrackSuggestionPrompt } from "./ai/prompts/engineering/track_suggestions";
import { getTopicRoadmapPrompt } from "./ai/prompts/engineering/topic_roadmap";
import { lessonPlanSchema } from "./ai/schemas";

// Re-export existing generators from the dedicated generator file
export { 
    generateLessonPlan, 
    generateDailyWorkoutPlan, 
    generateVariantLesson, 
    generateLeetCodeContext, 
    validateUserCode, 
    generateEngineeringLesson, 
    generateReviewLesson, 
    generateSyntaxClinicPlan, 
    generateSyntaxRoadmap, 
    generateSyntaxLesson, 
    generateAiAssistance 
} from "./ai/generator";

// --- HELPER: WIDGET VALIDATOR & SANITIZER ---
const sanitizeLessonPlan = (rawPlan: any): LessonPlan => {
    if (!rawPlan || typeof rawPlan !== 'object') throw new Error("Invalid plan format");
    
    const plan: LessonPlan = {
        title: rawPlan.title || "Untitled Lesson",
        description: rawPlan.description || "No description",
        suggestedQuestions: Array.isArray(rawPlan.suggestedQuestions) ? rawPlan.suggestedQuestions : [],
        screens: [],
        headerImage: rawPlan.headerImage
    };

    if (Array.isArray(rawPlan.screens)) {
        plan.screens = rawPlan.screens.map((screen: any, sIdx: number) => {
            const safeScreen = {
                id: screen.id || `screen_${sIdx}`,
                header: screen.header || "Learn",
                widgets: [] as Widget[]
            };

            if (Array.isArray(screen.widgets)) {
                safeScreen.widgets = screen.widgets.map((w: any, wIdx: number) => {
                    let type = (w.type || 'callout').toLowerCase();
                    // Normalize types
                    if (type === 'mermaidvisual') type = 'mermaid';
                    if (type === 'comparisontable') type = 'comparison-table';
                    
                    const safeWidget: Widget = {
                        id: w.id || `w_${sIdx}_${wIdx}`,
                        type: type as any,
                        dialogue: w.dialogue,
                        callout: w.callout,
                        flipcard: w.flipcard,
                        quiz: w.quiz,
                        interactiveCode: w.interactiveCode,
                        parsons: w.parsons,
                        fillIn: w.fillIn,
                        stepsList: w.stepsList,
                        mermaid: w.mermaid,
                        visualQuiz: w.visualQuiz,
                        comparisonTable: w.comparisonTable,
                        code: w.code,
                        leetcode: w.leetcode,
                        terminal: w.terminal,
                        codeWalkthrough: w.codeWalkthrough,
                        miniEditor: w.miniEditor,
                        archCanvas: w.archCanvas
                    };
                    return safeWidget;
                }).filter((w): w is Widget => w !== null);
            }
            return safeScreen;
        }).filter(s => s.widgets.length > 0);
    }
    
    if (plan.screens.length === 0) {
        plan.screens.push({
            id: "fallback",
            header: "Generation Error",
            widgets: [{
                id: "err",
                type: "callout",
                callout: { title: "Error", text: "AI failed to generate content.", variant: "warning" }
            }]
        });
    }
    return plan;
};

// Generic API Call Wrapper
const callAI = async (
    preferences: UserPreferences,
    systemInstruction: string,
    prompt: string,
    schema?: any,
    jsonMode: boolean = false,
    tools?: any[]
): Promise<string> => {
    const client = getClient(preferences);
    const modelId = preferences.apiConfig.gemini.model || 'gemini-2.5-flash';
    const useJsonMode = jsonMode && (!tools || tools.length === 0);

    try {
        const response = await client.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: useJsonMode ? "application/json" : undefined,
                responseSchema: useJsonMode ? schema : undefined,
                temperature: 0.4,
                tools: tools,
            }
        });
        return response.text || "";
    } catch (e) {
        console.error("Gemini API Error", e);
        throw e;
    }
};

// --- FORGE GENERATORS ---

export const generateForgeRoadmap = async (topic: string, preferences: UserPreferences): Promise<ForgeRoadmap> => {
    const systemInstruction = getForgeRoadmapPrompt(topic, preferences.spokenLanguage);
    const prompt = `Search and create roadmap for: ${topic}`;
    
    const forgePreferences = { 
        ...preferences, 
        apiConfig: { 
            ...preferences.apiConfig, 
            gemini: { ...preferences.apiConfig.gemini, model: 'gemini-2.5-pro' } 
        } 
    };

    try {
        const text = await callAI(
            forgePreferences, 
            systemInstruction, 
            prompt, 
            undefined, 
            false, 
            [{ googleSearch: {} }]
        );
        
        const match = text.match(/\{[\s\S]*\}/);
        const cleanText = match ? match[0] : text;
        const data = JSON.parse(cleanText);
        
        return {
            id: `forge_${Date.now()}`,
            topic: topic,
            title: data.title || topic,
            description: data.description || "AI Generated Course",
            createdAt: Date.now(),
            stages: data.stages.map((s: any) => ({
                ...s,
                status: s.id === 1 ? 'unlocked' : 'locked'
            }))
        };

    } catch (e: any) {
        console.error("Forge Roadmap Failed", e);
        throw new AIGenerationError("Failed to search and plan topic.", e.message);
    }
};

export const generateForgeStage = async (
    roadmap: ForgeRoadmap, 
    stageId: number, 
    preferences: UserPreferences
): Promise<LessonPlan> => {
    const stage = roadmap.stages.find(s => s.id === stageId);
    if (!stage) throw new Error("Stage not found");

    const systemInstruction = getForgeStagePrompt(
        roadmap.topic, 
        stage.title, 
        stage.description, 
        stage.focus, 
        preferences.spokenLanguage
    );
    
    const prompt = `Generate detailed lesson content for stage ${stageId}`;

    try {
        const text = await callAI(preferences, systemInstruction, prompt, lessonPlanSchema, true);
        const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
        const rawPlan = JSON.parse(cleanText);
        
        const plan = sanitizeLessonPlan(rawPlan);
        if (roadmap.coverImage) plan.headerImage = roadmap.coverImage;
        
        return plan;
    } catch (e: any) {
        console.error("Forge Stage Generation Failed", e);
        throw new AIGenerationError("Failed to generate stage content.", e.message);
    }
};

export const generateForgeImage = async (topic: string, preferences: UserPreferences): Promise<string | undefined> => {
    const client = getClient(preferences);
    const model = 'gemini-2.5-flash-image';
    
    try {
        const response = await client.models.generateContent({
            model: model,
            contents: {
                parts: [
                    { text: `Create a high quality, artistic, futuristic cover image for a lesson about: ${topic}. Minimalist, vector style, vibrant colors.` }
                ]
            },
            config: {
                imageConfig: {
                    aspectRatio: "16:9",
                }
            }
        });

        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
    } catch (e) {
        console.error("Image Generation Failed", e);
    }
    return undefined;
};

// --- NEW ENGINEERING FUNCTIONS ---

export const generateCustomTrack = async (title: string, description: string, preferences: UserPreferences): Promise<SkillTrack> => {
    const systemInstruction = getTrackSyllabusPrompt(title, description, preferences.spokenLanguage);
    const prompt = "Generate syllabus";
    
    try {
        const text = await callAI(preferences, systemInstruction, prompt, undefined, true); 
        const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
        const data = JSON.parse(cleanText);
        
        return {
            id: `custom_${Date.now()}`,
            title: title,
            description: description,
            category: 'other',
            icon: 'Sparkles',
            progress: 0,
            isOfficial: false,
            createdAt: Date.now(),
            modules: data.modules 
        };
    } catch (e: any) {
        throw new AIGenerationError("Failed to generate track syllabus.", e.message);
    }
};

export const generateTrackSuggestions = async (category: string, existingTitles: string[], preferences: UserPreferences): Promise<SkillTrack[]> => {
    const systemInstruction = getTrackSuggestionPrompt(category, existingTitles);
    const prompt = "Suggest tracks";
    
    try {
        const text = await callAI(preferences, systemInstruction, prompt, undefined, true);
        const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
        const data = JSON.parse(cleanText);
        
        return data.tracks.map((t: any) => ({
            id: `suggested_${Date.now()}_${Math.random()}`,
            title: t.title,
            description: t.description,
            icon: t.icon,
            category: category === 'all' ? 'other' : category,
            progress: 0,
            isOfficial: false,
            createdAt: Date.now(),
            keywords: t.keywords
        }));
    } catch (e: any) {
        throw new AIGenerationError("Failed to generate suggestions.", e.message);
    }
};

export const generateEngineeringRoadmap = async (
    topic: string, 
    pillar: 'system' | 'cs' | 'track', 
    keywords: string[], 
    preferences: UserPreferences
): Promise<EngineeringStep[]> => {
    const systemInstruction = getTopicRoadmapPrompt(topic, pillar, keywords, preferences.spokenLanguage);
    const prompt = "Generate roadmap";
    
    try {
        const text = await callAI(preferences, systemInstruction, prompt, undefined, true);
        const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
        const data = JSON.parse(cleanText);
        
        return data.roadmap.map((step: any) => ({
            id: step.id,
            title: step.title,
            description: step.description,
            focus: step.focus,
            status: step.id === data.roadmap[0].id ? 'active' : 'locked'
        }));
    } catch (e: any) {
        throw new AIGenerationError("Failed to generate engineering roadmap.", e.message);
    }
};