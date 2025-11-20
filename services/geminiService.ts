
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
        title: { type: Type.STRING, description: "e.g. '1. Two Sum'" },
        initialCode: { type: Type.STRING, description: "ONLY the function signature/boilerplate. NO implementation logic." },
        problemDescription: { type: Type.STRING, description: "The full problem text description." },
        examples: { 
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    input: { type: Type.STRING },
                    output: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                }
            }
        },
        constraints: { type: Type.ARRAY, items: { type: Type.STRING } },
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
                        flipcard: {
                            type: Type.OBJECT,
                            properties: { 
                                front: { type: Type.STRING }, 
                                back: { type: Type.STRING }, 
                                hint: { type: Type.STRING },
                                mode: { type: Type.STRING, enum: ['learn', 'assessment'] }
                            }
                        },
                        quiz: {
                            type: Type.OBJECT,
                            properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctIndex: { type: Type.INTEGER }, explanation: { type: Type.STRING } }
                        },
                        callout: {
                            type: Type.OBJECT,
                            properties: { title: { type: Type.STRING }, text: { type: Type.STRING }, variant: { type: Type.STRING, enum: ['info', 'warning', 'success', 'tip'] } }
                        }
                    },
                    required: ['id', 'type']
                }
            }
          },
          required: ['id', 'widgets', 'header']
        }
      }
    },
    required: ['title', 'screens', 'suggestedQuestions']
};

// --- SYSTEM PROMPT ---

const getSystemPrompt = (prefs: UserPreferences) => `
You are "AlgoLingo", a Senior Tech Interview Coach.
Target Lang: **${prefs.targetLanguage}** | Instruction Lang: **${prefs.spokenLanguage}**.

**CRITICAL RULES:**
1. **ONE INTERACTIVE WIDGET PER SCREEN:**
   - A screen must contain **EXACTLY ONE** Interactive Widget.
   - **Interactive Widgets:** 'quiz', 'fill-in', 'parsons', 'code-editor', 'flipcard' (mode='assessment'), 'steps-list' (mode='interactive').
   - **Context Widgets (Allowed Multiple):** 'dialogue', 'callout', 'flipcard' (mode='learn'), 'interactive-code'.
   - **NEVER** put two interactive widgets on the same screen.
   - **NEVER** put a 'flipcard' (assessment) with a 'quiz' or 'parsons'.

2. **PHASE PROGRESSION (6 PHASES):**
   You are generating content for a specific phase of learning a LeetCode problem.
   
   - **Phase 0 (Concept):** Intro. Use 'dialogue', 'flipcard' (learn), 'quiz', 'fill-in' (select). **NO** 'parsons', **NO** 'assessment flipcard'.
   - **Phase 1 (Basics):** Logic building. Introduce 'flipcard' (assessment) and 'parsons'.
   - **Phase 2 (Review):** Reinforcement. Review concepts. Introduce 'fill-in' (type).
   - **Phase 3 & 4 (Optimization):** Advanced logic. Heavy use of 'parsons' and 'fill-in' (type).
   - **Phase 5 (Mastery):** Full implementation.
     - **MUST** end with a 'code-editor' widget as the 17th screen.

3. **CONTENT:**
   - **EXACTLY 17 SCREENS** per lesson.
   - Ensure the content is technically accurate for ${prefs.targetLanguage}.
`;

