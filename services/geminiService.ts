
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
import { getMistakeRepairSystemInstruction, getDailyWorkoutSystemInstruction } from "./ai/prompts/stages/workout";
import { lessonPlanSchema } from "./ai/schemas";
import { ForgeGenConfig } from "../types/forge";
import { getVariantSystemInstruction } from "./ai/prompts";
import { getSystemArchitectPrompt } from "./ai/prompts/engineering/system_architect";
import { getCSKernelPrompt } from "./ai/prompts/engineering/cs_kernel";
import { getSyntaxRoadmapPrompt } from "./ai/prompts/engineering/syntax_roadmap";
import { getSyntaxTrainerPrompt } from "./ai/prompts/engineering/syntax_trainer";
import { PROBLEM_MAP } from "../constants";

// Re-export existing generators
export { 
    generateLessonPlan, 
    generateLeetCodeContext, 
    validateUserCode, 
    generateAiAssistance,
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
                    // Normalizations
                    if (type === 'mermaidvisual') type = 'mermaid';
                    if (type === 'comparisontable') type = 'comparison-table';
                    if (type === 'fillin') type = 'fill-in';
                    if (type === 'interactivecode') type = 'interactive-code';
                    if (type === 'comparisoncode') type = 'comparison-code';
                    if (type === 'stepslist') type = 'steps-list';
                    if (type === 'visualquiz') type = 'visual-quiz';
                    if (type === 'codewalkthrough') type = 'code-walkthrough';
                    if (type === 'minieditor') type = 'mini-editor';
                    
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
                        stepsList: w.stepsList || w.stepslist,
                        mermaid: w.mermaid,
                        visualQuiz: w.visualQuiz || w.visualquiz,
                        comparisonTable: w.comparisonTable || w.comparisontable,
                        code: w.code,
                        leetcode: w.leetcode,
                        terminal: w.terminal,
                        codeWalkthrough: w.codeWalkthrough || w.codewalkthrough,
                        miniEditor: w.miniEditor || w.minieditor,
                        archCanvas: w.archCanvas || w.archcanvas
                    } as any;
                    return safeWidget;
                }).filter((w): w is Widget => w !== null);
            }
            return safeScreen;
        }).filter(s => s.widgets.length > 0);
    }
    return plan;
};

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
    // SANITIZATION APPLIED HERE
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
        // SANITIZATION APPLIED HERE
        const plan = sanitizeLessonPlan(rawPlan);
        plan.title = preferences.spokenLanguage === 'Chinese' ? `专项特训：${problemName} 修复` : `Targeted Repair: ${problemName}`;
        return plan;
    } catch (e: any) {
        console.error("Repair Plan Generation Failed", e);
        throw new AIGenerationError("Failed to generate repair plan.", e.message);
    }
};

// ... generateDailyWorkoutPlan ...
export const generateDailyWorkoutPlan = async (
    mistakes: MistakeRecord[],
    learnedProblemIds: string[],
    preferences: UserPreferences
): Promise<LessonPlan> => {
    const learnedProblemNames = learnedProblemIds.map(id => PROBLEM_MAP[id]).filter(n => !!n);
    // If no learned problems, default to first problem
    const targetProblems = learnedProblemNames.length === 0 ? ["Two Sum"] : learnedProblemNames;

    const topMistakes = mistakes.slice(0, 5);
    const mistakeContext = topMistakes.map(m => `Problem: ${m.problemName}, Failed Logic: ${m.context}`).join('\n');

    const systemInstruction = getDailyWorkoutSystemInstruction(preferences.targetLanguage, preferences.spokenLanguage);
    const prompt = `
    GENERATE DAILY WORKOUT
    LEARNED PROBLEMS: ${targetProblems.join(', ')}
    RECENT MISTAKES: ${mistakeContext || "None. Focus on general reinforcement."}
    `;

    const text = await callAI(preferences, systemInstruction, prompt, lessonPlanSchema, true);
    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
    
    const rawPlan = JSON.parse(cleanText);
    // SANITIZATION APPLIED HERE
    const plan: LessonPlan = sanitizeLessonPlan(rawPlan);
    
    plan.title = preferences.spokenLanguage === 'Chinese' ? "📅 今日智能特训" : "📅 Daily Smart Workout";
    return plan;
};

