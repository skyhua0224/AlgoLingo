
import { Schema, Type } from "@google/genai";

export const fillInSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        code: { type: Type.STRING, description: "Code with __BLANK__ placeholders." },
        options: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING }, 
            description: "REQUIRED: Options for select mode. Must be provided for Phase 0 and 1." 
        },
        correctValues: { type: Type.ARRAY, items: { type: Type.STRING } },
        explanation: { type: Type.STRING },
        inputMode: { 
            type: Type.STRING, 
            enum: ['select', 'type'], 
            description: "DEFAULT to 'select'. Use 'type' ONLY for Phase 3+ or Exams." 
        }
    },
    required: ["code", "correctValues", "explanation"]
};
