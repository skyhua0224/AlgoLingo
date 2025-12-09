
import { GoogleGenAI } from "@google/genai";
import { getClient } from "./ai/client";
import { UserPreferences, LessonPlan, Widget, LessonScreen, SolutionStrategy, LeetCodeContext } from "../types";
import { ForgeRoadmap } from "../types/forge";
import { SkillTrack, EngineeringStep } from "../types/engineering";
import { AIGenerationError } from "./ai/generator";

import { getForgeRoadmapPrompt, getForgeStagePrompt } from "./ai/prompts/forge";
import { getTrackSyllabusPrompt } from "./ai/prompts/engineering/track_generator";
import { getTrackSuggestionPrompt } from "./ai/prompts/engineering/track_suggestions";
import { getTopicRoadmapPrompt } from "./ai/prompts/engineering/topic_roadmap";
import { getRegenerateScreenPrompt } from "./ai/prompts/regenerate";
import { getDisputeJudgePrompt } from "./ai/prompts/dispute";
import { getLeetCodeSolutionSystemInstruction } from "./ai/prompts/stages/leetcode";
import { lessonPlanSchema } from "./ai/schemas";
import { ForgeGenConfig } from "../types/forge";

// Re-export existing generators
export { 
    generateLessonPlan, 
    generateDailyWorkoutPlan, 
    generateVariantLesson, 
    generateLeetCodeContext, 
    validateUserCode, 
    generateReviewLesson, 
    generateSyntaxClinicPlan, 
    generateSyntaxRoadmap, 
    generateSyntaxLesson, 
    generateAiAssistance 
} from "./ai/generator";

