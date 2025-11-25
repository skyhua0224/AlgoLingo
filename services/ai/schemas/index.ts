
import { Schema, Type } from "@google/genai";
import { parsonsSchema } from "./definitions/parsons";
import { fillInSchema } from "./definitions/fillIn";

export const dialogueSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        text: { type: Type.STRING },
        speaker: { type: Type.STRING, enum: ['coach', 'user'] },
        emotion: { type: Type.STRING, enum: ['neutral', 'happy', 'thinking', 'excited'] }
    },
    required: ["text", "speaker"]
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
                    code: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                },
                required: ["code", "explanation"]
            }
        },
        caption: { type: Type.STRING }
    },
    required: ["language", "lines"]
};

export const stepsListSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        items: { type: Type.ARRAY, items: { type: Type.STRING } },
        mode: { type: Type.STRING, enum: ['static', 'interactive'] },
        correctOrder: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["items", "mode"]
};

export const leetcodeSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        problemSlug: { type: Type.STRING },
        concept: {
            type: Type.OBJECT,
            properties: {
                front: { type: Type.STRING },
                back: { type: Type.STRING }
            },
            required: ["front", "back"]
        },
        exampleCode: interactiveCodeSchema
    },
    required: ["problemSlug", "concept", "exampleCode"]
};

// New Schemas
export const terminalSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        initialOutput: { type: Type.STRING },
        command: { type: Type.STRING, description: "Regex string for validation" },
        feedback: { type: Type.STRING, description: "Output on success" },
        hint: { type: Type.STRING }
    },
    required: ["command", "feedback"]
};

export const codeWalkthroughSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        code: { type: Type.STRING },
        language: { type: Type.STRING },
        steps: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    lines: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                    content: { type: Type.STRING }
                },
                required: ["lines", "content"]
            }
        }
    },
    required: ["code", "steps"]
};

export const miniEditorSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        language: { type: Type.STRING },
        startingCode: { type: Type.STRING },
        solutionSnippet: { type: Type.STRING },
        validationRegex: { type: Type.STRING },
        taskDescription: { type: Type.STRING }
    },
    required: ["language", "startingCode", "taskDescription"]
};

export const archCanvasSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        goal: { type: Type.STRING },
        initialComponents: { type: Type.ARRAY, items: { type: Type.STRING } },
        requiredComponents: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["goal", "requiredComponents"]
};

// --- FORGE WIDGETS ---
export const mermaidSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        chart: { type: Type.STRING, description: "Valid mermaid.js syntax string" },
        caption: { type: Type.STRING }
    },
    required: ["chart"]
};

export const visualQuizSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        question: { type: Type.STRING },
        options: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    label: { type: Type.STRING },
                    icon: { type: Type.STRING, description: "Lucide icon name" }
                },
                required: ["id", "label"]
            }
        },
        correctId: { type: Type.STRING },
        explanation: { type: Type.STRING }
    },
    required: ["question", "options", "correctId", "explanation"]
};

export const comparisonTableSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        headers: { type: Type.ARRAY, items: { type: Type.STRING } },
        rows: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    label: { type: Type.STRING },
                    values: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["label", "values"]
            }
        }
    },
    required: ["headers", "rows"]
};

// Root Lesson Plan Schema
export const lessonPlanSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      suggestedQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
      headerImage: { type: Type.STRING, description: "Optional generated image URL" },
      screens: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            header: { type: Type.STRING },
            widgets: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        type: { type: Type.STRING }, // simplified enum for brevity in this file
                        dialogue: dialogueSchema,
                        interactiveCode: interactiveCodeSchema,
                        parsons: parsonsSchema,
                        fillIn: fillInSchema,
                        leetcode: leetcodeSchema,
                        stepsList: stepsListSchema,
                        terminal: terminalSchema,
                        codeWalkthrough: codeWalkthroughSchema,
                        miniEditor: miniEditorSchema,
                        archCanvas: archCanvasSchema,
                        mermaid: mermaidSchema,
                        visualQuiz: visualQuizSchema,
                        comparisonTable: comparisonTableSchema,
                        callout: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                text: { type: Type.STRING },
                                variant: { type: Type.STRING, enum: ['info', 'warning', 'success', 'tip'] }
                            },
                            required: ["title", "text", "variant"]
                        },
                        flipcard: {
                            type: Type.OBJECT,
                            properties: {
                                front: { type: Type.STRING },
                                back: { type: Type.STRING },
                                hint: { type: Type.STRING },
                                mode: { type: Type.STRING, enum: ['learn', 'assessment'] },
                                model3d: { type: Type.STRING }
                            },
                            required: ["front", "back"]
                        },
                        code: {
                            type: Type.OBJECT,
                            properties: {
                                content: { type: Type.STRING },
                                language: { type: Type.STRING },
                                caption: { type: Type.STRING }
                            },
                            required: ["content", "language"]
                        },
                        quiz: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                correctIndex: { type: Type.INTEGER },
                                explanation: { type: Type.STRING }
                            },
                            required: ["question", "options", "correctIndex", "explanation"]
                        }
                    },
                    required: ["id", "type"]
                }
            }
          },
          required: ["id", "widgets"]
        }
      }
    },
    required: ["title", "screens"]
};

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
