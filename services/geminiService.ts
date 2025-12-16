
// ... existing imports ...
import { GoogleGenAI } from "@google/genai";
import { getClient } from "./ai/client";
import { UserPreferences, LessonPlan, Widget, LessonScreen, SolutionStrategy, LeetCodeContext, MistakeRecord } from "../types";
import { ForgeRoadmap } from "../types/forge";
import { SkillTrack, EngineeringStep } from "../types/engineering";
import { AIGenerationError } from "./ai/generator";

import { getForgeRoadmapPrompt, getForgeStagePrompt } from "./ai/prompts/forge";
import { getTrackSyllabusPrompt } from "./ai/prompts/engineering/track_generator";
import { getTrackSuggestionPrompt } from "./ai/prompts/engineering/track_suggestions";
import { getTopicRoadmapPrompt } from "./ai/prompts/engineering/topic_roadmap";
import { getRegenerateScreenPrompt } from "./ai/prompts/regenerate";
import { getDisputeJudgePrompt } from "./ai/prompts/dispute";
import { getLeetCodeSolutionSystemInstruction, getOfficialSolutionPrompt } from "./ai/prompts/stages/leetcode";
import { getMistakeRepairSystemInstruction } from "./ai/prompts/stages/workout";
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
    generateAiAssistance,
} from "./ai/generator";

// ... existing helper functions (sanitizeLessonPlan, callAI) ...
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
                    // Normalizations
                    if (type === 'mermaidvisual') type = 'mermaid';
                    if (type === 'comparisontable') type = 'comparison-table';
                    if (type === 'fillin') type = 'fill-in';
                    if (type === 'interactivecode') type = 'interactive-code';
                    if (type === 'comparisoncode') type = 'comparison-code';
                    
                    const safeWidget: Widget = {
                        id: w.id || `w_${sIdx}_${wIdx}`,
                        type: type as any,
                        dialogue: w.dialogue,
                        callout: w.callout,
                        flipcard: w.flipcard,
                        quiz: w.quiz,
                        interactiveCode: w.interactiveCode,
                        comparisonCode: w.comparisonCode, // Added mapping
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
                        archCanvas: w.archCanvas
                    } as any;
                    return safeWidget;
                }).filter((w): w is Widget => w !== null);
            }
            return safeScreen;
        }).filter(s => s.widgets.length > 0);
    }
    return plan;
};

