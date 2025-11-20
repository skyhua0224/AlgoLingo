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
        lines: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Code lines for the puzzle. Aim for 5-8 lines. Combine short lines if needed." },
        explanation: { type: Type.STRING }
    }
};

const fillInSchema = {
    type: Type.OBJECT,
    properties: {
        code: { type: Type.STRING, description: "PURE CODE ONLY with __BLANK__ placeholders. NO instructions or text allowed in this string." },
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
    history: SavedLesson[] = [],
    onDebug?: (msg: string) => void
): Promise<LessonPlan> => {
    const log = (msg: string) => {
        console.log(`[GeminiService] ${msg}`);
        if (onDebug) onDebug(msg);
    };

    log("Initializing generation request...");
    const client = getGeminiClient(preferences);
    const modelId = preferences.apiConfig.gemini.model || 'gemini-2.5-flash';

    log(`Model: ${modelId}`);
    log(`Phase: ${phaseIndex}, Language: ${preferences.targetLanguage}`);

    const systemInstruction = getSystemInstruction({
        problemName,
        preferences,
        phaseIndex,
        mistakes,
    });

    log(`System Prompt Length: ${systemInstruction.length} chars`);

    const userPrompt = `Generate the lesson plan for Phase ${phaseIndex + 1} of ${problemName}. Remember: 17 Screens.`;
    log(`User Prompt: ${userPrompt}`);

    try {
        const TIMEOUT_MS = 90000; // Increased to 90 seconds
        log(`Sending request to Gemini API (Timeout: ${TIMEOUT_MS/1000}s)...`);

        const apiCall = client.models.generateContent({
            model: modelId,
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: lessonPlanSchema,
                temperature: 0.2, // Lower temperature for more stability
            },
        });

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`API call timed out after ${TIMEOUT_MS / 1000}s`)), TIMEOUT_MS)
        );

        // Race the API call against the timeout
        const response = (await Promise.race([apiCall, timeoutPromise])) as GenerateContentResponse;

        log("Response received!");
        
        const text = response.text;
        if (!text) {
            log("Error: Empty response text from API");
            throw new Error("Empty response");
        }
        
        log(`Response text length: ${text.length}`);
        log("Parsing JSON...");

        let plan: LessonPlan;
        try {
            plan = JSON.parse(text);
        } catch (jsonError) {
            log("Error: Failed to parse JSON. Response might be malformed or incomplete.");
            // Log partial text for debugging
            log(`Partial Response: ${text.substring(0, 500)}...`);
            throw new Error("Invalid JSON received from AI");
        }

        // --- VALIDATION & SANITIZATION ---
        log("Validating Lesson Plan schema...");
        const validationResult = validateLessonPlan(plan);
        if (!validationResult.isValid) {
            const errors = validationResult.errors.join(', ');
            log(`Validation Failed: ${errors}`);
            console.error("AI Response Validation Failed:", validationResult.errors);
            throw new Error(`AI response failed validation: ${errors}`);
        }

        log("Validation Successful. Lesson Plan ready.");
        return validationResult.sanitizedPlan!;

    } catch (error: any) {
        log(`Gemini API Error: ${error.message}`);
        console.error("Gemini API Error:", error);
        throw error;
    }
};

// --- REVIEW GENERATION (Simplified) ---
export const generateReviewLesson = async (
    mistakes: MistakeRecord[], 
    preferences: UserPreferences,
    onDebug?: (msg: string) => void
): Promise<LessonPlan> => {
    if (onDebug) onDebug("Generating Review Lesson (Local + AI wrapper)...");
    
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

export const generateSyntaxClinicPlan = async (preferences: UserPreferences, onDebug?: (msg: string) => void): Promise<LessonPlan> => {
    return generateLessonPlan("Syntax Clinic", 1, preferences, [], [], onDebug);
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