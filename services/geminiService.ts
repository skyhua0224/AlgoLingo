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

**MANDATORY PEDAGOGY RULES:**
1. **SCAFFOLDING FIRST:** NEVER ask the user to write code (Code Editor) or fill in a blank without teaching it first.
   - BEFORE any 'quiz', 'fill-in', or 'code-editor', you MUST provide a 'flipcard' or 'callout' explaining the exact syntax or concept.
   - Users are beginners in this language. Do not assume they know the syntax.

2. **WIDGET USAGE BY PHASE:**
   - **Phase 0 (Concept):** 
     - **MANDATORY:** Screen 4 MUST be 'interactive-code'. Show the FULL algorithm implementation so the user gets familiar with the structure immediately.
     - USE: 'quiz' (Multiple Choice), 'fill-in' (InputMode: 'select'), 'flipcard'.
     - **Parsons:** Generally reserved for Phase 1, BUT allowed in Screens 16-17 if the user has practiced enough.
     - **FORBIDDEN:** 'code-editor', 'fill-in' (InputMode: 'type'). 
   - **Phase 1 (Basics):** 
     - **CORE:** Use 'parsons' (Logic Sorting) heavily here (Screens 5-10).
     - USE: 'fill-in' (InputMode: 'select').
     - **FORBIDDEN:** 'code-editor', 'fill-in' (InputMode: 'type').
   - **Phase 2 (Code):** 
     - Introduce 'fill-in' (InputMode: 'type') sparingly.
   - **Phase 3+ (Optimize/Boss):** 
     - You may use 'code-editor' and 'type' mode.

3. **VISUAL AIDS:**
   - Use 'callout' (variant: 'tip' or 'info') liberally to act as "Cheat Sheets" or "Memory Cards" before a question.
   - E.g., "Tip: In Python, use \`len(arr)\` to get length." -> THEN ask a question about length.

4. **CONTENT RULES:**
   - **EXACTLY 17 SCREENS.**
   - **PARSONS:** Min 5 lines. 
   - **PARSONS FORMATTING:** For languages with curly braces (Java, C++, C, JS), do NOT create separate lines for opening or closing braces. Attach them to the statement line (e.g., "if (x) {" or "} else {"). This prevents single-character sorting items.
   - **CODE:** Valid ${prefs.targetLanguage} only. No pseudo-code in code blocks.
   - **NO MARKDOWN** in dialogue/callouts.
