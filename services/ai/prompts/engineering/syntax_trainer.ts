
import { BASE_SYSTEM_INSTRUCTION } from "../system";
import { SyntaxProfile, SyntaxUnit, SyntaxLesson } from "../../../../types/engineering";

export const getSyntaxTrainerPrompt = (
    profile: SyntaxProfile, 
    unit: SyntaxUnit, 
    lesson: SyntaxLesson, 
    stageId: string,
    spokenLanguage: string
) => {
    const lang = profile.language;
    const langKey = spokenLanguage === 'Chinese' ? 'zh' : 'en';
    const attr = profile.attributes;

    // --- PHASE CONFIGURATIONS (Matches 6-Stage Model) ---
    const phaseConfig: Record<string, string> = {
        '0': `
        **PHASE 1: CONCEPT INTRO**
        - Goal: Introduce the concept clearly.
        - Widgets: 'dialogue' (Teaching), 'interactive-code' (Demo), 'quiz' (Simple check).
        - Structure: EXACTLY 17 Screens.
        `,
        '1': `
        **PHASE 2: SYNTAX BASICS**
        - Goal: Recognize and read the syntax.
        - Widgets: 'interactive-code' (Line-by-line breakdown), 'quiz' (Predict output).
        - Structure: EXACTLY 17 Screens.
        `,
        '2': `
        **PHASE 3: RECALL DRILL**
        - Goal: Active recall and typing.
        - Widgets: 'fill-in' (mode='select' for first 5, mode='type' for rest).
        - Structure: EXACTLY 17 Screens.
        - **CONSTRAINT**: Do NOT generate trivial variable assignments (e.g. 'x = 1', 'b = True'). Focus on **Logic**, **Loops**, and **Methods**.
        `,
        '3': `
        **PHASE 4: LOGIC BUILD**
        - Goal: Assemble code logic.
        - Widgets: 'parsons' (Code Ordering) is MANDATORY.
        - Structure: EXACTLY 17 Screens.
        `,
        '4': `
        **PHASE 5: DEBUG & REVIEW**
        - Goal: Find errors and edge cases.
        - Widgets: 'quiz' (Spot the bug), 'interactive-code' (Bad code vs Good code).
        - Structure: EXACTLY 17 Screens.
        `,
        '5': `
        **PHASE 6: MASTERY BOSS**
        - Goal: Prove full competence under pressure.
        - Widgets: 'fill-in' (inputMode='type') and 'parsons'.
        - Structure: EXACTLY 17 Screens.
        - Difficulty: High. NO simple initialization questions.
        `,
        'sandbox': `
        **MODE: IDE SIMULATION (SANDBOX)**
        - Goal: Hands-on open coding.
        - Generate EXACTLY 1 SCREEN containing a 'leetcode' widget.
        `
    };

    const specificInstructions = phaseConfig[stageId] || phaseConfig['0'];

    let focusInstruction = "";
    if (attr.handwriting && (stageId === '2' || stageId === '5')) {
        focusInstruction += "- **HANDWRITING**: Use 'fill-in' with inputMode='type'.\n";
    }
    if (profile.origin === 'mapped') {
        focusInstruction += `- **COMPARATIVE**: Contrast ${lang} with ${profile.sourceLanguage}.\n`;
    }

    return `
    ${BASE_SYSTEM_INSTRUCTION}

    **ENGINEERING HUB: SYNTAX TRAINER**
    
    TARGET CODE LANGUAGE: ${lang}
    USER INSTRUCTION LANGUAGE: ${spokenLanguage}
    
    TOPIC: "${lesson.title[langKey]}" (Module: ${unit.title[langKey]})
    PHASE ID: ${stageId}
    
    USER PROFILE:
    - Goal: ${profile.objective}
    
    PEDAGOGY:
    ${focusInstruction}

    GENERATION RULES:
    ${specificInstructions}
    - **LENGTH**: You MUST generate EXACTLY 17 SCREENS (unless 'sandbox' mode which is 1).
    
    **CRITICAL LANGUAGE RULES**:
    1. **CODE**: ALL code snippets, variable names, function names, and syntax MUST remain in standard **ENGLISH**. Do NOT translate code logic.
    2. **INSTRUCTIONS**: All explanations, dialogue, quiz questions, callout text, and comments MUST be in **${spokenLanguage}**.

    **MANDATORY TOP-HINT RULE**:
    - You **MUST** place a 'callout' widget (variant='tip' or 'info') as the **FIRST** widget on **EVERY** screen (including Mastery/Exam phases).
    - **CONTENT PRIORITY**:
      1. **Variable Context**: ONLY if the code uses **ambiguous single-letter variables** (like 'i', 'j', 'n' in loops, or 'x'), you MUST explain what they represent (e.g., "i: row index"). Do **NOT** explain descriptive variables like 'age', 'name', or 'isActive'.
      2. **Strategic Hint**: If variables are clear, provide a brief, high-level hint about the syntax pattern or logic being tested (e.g., "Remember: strings are immutable").
    - **ANTI-SPOILER**: Do NOT reveal the answer key or the exact missing code. The hint should guide the user's thinking, not solve the puzzle.
    - **LANGUAGE**: The hint text MUST be in **${spokenLanguage}**.

    **ANTI-TRIVIA RULE**:
    - Strictly FORBID questions that just ask to assign a literal value (e.g. 'a = True'). 
    - Questions must involve an operation, a method call, a control structure, or a type conversion.

    OUTPUT FORMAT: JSON matching LessonPlan schema.
    `;
};
