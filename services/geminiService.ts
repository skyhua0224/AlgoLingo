import { GenerateContentResponse, Schema, Type } from "@google/genai";
import { LessonPlan, MistakeRecord, SavedLesson, UserPreferences } from "../types";
import { getGeminiClient } from "./api/geminiClient";
import { getSystemInstruction } from "./prompts/lessonPrompts";
import { validateLessonPlan } from "./validators/lessonValidator";

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

const solutionDisplaySchema = {
    type: Type.OBJECT,
    properties: {
        language: { type: Type.STRING },
        code: { type: Type.STRING, description: "The full, correct solution code." },
        explanation: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    lineNumber: { type: Type.INTEGER },
                    explanation: { type: Type.STRING, description: "The technical explanation for this specific line or block." }
                }
            }
        }
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
                                type: { type: Type.STRING, enum: ['dialogue', 'flipcard', 'quiz', 'code', 'interactive-code', 'parsons', 'fill-in', 'callout', 'code-editor', 'steps-list', 'solution-display'] },
                                dialogue: dialogueSchema,
                                interactiveCode: interactiveCodeSchema,
                                parsons: parsonsSchema,
                                fillIn: fillInSchema,
                                codeEditor: codeEditorSchema,
                                stepsList: stepsListSchema,
                                solutionDisplay: solutionDisplaySchema,
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

// --- GENERATION LOGIC ---

export const generateLessonPlan = async (
    problemName: string,
    phaseIndex: number,
    preferences: UserPreferences,
    mistakes: MistakeRecord[] = [],
    history: SavedLesson[] = []
): Promise<LessonPlan> => {
    const client = getGeminiClient(preferences);
    const modelId = preferences.apiConfig.gemini.model || 'gemini-2.5-flash';

    const systemInstruction = getSystemInstruction({
        problemName,
        preferences,
        phaseIndex,
        mistakes,
    });

    const userPrompt = `Generate the lesson plan for Phase ${phaseIndex + 1} of ${problemName}. Remember: 17 Screens.`;

    try {
        const TIMEOUT_MS = 60000; // 60-second timeout

        const apiCall = client.models.generateContent({
            model: modelId,
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: lessonPlanSchema,
                temperature: 0.4,
            },
        });

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`API call timed out after ${TIMEOUT_MS / 1000}s`)), TIMEOUT_MS)
        );

        // Race the API call against the timeout
        const response = (await Promise.race([apiCall, timeoutPromise])) as GenerateContentResponse;

        const text = response.text;
        if (!text) throw new Error("Empty response");

        let plan: LessonPlan = JSON.parse(text);

        // --- VALIDATION & SANITIZATION ---
        const validationResult = validateLessonPlan(plan);
        if (!validationResult.isValid) {
            console.error("AI Response Validation Failed:", validationResult.errors);
            throw new Error(`AI response failed validation: ${validationResult.errors.join(', ')}`);
        }

        return validationResult.sanitizedPlan!;

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
            widgets: [m.widget!],
            isRetry: true
        }))
    };
};

export const validateUserCode = async (code: string, problemDesc: string, preferences: UserPreferences) => {
    const client = getGeminiClient(preferences);

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
    return generateLessonPlan("Syntax Clinic", 1, preferences);
}

export const generateAiAssistance = async (context: string, userQuery: string, preferences: UserPreferences, model: string) => {
    const client = getGeminiClient(preferences);

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