// --- HELPER: WIDGET VALIDATOR & SANITIZER (Kept from existing file) ---
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
                        fillIn: w.fillIn || w.fillin, 
                        stepsList: w.stepsList,
                        mermaid: w.mermaid,
                        visualQuiz: w.visualQuiz,
                        comparisonTable: w.comparisonTable,
                        code: w.code,
                        leetcode: w.leetcode,
                        terminal: w.terminal,
                        codeWalkthrough: w.codeWalkthrough,
                        miniEditor: w.miniEditor,
                        archCanvas: w.archCanvas,
                        markdown: (w as any).markdown
                    } as any;
                    return safeWidget;
                }).filter((w): w is Widget => w !== null);
            }
            return safeScreen;
        }).filter(s => s.widgets.length > 0);
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
    tools?: any[],
    modelOverride?: string
): Promise<string> => {
    const client = getClient(preferences);
    // Use modelOverride if provided, otherwise default to user preference
    const modelId = modelOverride || preferences.apiConfig.gemini.model || 'gemini-2.5-flash';
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

// --- IMPORT PROMPTS ---
import { getSystemArchitectPrompt } from "./ai/prompts/engineering/system_architect";
import { getCSKernelPrompt } from "./ai/prompts/engineering/cs_kernel";

// --- GENERATE SOLUTIONS (Updated for Detail & Chinese) ---
export const generateLeetCodeSolutions = async (
    problemContext: LeetCodeContext,
    preferences: UserPreferences
) => {
    // Use user selected model instead of forcing Pro
    const model = preferences.apiConfig.gemini.model; 
    
    // Convert context object to string for prompt
    const contextStr = `
    Title: ${problemContext.meta.title}
    Description: ${problemContext.problem.description}
    Examples: ${JSON.stringify(problemContext.problem.examples)}
    `;

    const systemInstruction = getLeetCodeSolutionSystemInstruction(preferences.targetLanguage, contextStr);
    
    const prompt = `Based on the problem context, generate 3 detailed solution strategies in Chinese.`;

    const text = await callAI(preferences, systemInstruction, prompt, undefined, true, undefined, model);
    return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
};

export const refineUserSolution = async (
    userNotes: string,
    problemName: string,
    preferences: UserPreferences
) => {
    const model = preferences.apiConfig.gemini.model; // Use User model
    const systemInstruction = getLeetCodeSolutionSystemInstruction(preferences.targetLanguage, `Problem: ${problemName}`);
    
    const prompt = `
    The user has provided a CUSTOM solution/idea: "${userNotes}".
    Refine this into a structured "SolutionApproach" object (JSON) matching the standard format.
    
    REQUIREMENTS:
    1. **Title**: Summarize the approach in Chinese (e.g. "用户自定义：递归法").
    2. **Derivation**: Explain the logic clearly in Chinese Markdown. Fill in gaps if user notes are sparse.
    3. **Code Parsing**: If the user provided code, parse it into 'codeLines' with explanations. If they provided text, generate the code for them in ${preferences.targetLanguage}.
    
    OUTPUT FORMAT: Single object inside "approaches" array: { id, title, complexity, tags, derivation, codeLines }
    `;

    const text = await callAI(preferences, systemInstruction, prompt, undefined, true, undefined, model);
    const data = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    return data.approaches ? data.approaches[0] : data;
};

// --- ENGINEERING GENERATOR ---
export const generateEngineeringLesson = async (
    pillar: 'system' | 'cs' | 'track', 
    topic: string,
    keywords: string[],
    level: string, 
    preferences: UserPreferences,
    extraContext?: string,
    topicId?: string, 
    stepId?: string
): Promise<LessonPlan> => {
    const useSystemPrompt = pillar === 'system' || pillar === 'track';
    
    const systemInstruction = useSystemPrompt 
        ? getSystemArchitectPrompt(topic, keywords, level, extraContext)
        : getCSKernelPrompt(topic, keywords, level); 
        
    const prompt = `Generate a comprehensive engineering lesson for: ${topic}. Phase: ${level}. Context: ${extraContext || 'General'}`;

    try {
        const text = await callAI(preferences, systemInstruction, prompt, lessonPlanSchema, true);
        const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
        const rawPlan = JSON.parse(cleanText);
        const plan = sanitizeLessonPlan(rawPlan);
        
        plan.context = { 
            type: 'pillar', 
            pillar,
            topic, 
            phaseIndex: 0, 
            levelId: level,
            topicId: topicId,
            stepId: stepId
        }; 
        return plan;
    } catch (e: any) {
        console.error("Engineering Lesson Generation Failed", e);
        throw new AIGenerationError("Failed to generate engineering lesson.", e.message);
    }
};

// --- FORGE GENERATORS ---
export const generateForgeRoadmap = async (
    topic: string, 
    config: ForgeGenConfig,
    preferences: UserPreferences
): Promise<ForgeRoadmap> => {
    const systemInstruction = getForgeRoadmapPrompt(topic, preferences.spokenLanguage, config);
    const prompt = `Search and create a ${config.stageCount}-stage learning roadmap for: ${topic}.`;
    
    const forgePreferences = { 
        ...preferences, 
        apiConfig: { ...preferences.apiConfig, gemini: { ...preferences.apiConfig.gemini, model: 'gemini-2.5-pro' } } 
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
            config: config, 
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

    const config = roadmap.config || { mode: 'technical', difficultyStart: 'intermediate', stageCount: 6, screensPerStage: 6 };

    const systemInstruction = getForgeStagePrompt(
        roadmap.topic, 
        stage.title, 
        stage.description, 
        stage.focus, 
        preferences.spokenLanguage,
        config,
        stageIndex 
    );
    
    const prompt = `Generate detailed lesson content for stage ${stageId}: "${stage.title}".`;

    try {
        const text = await callAI(preferences, systemInstruction, prompt, lessonPlanSchema, true);
        const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
        const rawPlan = JSON.parse(cleanText);
        const plan = sanitizeLessonPlan(rawPlan);
        plan.context = {
            type: 'forge',
            topic: roadmap.topic, 
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

export const generateCustomTrack = async (title: string, description: string, preferences: UserPreferences): Promise<SkillTrack> => {
    const systemInstruction = getTrackSyllabusPrompt(title, description, preferences.spokenLanguage);
    try {
        const text = await callAI(preferences, systemInstruction, "Generate syllabus", undefined, true); 
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
    try {
        const text = await callAI(preferences, systemInstruction, "Suggest tracks", undefined, true);
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
    try {
        const text = await callAI(preferences, systemInstruction, "Generate roadmap", undefined, true);
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

export const regenerateLessonScreen = async (
    currentScreen: LessonScreen,
    planContext: any,
    userInstruction: string,
    preferences: UserPreferences
): Promise<LessonScreen> => {
    const systemInstruction = getRegenerateScreenPrompt(
        currentScreen, 
        planContext,
        userInstruction,
        preferences.spokenLanguage,
        preferences.targetLanguage
    );
    try {
        const text = await callAI(preferences, systemInstruction, "Regenerate this screen.", undefined, true);
        const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
        let screenData = JSON.parse(cleanText);
        const mockPlan = { screens: [screenData] };
        const safePlan = sanitizeLessonPlan(mockPlan);
        return safePlan.screens[0];
    } catch (e: any) {
        console.error("Regeneration Failed", e);
        throw new AIGenerationError("Failed to regenerate screen.", e.message);
    }
};

export const verifyAnswerDispute = async (
    widget: Widget,
    userAnswer: any,
    context: string,
    preferences: UserPreferences
): Promise<{ verdict: 'correct' | 'incorrect'; explanation: string; memoryTip: string }> => {
    const widgetJson = JSON.stringify(widget);
    const userAnsStr = typeof userAnswer === 'string' ? userAnswer : JSON.stringify(userAnswer);
    const systemInstruction = getDisputeJudgePrompt(widgetJson, userAnsStr, context, preferences.spokenLanguage);
    try {
        const text = await callAI(preferences, systemInstruction, "Judge the user's answer.", undefined, true);
        const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
        return JSON.parse(cleanText);
    } catch (e) {
        console.error("Dispute Verification Failed", e);
        throw new Error("AI Judge is unavailable.");
    }
};
