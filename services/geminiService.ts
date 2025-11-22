
import { GoogleGenAI, Schema, Type } from "@google/genai";
import { LessonPlan, MistakeRecord, UserPreferences, LessonScreen, Widget, SavedLesson, ApiConfig } from "../types";

// --- SCHEMA DEFINITIONS ---
const dialogueSchema = {
    type: Type.OBJECT,
    properties: {
        text: { type: Type.STRING },
        speaker: { type: Type.STRING, enum: ['coach', 'user'] },
        emotion: { type: Type.STRING, enum: ['neutral', 'happy', 'thinking', 'excited'] }
    }
};

const interactiveCodeSchema = {
    type: Type.OBJECT,
    properties: {
        language: { type: Type.STRING },
        lines: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    code: { type: Type.STRING, description: "VALID CODE ONLY. NO COMMENTS OR TEXT." },
                    explanation: { type: Type.STRING, description: "The technical explanation of this specific line." }
                }
            }
        },
        caption: { type: Type.STRING }
    }
};

const stepsListSchema = {
    type: Type.OBJECT,
    properties: {
        items: { type: Type.ARRAY, items: { type: Type.STRING } },
        mode: { type: Type.STRING, enum: ['static', 'interactive'] },
        correctOrder: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
};

const leetcodeSchema = {
    type: Type.OBJECT,
    properties: {
        problemSlug: { type: Type.STRING, description: "The exact slug for leetcode.cn (e.g., 'two-sum', 'lru-cache')." },
        concept: {
            type: Type.OBJECT,
            properties: {
                front: { type: Type.STRING, description: "Key Concept Name (e.g. 'HashMap')" },
                back: { type: Type.STRING, description: "Brief summary of the concept." }
            }
        },
        exampleCode: interactiveCodeSchema
    }
};

const parsonsSchema = {
    type: Type.OBJECT,
    properties: {
        lines: { type: Type.ARRAY, items: { type: Type.STRING }, description: "MUST CONTAIN AT LEAST 5 LINES OF CODE. DO NOT MAKE IT SHORT." },
        explanation: { type: Type.STRING },
        indentation: { type: Type.BOOLEAN, description: "If true, UI shows indentation controls." }
    }
};

const fillInSchema = {
    type: Type.OBJECT,
    properties: {
        code: { type: Type.STRING, description: "Code with __BLANK__ placeholders." },
        options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Optional options for select mode. MUST BE PROVIDED for Phase 0 and 1." },
        correctValues: { type: Type.ARRAY, items: { type: Type.STRING } },
        explanation: { type: Type.STRING },
        inputMode: { type: Type.STRING, enum: ['select', 'type'], description: "DEFAULT to 'select'. Use 'type' ONLY for Phase 3+ or Exams." }
    }
};

const lessonPlanSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      suggestedQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
      screens: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            header: { type: Type.STRING, description: "A short title for this screen e.g. 'Concept: The Dictionary'" },
            widgets: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['dialogue', 'flipcard', 'quiz', 'code', 'interactive-code', 'parsons', 'fill-in', 'callout', 'leetcode', 'steps-list'] },
                        dialogue: dialogueSchema,
                        interactiveCode: interactiveCodeSchema,
                        parsons: parsonsSchema,
                        fillIn: fillInSchema,
                        leetcode: leetcodeSchema,
                        stepsList: stepsListSchema,
                        callout: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                text: { type: Type.STRING },
                                variant: { type: Type.STRING, enum: ['info', 'warning', 'success', 'tip'] }
                            }
                        },
                        flipcard: {
                            type: Type.OBJECT,
                            properties: {
                                front: { type: Type.STRING },
                                back: { type: Type.STRING },
                                hint: { type: Type.STRING },
                                mode: { type: Type.STRING, enum: ['learn', 'assessment'] },
                                model3d: { type: Type.STRING }
                            }
                        },
                        code: {
                            type: Type.OBJECT,
                            properties: {
                                content: { type: Type.STRING },
                                language: { type: Type.STRING },
                                caption: { type: Type.STRING }
                            }
                        },
                        quiz: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                correctIndex: { type: Type.INTEGER },
                                explanation: { type: Type.STRING }
                            }
                        }
                    }
                }
            }
          }
        }
      }
    }
};

// --- VALIDATION HELPER ---
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

// --- PHASE CONFIGURATIONS ---

