
// ... existing imports ...
import { getClient } from "./client";
import { getLessonPlanSystemInstruction, getVariantSystemInstruction } from "./prompts/algo";
import { getLeetCodeContextSystemInstruction, getDailyWorkoutSystemInstruction } from "./prompts/stages";
import { getJudgeSystemInstruction } from "./prompts/judge"; 
import { getSystemArchitectPrompt } from "./prompts/engineering/system_architect";
import { getCSKernelPrompt } from "./prompts/engineering/cs_kernel";
import { getSyntaxRoadmapPrompt } from "./prompts/engineering/syntax_roadmap";
import { getSyntaxTrainerPrompt } from "./prompts/engineering/syntax_trainer";
import { lessonPlanSchema, leetCodeContextSchema, judgeResultSchema } from "./schemas";
import { UserPreferences, MistakeRecord, LessonPlan, Widget, LeetCodeContext, SavedLesson, SolutionStrategy } from "../../types";
import { PROBLEM_MAP } from "../../constants";
import { SyntaxProfile, SyntaxUnit, SyntaxLesson } from "../../types/engineering";

export class AIGenerationError extends Error {
    rawOutput?: string;
    constructor(message: string, rawOutput?: string) {
        super(message);
        this.name = "AIGenerationError";
        this.rawOutput = rawOutput;
    }
}

const isValidWidget = (w: Widget): boolean => {
    if (!w || !w.type) {
        return false;
    }
    const type = w.type.toLowerCase().replace('fillin', 'fill-in').replace('interactivecode', 'interactive-code');
    
    switch (type) {
        case 'dialogue': 
            return !!w.dialogue && typeof w.dialogue.text === 'string';
        case 'flipcard': 
            return !!w.flipcard && (!!w.flipcard.front || !!w.flipcard.back); 
        case 'quiz': 
            return !!w.quiz && !!w.quiz.question && Array.isArray(w.quiz.options);
        case 'code': 
            return !!w.code && !!w.code.content;
        case 'interactive-code': 
            return !!w.interactiveCode || !!(w as any).code; 
        case 'parsons': 
            return !!w.parsons && Array.isArray(w.parsons.lines);
        case 'fill-in': 
            return !!w.fillIn && !!w.fillIn.code;
        case 'leetcode': 
            return !!w.leetcode && !!w.leetcode.problemSlug;
        case 'steps-list': 
            return !!w.stepsList && Array.isArray(w.stepsList.items);
        case 'callout': 
            return !!w.callout && !!w.callout.title;
        case 'terminal':
            return !!w.terminal && !!w.terminal.command;
        case 'code-walkthrough':
            return !!w.codeWalkthrough && !!w.codeWalkthrough.code;
        case 'mini-editor':
            return !!w.miniEditor && !!w.miniEditor.startingCode;
        case 'arch-canvas':
            return !!w.archCanvas && !!w.archCanvas.goal;
        case 'mermaid':
            return !!w.mermaid && !!w.mermaid.chart;
        default: 
            return false;
    }
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
          const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
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
    const learnedProblemNames = learnedProblemIds.map(id => PROBLEM_MAP[id]).filter(n => !!n);
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
    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
    
    const plan: LessonPlan = JSON.parse(cleanText);
    plan.title = preferences.spokenLanguage === 'Chinese' ? "📅 今日智能特训" : "📅 Daily Smart Workout";
    return plan;
};

export const generateVariantLesson = async (mistake: MistakeRecord, preferences: UserPreferences): Promise<LessonPlan> => {
    const systemInstruction = getVariantSystemInstruction(preferences.targetLanguage, preferences.spokenLanguage);
    const prompt = `Create VARIANT of: ${mistake.problemName}. Widget Data: ${JSON.stringify(mistake.widget)}`;
    const text = await callAI(preferences, systemInstruction, prompt, lessonPlanSchema, true);
    return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
};

export const generateLeetCodeContext = async (problemName: string, preferences: UserPreferences): Promise<LeetCodeContext> => {
    const systemInstruction = getLeetCodeContextSystemInstruction(problemName, preferences.spokenLanguage, preferences.targetLanguage);
    try {
        const text = await callAI(preferences, systemInstruction, `Generate full LeetCode simulation data for ${problemName}`, leetCodeContextSchema, true);
        return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    } catch (error: any) {
        throw error;
    }
};

export const validateUserCode = async (code: string, problemDesc: string, preferences: UserPreferences, languageOverride?: string) => {
    const targetLang = languageOverride || preferences.targetLanguage;
    const systemInstruction = getJudgeSystemInstruction(targetLang, preferences.spokenLanguage);
    const prompt = `Problem: ${problemDesc}\nUser Code:\n\`\`\`${targetLang}\n${code}\n\`\`\``;
    try {
        const modelId = 'gemini-3-pro-preview'; 
        const text = await callAI(preferences, systemInstruction, prompt, judgeResultSchema, true, modelId);
        return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    } catch (e) {
        console.error("Validation failed", e);
        return { status: "Runtime Error", error_message: "Judge Connection Failed.", test_cases: [] };
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
        const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
        const plan = JSON.parse(cleanText);
        plan.context = { type: 'pillar', pillar, topic, phaseIndex: 0, levelId: level, topicId: topicId, stepId: stepId }; 
        return plan;
    } catch (e: any) {
        console.error("Engineering Lesson Generation Failed", e);
        throw new AIGenerationError("Failed to generate engineering lesson.");
    }
};

export const generateReviewLesson = async (mistakes: MistakeRecord[], preferences: UserPreferences) => generateDailyWorkoutPlan(mistakes, ["p_1"], preferences);
export const generateSyntaxClinicPlan = async (preferences: UserPreferences) => generateLessonPlan("Syntax Clinic", 1, preferences); 
export const generateSyntaxRoadmap = async (profile: any, preferences: UserPreferences) => {
    const prompt = getSyntaxRoadmapPrompt(profile);
    const text = await callAI(preferences, "You are a curriculum designer.", prompt, undefined, false, 'gemini-3-flash-preview'); 
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
    const plan = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    plan.context = { type: 'syntax', language: profile.language, unitId: unit.id, lessonId: lesson.id, phaseIndex: stageId === 'sandbox' ? 6 : parseInt(stageId) };
    return plan;
}

export const generateAiAssistance = async (context: string, userQuery: string, preferences: UserPreferences, model: string) => {
    try {
        // Force fast flash for assistant
        return await callAI(preferences, "You are a helpful coding assistant. Be brief.", `Context:\n${context}\n\nUser Question: ${userQuery}\n\nAnswer briefly.`, undefined, false, 'gemini-3-flash-preview');
    } catch (e) {
        return "AI is offline.";
    }
};
