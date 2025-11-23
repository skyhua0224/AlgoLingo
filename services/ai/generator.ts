
import { getClient } from "./client";
import { getLessonPlanSystemInstruction, getLeetCodeContextSystemInstruction, getJudgeSystemInstruction, getVariantSystemInstruction, getDailyWorkoutSystemInstruction } from "./prompts";
import { lessonPlanSchema, leetCodeContextSchema, judgeResultSchema } from "./schemas";
import { UserPreferences, MistakeRecord, LessonPlan, Widget, LeetCodeContext, SavedLesson } from "../../types";
import { PROBLEM_MAP } from "../../constants";

// --- CUSTOM ERROR CLASS ---
export class AIGenerationError extends Error {
    rawOutput?: string;
    constructor(message: string, rawOutput?: string) {
        super(message);
        this.name = "AIGenerationError";
        this.rawOutput = rawOutput;
    }
}

// --- VALIDATION HELPER ---
const isValidWidget = (w: Widget): boolean => {
    if (!w || !w.type) {
        return false;
    }
    
    // Normalize type to lowercase for validation
    const type = w.type.toLowerCase();
    
    // Basic integrity check based on type
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
            return !!w.interactiveCode && Array.isArray(w.interactiveCode.lines);
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
        default: 
            return false;
    }
};

// --- GENERIC API CALL WRAPPER ---
const callAI = async (
    preferences: UserPreferences,
    systemInstruction: string,
    prompt: string,
    schema?: any,
    jsonMode: boolean = false
): Promise<string> => {
    const provider = preferences.apiConfig.provider;

    // 1. OpenAI Compatible
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

    // 2. Google Gemini
    const client = getClient(preferences);
    const modelId = preferences.apiConfig.gemini.model || 'gemini-2.5-flash';
    
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


// --- LESSON PLAN GENERATOR ---
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

  let text = "";

  try {
      console.log(`[AI] Generating Plan for ${problemName} using ${preferences.apiConfig.provider}...`);
      
      text = await callAI(
          preferences, 
          systemInstruction, 
          userPrompt, 
          lessonPlanSchema, 
          true // JSON Mode
      );
      
      if (!text) throw new Error("Empty response from AI");
      
      console.log("[AI] Raw Response received. Parsing...");
      let plan: LessonPlan;
      try {
          const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
          plan = JSON.parse(cleanText);
      } catch (e) {
          console.error("[AI] JSON Parse Error:", e);
          // Throw special error with raw text attached
          throw new AIGenerationError("JSON Parse Error: The AI response was not valid JSON.", text);
      }

      // --- CLIENT SIDE SANITIZATION ---
      if (!plan.screens) plan.screens = [];
      
      plan.screens = plan.screens.map(screen => {
          if (!screen.widgets) screen.widgets = [];
          
          const validWidgets = screen.widgets.filter(w => {
              if (w.type && w.type !== w.type.toLowerCase()) {
                  w.type = w.type.toLowerCase() as any;
              }
              return isValidWidget(w);
          });

          // Enforce single interactive widget policy
          const interactiveTypes = ['quiz', 'parsons', 'fill-in', 'leetcode', 'steps-list'];
          let interactiveCount = 0;
          
          const finalWidgets = validWidgets.filter(w => {
              const isInteractive = interactiveTypes.includes(w.type) || 
                                   (w.type === 'flipcard' && w.flipcard?.mode === 'assessment');
              
              if (isInteractive) {
                  if (interactiveCount > 0) return false; 
                  interactiveCount++;
                  return true;
              }
              return true; 
          });
          
          return { ...screen, widgets: finalWidgets };
      });

      // Remove empty screens
      const originalScreenCount = plan.screens.length;
      plan.screens = plan.screens.filter(s => s.widgets.length > 0);
      
      if (plan.screens.length === 0) {
          throw new AIGenerationError("Validation Error: AI generated 0 valid screens.", text);
      }

      return plan;

  } catch (error: any) {
      // Ensure we re-throw our custom error or wrap a generic one
      if (error instanceof AIGenerationError) {
          throw error;
      }
      throw new AIGenerationError(error.message || "Unknown Generation Error", text);
  }
};