// Maps 0-6 (Node Index) to Stage Requirements
const getStageConfig = (phaseIndex: number, problemName: string) => {
    switch (phaseIndex) {
        case 0: // Stage 1: Concept Introduction
            return `
            STAGE 1: CONCEPT INTRODUCTION
            - Goal: Introduce the core concept of "${problemName}".
            - Widgets Allowed: 'dialogue', 'callout', 'flipcard' (mode='learn'), 'quiz', 'fill-in' (inputMode='select'), 'interactive-code'.
            - PROHIBITED: 'parsons', 'flipcard' (mode='assessment'), 'fill-in' (inputMode='type'), 'leetcode'.
            - Structure: Mix of teaching screens (dialogue/flipcard) and simple checks (quiz).
            - REQUIREMENT: You MUST include at least one screen with an 'interactive-code' widget to visually explain the code logic/syntax.
            - CRITICAL INSTRUCTION: Every screen MUST start with a 'dialogue' or 'callout' widget to explain the concept simply BEFORE showing any code or interactive widget. Do NOT assume prior knowledge. Guide the user gently.
            - METHOD: Use Socratic questioning. Guide the user step-by-step.
            `;
        case 1: // Stage 2: Basics (Review + New Tools)
            return `
            STAGE 2: BASICS & REINFORCEMENT
            - Goal: Review Stage 1 and strengthen syntax.
            - NEW Widgets Allowed: 'flipcard' (mode='assessment' - "Forgot/Got it" buttons), 'parsons' (Ordering code).
            - Widgets Allowed: All from Stage 1 (including 'interactive-code') + New ones.
            - PROHIBITED: 'fill-in' (inputMode='type'), 'leetcode'.
            - Structure: Start with 'flipcard' (assessment) to check memory. Use 'parsons' for logic flow.
            - REQUIREMENT: You MUST include at least one 'interactive-code' widget to reinforce the algorithm structure.
            `;
        case 2: // Stage 3: Review I (Handwriting Intro)
            return `
            STAGE 3: REVIEW I
            - Goal: Deepen memory with active recall.
            - NEW Widgets Allowed: 'fill-in' (inputMode='type' - simulates handwriting).
            - Widgets Allowed: All previous (including 'interactive-code') + New one.
            - PROHIBITED: 'leetcode'.
            - Difficulty: Medium. Reduce simple multiple choice questions. Increase 'fill-in' (type) usage.
            - REQUIREMENT: You MUST include at least one 'interactive-code' widget to review code patterns before typing exercises.
            `;
        case 3: // Stage 4: Code Implementation
            return `
            STAGE 4: CODE IMPLEMENTATION
            - Goal: Focus on writing the actual algorithm structure.
            - Widgets: Heavily use 'parsons' and 'fill-in' (type).
            - PROHIBITED: 'leetcode'.
            - Difficulty: Hard.
            `;
        case 4: // Stage 5: Review II
            return `
            STAGE 5: REVIEW II
            - Goal: Pre-Mastery check. High difficulty.
            - Widgets: All allowed except 'leetcode'.
            - Focus: Edge cases and optimization logic.
            `;
        case 5: // Stage 6: Mastery
            return `
            STAGE 6: MASTERY CHALLENGE
            - Goal: Prove full competence.
            - STRUCTURE: Generate 16-18 Screens.
            - Widgets: Difficult mix of 'parsons', 'fill-in' (type), and 'flipcard' (assessment).
            - PROHIBITED: 'leetcode', 'dialogue' (minimize teaching, focus on testing).
            - Focus: This is the final boss exam. No hand-holding.
            `;
        case 6: // Stage 7: LeetCode Integration
            return `
            STAGE 7: LEETCODE STUDY MODE
            - Goal: Provide resources for the LeetCode solve.
            - STRUCTURE: Generate EXACTLY 1 SCREEN.
            - Widget: MUST be 'leetcode'.
            - For the 'leetcode' widget, you MUST provide:
                 1. 'problemSlug': The correct slug for leetcode.cn (e.g., "two-sum").
                 2. 'concept': A concise summary card.
                 3. 'exampleCode': The optimal solution with line-by-line explanations.
            `;
        default:
            return "Standard Review";
    }
};

// --- GENERATION LOGIC ---

