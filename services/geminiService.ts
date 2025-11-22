import { GoogleGenAI, Schema, Type } from "@google/genai";
import { LessonPlan, MistakeRecord, UserPreferences, LessonScreen, Widget, SavedLesson, ApiConfig, LeetCodeContext } from "../types";

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

const leetCodeContextSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        meta: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] },
                slug: { type: Type.STRING }
            }
        },
        problem: {
            type: Type.OBJECT,
            properties: {
                description: { type: Type.STRING, description: "Markdown formatted problem description." },
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
                constraints: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
        },
        starterCode: { type: Type.STRING, description: "Standard template code (e.g. 'class Solution...')" },
        starterCodeMap: {
            type: Type.OBJECT,
            description: "Map of language name to starter code template. MUST include: Python, Java, C++, JavaScript, Go, C.",
            properties: {
                Python: { type: Type.STRING },
                Java: { type: Type.STRING },
                "C++": { type: Type.STRING },
                JavaScript: { type: Type.STRING },
                Go: { type: Type.STRING },
                C: { type: Type.STRING }
            }
        },
        sidebar: {
            type: Type.OBJECT,
            properties: {
                concept: {
                    type: Type.OBJECT,
                    properties: {
                        front: { type: Type.STRING, description: "The name of the core algorithm concept (e.g. 'Sliding Window')." },
                        back: { type: Type.STRING, description: "A concise explanation of why this concept applies to this problem." }
                    }
                },
                codeSolution: interactiveCodeSchema,
                assistantSuggestions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "3 smart follow-up questions the user might ask AI about this code."
                }
            }
        }
    }
};

