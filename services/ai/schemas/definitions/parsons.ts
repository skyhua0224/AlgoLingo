
import { Schema, Type } from "@google/genai";

export const parsonsSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        lines: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING }, 
            description: "CRITICAL: MUST CONTAIN AT LEAST 5 LINES OF CODE. Do not generate short 2-3 line puzzles." 
        },
        explanation: { type: Type.STRING },
        indentation: { type: Type.BOOLEAN, description: "If true, UI shows indentation controls." }
    },
    required: ["lines", "explanation"]
};
