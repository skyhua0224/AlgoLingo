
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

const codeEditorSchema = {
    type: Type.OBJECT,
    properties: {
        initialCode: { type: Type.STRING },
        problemDescription: { type: Type.STRING },
        expectedOutputDescription: { type: Type.STRING },
        solutionTemplate: { type: Type.STRING },
        hints: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
};

const parsonsSchema = {
    type: Type.OBJECT,
    properties: {
        lines: { type: Type.ARRAY, items: { type: Type.STRING }, description: "MUST CONTAIN AT LEAST 5 LINES OF CODE. DO NOT MAKE IT SHORT." },
        explanation: { type: Type.STRING }
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
                        type: { type: Type.STRING, enum: ['dialogue', 'flipcard', 'quiz', 'code', 'interactive-code', 'parsons', 'fill-in', 'callout', 'code-editor', 'steps-list'] },
                        dialogue: dialogueSchema,
                        interactiveCode: interactiveCodeSchema,
                        parsons: parsonsSchema,
                        fillIn: fillInSchema,
                        codeEditor: codeEditorSchema,
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
                                mode: { type: Type.STRING, enum: ['learn', 'assessment'] }
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

// --- PHASE CONFIGURATIONS ---

// Maps 0-5 (Node Index) to Stage Requirements
const getStageConfig = (phaseIndex: number, problemName: string) => {
    switch (phaseIndex) {
        case 0: // Stage 1: Concept Introduction
            return `
            STAGE 1: CONCEPT INTRODUCTION
            - Goal: Introduce the core concept of "${problemName}".
            - Widgets Allowed: 'dialogue', 'callout', 'flipcard' (mode='learn'), 'quiz', 'fill-in' (inputMode='select').
            - PROHIBITED: 'parsons', 'flipcard' (mode='assessment'), 'fill-in' (inputMode='type'), 'code-editor'.
            - Structure: Mix of teaching screens (dialogue/flipcard) and simple checks (quiz).
            `;
        case 1: // Stage 2: Basics (Review + New Tools)
            return `
            STAGE 2: BASICS & REINFORCEMENT
            - Goal: Review Stage 1 and strengthen syntax.
            - NEW Widgets Allowed: 'flipcard' (mode='assessment' - "Forgot/Got it" buttons), 'parsons' (Ordering code).
            - Widgets Allowed: All from Stage 1 + New ones.
            - PROHIBITED: 'fill-in' (inputMode='type'), 'code-editor'.
            - Structure: Start with 'flipcard' (assessment) to check memory. Use 'parsons' for logic flow.
            `;
        case 2: // Stage 3: Review I (Handwriting Intro)
            return `
            STAGE 3: REVIEW I
            - Goal: Deepen memory with active recall.
            - NEW Widgets Allowed: 'fill-in' (inputMode='type' - simulates handwriting).
            - Widgets Allowed: All previous + New one.
            - PROHIBITED: 'code-editor'.
            - Difficulty: Medium. Reduce simple multiple choice questions. Increase 'fill-in' (type) usage.
            `;
        case 3: // Stage 4: Code Implementation
            return `
            STAGE 4: CODE IMPLEMENTATION
            - Goal: Focus on writing the actual algorithm structure.
            - Widgets: Heavily use 'parsons' and 'fill-in' (type).
            - PROHIBITED: 'code-editor'.
            - Difficulty: Hard.
            `;
        case 4: // Stage 5: Review II
            return `
            STAGE 5: REVIEW II
            - Goal: Pre-Mastery check. High difficulty.
            - Widgets: All allowed except 'code-editor'.
            - Focus: Edge cases and optimization logic.
            `;
        case 5: // Stage 6: Mastery
            return `
            STAGE 6: MASTERY
            - Goal: Prove full competence.
            - REQUIREMENTS:
               - Screens 1-16: Difficult mix of 'parsons', 'fill-in' (type), and 'flipcard' (assessment).
               - Screen 17 (FINAL SCREEN): MUST BE widget type 'code-editor'. This is the ONLY place 'code-editor' is allowed.
               - The 'code-editor' widget simulates a LeetCode environment.
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
      // Official uses process.env in a real app, or a proxy. 
      // For this demo we assume the key is injected or handled via proxy if configured.
      client = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  const modelId = preferences.apiConfig.gemini.model || 'gemini-2.5-flash';
  const targetLang = preferences.targetLanguage;
  const speakLang = preferences.spokenLanguage;
  const stageConfig = getStageConfig(phaseIndex, problemName);

  // --- PROMPT ENGINEERING ---
  const systemInstruction = `
    You are an elite AlgoLingo coach. You are teaching the algorithm "${problemName}" in ${targetLang}.
    The user speaks ${speakLang}.
    
    STRICT LESSON STRUCTURE RULES:
    1. **TOTAL SCREENS**: You MUST generate EXACTLY 17 SCREENS (Screen 1 to Screen 17). This is a HARD requirement.
    2. **ONE INTERACTION PER SCREEN**: A screen can have decorative widgets (dialogue, callout, code-display), but it MUST have EXACTLY ONE "Interactive Widget".
       - Interactive Widgets are: 'quiz', 'flipcard' (mode='assessment'), 'parsons', 'fill-in', 'code-editor', 'steps-list' (mode='interactive').
       - NEVER put two interactive widgets on the same screen. (e.g. DO NOT put a Quiz and a Flipcard on the same screen).
       - You CAN put a Dialogue and a Quiz on the same screen. This is encouraged to make it lively.
    
    STAGE CONFIGURATION (Follow this STRICTLY):
    ${stageConfig}

    WIDGET RULES:
    - 'flipcard': 
        - mode='learn': Simple front/back. Used in Stage 1.
        - mode='assessment': Has "Forgot/Got it" buttons. ONLY allowed Stage 2+.
    - 'fill-in':
        - inputMode='select': Select from options. Stage 1+.
        - inputMode='type': User types answer. ONLY allowed Stage 3+.
    - 'parsons': ONLY allowed Stage 2+.
    - 'code-editor': ONLY allowed in Stage 6 (Index 5), and ONLY on Screen 17.

    CONTENT STYLE:
    - Tone: Encouraging, professional, slightly gamified (Duolingo style).
    - Language: Explanations in ${speakLang}. Code in ${targetLang}.
    - Mistake Adaptation: The user has made ${mistakes.length} mistakes recently. Incorporate similar tricky cases if relevant.
    
    OUTPUT FORMAT:
    - JSON matching the Schema provided.
    - Do not wrap in markdown blocks. Return raw JSON if possible, or standard markdown json.
  `;

  const userPrompt = `Generate the lesson plan for Phase ${phaseIndex + 1} of ${problemName}. Remember: 17 Screens.`;

  try {
      const response = await client.models.generateContent({
          model: modelId,
          contents: userPrompt,
          config: {
              systemInstruction: systemInstruction,
              responseMimeType: "application/json",
              responseSchema: lessonPlanSchema,
              temperature: 0.4, // Lower temp for stricter adherence to rules
          }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response");
      
      let plan: LessonPlan = JSON.parse(text);

      // --- CLIENT SIDE SANITIZATION (Safety Net) ---
      // Ensure we have screens
      if (!plan.screens) plan.screens = [];

      // Enforce 17 screens if AI failed (Truncate or Pad - Pad is harder, so we truncate)
      // Actually, better to just accept what we get but log warning, or duplicate review questions if short.
      // For now, we trust the prompt but perform widget sanitization.
      
      plan.screens = plan.screens.map(screen => {
          // 1. Filter strictly 1 interactive widget per screen
          const interactiveTypes = ['quiz', 'parsons', 'fill-in', 'code-editor', 'steps-list'];
          let interactiveCount = 0;
          
          const newWidgets = screen.widgets.filter(w => {
              // Check flipcard mode
              if (w.type === 'flipcard' && w.flipcard?.mode === 'assessment') {
                  if (interactiveCount > 0) return false;
                  interactiveCount++;
                  return true;
              }
              if (interactiveTypes.includes(w.type)) {
                  if (interactiveCount > 0) return false;
                  interactiveCount++;
                  return true;
              }
              return true; // Keep decorative widgets
          });
          
          return { ...screen, widgets: newWidgets };
      });

      return plan;

  } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
  }
};

// --- REVIEW GENERATION (Simplified) ---
export const generateReviewLesson = async (mistakes: MistakeRecord[], preferences: UserPreferences): Promise<LessonPlan> => {
    // Review logic remains mostly same, but we can enforce the "Type Mode" for fill-ins if strict
    // For this request, we primarily focused on the main path.
    // We will just return a simple wrapper around the existing mistakes for now, 
    // or call AI to "Remix" them. 
    
    // To save tokens/latency, we often just replay the widgets. 
    // But if we want AI to generate NEW review questions based on old mistakes:
    
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
    // Mock validation using AI to check logic
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