// Schema for Strict Judge Result
const judgeResultSchema = {
    type: Type.OBJECT,
    properties: {
        status: { type: Type.STRING, enum: ["Accepted", "Wrong Answer", "Compile Error", "Runtime Error", "Time Limit Exceeded"], description: "The overall result of the submission." },
        error_message: { type: Type.STRING, description: "Raw compiler or runtime error message. Null if Accepted/Wrong Answer." },
        total_correct: { type: Type.INTEGER },
        total_testcases: { type: Type.INTEGER },
        test_cases: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    input: { type: Type.STRING },
                    expected: { type: Type.STRING },
                    actual: { type: Type.STRING },
                    passed: { type: Type.BOOLEAN },
                    stdout: { type: Type.STRING, description: "Simulated standard output if print statements were used." }
                }
            }
        },
        stats: {
            type: Type.OBJECT,
            properties: {
                runtime: { type: Type.STRING, description: "e.g. '45 ms'" },
                memory: { type: Type.STRING, description: "e.g. '16.2 MB'" },
                percentile: { type: Type.STRING, description: "e.g. 'Beats 85.4%'" }
            }
        },
        analysis: {
            type: Type.OBJECT,
            properties: {
                pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                cons: { type: Type.ARRAY, items: { type: Type.STRING } },
                timeComplexity: { type: Type.STRING },
                spaceComplexity: { type: Type.STRING }
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
// ... (Rest of phase config remains same, omitted for brevity as it wasn't changed)
const getStageConfig = (phaseIndex: number, problemName: string) => {
    // Re-using existing logic for standard lessons
    switch (phaseIndex) {
        case 0: return `STAGE 1: CONCEPT INTRODUCTION. Widgets: dialogue, flipcard, quiz.`;
        case 1: return `STAGE 2: BASICS. Widgets: flipcard(assessment), parsons.`;
        case 2: return `STAGE 3: REVIEW I. Widgets: fill-in(type).`;
        case 3: return `STAGE 4: CODE. Focus on writing.`;
        case 4: return `STAGE 5: REVIEW II. High difficulty.`;
        case 5: return `STAGE 6: MASTERY. Final Boss.`;
        case 6: return `STAGE 7: LEETCODE. Output one screen with 'leetcode' widget.`;
        default: return "Standard Review";
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
  
  let client: GoogleGenAI;
  if (preferences.apiConfig.provider === 'gemini-custom') {
      client = new GoogleGenAI({ apiKey: preferences.apiConfig.gemini.apiKey || '' });
  } else {
      client = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  const modelId = preferences.apiConfig.gemini.model || 'gemini-2.5-flash';
  const targetLang = preferences.targetLanguage;
  const speakLang = preferences.spokenLanguage;
  
  // Simplified for this snippet, usually calls getStageConfig
  const stageConfig = getStageConfig(phaseIndex, problemName);

  let screenCountInstruction = "You MUST generate EXACTLY 17 SCREENS.";
  if (phaseIndex === 6) screenCountInstruction = "You MUST generate EXACTLY 1 SCREEN containing the 'leetcode' widget.";

  const systemInstruction = `
    You are an elite AlgoLingo coach teaching "${problemName}" in ${targetLang}.
    User speaks ${speakLang}.
    
    STRICT RULES:
    - Use ${targetLang} syntax.
    - Lesson Screens: ${screenCountInstruction}
    - Follow Stage Config: ${stageConfig}
    - One interactive widget per screen.
  `;

  try {
      const response = await client.models.generateContent({
          model: modelId,
          contents: `Generate plan for Phase ${phaseIndex + 1}`,
          config: {
              systemInstruction: systemInstruction,
              responseMimeType: "application/json",
              responseSchema: lessonPlanSchema,
              temperature: 0.4, 
          }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response");
      return JSON.parse(text);

  } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
  }
};

// --- UPDATED: LEETCODE CONTEXT GENERATOR ---
export const generateLeetCodeContext = async (
    problemName: string,
    preferences: UserPreferences
): Promise<LeetCodeContext> => {
    let client: GoogleGenAI;
    if (preferences.apiConfig.provider === 'gemini-custom') {
        client = new GoogleGenAI({ apiKey: preferences.apiConfig.gemini.apiKey || '' });
    } else {
        client = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    }

    const modelId = preferences.apiConfig.gemini.model || 'gemini-2.5-flash';
    
    const systemInstruction = `
        You are the AlgoLingo Simulator Engine.
        Task: Generate a COMPLETE simulation context for the LeetCode problem: "${problemName}".
        
        Output Language for Descriptions: ${preferences.spokenLanguage}.
        Code Language: ${preferences.targetLanguage}.

        REQUIRED DATA:
        1. meta: Title, Difficulty (Easy/Medium/Hard based on real stats), Slug.
        2. problem:
           - description: Full problem text in Markdown.
           - examples: 2-3 examples with input/output/explanation.
           - constraints: List of constraints (e.g. 1 <= nums.length <= 10^5).
        3. starterCode: A valid, idiomatic ${preferences.targetLanguage} starter template (e.g. "class Solution:\n    def twoSum(self, nums, target):").
        4. starterCodeMap: Provide starter templates for: Python, Java, C++, C, JavaScript, Go. The function name/class must be standard LeetCode style.
        5. sidebar: The standard helper content (concept card, solution code, suggestions).
    `;

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

// Keep existing helpers...
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

// --- NEW STRICT VALIDATOR ---
export const validateUserCode = async (code: string, problemDesc: string, preferences: UserPreferences, languageOverride?: string) => {
     let client: GoogleGenAI;
      if (preferences.apiConfig.provider === 'gemini-custom') {
          client = new GoogleGenAI({ apiKey: preferences.apiConfig.gemini.apiKey || '' });
      } else {
          client = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      }

      const targetLang = languageOverride || preferences.targetLanguage;
      const modelId = preferences.apiConfig.gemini.model || 'gemini-2.5-flash';

      const systemInstruction = `
      Act as a VIRTUAL LEETCODE JUDGE ENGINE.
      Target Language: ${targetLang}.
      
      Your Goal: SIMULATE the execution of the user's code against the problem description.
      
      CRITICAL RULES:
      1. **COMPILATION/SYNTAX**: If there is a syntax error, set status="Compile Error" and "error_message" to a REALISTIC error log (like gcc/python interpreter output).
      2. **TEST CASES**: Generate 3 representative test cases (Input, Expected, Actual).
         - Calculate the "Actual" output by mentally running the code.
         - Compare Expected vs Actual. If they mismatch, set passed=false.
      3. **STATUS**:
         - If any syntax error -> "Compile Error".
         - If logic crashes (e.g. index out of bounds) -> "Runtime Error".
         - If O(n^2) used on large constraints -> "Time Limit Exceeded".
         - If output mismatches -> "Wrong Answer".
         - Only if ALL pass -> "Accepted".
      4. **STATS**: Estimate runtime/memory based on complexity (e.g. O(n) is fast, O(n^2) is slow).
      5. **ANALYSIS**: Provide pros/cons and Big O analysis in ${preferences.spokenLanguage}.
      `;

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

export const generateSyntaxClinicPlan = async (preferences: UserPreferences): Promise<LessonPlan> => {
    return generateLessonPlan("Syntax Clinic", 1, preferences); 
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