export const generateLessonPlan = async (
  problemName: string, 
  phaseIndex: number, 
  preferences: UserPreferences,
  mistakes: MistakeRecord[] = [],
  history: SavedLesson[] = []
): Promise<LessonPlan> => {
  
  // --- CLIENT SETUP ---
  let client: GoogleGenAI;
  if (preferences.apiConfig.provider === 'gemini-custom') {
      client = new GoogleGenAI({ 
          apiKey: preferences.apiConfig.gemini.apiKey || '', 
      });
  } else {
      client = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  const modelId = preferences.apiConfig.gemini.model || 'gemini-2.5-flash';
  const targetLang = preferences.targetLanguage;
  const speakLang = preferences.spokenLanguage;
  const stageConfig = getStageConfig(phaseIndex, problemName);

  // --- PROMPT ENGINEERING ---
  let screenCountInstruction = "You MUST generate EXACTLY 17 SCREENS.";
  if (phaseIndex === 6) screenCountInstruction = "You MUST generate EXACTLY 1 SCREEN containing the 'leetcode' widget.";

  const langRules: Record<string, string> = {
    Python: "Use Pythonic syntax (list comprehensions, snake_case). Standard library only.",
    Java: "Use standard Java conventions. For snippets, assume context inside a method or class. Use camelCase.",
    "C++": "Use modern C++ features (auto, vectors, STL).",
    JavaScript: "Use ES6+ syntax (const, let, arrow functions).",
    Go: "Use idiomatic Go. Short variable names where appropriate.",
    C: "Use standard C99. Manual memory management focus where relevant."
  };

  const targetRule = langRules[targetLang] || "Use standard syntax.";

  const systemInstruction = `
    You are an elite AlgoLingo coach. You are teaching the algorithm "${problemName}" in ${targetLang}.
    The user speaks ${speakLang}.
    
    STRICT CODE RULES:
    - **${targetRule}**
    - Ensure all code snippets are syntactically correct for ${targetLang}.
    - For Parsons problems, ensure lines are logical and can be ordered correctly. Indentation is important for Python.
    - **CONSISTENCY**: Use the EXACT SAME variable names (e.g., 'nums', 'target'), coding style, and logic baseline across all widgets. Do not switch naming conventions or logic styles midway.
    - **NO PEDANTIC CHECKS**: Do NOT test for function signatures, parameter type hints, or strict naming conventions in quizzes/fill-ins unless it is the core concept being taught. Focus on the algorithm logic and steps.
    
    STRICT LESSON STRUCTURE RULES:
    1. **TOTAL SCREENS**: ${screenCountInstruction}
    2. **ONE INTERACTION PER SCREEN**: A screen can have decorative widgets (dialogue, callout, code-display), but it MUST have EXACTLY ONE "Interactive Widget".
       - Interactive Widgets are: 'quiz', 'flipcard' (mode='assessment'), 'parsons', 'fill-in', 'leetcode', 'steps-list' (mode='interactive').
       - NEVER put two interactive widgets on the same screen.
    3. **DATA VALIDITY**: Do not generate widgets with empty content. E.g. A dialogue widget MUST have text.
    
    STAGE CONFIGURATION (Follow this STRICTLY):
    ${stageConfig}

    WIDGET RULES:
    - 'flipcard': 
        - mode='learn': Simple front/back. Used in Stage 1.
        - mode='assessment': Has "Forgot/Got it" buttons. ONLY allowed Stage 2+.
    - 'fill-in':
        - inputMode='select': Select from options. Stage 1+.
        - inputMode='type': User types answer. ONLY allowed Stage 3+.
    - 'parsons': 
        - ONLY allowed Stage 2+.
        - Set 'indentation': true for Python or if code nesting is complex.
    - 'leetcode': ONLY allowed in Phase 7 (Index 6).

    CONTENT STYLE:
    - Tone: Encouraging, professional, slightly gamified (Duolingo style).
    - Language: Explanations in ${speakLang}. Code in ${targetLang}.
    - Mistake Adaptation: The user has made ${mistakes.length} mistakes recently. Incorporate similar tricky cases if relevant.
    
    OUTPUT FORMAT:
    - JSON matching the Schema provided.
  `;

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

      // --- CLIENT SIDE SANITIZATION & VALIDATION ---
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
                  if (interactiveCount > 0) return false; // Already have one
                  interactiveCount++;
                  return true;
              }
              return true; // Keep decorative widgets
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

// --- REVIEW GENERATION (Simplified) ---
export const generateReviewLesson = async (mistakes: MistakeRecord[], preferences: UserPreferences): Promise<LessonPlan> => {
    return {
        title: preferences.spokenLanguage === 'Chinese' ? "智能复习" : "Smart Review",
        description: "AI generated review based on your mistakes.",
        suggestedQuestions: [],
        screens: mistakes.map((m, i) => ({
            id: `review_${i}`,
            header: `Review: ${m.problemName}`,
            widgets: [m.widget!], // Replay the exact widget
            isRetry: true
        }))
    };
};

export const validateUserCode = async (code: string, problemDesc: string, preferences: UserPreferences) => {
     let client: GoogleGenAI;
      if (preferences.apiConfig.provider === 'gemini-custom') {
          client = new GoogleGenAI({ apiKey: preferences.apiConfig.gemini.apiKey || '' });
      } else {
          client = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      }

      const prompt = `
      Problem: ${problemDesc}
      User Code:
      \`\`\`${preferences.targetLanguage}
      ${code}
      \`\`\`
      
      Analyze the user's code. 
      1. Is it logically correct for the problem?
      2. Does it have syntax errors?
      
      Return JSON: { "correct": boolean, "output": string (simulated output or error), "feedback": string }
      `;

      try {
        const res = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(res.text || '{}');
      } catch (e) {
          return { correct: false, output: "AI Validation Failed", feedback: "Connection error." };
      }
}

export const generateSyntaxClinicPlan = async (preferences: UserPreferences): Promise<LessonPlan> => {
    return generateLessonPlan("Syntax Clinic", 1, preferences); // Reuse basics stage logic
}

export const generateAiAssistance = async (context: string, userQuery: string, preferences: UserPreferences, model: string) => {
     let client: GoogleGenAI;
      if (preferences.apiConfig.provider === 'gemini-custom') {
          client = new GoogleGenAI({ apiKey: preferences.apiConfig.gemini.apiKey || '' });
      } else {
          client = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      }

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