`;

const sanitizePlan = (plan: LessonPlan): LessonPlan => {
    const validScreens = plan.screens.filter(screen => {
        if (!screen.widgets || screen.widgets.length === 0) return false;
        
        // Check for broken specific widgets
        const hasBrokenWidgets = screen.widgets.some(w => {
            if (w.type === 'flipcard' && (!w.flipcard || !w.flipcard.front)) return true;
            if (w.type === 'quiz' && (!w.quiz || !w.quiz.options || w.quiz.options.length < 2 || !w.quiz.question)) return true;
            if (w.type === 'dialogue' && (!w.dialogue || !w.dialogue.text)) return true;
            if (w.type === 'callout' && (!w.callout || !w.callout.text)) return true;
            return false;
        });
        if (hasBrokenWidgets) return false;

        // Fix: Check for Fill-in widgets missing options
        screen.widgets.forEach(w => {
            if (w.type === 'fill-in' && w.fillIn) {
                // Logic: If options provided, force select. If no options, allow type.
                // But per user request, we prefer select.
                if (!w.fillIn.options || w.fillIn.options.length === 0) {
                    w.fillIn.inputMode = 'type';
                    w.fillIn.options = []; 
                } else {
                    w.fillIn.inputMode = 'select'; // Enforce select if options exist
                }
            }
        });

        const interactive = screen.widgets.find(w => ['quiz', 'parsons', 'fill-in', 'steps-list'].includes(w.type));
        if (interactive) {
            if (interactive.type === 'fill-in' && interactive.fillIn) {
                if (!interactive.fillIn.code) return false;
            }
            if (interactive.type === 'steps-list' && interactive.stepsList?.mode === 'interactive' && !interactive.stepsList.correctOrder) return false;
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
        phaseName: previousNodeIndex === 0 ? "Concept (Intro)" : previousNodeIndex === 1 ? "Basics" : "Previous",
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

    async generate(systemPrompt: string, userPrompt: string, schema?: Schema): Promise<string> {
        const provider = this.config.provider;

        if (provider === 'gemini-official') {
            const ai = new GoogleGenAI({ apiKey: this.getGeminiKey() });
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
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
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
            return data.choices?.[0]?.message?.content || "{}";
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
  savedLessons: SavedLesson[] = []
): Promise<LessonPlan> => {
  const client = new LLMClient(prefs.apiConfig);
  const prevReport = getPreviousPhaseReport(savedLessons, mistakesHistory, nodeIndex, problemName);
  
  // NODE 0: CONCEPT (NO HANDWRITING)
  const blueprintNode0 = `
  **PHASE 0: CONCEPT (17 Screens)**
  1-3: Analogy (Real world).
  4: **Interactive Code** (Full Algorithm Preview - Explain line by line).
  5-10: Logic Quiz (Multiple Choice Only).
  11-15: Flipcards (Syntax Rules) & Simple Fill-in (Select Mode).
  16-17: Parsons Problem (Simple Logic Sort) OR Fill-in (Select).
  `;

  // NODE 1: BASICS (NO HANDWRITING)
  const blueprintNode1 = `
  **PHASE 1: BASICS (17 Screens)**
  CONTEXT: User finished Phase 0.
  1: Dialogue (Review).
  2-4: Flipcards (Assessment Mode - Syntax Drill).
  5-10: Parsons Problems (Logic ordering - Critical for this phase).
  11-17: Fill-in-the-blanks (InputMode: 'select' ONLY. Provide options for every blank).
  `;

  // NODE 2: CODE (INTRO HANDWRITING SPARINGLY)
  const blueprintNode2 = `
  **PHASE 2: IMPLEMENTATION (17 Screens)**
  1: Dialogue.
  2-8: Fill-in (InputMode: 'select').
  9-14: Parsons Problems (Complex).
  15-17: Advanced Fill-in (InputMode: 'type' allowed for final test) OR Code Editor (Only for final).
  `;
  
  // NODE 3: OPTIMIZE
  const blueprintNode3 = `
  **PHASE 3: OPTIMIZATION (17 Screens)**
  Focus on Time/Space complexity.
  Code Editor allowed.
  `;

  let selectedBlueprint = blueprintNode0;
  if (nodeIndex === 1) selectedBlueprint = blueprintNode1;
  if (nodeIndex === 2) selectedBlueprint = blueprintNode2;
  if (nodeIndex >= 3) selectedBlueprint = blueprintNode3;

  const prompt = `
  Generate a lesson plan for: ${problemName} (Node Index: ${nodeIndex}).
  ${selectedBlueprint}
  ${prevReport ? `REPORT: ${prevReport.mistakeCount} mistakes in previous phase.` : ""}
  
  CRITICAL: Ensure every 'fill-in' or 'code-editor' is preceded by a 'callout' or 'flipcard' that explains the exact syntax needed.
  Output JSON only.
  `;

  try {
    const text = await client.generate(getSystemPrompt(prefs), prompt, lessonPlanSchema);
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
  topics: string[] = []
): Promise<LessonPlan> => {
  const client = new LLMClient(prefs.apiConfig);
  
  const hasMistakes = mistakes.length > 0;
  const focusTopics = hasMistakes ? mistakes.slice(0, 10).map(m => m.context).join(', ') : topics.slice(0, 5).join(', ');

  const prompt = `
  Task: Create a **17-Screen Global Review Session**.
  
  **TARGET TOPICS:** ${focusTopics || "General Algorithms"}
  
  **INSTRUCTIONS:**
  - Focus on Scaffolding.
  - Structure:
    1-5: Flipcards (Memory recall)
    6-10: Parsons Problems (Logic)
    11-15: Fill-in-the-blanks (InputMode: 'select' - Provide Options)
    16-17: Challenge (InputMode: 'type' allowed here).
  `;

  try {
    const text = await client.generate(getSystemPrompt(prefs), prompt, lessonPlanSchema);
    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
    return sanitizePlan(JSON.parse(cleanText) as LessonPlan);
  } catch (error) {
    return createFallbackPlan(prefs);
  }
};

export const generateSyntaxClinicPlan = async (
    prefs: UserPreferences
): Promise<LessonPlan> => {
    const client = new LLMClient(prefs.apiConfig);
    
    const prompt = `
    Task: Create a **17-Screen Syntax Clinic** specifically for **${prefs.targetLanguage}**.
    
    **GOAL:** Drill specific syntax (e.g. List Comprehensions, Iterators).
    
    **STRUCTURE:**
    1: Dialogue.
    2-8: Flipcards & Callouts (Teach the syntax explicitly).
    9-14: Quiz & Fill-in (Mode: 'select').
    15-17: Fill-in (Mode: 'type' - Final check).
    `;

    try {
        const text = await client.generate(getSystemPrompt(prefs), prompt, lessonPlanSchema);
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