export const generateDailyWorkoutPlan = async (
    mistakes: MistakeRecord[],
    learnedProblemIds: string[],
    preferences: UserPreferences
): Promise<LessonPlan> => {
    // Resolve IDs to Names
    const learnedProblemNames = learnedProblemIds.map(id => PROBLEM_MAP[id]).filter(n => !!n);
    
    // If no learned problems, fallback to a basic intro
    if (learnedProblemNames.length === 0) {
        return generateLessonPlan("Two Sum", 0, preferences);
    }

    const topMistakes = mistakes.slice(0, 5);
    const mistakeContext = topMistakes.map(m => `Problem: ${m.problemName}, Failed Logic: ${m.context}`).join('\n');

    const systemInstruction = getDailyWorkoutSystemInstruction(preferences.targetLanguage, preferences.spokenLanguage);
    const prompt = `
    GENERATE DAILY WORKOUT
    
    LEARNED PROBLEMS (ALLOWED CONTENT):
    ${learnedProblemNames.join(', ')}

    RECENT MISTAKES (PRIORITIZE FIXING THESE):
    ${mistakeContext || "None. Focus on general reinforcement of learned topics."}
    `;

    const text = await callAI(preferences, systemInstruction, prompt, lessonPlanSchema, true);
    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
    
    const plan: LessonPlan = JSON.parse(cleanText);
    plan.title = preferences.spokenLanguage === 'Chinese' ? "📅 今日智能特训" : "📅 Daily Smart Workout";
    return plan;
};

export const generateVariantLesson = async (
    mistake: MistakeRecord,
    preferences: UserPreferences
): Promise<LessonPlan> => {
    const systemInstruction = getVariantSystemInstruction(preferences.targetLanguage, preferences.spokenLanguage);
    const prompt = `
    ORIGINAL MISTAKE CONTEXT:
    Problem: ${mistake.problemName}
    Widget Data: ${JSON.stringify(mistake.widget)}
    
    INSTRUCTION:
    Create a VARIANT of this specific widget. Keep the difficulty similar but change the scenario.
    `;

    const text = await callAI(preferences, systemInstruction, prompt, lessonPlanSchema, true);
    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleanText);
};

// --- OTHER GENERATORS ---

export const generateLeetCodeContext = async (
    problemName: string,
    preferences: UserPreferences
): Promise<LeetCodeContext> => {
    const systemInstruction = getLeetCodeContextSystemInstruction(
        problemName, 
        preferences.spokenLanguage, 
        preferences.targetLanguage
    );
    try {
        const text = await callAI(preferences, systemInstruction, `Generate full LeetCode simulation data for ${problemName}`, leetCodeContextSchema, true);
        const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
        return JSON.parse(cleanText || '{}');
    } catch (error: any) {
        console.error("Simulator Generation Error:", error);
        throw error;
    }
};

export const validateUserCode = async (code: string, problemDesc: string, preferences: UserPreferences, languageOverride?: string) => {
    const targetLang = languageOverride || preferences.targetLanguage;
    const systemInstruction = getJudgeSystemInstruction(targetLang, preferences.spokenLanguage);
    const prompt = `Problem: ${problemDesc}\nUser Code:\n\`\`\`${targetLang}\n${code}\n\`\`\``;

    try {
        const text = await callAI(preferences, systemInstruction, prompt, judgeResultSchema, true);
        const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
        return JSON.parse(cleanText || '{}');
    } catch (e) {
        return { 
            status: "Runtime Error", 
            error_message: "Judge Connection Failed.", 
            test_cases: [], 
            analysis: { pros: [], cons: [], timeComplexity: "?", spaceComplexity: "?" } 
        };
    }
};

export const generateReviewLesson = async (mistakes: MistakeRecord[], preferences: UserPreferences): Promise<LessonPlan> => {
    // Legacy fallback wrapper, should be replaced by DailyWorkout mostly
    return generateDailyWorkoutPlan(mistakes, ["p_1"], preferences);
};

export const generateSyntaxClinicPlan = async (preferences: UserPreferences): Promise<LessonPlan> => {
    // Hardcoded simple clinic for now, could be AI powered later
    return generateLessonPlan("Syntax Clinic", 1, preferences); 
}

export const generateAiAssistance = async (context: string, userQuery: string, preferences: UserPreferences, model: string) => {
    try {
        return await callAI(preferences, "You are a helpful coding assistant. Be brief.", `Context:\n${context}\n\nUser Question: ${userQuery}\n\nAnswer briefly.`, undefined, false);
    } catch (e) {
        return "AI is offline.";
    }
};
