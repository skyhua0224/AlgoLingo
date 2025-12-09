
import { BASE_SYSTEM_INSTRUCTION } from "./system";

export const getRegenerateScreenPrompt = (
    originalScreen: any,
    context: any,
    userInstruction: string,
    lang: string,
    targetLang: string
) => {
    // Robustly determine topic from context
    const topic = context?.topic || context?.companyName || context?.title || "General Programming";
    const specificContext = context?.stageTitle ? `Stage: ${context.stageTitle}` : "";
    
    // Dump the full context object to help the AI if keys vary
    const contextDump = JSON.stringify(context || {});
    const originalJson = JSON.stringify(originalScreen || {});

    const isDefaultFix = !userInstruction || userInstruction.trim() === "";

    return `
    ${BASE_SYSTEM_INSTRUCTION}
    
    TASK: REGENERATE A SINGLE LESSON SCREEN
    
    **CURRENT CONTEXT (CRITICAL)**:
    - **MAIN TOPIC**: "${topic}"
    - Sub-Context: ${specificContext}
    - Target Language: ${targetLang}
    - User Language: ${lang}
    - Original Screen JSON: \`\`\`json\n${originalJson}\n\`\`\`
    
    **USER INSTRUCTION**: 
    "${isDefaultFix ? "Analyze the original screen JSON. Detect logical flaws (e.g. asking for a variable name without context, trivial questions). Regenerate a BETTER version of this screen that is pedagogically sound." : userInstruction}"

    **CRITICAL ANTI-HALLUCINATION RULES**:
    1. **STAY ON TOPIC**: If the MAIN TOPIC is specific (e.g. "OpenGL", "Kafka", "React"), you MUST generate content about that topic.
    2. **WIDGETS**: You may keep the same widget type if fixing a specific error, OR switch types if the original was fundamentally flawed (e.g. 'lonely dialogue').
    3. **DATA**: Ensure code snippets are valid ${targetLang}.
    4. **FILL-IN FIX**: If the original screen asked the user to fill in a variable name (e.g. \`__BLANK__ = {}\`), FIX IT by blanking the value instead (e.g. \`seen = __BLANK__\`).

    OUTPUT:
    - A single valid 'LessonScreen' object (JSON).
    - Structure: { "id": "regen_...", "header": "...", "widgets": [...] }
    - Must follow STRICT SCREEN COMPOSITION PROTOCOL.
    `;
};