const sanitizePlan = (plan: LessonPlan): LessonPlan => {
    const validScreens = plan.screens.filter(screen => {
        if (!screen.widgets || screen.widgets.length === 0) return false;
        
        const hasBrokenWidgets = screen.widgets.some(w => {
            if (w.type === 'flipcard' && (!w.flipcard || !w.flipcard.front)) return true;
            if (w.type === 'quiz' && (!w.quiz || !w.quiz.options || w.quiz.options.length < 2 || !w.quiz.question)) return true;
            if (w.type === 'dialogue' && (!w.dialogue || !w.dialogue.text)) return true;
            if (w.type === 'callout' && (!w.callout || !w.callout.text)) return true;
            return false;
        });
        if (hasBrokenWidgets) return false;

        // Sanitize Fill-In
        screen.widgets.forEach(w => {
            if (w.type === 'fill-in' && w.fillIn) {
                if (!w.fillIn.options || w.fillIn.options.length === 0) {
                    w.fillIn.inputMode = 'type';
                    w.fillIn.options = []; 
                } else {
                    if (!w.fillIn.inputMode) w.fillIn.inputMode = 'select';
                }
            }
        });

        // Sanitize Interactive Validation
        // Ensure strictly one interactive widget if multiple are present (rare if prompt follows rules, but safety first)
        const interactiveWidgets = screen.widgets.filter(w => ['quiz', 'parsons', 'fill-in', 'steps-list', 'code-editor'].includes(w.type) || (w.type === 'flipcard' && w.flipcard?.mode === 'assessment'));
        
        if (interactiveWidgets.length > 1) {
            // Keep only the first interactive widget, remove others
            const firstId = interactiveWidgets[0].id;
            screen.widgets = screen.widgets.filter(w => {
                const isInteractive = ['quiz', 'parsons', 'fill-in', 'steps-list', 'code-editor'].includes(w.type) || (w.type === 'flipcard' && w.flipcard?.mode === 'assessment');
                return !isInteractive || w.id === firstId;
            });
        }
        
        return true;
    });
    
    return { ...plan, screens: validScreens };
};

// Helper to get previous phase data
const getPreviousPhaseReport = (savedLessons: SavedLesson[], mistakesHistory: MistakeRecord[], nodeIndex: number, problemName: string) => {
    if (nodeIndex === 0) return null;
    const previousNodeIndex = nodeIndex - 1;
    const relevantMistakes = mistakesHistory.filter(m => {
        const matchesProblem = m.problemName === problemName || m.problemName.includes(problemName);
        const matchesPhase = m.nodeIndex !== undefined ? m.nodeIndex === previousNodeIndex : true;
        return matchesProblem && matchesPhase;
    });

    return {
        phaseName: `Phase ${previousNodeIndex}`,
        mistakeCount: relevantMistakes.length,
        mistakeTopics: relevantMistakes.slice(0, 3).map(m => m.context),
        wasPerfect: relevantMistakes.length === 0
    };
};

// --- LLM CLIENT ABSTRACTION ---

class LLMClient {
    private config: ApiConfig;

    constructor(config: ApiConfig) {
        this.config = config;
    }

    private getGeminiKey() {
        return this.config.gemini.apiKey || process.env.API_KEY;
    }

