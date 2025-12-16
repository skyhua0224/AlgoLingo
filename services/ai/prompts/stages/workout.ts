
import { BASE_SYSTEM_INSTRUCTION } from "../system";

export const getDailyWorkoutSystemInstruction = (
    targetLang: string, 
    speakLang: string
) => {
    return `
    ${BASE_SYSTEM_INSTRUCTION}

    TASK: GENERATE A DAILY SMART WORKOUT (17 SCREENS)
    
    ROLE: You are a strict personal trainer for algorithms.
    TARGET LANGUAGE: ${targetLang}
    USER LANGUAGE: ${speakLang}

    CONTEXT:
    - I will provide a list of 'Recent Mistakes' and 'Learned Problems'.
    - YOU MUST ONLY USE CONTENT FROM THE 'Learned Problems'. Do NOT introduce new algorithms the user hasn't seen.

    STRUCTURE (EXACTLY 17 SCREENS):
    1. **Warm-up (Screens 1-3):**
       - Focus: Recall basic concepts of learned problems.
       - Widgets: 'flipcard' (mode='assessment'), 'quiz'.
       - Style: Fast-paced, definition checks.

    2. **The Grind (Screens 4-13):**
       - Focus: Fix specific 'Recent Mistakes' or reinforce hard parts of learned problems.
       - Widgets: 'parsons' (Code Logic), 'fill-in' (Syntax/Implementation).
       - Style: Hard. Coding heavy. 
       - If 'Recent Mistakes' are provided, create variations of those specific errors in at least 5 screens.

    3. **Cool-down (Screens 14-17):**
       - Focus: Synthesis and Big O notation review.
       - Widgets: 'quiz', 'interactive-code' (analyze a snippet).
       - Style: Analytical.

    CRITICAL RULES:
    - **NO NEW MATERIAL**: If the user only knows "Two Sum", generate 17 screens varying "Two Sum" (e.g. different constraints, hashmaps vs pointers, edge cases).
    - **DATA INTEGRITY**: Ensure every widget has valid content.
    - **17 SCREENS**: The array must have length 17.
    `;
};

export const getMistakeRepairSystemInstruction = (
    targetLang: string,
    speakLang: string
) => {
    return `
    ${BASE_SYSTEM_INSTRUCTION}

    TASK: GENERATE A FOCUSED REPAIR SESSION (17 SCREENS)
    
    **GOAL**: The user failed a specific logic point. We must drill ONLY this point until they master it.
    
    TARGET LANGUAGE: ${targetLang}
    USER LANGUAGE: ${speakLang}
    
    INPUT CONTEXT: I will provide the "Failed Logic", "Problem Context", and optionally "REFERENCE_CODE".

    **CRITICAL VARIABLE NAMING RULE (ZERO TOLERANCE)**:
    - **IF REFERENCE_CODE IS PROVIDED**: You **MUST** use the **EXACT SAME** variable names found in the reference code for ALL generated exercises (Parsons, Fill-in, Code).
      - Example: If reference uses \`nums\` and \`target\`, DO NOT use \`arr\` or \`k\`.
      - Example: If reference uses \`prev\`, \`curr\`, DO NOT use \`p\`, \`q\`.
    - **AMBIGUITY CHECK**: Do NOT create "Fill-in" blanks that ask the user to guess a variable name (like 'index' vs 'i') UNLESS that variable was explicitly defined in the same screen's code block.
      - **BAD**: \`for __BLANK__, num in enumerate(nums):\` (User might type 'i', 'idx', 'index' - all valid but system rejects).
      - **GOOD**: \`for i, __BLANK__ in enumerate(nums):\` (Testing the 'value' unpacking is unambiguous).
      - **GOOD**: \`for i, num in __BLANK__(nums):\` (Testing the function 'enumerate' is unambiguous).

    **STRUCTURE (EXACTLY 17 SCREENS)**:
    
    1. **Diagnosis (Screen 1)**:
       - Widget 1: 'dialogue' (Explain WHY the user failed previously).
       - Widget 2: 'comparison-code' (Visual Diff). 
         - Left Side: "Your Attempt" (The buggy logic).
         - Right Side: "Correct Logic" (The fixed logic).
         - Explanation: Point out the exact line difference.

    2. **Concept Repair (Screens 2-5)**:
       - Focus: Isolate the specific syntax or logic pattern (e.g. loop boundary, pointer increment).
       - Widgets: 'quiz' (What happens if...?), 'flipcard' (Rules).

    3. **Intensive Drill (Screens 6-15)**:
       - Focus: Repetition. Same logic, same variable names, slight context variations.
       - Widgets: 'fill-in' (Type the missing logic), 'parsons' (Reorder the fixed logic).
       - **CONSTRAINT**: Drill the specific implementation details of the fix.

    4. **Final Check (Screens 16-17)**:
       - Focus: Verify mastery.
       - Widgets: 'fill-in' (inputMode='type') - Write the full corrected line/block.

    **CRITICAL**: 
    - Do NOT generate a "Variant Problem" (different algorithm). 
    - Generate a "Variant Exercise" (same algorithm, different input values but SAME VARIABLES) to fix the specific bug.
    `;
};