// ... generateVariantLesson ...
export const generateVariantLesson = async (mistake: MistakeRecord, preferences: UserPreferences): Promise<LessonPlan> => {
    const systemInstruction = getVariantSystemInstruction(preferences.targetLanguage, preferences.spokenLanguage);
    const prompt = `Create VARIANT of: ${mistake.problemName}. Widget Data: ${JSON.stringify(mistake.widget)}`;
    const text = await callAI(preferences, systemInstruction, prompt, lessonPlanSchema, true);
    const rawPlan = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    // SANITIZATION APPLIED HERE
    return sanitizeLessonPlan(rawPlan);
};

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
        // SANITIZATION APPLIED HERE
        const plan = sanitizeLessonPlan(rawPlan);
        
        plan.context = { type: 'pillar', pillar, topic, phaseIndex: 0, levelId: level, topicId: topicId, stepId: stepId }; 
        return plan;
    } catch (e: any) {
        console.error("Engineering Lesson Generation Failed", e);
        throw new AIGenerationError("Failed to generate engineering lesson.");
    }
};

export const generateReviewLesson = async (mistakes: MistakeRecord[], preferences: UserPreferences) => generateDailyWorkoutPlan(mistakes, ["p_1"], preferences);
export const generateSyntaxClinicPlan = async (preferences: UserPreferences) => {
    // Basic plan
    return {
        title: "Syntax Clinic",
        description: "Focus on syntax errors.",
        screens: [],
        suggestedQuestions: []
    } as LessonPlan;
};

export const generateSyntaxRoadmap = async (profile: any, preferences: UserPreferences) => {
    const prompt = getSyntaxRoadmapPrompt(profile);
    const text = await callAI(preferences, "You are a curriculum designer.", prompt, undefined, false); 
    try {
       const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
       const data = JSON.parse(cleanText);
       return data.units.map((u: any, idx: number) => ({ ...u, status: idx === 0 ? 'active' : 'locked', lessons: u.lessons.map((l: any, lIdx: number) => ({ ...l, status: (idx === 0 && lIdx === 0) ? 'active' : 'locked', currentPhaseIndex: 0 })) }));
    } catch(e) {
        throw new Error("Roadmap Gen Failed");
    }
};

export const generateSyntaxLesson = async (unit: any, lesson: any, stageId: string, profile: any, preferences: UserPreferences) => {
    const systemInstruction = getSyntaxTrainerPrompt(profile, unit, lesson, stageId, preferences.spokenLanguage);
    const prompt = `Generate lesson for ${lesson.title.en}. Stage: ${stageId}.`;
    const text = await callAI(preferences, systemInstruction, prompt, lessonPlanSchema, true);
    const rawPlan = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    // SANITIZATION APPLIED HERE
    const plan = sanitizeLessonPlan(rawPlan);
    
    plan.context = { type: 'syntax', language: profile.language, unitId: unit.id, lessonId: lesson.id, phaseIndex: stageId === 'sandbox' ? 6 : parseInt(stageId) };
    return plan;
}

export const generateForgeRoadmap = async (topic: string, config: ForgeGenConfig, preferences: UserPreferences): Promise<ForgeRoadmap> => {
    const prompt = getForgeRoadmapPrompt(topic, preferences.spokenLanguage, config);
    // Use Pro model for deep planning
    const text = await callAI(preferences, "You are a curriculum architect.", prompt, undefined, true, undefined, 'gemini-3-pro-preview');
    const data = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    
    return {
        id: `forge_${Date.now()}`,
        topic,
        title: data.title,
        description: data.description,
        stages: data.stages.map((s: any) => ({ ...s, status: s.id === 1 ? 'unlocked' : 'locked' })),
        config,
        createdAt: Date.now()
    };
};

export const generateForgeStage = async (roadmap: ForgeRoadmap, stageId: number, preferences: UserPreferences) => {
    const stage = roadmap.stages.find(s => s.id === stageId);
    if (!stage) throw new Error("Stage not found");
    
    const systemInstruction = getForgeStagePrompt(
        roadmap.topic, 
        stage.title, 
        stage.description, 
        stage.focus, 
        preferences.spokenLanguage,
        roadmap.config,
        stageId - 1
    );
    
    const text = await callAI(preferences, systemInstruction, "Generate stage content.", lessonPlanSchema, true);
    const rawPlan = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    // SANITIZATION APPLIED HERE
    const plan = sanitizeLessonPlan(rawPlan);
    
    plan.context = { 
        type: 'forge', 
        roadmapId: roadmap.id,
        stageId: stageId,
        stageTitle: stage.title 
    };
    return plan;
};

export const generateCustomTrack = async (title: any, description: any, preferences: any) => { return {} as any };
export const generateTrackSuggestions = async (category: any, existingTitles: any, preferences: any) => { return [] as any };
export const generateEngineeringRoadmap = async (topic: any, pillar: any, keywords: any, preferences: any) => { return [] as any };
