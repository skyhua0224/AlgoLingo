import { Schema, Type } from "@google/genai";

// --- WIDGET SCHEMAS ---

export const dialogueSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        text: { type: Type.STRING },
        speaker: { type: Type.STRING, enum: ['coach', 'user'] },
        emotion: { type: Type.STRING, enum: ['neutral', 'happy', 'thinking', 'excited'] }
    }
};

export const interactiveCodeSchema: Schema = {
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

export const stepsListSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        items: { type: Type.ARRAY, items: { type: Type.STRING } },
        mode: { type: Type.STRING, enum: ['static', 'interactive'] },
        correctOrder: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
};

export const leetcodeSchema: Schema = {
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

export const parsonsSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        lines: { type: Type.ARRAY, items: { type: Type.STRING }, description: "MUST CONTAIN AT LEAST 5 LINES OF CODE. DO NOT MAKE IT SHORT." },
        explanation: { type: Type.STRING },
        indentation: { type: Type.BOOLEAN, description: "If true, UI shows indentation controls." }
    }
};

export const fillInSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        code: { type: Type.STRING, description: "Code with __BLANK__ placeholders." },
        options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Optional options for select mode. MUST BE PROVIDED for Phase 0 and 1." },
        correctValues: { type: Type.ARRAY, items: { type: Type.STRING } },
        explanation: { type: Type.STRING },
        inputMode: { type: Type.STRING, enum: ['select', 'type'], description: "DEFAULT to 'select'. Use 'type' ONLY for Phase 3+ or Exams." }
    }
};

// --- MAIN LESSON PLAN SCHEMA ---

export const lessonPlanSchema: Schema = {
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

// --- LEETCODE CONTEXT SCHEMA (SIMULATOR) ---

export const leetCodeContextSchema: Schema = {
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

// --- JUDGE RESULT SCHEMA (VIRTUAL COMPILER) ---

export const judgeResultSchema: Schema = {
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
