
import { GoogleGenAI } from "@google/genai";
import { getClient } from "./ai/client";
import { UserPreferences, LessonPlan, Widget, LessonScreen } from "../types";
import { ForgeRoadmap } from "../types/forge";
import { SkillTrack, EngineeringStep } from "../types/engineering";
import { AIGenerationError } from "./ai/generator";

import { getForgeRoadmapPrompt, getForgeStagePrompt } from "./ai/prompts/forge";
import { getTrackSyllabusPrompt } from "./ai/prompts/engineering/track_generator";
import { getTrackSuggestionPrompt } from "./ai/prompts/engineering/track_suggestions";
import { getTopicRoadmapPrompt } from "./ai/prompts/engineering/topic_roadmap";
import { getRegenerateScreenPrompt } from "./ai/prompts/regenerate";
import { lessonPlanSchema } from "./ai/schemas";
import { ForgeGenConfig } from "../types/forge";

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
                    if (type === 'fillin') type = 'fill-in';
                    if (type === 'interactivecode') type = 'interactive-code';
                    
                    const safeWidget: Widget = {
                        id: w.id || `w_${sIdx}_${wIdx}`,
                        type: type as any,
                        dialogue: w.dialogue,
                        callout: w.callout,
                        flipcard: w.flipcard,
                        quiz: w.quiz,
                        interactiveCode: w.interactiveCode,
                        parsons: w.parsons,
                        fillIn: w.fillIn || w.fillin, // Handle both casing
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

export const generateForgeRoadmap = async (
    topic: string, 
    config: ForgeGenConfig,
    preferences: UserPreferences
): Promise<ForgeRoadmap> => {
    const systemInstruction = getForgeRoadmapPrompt(topic, preferences.spokenLanguage, config);
    // Explicitly reinforced instructions about the stage count
    const prompt = `Search and create a ${config.stageCount}-stage learning roadmap for: ${topic}. 
    CRITICAL: You MUST generate an array of EXACTLY ${config.stageCount} stages. 
    Do not generate fewer. Do not generate more.`;
    
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
            config: config, // Store for later
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
    const stageIndex = roadmap.stages.findIndex(s => s.id === stageId);
    const stage = roadmap.stages[stageIndex];
    if (!stage) throw new Error("Stage not found");

    // Use stored config or default
    const config = roadmap.config || { mode: 'technical', difficultyStart: 'intermediate', stageCount: 6, screensPerStage: 6 };

    const systemInstruction = getForgeStagePrompt(
        roadmap.topic, 
        stage.title, 
        stage.description, 
        stage.focus, 
        preferences.spokenLanguage,
        config,
        stageIndex // Pass index for progression logic (beginner protection)
    );
    
    // Reinforce screen count in user prompt as well
    const prompt = `Generate detailed lesson content for stage ${stageId}: "${stage.title}". 
    Generate EXACTLY ${config.screensPerStage || 6} screens. 
    Make it rich, visual, and interactive.`;

    try {
        const text = await callAI(preferences, systemInstruction, prompt, lessonPlanSchema, true);
        const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
        const rawPlan = JSON.parse(cleanText);
        
        const plan = sanitizeLessonPlan(rawPlan);
        
        // Inject context for progress saving AND Regeneration context
        plan.context = {
            type: 'forge',
            topic: roadmap.topic, // CRITICAL for regeneration
            stageTitle: stage.title,
            roadmapId: roadmap.id,
            stageId: stageId
        };

        return plan;
    } catch (e: any) {
        console.error("Forge Stage Generation Failed", e);
        throw new AIGenerationError("Failed to generate stage content.", e.message);
    }
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

// --- REGENERATE SCREEN ---
export const regenerateLessonScreen = async (
    currentScreen: LessonScreen,
    planContext: any,
    userInstruction: string,
    preferences: UserPreferences
): Promise<LessonScreen> => {
    const systemInstruction = getRegenerateScreenPrompt(
        currentScreen.header || "Lesson Screen",
        planContext,
        userInstruction,
        preferences.spokenLanguage,
        preferences.targetLanguage
    );
    
    const prompt = "Regenerate this screen based on the user instruction and context.";

    try {
        const text = await callAI(preferences, systemInstruction, prompt, undefined, true);
        const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
        let screenData = JSON.parse(cleanText);
        
        // Wrap in plan structure to use existing sanitizer
        const mockPlan = { screens: [screenData] };
        const safePlan = sanitizeLessonPlan(mockPlan);
        
        return safePlan.screens[0];
    } catch (e: any) {
        console.error("Regeneration Failed", e);
        throw new AIGenerationError("Failed to regenerate screen.", e.message);
    }
};