    async generate(systemPrompt: string, userPrompt: string, schema?: Schema, onStream?: (text: string) => void): Promise<string> {
        const provider = this.config.provider;

        if (provider === 'gemini-official') {
            const ai = new GoogleGenAI({ apiKey: this.getGeminiKey() });
            
            if (onStream) {
                // Streaming mode for visualization
                try {
                    const responseStream = await ai.models.generateContentStream({
                        model: this.config.gemini.model,
                        contents: userPrompt,
                        config: {
                            systemInstruction: systemPrompt,
                            responseMimeType: schema ? "application/json" : "text/plain",
                            responseSchema: schema,
                            thinkingConfig: { thinkingBudget: 2048 } 
                        }
                    });
                    let fullText = "";
                    for await (const chunk of responseStream) {
                        const text = chunk.text;
                        if (text) {
                            fullText += text;
                            onStream(text);
                        }
                    }
                    return fullText || "{}";
                } catch (e) {
                    // Fallback to non-streaming on error if needed, or just throw
                    throw e;
                }
            } else {
                const response = await ai.models.generateContent({
                    model: this.config.gemini.model,
                    contents: userPrompt,
                    config: {
                        systemInstruction: systemPrompt,
                        responseMimeType: schema ? "application/json" : "text/plain",
                        responseSchema: schema,
                        thinkingConfig: { thinkingBudget: 2048 } 
                    }
                });
                return response.text || "{}";
            }
        }

        if (provider === 'gemini-custom') {
            const baseUrl = this.config.gemini.baseUrl || 'https://generativelanguage.googleapis.com';
            const url = `${baseUrl}/v1beta/models/${this.config.gemini.model}:generateContent?key=${this.getGeminiKey()}`;
            const body: any = {
                contents: [{ parts: [{ text: userPrompt }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
            };
            if (schema) {
                body.generationConfig = { responseMimeType: "application/json", responseSchema: schema };
            }
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!res.ok) throw new Error(`Gemini API Error: ${res.statusText}`);
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
            if (onStream) onStream(text); // Simulate single chunk stream
            return text;
        }

        if (provider === 'openai') {
            const baseUrl = this.config.openai.baseUrl;
            if (!baseUrl) throw new Error("OpenAI Base URL is missing");
            
            const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
            let finalSystemPrompt = systemPrompt;
            if (schema) {
                finalSystemPrompt += `\n\nIMPORTANT: Output valid JSON matching this schema:\n${JSON.stringify(schema, null, 2)}`;
            }
            const body = {
                model: this.config.openai.model,
                messages: [
                    { role: "system", content: finalSystemPrompt },
                    { role: "user", content: userPrompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.7
            };
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.openai.apiKey}`
                },
                body: JSON.stringify(body)
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            const text = data.choices?.[0]?.message?.content || "{}";
            if (onStream) onStream(text); // Simulate single chunk stream
            return text;
        }
        throw new Error("Unknown provider");
    }
}

// --- MAIN FUNCTIONS ---

export const generateLessonPlan = async (
  problemName: string,
  nodeIndex: number,
  prefs: UserPreferences,
  mistakesHistory: MistakeRecord[] = [],
  savedLessons: SavedLesson[] = [],
  onUpdate?: (log: string) => void
): Promise<LessonPlan> => {
  const client = new LLMClient(prefs.apiConfig);
  const prevReport = getPreviousPhaseReport(savedLessons, mistakesHistory, nodeIndex, problemName);
  
  const blueprints = [
      // Phase 0: Concept
      `**PHASE 0: CONCEPT (17 Screens)**
       Focus: Intro, Syntax, Basic Logic.
       Widgets: 'dialogue', 'flipcard' (Learn Mode), 'quiz', 'fill-in' (Select Mode).
       RESTRICTIONS: NO 'parsons', NO 'flipcard' (Assessment), NO 'code-editor'.`,

      // Phase 1: Basics
      `**PHASE 1: BASICS (17 Screens)**
       Focus: Logic ordering, basic patterns.
       Widgets: Introduce 'parsons' & 'flipcard' (Assessment Mode).
       Mix with 'quiz' and 'fill-in' (Select).`,

      // Phase 2: Review
      `**PHASE 2: REVIEW & REINFORCEMENT (17 Screens)**
       Focus: Review Phase 0 & 1 concepts. Introduce 'fill-in' (Type Mode).
       Mistake Integration: If report exists, generate variations of failed questions.`,

      // Phase 3: Optimization I
      `**PHASE 3: OPTIMIZATION I (17 Screens)**
       Focus: Efficiency, Time Complexity.
       Widgets: Heavy 'parsons' (complex logic), 'fill-in' (Type).`,

      // Phase 4: Optimization II
      `**PHASE 4: OPTIMIZATION II (17 Screens)**
       Focus: Edge cases, advanced patterns.
       Widgets: 'parsons', 'fill-in' (Type), 'quiz' (Edge cases).`,

      // Phase 5: Mastery
      `**PHASE 5: MASTERY (17 Screens)**
       Screens 1-16: Advanced mix of all interactive widgets.
       Screen 17: **MUST** be a 'code-editor' widget. Full LeetCode style implementation.`
  ];

  const selectedBlueprint = blueprints[Math.min(nodeIndex, 5)];

  const prompt = `
  Generate a lesson plan for: ${problemName} (Phase Index: ${nodeIndex}).
  ${selectedBlueprint}
  ${prevReport ? `PREVIOUS PHASE REPORT: ${prevReport.mistakeCount} mistakes on topics: ${prevReport.mistakeTopics.join(', ')}. EMPHASIZE THESE TOPICS.` : ""}
  
  Output JSON only.
  `;

  try {
    const text = await client.generate(getSystemPrompt(prefs), prompt, lessonPlanSchema, onUpdate);
    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
    return sanitizePlan(JSON.parse(cleanText) as LessonPlan);
  } catch (error) {
    console.error("GenAI Error:", error);
    return createFallbackPlan(prefs);
  }
};

export const generateReviewLesson = async (
  mistakes: MistakeRecord[],
  prefs: UserPreferences,
  topics: string[] = [],
  onUpdate?: (log: string) => void
): Promise<LessonPlan> => {
  const client = new LLMClient(prefs.apiConfig);
  
  const hasMistakes = mistakes.length > 0;
  const focusTopics = hasMistakes ? mistakes.slice(0, 10).map(m => m.context).join(', ') : topics.slice(0, 5).join(', ');

  const prompt = `
  Task: Create a **17-Screen Global Review Session**.
  
  **TARGET TOPICS:** ${focusTopics || "General Algorithms"}
  
  **INSTRUCTIONS:**
  - Use 'code-editor' for at least 2 screens to verify mastery.
  - Mix 'parsons', 'fill-in' (Type & Select), 'quiz', 'flipcard' (Assessment).
  - Structure: 1-5 Recall, 6-12 Application, 13-17 Coding.
  `;

  try {
    const text = await client.generate(getSystemPrompt(prefs), prompt, lessonPlanSchema, onUpdate);
    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
    return sanitizePlan(JSON.parse(cleanText) as LessonPlan);
  } catch (error) {
    return createFallbackPlan(prefs);
  }
};

export const generateSyntaxClinicPlan = async (
    prefs: UserPreferences,
    onUpdate?: (log: string) => void
): Promise<LessonPlan> => {
    const client = new LLMClient(prefs.apiConfig);
    
    const prompt = `
    Task: Create a **17-Screen Syntax Clinic** for **${prefs.targetLanguage}**.
    
    **GOAL:** Drill syntax patterns.
    
    **STRUCTURE:**
    1: Dialogue.
    2-8: 'flipcard' (Learn & Assessment) & 'callout'.
    9-14: 'fill-in' (Select & Type).
    15-17: 'code-editor' (Simple functions).
    `;

    try {
        const text = await client.generate(getSystemPrompt(prefs), prompt, lessonPlanSchema, onUpdate);
        const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
        return sanitizePlan(JSON.parse(cleanText) as LessonPlan);
    } catch (error) {
        return createFallbackPlan(prefs);
    }
}

export const validateUserCode = async (
    code: string,
    problemDescription: string,
    prefs: UserPreferences
): Promise<{ correct: boolean, output: string, feedback: string }> => {
    const client = new LLMClient(prefs.apiConfig);
    const prompt = `
    Role: Senior Code Reviewer.
    Task: Validate this ${prefs.targetLanguage} code for "${problemDescription}".
    User Code: ${code}
    Check for: Correct Logic, Edge cases, Syntax.
    Return JSON: { "correct": boolean, "output": "Simulated stdout/error", "feedback": "Concise hint" }
    `;

    try {
        const text = await client.generate("Output JSON only.", prompt);
        return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
    } catch (e) {
        return { correct: false, output: "Error", feedback: "Validation failed." };
    }
}

export const generateAiAssistance = async (
    context: string, 
    userQuery: string,
    prefs: UserPreferences,
    modelOverride?: string
) => {
    const specificConfig = { ...prefs.apiConfig };
    if (modelOverride) {
        if (specificConfig.provider === 'gemini-official' || specificConfig.provider === 'gemini-custom') {
             specificConfig.gemini = { ...specificConfig.gemini, model: modelOverride };
        }
    }

    const client = new LLMClient(specificConfig);
    const prompt = `Context: ${context}\nUser Question: ${userQuery}\nRespond in ${prefs.spokenLanguage}. Concise (max 2 sentences).`;
    try {
        return await client.generate("You are a helpful tutor.", prompt);
    } catch (e) {
        return "Assistant offline.";
    }
}

function createFallbackPlan(prefs: UserPreferences): LessonPlan {
    return {
        title: "Connection Issue",
        description: "Please check settings.",
        suggestedQuestions: ["Retry"],
        screens: [{
            id: 'error',
            header: 'Error',
            widgets: [{ id: 'e', type: 'callout', callout: { title: "Error", text: "Failed to generate. Check API Key.", variant: 'warning' } }]
        }]
    };
}
