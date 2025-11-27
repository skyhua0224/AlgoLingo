
import { BASE_SYSTEM_INSTRUCTION } from "./system";

export const getRegenerateScreenPrompt = (
    originalHeader: string,
    context: any,
    userInstruction: string,
    lang: string,
    targetLang: string
) => {
    // Robustly determine topic from context
    // Fallback to checking multiple property names to ensure we catch the topic
    const topic = context?.topic || context?.companyName || context?.title || "General Programming";
    const specificContext = context?.stageTitle ? `Stage: ${context.stageTitle}` : "";
    
    // Dump the full context object to help the AI if keys vary
    const contextDump = JSON.stringify(context || {});

    return `
    ${BASE_SYSTEM_INSTRUCTION}
    
    TASK: REGENERATE A SINGLE LESSON SCREEN
    
    **CURRENT CONTEXT (CRITICAL)**:
    - **MAIN TOPIC**: "${topic}"
    - Sub-Context: ${specificContext}
    - Target Language: ${targetLang}
    - User Language: ${lang}
    - Original Header: "${originalHeader}"
    - Full Context Data: ${contextDump}
    
    **USER INSTRUCTION**: 
    "${userInstruction || "Generate a harder variation of this screen."}"

    **CRITICAL ANTI-HALLUCINATION RULES**:
    1. **STAY ON TOPIC**: If the MAIN TOPIC is specific (e.g. "OpenGL", "Kafka", "React"), you MUST generate content about that topic. Do NOT generate generic questions like "Bubble Sort", "Sum List", or "Two Sum" unless they are directly relevant.
    2. **WIDGETS**: You MUST use a DIFFERENT widget type than the original if possible (e.g., if original was 'quiz', try 'fill-in' or 'parsons').
    3. **DATA**: Ensure code snippets are valid ${targetLang}.

    OUTPUT:
    - A single valid 'LessonScreen' object (JSON).
    - Structure: { "id": "regen_...", "header": "...", "widgets": [...] }
    - Must follow STRICT SCREEN COMPOSITION PROTOCOL.
    `;
};
