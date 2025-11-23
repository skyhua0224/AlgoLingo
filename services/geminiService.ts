import { GoogleGenAI } from "@google/genai";
import { LessonPlan, MistakeRecord, UserPreferences, Widget, SavedLesson, LeetCodeContext } from "../types";
import { 
    lessonPlanSchema, 
    leetCodeContextSchema, 
    judgeResultSchema 
} from "./schemas";
import { 
    getLessonPlanSystemInstruction, 
    getLeetCodeContextSystemInstruction, 
    getJudgeSystemInstruction 
} from "./prompts";

// --- VALIDATION HELPER (Legacy Robust Version) ---
const isValidWidget = (w: Widget): boolean => {
    if (!w || !w.type) return false;
    switch (w.type) {
        case 'dialogue': return !!w.dialogue && typeof w.dialogue.text === 'string';
        case 'flipcard': return !!w.flipcard && !!w.flipcard.front && !!w.flipcard.back;
        case 'quiz': return !!w.quiz && !!w.quiz.question && Array.isArray(w.quiz.options);
        case 'code': return !!w.code && !!w.code.content;
        case 'interactive-code': return !!w.interactiveCode && Array.isArray(w.interactiveCode.lines);
        case 'parsons': return !!w.parsons && Array.isArray(w.parsons.lines);
        case 'fill-in': return !!w.fillIn && !!w.fillIn.code;
        case 'leetcode': return !!w.leetcode && !!w.leetcode.problemSlug;
        case 'steps-list': return !!w.stepsList && Array.isArray(w.stepsList.items);
        case 'callout': return !!w.callout && !!w.callout.title;
        default: return false;
    }
};

// --- CLIENT HELPER ---
const getClient = (preferences: UserPreferences) => {
    if (preferences.apiConfig.provider === 'gemini-custom') {
        return new GoogleGenAI({ apiKey: preferences.apiConfig.gemini.apiKey || '' });
    } else {
        return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    }
}

// --- CORE GENERATION LOGIC ---

export const generateLessonPlan = async (
  problemName: string, 
  phaseIndex: number, 
  preferences: UserPreferences,
  mistakes: MistakeRecord[] = [],
  history: SavedLesson[] = []
): Promise<LessonPlan> => {
  
  const client = getClient(preferences);
  const modelId = preferences.apiConfig.gemini.model || 'gemini-2.5-flash';
  const targetLang = preferences.targetLanguage;
  const speakLang = preferences.spokenLanguage;

  const systemInstruction = getLessonPlanSystemInstruction(problemName, targetLang, speakLang, phaseIndex);
  const userPrompt = `Generate the lesson plan for Phase ${phaseIndex + 1} of ${problemName}.`;

  try {
      const response = await client.models.generateContent({
          model: modelId,
          contents: userPrompt,
          config: {
              systemInstruction: systemInstruction,
              responseMimeType: "application/json",
              responseSchema: lessonPlanSchema,
              temperature: 0.4, 
          }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response");
      
      let plan: LessonPlan = JSON.parse(text);

      // --- CLIENT SIDE SANITIZATION & VALIDATION (Re-implemented from Legacy) ---
      // This logic ensures "1 interactive widget per screen" but allows multiple "decorative" widgets.
      
      if (!plan.screens) plan.screens = [];
      
      plan.screens = plan.screens.map(screen => {
          if (!screen.widgets) screen.widgets = [];
          
          // 1. Filter invalid widgets (missing required data)
          const validWidgets = screen.widgets.filter(isValidWidget);

          // 2. Enforce single interactive widget
          const interactiveTypes = ['quiz', 'parsons', 'fill-in', 'leetcode', 'steps-list'];
          let interactiveCount = 0;
          
          const finalWidgets = validWidgets.filter(w => {
              const isInteractive = interactiveTypes.includes(w.type) || 
                                   (w.type === 'flipcard' && w.flipcard?.mode === 'assessment');
              
              if (isInteractive) {
                  if (interactiveCount > 0) return false; // Already have one, discard extras
                  interactiveCount++;
                  return true;
              }
              return true; // Keep decorative widgets (dialogue, callout, code)
          });
          
          return { ...screen, widgets: finalWidgets };
      });

      // 3. Remove empty screens
      plan.screens = plan.screens.filter(s => s.widgets.length > 0);

      // 4. Final Validity Check
      if (plan.screens.length === 0) {
          throw new Error("Validation Error: AI generated 0 valid screens.");
      }

      return plan;

  } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
  }
};

export const generateLeetCodeContext = async (
    problemName: string,
    preferences: UserPreferences
): Promise<LeetCodeContext> => {
    const client = getClient(preferences);
    const modelId = preferences.apiConfig.gemini.model || 'gemini-2.5-flash';
    const systemInstruction = getLeetCodeContextSystemInstruction(
        problemName, 
        preferences.spokenLanguage, 
        preferences.targetLanguage
    );

    try {
        const response = await client.models.generateContent({
            model: modelId,
            contents: `Generate full LeetCode simulation data for ${problemName}`,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: leetCodeContextSchema,
                temperature: 0.3
            }
        });
        
        return JSON.parse(response.text || '{}');
    } catch (error) {
        console.error("Simulator Generation Error:", error);
        throw error;
    }
};

// --- VIRTUAL JUDGE ENGINE ---
export const validateUserCode = async (code: string, problemDesc: string, preferences: UserPreferences, languageOverride?: string) => {
    const client = getClient(preferences);
    const targetLang = languageOverride || preferences.targetLanguage;
    const modelId = preferences.apiConfig.gemini.model || 'gemini-2.5-flash';

    const systemInstruction = getJudgeSystemInstruction(targetLang, preferences.spokenLanguage);

    const prompt = `
    Problem: ${problemDesc}
    User Code:
    \`\`\`${targetLang}
    ${code}
    \`\`\`
    `;

    try {
        const res = await client.models.generateContent({
            model: modelId,
            contents: prompt,
            config: { 
                systemInstruction: systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: judgeResultSchema,
                temperature: 0.2 // Low temp for deterministic logic checking
            }
        });
        return JSON.parse(res.text || '{}');
    } catch (e) {
        return { 
            status: "Runtime Error", 
            error_message: "Judge Connection Failed. Please try again.", 
            test_cases: [], 
            analysis: { pros: [], cons: [], timeComplexity: "?", spaceComplexity: "?" } 
        };
    }
}

// --- HELPER FUNCTIONS ---

export const generateReviewLesson = async (mistakes: MistakeRecord[], preferences: UserPreferences): Promise<LessonPlan> => {
    return {
        title: preferences.spokenLanguage === 'Chinese' ? "智能复习" : "Smart Review",
        description: "AI generated review.",
        suggestedQuestions: [],
        screens: mistakes.map((m, i) => ({
            id: `review_${i}`,
            header: `Review: ${m.problemName}`,
            widgets: [m.widget!],
            isRetry: true
        }))
    };
};

export const generateSyntaxClinicPlan = async (preferences: UserPreferences): Promise<LessonPlan> => {
    return generateLessonPlan("Syntax Clinic", 1, preferences); 
}

export const generateAiAssistance = async (context: string, userQuery: string, preferences: UserPreferences, model: string) => {
    const client = getClient(preferences);

    try {
        const res = await client.models.generateContent({
            model: model,
            contents: `Context:\n${context}\n\nUser Question: ${userQuery}\n\nAnswer briefly and helpfully in ${preferences.spokenLanguage}.`
        });
        return res.text;
    } catch (e) {
        return "AI is offline.";
    }
}
