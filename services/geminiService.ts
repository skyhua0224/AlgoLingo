
import { GoogleGenAI } from "@google/genai";
import { UserPreferences, LessonPlan, LeetCodeContext, MistakeRecord, SavedLesson, SolutionStrategy, Widget } from "../types";
import { ForgeGenConfig, ForgeRoadmap, ForgeStage } from "../types/forge";
import { EngineeringTopic, SkillTrack, SyntaxProfile, SyntaxUnit, SyntaxLesson } from "../types/engineering";
import { getClient } from "./ai/client";

// Import Prompts
import { getLessonPlanSystemInstruction, getVariantSystemInstruction, getLeetCodeContextSystemInstruction, getDailyWorkoutSystemInstruction } from "./ai/prompts/algo";
import { getJudgeSystemInstruction } from "./ai/prompts/judge";
import { getProblemStrategiesPrompt } from "./ai/prompts/algo/strategies";
import { getSolutionDeepDivePrompt } from "./ai/prompts/algo/deep_dive";
import { getDisputeJudgePrompt } from "./ai/prompts/dispute";
import { getForgeRoadmapPrompt, getForgeStagePrompt } from "./ai/prompts/forge";
import { getRegenerateScreenPrompt } from "./ai/prompts/regenerate";
import { getTopicRoadmapPrompt } from "./ai/prompts/engineering/topic_roadmap";
import { getSystemArchitectPrompt } from "./ai/prompts/engineering/system_architect";
import { getCSKernelPrompt } from "./ai/prompts/engineering/cs_kernel";
import { getTrackSyllabusPrompt } from "./ai/prompts/engineering/track_generator";
import { getTrackSuggestionPrompt } from "./ai/prompts/engineering/track_suggestions";
import { getSyntaxRoadmapPrompt } from "./ai/prompts/engineering/syntax_roadmap";
import { getSyntaxTrainerPrompt } from "./ai/prompts/engineering/syntax_trainer";
import { getMistakeRepairSystemInstruction } from "./ai/prompts/stages/workout";
import { getEvaluationPrompt } from "./ai/prompts/evaluate"; 

// Import Schemas
import { lessonPlanSchema, leetCodeContextSchema, judgeResultSchema, disputeSchema } from "./ai/schemas";
import { PROBLEM_MAP } from "../constants";

export class AIGenerationError extends Error {
    rawOutput?: string;
    constructor(message: string, rawOutput?: string) {
        super(message);
        this.name = "AIGenerationError";
        this.rawOutput = rawOutput;
    }
}

// Helper to clean JSON string from markdown code blocks
const cleanJsonOutput = (text: string): string => {
    return text.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
};

