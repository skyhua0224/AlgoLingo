
import { BASE_SYSTEM_INSTRUCTION } from "./system";
import { INTRO_STAGE_PROMPT } from "./stages/intro";
import { BASIC_STAGE_PROMPT } from "./stages/basic";
import { REVIEW_STAGE_PROMPT } from "./stages/review";
import { CODING_STAGE_PROMPT } from "./stages/coding";
import { MASTERY_STAGE_PROMPT } from "./stages/mastery";
import { LEETCODE_STAGE_PROMPT } from "./stages/leetcode";

const langRules: Record<string, string> = {
    Python: "Use Pythonic syntax (list comprehensions, snake_case). Standard library only.",
    Java: "Use standard Java conventions. For snippets, assume context inside a method or class. Use camelCase.",
    "C++": "Use modern C++ features (auto, vectors, STL).",
    JavaScript: "Use ES6+ syntax (const, let, arrow functions).",
    Go: "Use idiomatic Go. Short variable names where appropriate.",
    C: "Use standard C99. Manual memory management focus where relevant."
};

export const getLessonPlanSystemInstruction = (
    problemName: string, 
    targetLang: string, 
    speakLang: string,
    phaseIndex: number
) => {
    const targetRule = langRules[targetLang] || "Use standard syntax.";
    
    let stageConfig = "";
    let screenCountInstruction = "You MUST generate EXACTLY 17 SCREENS.";

    switch (phaseIndex) {
        case 0: stageConfig = INTRO_STAGE_PROMPT; break;
        case 1: stageConfig = BASIC_STAGE_PROMPT; break;
        case 2: stageConfig = REVIEW_STAGE_PROMPT; break;
        case 3: stageConfig = CODING_STAGE_PROMPT; break;
        case 4: stageConfig = REVIEW_STAGE_PROMPT; break;
        case 5: stageConfig = MASTERY_STAGE_PROMPT; break;
        case 6: 
            stageConfig = LEETCODE_STAGE_PROMPT; 
            screenCountInstruction = "You MUST generate EXACTLY 1 SCREEN containing the 'leetcode' widget.";
            break;
        default: stageConfig = REVIEW_STAGE_PROMPT;
    }

    return `
    ${BASE_SYSTEM_INSTRUCTION}

    CONTEXT:
    - Problem: "${problemName}"
    - Target Language: ${targetLang}
    - User Language: ${speakLang}

    **CRITICAL PEDAGOGY - OPTIMALITY FIRST**:
    1. **OPTIMAL SOLUTION ONLY**: You MUST focus the teaching and exercises on the *optimal* algorithm (best Time/Space complexity) for "${problemName}".
    2. **NO BRUTE FORCE PRACTICE**: Do NOT generate interactive exercises (Parsons, Fill-in, Code) for brute force or suboptimal approaches.
       - *Allowed*: Briefly mentioning brute force in Stage 1 (Concept) purely for contrast.
       - *Forbidden*: Asking the user to implement, sort, or fill in a brute force solution.
    3. **EXAMPLE**: For "Two Sum", teach the **Hash Map** approach (O(n)). Do NOT teach or test the nested loop approach (O(n^2)).
    
    STRICT CODE RULES:
    - **${targetRule}**
    - Ensure all code snippets are syntactically correct for ${targetLang}.
    - For Parsons problems, ensure lines are logical and can be ordered correctly. Indentation is important for Python.
    - **CONSISTENCY**: Use the EXACT SAME variable names (e.g., 'nums', 'target'), coding style, and logic baseline across all widgets. Do not switch naming conventions or logic styles midway.
    - **NO PEDANTIC CHECKS**: Do NOT test for function signatures, parameter type hints, or strict naming conventions in quizzes/fill-ins unless it is the core concept being taught. Focus on the algorithm logic and steps.
    
    STRICT LESSON STRUCTURE RULES:
    1. **TOTAL SCREENS**: ${screenCountInstruction}
    2. **ONE INTERACTION PER SCREEN**: A screen can have decorative widgets (dialogue, callout, code-display), but it MUST have EXACTLY ONE "Interactive Widget".
       - Interactive Widgets are: 'quiz', 'flipcard' (mode='assessment'), 'parsons', 'fill-in', 'leetcode', 'steps-list' (mode='interactive').
       - NEVER put two interactive widgets on the same screen.
    3. **DATA VALIDITY**: Do not generate widgets with empty content. E.g. A dialogue widget MUST have text.
    
    STAGE CONFIGURATION (Follow this STRICTLY):
    ${stageConfig}

    WIDGET RULES:
    - 'flipcard': 
        - mode='learn': Simple front/back. Used in Stage 1.
        - mode='assessment': Has "Forgot/Got it" buttons. ONLY allowed Stage 2+.
    - 'fill-in':
        - inputMode='select': Select from options. Stage 1+.
        - inputMode='type': User types answer. ONLY allowed Stage 3+.
    - 'parsons': 
        - ONLY allowed Stage 2+.
        - Set 'indentation': true for Python or if code nesting is complex.
    - 'leetcode': ONLY allowed in Phase 7 (Index 6).

    CONTENT STYLE:
    - Tone: Encouraging, professional, slightly gamified (Duolingo style).
    - Language: Explanations in ${speakLang}. Code in ${targetLang}.
  `;
};

export const getVariantSystemInstruction = (
    targetLang: string, 
    speakLang: string
) => {
    return `
    ${BASE_SYSTEM_INSTRUCTION}
    
    TASK: GENERATE A VARIANT LESSON SCREEN
    - You will receive a JSON representing a widget the user failed.
    - Your goal is to create a **single-screen lesson plan** containing a **VARIATION** of that specific problem.
    - The variation must test the **same underlying logic** but with different values, context, or variable names.
    - Example: If original was "Two Sum", variant could be "Find two numbers summing to target in a list of prices".
    - Example: If original was a Parsons puzzle about a 'for' loop, generate a similar 'for' loop puzzle with different iterator names.
    
    TARGET LANGUAGE: ${targetLang}
    USER LANGUAGE: ${speakLang}

    OUTPUT RULES:
    - Generate a valid 'LessonPlan' with exactly 1 screen.
    - The screen MUST contain the variant interactive widget.
    - You may add a short 'callout' before the interactive widget to explain the variation context.
    `;
};

export { getLeetCodeContextSystemInstruction } from "./stages/leetcode";
export { getJudgeSystemInstruction } from "./judge";
export { getDailyWorkoutSystemInstruction } from "./stages/workout";
