
/**
 * This file contains all the prompt engineering logic for generating AlgoLingo lessons.
 * It's the "brain" that instructs the AI on how to structure the educational content.
 */
import { MistakeRecord, UserPreferences } from '../../types';

// Maps phase index (0-5) to specific stage requirements for the AI.
const getStageConfig = (phaseIndex: number, problemName: string): string => {
    switch (phaseIndex) {
        case 0: // Stage 1: Concept Introduction
            return `
            ## STAGE 1: CONCEPT INTRODUCTION (Beginner)
            - **Goal**: Introduce the core concept of "${problemName}" using simple, foundational widgets.
            - **Allowed Interactive Widgets**: 'quiz', 'fill-in' (inputMode='select'), 'flipcard' (mode='learn').
            - **Widget Mix**: 
                - Heavy use of 'dialogue' and 'callout' for teaching.
                - Use 'quiz' for simple knowledge checks.
                - Use 'fill-in' with 'select' mode for basic syntax reinforcement.
            - **PROHIBITED**: 'parsons', 'flipcard' (mode='assessment'), 'fill-in' (inputMode='type'), 'code-editor', 'solution-display'.
            `;
        case 1: // Stage 2: Basics & Reinforcement
            return `
            ## STAGE 2: BASICS & REINFORCEMENT (Intermediate)
            - **Goal**: Strengthen syntax and introduce basic logic flow.
            - **NEW Allowed Interactive Widgets**: 'parsons', 'flipcard' (mode='assessment').
            - **Widget Mix**: 
                - Introduce 'parsons' puzzles for code ordering logic.
                - Introduce 'flipcard' with 'assessment' mode to test memory.
                - Begin to reduce the number of simple 'quiz' questions.
            - **PROHIBITED**: 'fill-in' (inputMode='type'), 'code-editor'.
            `;
        case 2: // Stage 3: Review & Active Recall
            return `
            ## STAGE 3: REVIEW & ACTIVE RECALL (Intermediate II)
            - **Goal**: Deepen memory with active recall by moving from selection to creation.
            - **NEW Allowed Interactive Widgets**: 'fill-in' (inputMode='type').
            - **Widget Mix**:
                - **Primary Focus**: Introduce 'fill-in' with 'type' mode. This simulates writing code from memory.
                - Drastically reduce simple 'quiz' and 'fill-in' (select) widgets.
                - Continue using 'parsons' and 'flipcard' (assessment).
            - **PROHIBITED**: 'code-editor'.
            `;
        case 3: // Stage 4: Advanced Application
            return `
            ## STAGE 4: ADVANCED APPLICATION (Hard)
            - **Goal**: Focus on writing larger chunks of the algorithm and understanding its structure.
            - **Widget Mix**:
                - **Primary Focus**: Heavy use of 'parsons' and 'fill-in' (type) for complex logic.
                - Simple 'quiz' questions should be rare and focus on edge cases or complexity analysis.
            - **PROHIBITED**: 'code-editor'.
            `;
        case 4: // Stage 5: Pre-Mastery Review
            return `
            ## STAGE 5: PRE-MASTERY REVIEW (Hard II)
            - **Goal**: A final, high-difficulty check before the mastery challenge.
            - **Widget Mix**:
                - Use a challenging mix of all available interactive widgets.
                - Focus on tricky edge cases, common bugs, and optimization logic.
            - **PROHIBITED**: 'code-editor'.
            `;
        case 5: // Stage 6: Mastery Challenge
            return `
            ## STAGE 6: MASTERY (Expert)
            - **Goal**: Prove full competence by solving the problem from scratch.
            - **REQUIREMENTS**:
               - **Screens 1-16**: A difficult mix of 'parsons', 'fill-in' (type), and 'flipcard' (assessment). NO 'quiz' or 'fill-in' (select).
               - **Screen 17 (FINAL SCREEN)**: MUST BE widget type 'code-editor'. This is the ONLY screen where 'code-editor' is allowed.
               - The 'code-editor' must present the full problem, simulating a LeetCode environment.
            `;
        default: // For special cases like review sessions
            return `
            ## GENERAL REVIEW SESSION
            - **Goal**: Review past mistakes.
            - **Widget Mix**: All widget types are allowed as needed to effectively review the user's specific mistakes.
            `;
    }
};