// ... (Duplicate callAI helper for context in this file) ...
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
    const modelId = modelOverride || preferences.apiConfig.gemini.model || 'gemini-3-pro-preview';
    
    try {
        const response = await client.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: jsonMode ? "application/json" : undefined,
                responseSchema: jsonMode ? schema : undefined,
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

// ... existing functions (generateLeetCodeSolutions, etc.) ...
export const generateLeetCodeSolutions = async (problemName: string, problemDescription: string, preferences: UserPreferences) => {
    const systemInstruction = getLeetCodeSolutionSystemInstruction(preferences.targetLanguage, preferences.spokenLanguage);
    const prompt = `Generate solutions for ${problemName}. Description: ${problemDescription}`;
    const text = await callAI(preferences, systemInstruction, prompt, undefined, true);
    return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
};

export const generateOfficialLeetCodeSolution = async (problemName: string, strategyTitle: string, preferences: UserPreferences, existingCode?: string) => {
    const systemInstruction = getOfficialSolutionPrompt(problemName, strategyTitle, preferences.targetLanguage, preferences.spokenLanguage);
    const prompt = existingCode ? `Analyze this code: ${existingCode}` : "Generate solution";
    const text = await callAI(preferences, systemInstruction, prompt, undefined, true);
    return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
};

// --- NEW: ANALYZE USER STRATEGY ---
export const analyzeUserStrategy = async (
    code: string, 
    problemName: string, 
    existingStrategies: string[], 
    preferences: UserPreferences
) => {
    const lang = preferences.spokenLanguage;
    const targetLang = preferences.targetLanguage;
    
    const systemInstruction = `
    ROLE: Senior Algorithm Judge.
    TASK: Analyze user's submitted code for "${problemName}".
    
    INPUT:
    - User Code: (Code provided by user)
    - Existing Strategies: ${JSON.stringify(existingStrategies)}
    
    GOAL:
    1. Determine if this code represents a NEW approach compared to the Existing Strategies.
       - If it's just a variable rename of an existing one, it is NOT new.
       - If it uses a different algorithm (e.g. Iterative vs Recursive, Map vs Array), it IS new.
    2. If NEW: Generate a full 'SolutionStrategy' object for it.
    3. If DUPLICATE: Return the name of the matching existing strategy.

    OUTPUT JSON:
    {
        "isNew": boolean,
        "match": string | null, // Title of existing strategy if isNew is false
        "strategy": { // Only if isNew is true
            "title": "Short descriptive title (e.g. 'Two Pointers Optimized')",
            "complexity": "Time: O(?) | Space: O(?)",
            "rationale": "Why this works...",
            "derivation": "Step by step logic...",
            "memoryTip": "Mnemonic...",
            "tags": ["Tag1", "Tag2"],
            "keywords": [{ "term": "key", "definition": "def" }]
        }
    }
    `;

    const prompt = `Analyze this ${targetLang} code:\n\`\`\`\n${code}\n\`\`\``;
    const text = await callAI(preferences, systemInstruction, prompt, undefined, true);
    return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
};

export const refineUserSolution = async (userNotes: string, problemTitle: string, preferences: UserPreferences) => { return {} as any; };
export const analyzeImageSolution = async (base64Image: string, problemTitle: string, preferences: UserPreferences) => { return {} as any; };
export const regenerateSolutionStrategy = async (originalStrategy: SolutionStrategy, instruction: string, preferences: UserPreferences) => { return {} as any; };
export const fixMermaidCode = async (brokenCode: string, errorMsg: string, preferences: UserPreferences) => { return ""; };

// ... (Rest of file unchanged) ...
export const regenerateLessonScreen = async (
    currentScreen: any,
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
    const prompt = "Generate the single replacement screen JSON.";
    const text = await callAI(preferences, systemInstruction, prompt, undefined, true); 
    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
    const rawData = JSON.parse(cleanText);
    let rawScreen = rawData;
    if (rawData.screens && Array.isArray(rawData.screens)) {
        rawScreen = rawData.screens[0];
    }
    const fakePlanInput = { title: "Temp", screens: [rawScreen] };
    const cleanPlan = sanitizeLessonPlan(fakePlanInput);
    if (cleanPlan.screens.length === 0) throw new Error("Regeneration resulted in empty screen");
    const newScreen = cleanPlan.screens[0];
    newScreen.id = `regen_${Date.now()}`;
    return newScreen;
};

export const verifyAnswerDispute = async (widget: any, userAnswer: string, context: string, preferences: UserPreferences) => {
    const systemInstruction = getDisputeJudgePrompt(JSON.stringify(widget), userAnswer, context, preferences.spokenLanguage);
    const text = await callAI(preferences, systemInstruction, "Judge the appeal.", undefined, true);
    return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
};

export const generateMistakeRepairPlan = async (mistakeContext: string, problemName: string, preferences: UserPreferences, referenceCode?: string) => {
    const systemInstruction = getMistakeRepairSystemInstruction(preferences.targetLanguage, preferences.spokenLanguage);
    let prompt = `GENERATE MISTAKE REPAIR PLAN.\nFAILED PROBLEM: "${problemName}"\nERROR CONTEXT: "${mistakeContext}"\nExecute the 4-phase repair structure (Diagnosis -> Concept -> Drill -> Mastery).\nGenerate 17 screens.`;
    if (referenceCode) {
        prompt += `\nREFERENCE CODE (STANDARD ANSWER):\n\`\`\`${preferences.targetLanguage}\n${referenceCode}\n\`\`\`\nSTRICT INSTRUCTION: You MUST use the exact variable names, coding style, and structure from the REFERENCE CODE above for all drill exercises. Do not invent new variable names.`;
    }
    try {
        const text = await callAI(preferences, systemInstruction, prompt, lessonPlanSchema, true);
        const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
        const rawPlan = JSON.parse(cleanText);
        const plan = sanitizeLessonPlan(rawPlan);
        plan.title = preferences.spokenLanguage === 'Chinese' ? `专项特训：${problemName} 修复` : `Targeted Repair: ${problemName}`;
        return plan;
    } catch (e: any) {
        console.error("Repair Plan Generation Failed", e);
        throw new AIGenerationError("Failed to generate repair plan.", e.message);
    }
};

export const generateEngineeringLesson = async (pillar: any, topic: any, keywords: any, level: any, preferences: any, extraContext?: any, topicId?: any, stepId?: any) => { return {} as any };
export const generateForgeRoadmap = async (topic: any, config: any, preferences: any) => { return {} as any };
export const generateForgeStage = async (roadmap: any, stageId: any, preferences: any) => { return {} as any };
export const generateCustomTrack = async (title: any, description: any, preferences: any) => { return {} as any };
export const generateTrackSuggestions = async (category: any, existingTitles: any, preferences: any) => { return [] as any };
export const generateEngineeringRoadmap = async (topic: any, pillar: any, keywords: any, preferences: any) => { return [] as any };