const callAI = async (
    preferences: UserPreferences,
    systemInstruction: string,
    prompt: string,
    schema?: any,
    jsonMode: boolean = false,
    modelOverride?: string
): Promise<string> => {
    const provider = preferences.apiConfig.provider;

    if (provider === 'openai') {
        const { apiKey, baseUrl, model } = preferences.apiConfig.openai;
        const url = `${baseUrl || 'https://api.openai.com/v1'}/chat/completions`;
        
        try {
            const body: any = {
                model: model || 'gpt-4o',
                messages: [
                    { role: 'system', content: systemInstruction },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.4,
                frequency_penalty: 0.5,
            };

            if (jsonMode) {
                body.response_format = { type: "json_object" };
                body.messages[0].content += "\n\nIMPORTANT: OUTPUT MUST BE VALID JSON MATCHING THE REQUESTED SCHEMA.";
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`OpenAI API Error ${response.status}: ${err}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || "";
        } catch (e: any) {
            console.error("OpenAI Call Failed", e);
            throw e;
        }
    }

    const client = getClient(preferences);
    // Use override, then user pref, then default
    const modelId = modelOverride || preferences.apiConfig.gemini.model || 'gemini-2.5-flash';
    
    const safeSystemInstruction = systemInstruction + `
    
    CRITICAL SAFETY:
    - DO NOT generate infinite loops of emojis.
    - DO NOT repeat the same phrase more than once.
    - If you are stuck, stop generating.
    `;

    try {
        const response = await client.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                systemInstruction: safeSystemInstruction,
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
  savedLessons: SavedLesson[] = [],
  targetSolution?: SolutionStrategy 
): Promise<LessonPlan> => {
  const targetLang = preferences.targetLanguage;
  const speakLang = preferences.spokenLanguage;
  const systemInstruction = getLessonPlanSystemInstruction(problemName, targetLang, speakLang, phaseIndex, targetSolution);
  
  let userPrompt = `Generate the lesson plan for Phase ${phaseIndex + 1} of ${problemName}.`;
  
  if (targetSolution) {
      userPrompt += `\n\n**MANDATORY STRATEGY**: You MUST teach the '${targetSolution.title}' approach.
      Reference Code Logic: 
      ${targetSolution.code.substring(0, 500)}...
      Derivation: ${targetSolution.derivation.substring(0, 300)}...
      
      Do NOT generate content for any other algorithm.`;
  }

  if (mistakes.length > 0) {
      userPrompt += `\nContext: The user previously struggled with: ${mistakes.map(m => m.context).join(', ')}. Please reinforce these concepts.`;
  }

  let text = "";

  try {
      console.log(`[AI] Generating Plan for ${problemName}...`);
      text = await callAI(preferences, systemInstruction, userPrompt, lessonPlanSchema, true);
      
      if (!text) throw new Error("Empty response from AI");
      
      let plan: LessonPlan;
      try {
          const cleanText = cleanJsonOutput(text);
          plan = JSON.parse(cleanText);
      } catch (e) {
          throw new AIGenerationError("JSON Parse Error", text);
      }

      if (!plan.screens) plan.screens = [];
      
      // Inject solution context
      plan.context = {
          ...plan.context,
          type: 'algo',
          targetSolution
      };

      return plan;

  } catch (error: any) {
      if (error instanceof AIGenerationError) throw error;
      throw new AIGenerationError(error.message || "Unknown Generation Error", text);
  }
};

export const generateDailyWorkoutPlan = async (
    mistakes: MistakeRecord[],
    learnedProblemIds: string[],
    preferences: UserPreferences
): Promise<LessonPlan> => {
    const learnedProblemNames = learnedProblemIds.map(id => PROBLEM_MAP[id]).filter(id => !!id);
    if (learnedProblemNames.length === 0) {
        return generateLessonPlan("Two Sum", 0, preferences);
    }

    const topMistakes = mistakes.slice(0, 5);
    const mistakeContext = topMistakes.map(m => `Problem: ${m.problemName}, Failed Logic: ${m.context}`).join('\n');

    const systemInstruction = getDailyWorkoutSystemInstruction(preferences.targetLanguage, preferences.spokenLanguage);
    const prompt = `
    GENERATE DAILY WORKOUT
    LEARNED PROBLEMS: ${learnedProblemNames.join(', ')}
    RECENT MISTAKES: ${mistakeContext || "None. Focus on general reinforcement."}
    `;

    const text = await callAI(preferences, systemInstruction, prompt, lessonPlanSchema, true);
    const cleanText = cleanJsonOutput(text);
    
    const plan: LessonPlan = JSON.parse(cleanText);
    plan.title = preferences.spokenLanguage === 'Chinese' ? "📅 今日智能特训" : "📅 Daily Smart Workout";
    
    return plan;
};

export const generateVariantLesson = async (mistake: MistakeRecord, preferences: UserPreferences): Promise<LessonPlan> => {
    const systemInstruction = getVariantSystemInstruction(preferences.targetLanguage, preferences.spokenLanguage);
    const prompt = `Create VARIANT of: ${mistake.problemName}. Widget Data: ${JSON.stringify(mistake.widget)}`;
    const text = await callAI(preferences, systemInstruction, prompt, lessonPlanSchema, true);
    const plan = JSON.parse(cleanJsonOutput(text));
    return plan;
};

export const generateLeetCodeContext = async (problemName: string, preferences: UserPreferences): Promise<LeetCodeContext> => {
    const systemInstruction = getLeetCodeContextSystemInstruction(problemName, preferences.spokenLanguage, preferences.targetLanguage);
    try {
        const text = await callAI(preferences, systemInstruction, `Generate full LeetCode simulation data for ${problemName}`, leetCodeContextSchema, true);
        return JSON.parse(cleanJsonOutput(text));
    } catch (error: any) {
        throw error;
    }
};

export const validateUserCode = async (code: string, problemDesc: string, preferences: UserPreferences, languageOverride?: string) => {
    const targetLang = languageOverride || preferences.targetLanguage;
    const systemInstruction = getJudgeSystemInstruction(targetLang, preferences.spokenLanguage);
    const prompt = `Problem: ${problemDesc}\nUser Code:\n\`\`\`${targetLang}\n${code}\n\`\`\``;
    try {
        const modelId = 'gemini-2.5-flash'; 
        const text = await callAI(preferences, systemInstruction, prompt, undefined, true, modelId);
        return JSON.parse(cleanJsonOutput(text));
    } catch (e) {
        console.error("Validation failed", e);
        return { status: "Runtime Error", error_message: "Judge Connection Failed or Timeout. Please try again.", test_cases: [] };
    }
};

// NEW: Meta-Evaluator
export const evaluateSubmissionQuality = async (
    code: string,
    timeSeconds: number,
    failCount: number,
    problemDesc: string,
    preferences: UserPreferences
) => {
    const prompt = getEvaluationPrompt(code, timeSeconds, failCount, problemDesc, preferences.spokenLanguage);
    try {
        // Use 2.5 Flash for maximum speed
        const text = await callAI(preferences, "You are a senior code reviewer.", prompt, undefined, true, 'gemini-2.5-flash');
        return JSON.parse(cleanJsonOutput(text));
    } catch (e) {
        console.error("Evaluation failed", e);
        return { score: 2, reason: "Analysis unavailable.", nextIntervalRecommendation: "3 days" };
    }
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
        const cleanText = cleanJsonOutput(text);
        const plan = JSON.parse(cleanText);
        plan.context = { type: 'pillar', pillar, topic, phaseIndex: 0, levelId: level, topicId: topicId, stepId: stepId }; 
        return plan;
    } catch (e: any) {
        console.error("Engineering Lesson Generation Failed", e);
        throw new AIGenerationError("Failed to generate engineering lesson.");
    }
};

export const generateEngineeringRoadmap = async (topic: string, pillar: string, keywords: string[], preferences: UserPreferences) => {
    const prompt = getTopicRoadmapPrompt(topic, pillar, keywords, preferences.spokenLanguage);
    // Use 3 Flash for fast roadmap planning
    const text = await callAI(preferences, "You are a curriculum designer.", prompt, undefined, true, 'gemini-3-flash-preview');
    return JSON.parse(cleanJsonOutput(text)).roadmap;
};

export const generateCustomTrack = async (title: string, description: string, preferences: UserPreferences): Promise<SkillTrack> => {
    const prompt = getTrackSyllabusPrompt(title, description, preferences.spokenLanguage);
    const text = await callAI(preferences, "You are a curriculum designer.", prompt, undefined, true, 'gemini-3-flash-preview');
    const data = JSON.parse(cleanJsonOutput(text));
    return {
        id: `custom_${Date.now()}`,
        title: title,
        icon: "Sparkles",
        category: "other",
        description: description,
        progress: 0,
        isOfficial: false,
        createdAt: Date.now(),
        modules: data.modules
    };
};

export const generateTrackSuggestions = async (category: string, existingTitles: string[], preferences: UserPreferences) => {
    const prompt = getTrackSuggestionPrompt(category, existingTitles);
    const text = await callAI(preferences, "You are a career coach.", prompt, undefined, true, 'gemini-3-flash-preview');
    const data = JSON.parse(cleanJsonOutput(text));
    return data.tracks.map((t: any) => ({
        ...t,
        id: `suggested_${Date.now()}_${Math.random()}`,
        category,
        progress: 0,
        isOfficial: false,
        createdAt: Date.now()
    }));
};

export const generateSyntaxClinicPlan = async (preferences: UserPreferences) => generateLessonPlan("Syntax Clinic", 1, preferences); 

export const generateSyntaxRoadmap = async (profile: any, preferences: UserPreferences) => {
    const prompt = getSyntaxRoadmapPrompt(profile);
    const text = await callAI(preferences, "You are a curriculum designer.", prompt, undefined, false, 'gemini-3-flash-preview'); 
    try {
       const cleanText = cleanJsonOutput(text);
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
    const plan = JSON.parse(cleanJsonOutput(text));
    plan.context = { type: 'syntax', language: profile.language, unitId: unit.id, lessonId: lesson.id, phaseIndex: stageId === 'sandbox' ? 6 : parseInt(stageId) };
    return plan;
}

export const generateAiAssistance = async (context: string, userQuery: string, preferences: UserPreferences, model: string) => {
    try {
        // ALWAYS use 3 Flash for quick chat
        return await callAI(preferences, "You are a helpful coding assistant. Be brief.", `Context:\n${context}\n\nUser Question: ${userQuery}\n\nAnswer briefly.`, undefined, false, 'gemini-3-flash-preview');
    } catch (e) {
        return "AI is offline.";
    }
};

export const generateProblemStrategies = async (problemName: string, description: string, preferences: UserPreferences) => {
    const prompt = getProblemStrategiesPrompt(problemName, description, preferences.spokenLanguage);
    const text = await callAI(preferences, "You are an algorithm expert.", prompt, undefined, true);
    return JSON.parse(cleanJsonOutput(text));
};

export const generateSolutionDeepDive = async (problemName: string, strategyTitle: string, preferences: UserPreferences, existingCode?: string) => {
    const prompt = getSolutionDeepDivePrompt(problemName, strategyTitle, preferences.targetLanguage, preferences.spokenLanguage, existingCode);
    const text = await callAI(preferences, "You are an official solution writer.", prompt, undefined, true, 'gemini-3-pro-preview');
    return JSON.parse(cleanJsonOutput(text));
};

export const generateMistakeRepairPlan = async (drillContext: string, problemTitle: string, preferences: UserPreferences, referenceCode?: string) => {
    const prompt = `FAILED LOGIC: ${drillContext}\nPROBLEM: ${problemTitle}\nREFERENCE CODE: ${referenceCode || 'N/A'}`;
    const system = getMistakeRepairSystemInstruction(preferences.targetLanguage, preferences.spokenLanguage);
    const text = await callAI(preferences, system, prompt, lessonPlanSchema, true);
    const plan = JSON.parse(cleanJsonOutput(text));
    return plan;
};

export const verifyAnswerDispute = async (widget: Widget, userAnswer: string, context: string, preferences: UserPreferences) => {
    const prompt = getDisputeJudgePrompt(JSON.stringify(widget), userAnswer, context, preferences.spokenLanguage);
    const text = await callAI(preferences, "You are an impartial judge. Evaluate the appeal.", prompt, disputeSchema, true, 'gemini-3-flash-preview');
    return JSON.parse(cleanJsonOutput(text));
};

export const generateForgeRoadmap = async (topic: string, config: ForgeGenConfig, preferences: UserPreferences): Promise<ForgeRoadmap> => {
    const prompt = getForgeRoadmapPrompt(topic, preferences.spokenLanguage, config);
    const text = await callAI(preferences, "Curriculum Architect", prompt, undefined, true, 'gemini-3-pro-preview');
    const data = JSON.parse(cleanJsonOutput(text));
    
    return {
        id: `forge_${Date.now()}`,
        topic: topic,
        title: data.title,
        description: data.description,
        stages: data.stages.map((s: any) => ({ ...s, status: s.id === 1 ? 'unlocked' : 'locked' })),
        config: config,
        createdAt: Date.now()
    };
};

export const generateForgeStage = async (roadmap: ForgeRoadmap, stageId: number, preferences: UserPreferences) => {
    const stage = roadmap.stages.find(s => s.id === stageId);
    if (!stage) throw new Error("Stage not found");
    
    const prompt = getForgeStagePrompt(
        roadmap.topic, 
        stage.title, 
        stage.description, 
        stage.focus, 
        preferences.spokenLanguage, 
        roadmap.config,
        stageId - 1 // 0-based index
    );
    
    const text = await callAI(preferences, prompt, "Generate Micro-Lesson", lessonPlanSchema, true);
    const plan = JSON.parse(cleanJsonOutput(text));
    plan.context = { type: 'forge', roadmapId: roadmap.id, stageId: stageId, stageTitle: stage.title };
    return plan;
};

export const fixMermaidCode = async (instruction: string, preferences: UserPreferences) => {
    const system = "You are a Mermaid.js Syntax Expert. Fix the diagram code provided by the user. Return ONLY the raw Mermaid code string. Do NOT use markdown blocks. Do NOT include explanations. Ensure labels are double-quoted. Avoid nested brackets.";
    return await callAI(preferences, system, instruction, undefined, false, 'gemini-3-flash-preview');
};

export const regenerateLessonScreen = async (originalScreen: any, context: any, instruction: string, preferences: UserPreferences) => {
    const prompt = getRegenerateScreenPrompt(originalScreen, context, instruction, preferences.spokenLanguage, preferences.targetLanguage);
    const text = await callAI(preferences, prompt, "Regenerate Screen", undefined, true, 'gemini-3-flash-preview');
    const screen = JSON.parse(cleanJsonOutput(text));
    return screen;
};

export const analyzeUserStrategy = async (code: string, problemTitle: string, existingStrategies: string[], preferences: UserPreferences) => {
    const prompt = `
    Analyze this user code for "${problemTitle}".
    Existing Strategies: ${existingStrategies.join(', ')}.
    
    Code:
    \`\`\`${preferences.targetLanguage}
    ${code}
    \`\`\`
    
    Task: Determine if this code represents a NEW strategy not in the list, or matches an existing one.
    
    Output JSON:
    {
        "isNew": boolean,
        "match": string | null, // If matches existing, which one?
        "strategy": { // If new, provide details
            "title": "Strategy Name",
            "complexity": "Time/Space",
            "tags": ["Tag1"],
            "derivation": "Explanation",
            "rationale": "Why this works",
            "analogy": "Analogy",
            "memoryTip": "Tip",
            "keywords": []
        }
    }
    `;
    const text = await callAI(preferences, "You are an Algorithm Analyst.", prompt, undefined, true, 'gemini-3-flash-preview');
    return JSON.parse(cleanJsonOutput(text));
};