interface SystemInstructionParams {
    problemName: string;
    preferences: UserPreferences;
    phaseIndex: number;
    mistakes: MistakeRecord[];
}

// Generates the main system instruction prompt for the Gemini model.
export const getSystemInstruction = (params: SystemInstructionParams): string => {
    const { problemName, preferences, phaseIndex, mistakes } = params;
    const { targetLanguage, spokenLanguage } = preferences;
    const stageConfig = getStageConfig(phaseIndex, problemName);

    return `
    You are an expert AlgoLingo coach, a master of pedagogy. Your task is to generate a structured, 17-screen lesson plan for the algorithm "${problemName}" in ${targetLanguage}. The user speaks ${spokenLanguage}.

    # CORE DIRECTIVES (NON-NEGOTIABLE)

    1.  **TOTAL SCREENS (IRON CLAD RULE)**: You MUST generate EXACTLY 17 screens. No more, no less. This is the most critical requirement.
    2.  **ONE INTERACTION PER SCREEN (IRON CLAD RULE)**: A screen can have multiple decorative widgets ('dialogue', 'callout', 'code'), but it MUST contain EXACTLY ONE interactive widget.
        -   **Interactive Widgets are**: 'quiz', 'parsons', 'fill-in', 'steps-list' (interactive mode), 'flipcard' (assessment mode), 'code-editor'.
        -   **Example**: A screen with a 'dialogue' and a 'quiz' is good. A screen with a 'quiz' and a 'parsons' is a CRITICAL FAILURE.

    # STAGE-SPECIFIC CONTENT PLAN

    Follow the specific configuration for the current stage. This dictates the learning objectives and allowed tools.

    ${stageConfig}

    # WIDGET-SPECIFIC RULES

    -   **'parsons' (Code Ordering)**:
        -   **MINIMUM LENGTH**: The 'lines' array MUST contain at least 5 lines of code.
        -   **NO TRIVIALITY**: Do NOT generate short 2-3 line sorting tasks. They are meaningless. If the code is short, break it down further or include surrounding context lines to make it at least 5 lines.

    -   **'fill-in' (Code Completion)**:
        -   **PURE CODE ONLY**: The 'code' property must contain ONLY valid code syntax with \`__BLANK__\` placeholders.
        -   **NO TEXT**: Do NOT include instructions like "Fill in the blank:" inside the code block. 
        -   **INSTRUCTION STRATEGY**: You MUST use a separate 'dialogue' or 'callout' widget immediately BEFORE the 'fill-in' widget to provide instructions or context.

    -   **'flipcard'**:
        -   mode='learn': For Stage 1. Simple front/back knowledge.
        -   mode='assessment': For Stages 2+. Includes "Forgot/Got It" interaction.
    
    -   **'solution-display' (NEW & IMPORTANT)**:
        -   **PURPOSE**: This widget is for the "View Solution & Explanation" feature.
        -   **REQUIREMENT**: For stages 1 through 5, AFTER any screen that contains a 'parsons' or 'fill-in' puzzle, the VERY NEXT screen should often contain a 'solution-display' widget. This provides immediate feedback.
        -   It is a **DECORATIVE** widget. It can be paired with a 'dialogue' widget from the coach congratulating the user or explaining the solution.

    # CONTENT & STYLE

    -   **Tone**: Encouraging, professional, slightly gamified (like Duolingo).
    -   **Language**: All explanations and dialogue must be in ${spokenLanguage}. All code must be in ${targetLanguage}.
    -   **Mistake Adaptation**: The user has made ${mistakes.length} mistakes recently. If relevant to "${problemName}", subtly incorporate scenarios that test against these past errors.

    # OUTPUT FORMAT

    -   You must output only a valid JSON object that conforms to the provided schema.
    -   Do not wrap the JSON in markdown backticks (\`\`\`json).
    `;
};
