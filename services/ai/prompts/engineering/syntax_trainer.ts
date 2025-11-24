
import { BASE_SYSTEM_INSTRUCTION } from "../system";
import { SyntaxProfile, SyntaxUnit, SyntaxLesson } from "../../../../types/engineering";

export const getSyntaxTrainerPrompt = (profile: SyntaxProfile, unit: SyntaxUnit, lesson: SyntaxLesson, stageId: string) => {
    const lang = profile.language;
    const langKey = 'en'; 
    const attr = profile.attributes;

    // --- PHASE CONFIGURATIONS (Matches 6-Stage Model) ---
    const phaseConfig: Record<string, string> = {
        '0': `
        **PHASE 1: CONCEPT INTRO**
        - Goal: Introduce the concept clearly. NO complex code yet.
        - Widgets: 'dialogue' (Teaching), 'interactive-code' (Demo), 'quiz' (Simple check).
        - Structure: EXACTLY 17 Screens. Start slow, ramp up.
        - REQUIRED: Start with a 'dialogue' or 'callout' explaining the concept.
        `,
        '1': `
        **PHASE 2: SYNTAX BASICS**
        - Goal: Recognize and read the syntax.
        - Widgets: 'interactive-code' (Line-by-line breakdown), 'quiz' (Predict output).
        - Structure: EXACTLY 17 Screens.
        - Focus: Anatomy of the syntax.
        `,
        '2': `
        **PHASE 3: RECALL DRILL**
        - Goal: Active recall and typing.
        - Widgets: 'fill-in' (mode='select' for first 5, mode='type' for rest).
        - Structure: EXACTLY 17 Screens.
        - Focus: Muscle memory.
        `,
        '3': `
        **PHASE 4: LOGIC BUILD**
        - Goal: Assemble code logic.
        - Widgets: 'parsons' (Code Ordering) is MANDATORY.
        - Structure: EXACTLY 17 Screens.
        - Focus: Control flow and structure.
        `,
        '4': `
        **PHASE 5: DEBUG & REVIEW**
        - Goal: Find errors and edge cases.
        - Widgets: 'quiz' (Spot the bug), 'interactive-code' (Bad code vs Good code).
        - Structure: EXACTLY 17 Screens.
        - Focus: Common pitfalls.
        `,
        '5': `
        **PHASE 6: MASTERY BOSS**
        - Goal: Prove competence.
        - Widgets: High ratio of 'quiz' and 'fill-in' (type). Reduced 'parsons'.
        - Allow 'callout' for context (variable definitions) before questions.
        - NO REPETITION of questions.
        - Structure: EXACTLY 17 Screens.
        - Difficulty: High.
        `,
        'sandbox': `
        **MODE: IDE SIMULATION (SANDBOX)**
        - Goal: Hands-on open coding.
        - Generate EXACTLY 1 SCREEN containing a 'leetcode' widget.
        - Config: problemSlug="${lesson.id}-sandbox", concept={front:"${unit.title[langKey]}", back:"Build it."}.
        `
    };

    const specificInstructions = phaseConfig[stageId] || phaseConfig['0'];

    // --- DYNAMIC PEDAGOGY SETTINGS ---
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
    
    TARGET LANGUAGE: ${lang}
    TOPIC: "${lesson.title[langKey]}" (Module: ${unit.title[langKey]})
    PHASE ID: ${stageId}
    
    USER PROFILE:
    - Goal: ${profile.objective}
    
    PEDAGOGY:
    ${focusInstruction}

    GENERATION RULES:
    ${specificInstructions}
    - **LENGTH**: You MUST generate EXACTLY 17 SCREENS (unless 'sandbox' mode which is 1). Do NOT generate short lessons. Fill the content with examples, variations, and drills.

    OUTPUT FORMAT: JSON matching LessonPlan schema.
    `;
};
