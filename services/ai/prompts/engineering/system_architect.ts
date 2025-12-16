
import { BASE_SYSTEM_INSTRUCTION } from "../system";

// Map phases to widget strategies (8-Phase Mastery Model)
// UPDATED: Focus on General Software Architecture (Patterns, API, Quality)
// NEW RULE: Strict Widget Progression to ensure variety and difficulty scaling.
const PHASE_STRATEGIES: Record<string, string> = {
    'phase_01': `
    **PHASE 01: THE PROBLEM & ANALOGY (Why do we need this?)**
    - **GOAL**: Explain the core software problem (e.g. "Tight Coupling", "Unclear Contracts").
    - **WIDGETS ALLOWED**: 'dialogue' (Scenario), 'flipcard' (Concept), 'quiz' (Simple Check).
    - **FORBIDDEN**: 'parsons', 'mini-editor', 'terminal'.
    - **STYLE**: "Imagine a restaurant where the waiter cooks the food..." (Single Responsibility Principle).
    `,
    'phase_02': `
    **PHASE 02: DEFINITION & STRUCTURE (The Pattern)**
    - **GOAL**: Define the pattern/principle formally.
    - **WIDGETS ALLOWED**: 'flipcard' (Diagram/UML), 'interactive-code' (Standard boilerplate), 'quiz'.
    - **FOCUS**: Class structure, JSON schema, Protocol definition.
    `,
    'phase_03': `
    **PHASE 03: IMPLEMENTATION (Writing Code)**
    - **GOAL**: How do we implement this in code?
    - **WIDGETS ALLOWED**: 'steps-list' (Refactoring steps), 'fill-in' (Code completion), 'parsons' (Assemble logic).
    - **FOCUS**: Implementing the pattern, Writing the API handler.
    `,
    'phase_04': `
    **PHASE 04: TRADE-OFFS & ANTI-PATTERNS**
    - **GOAL**: When NOT to use it? What goes wrong?
    - **WIDGETS ALLOWED**: 'quiz' (Scenario choice), 'callout' (Warning), 'interactive-code' (Bad code example).
    - **FOCUS**: Over-engineering, N+1 problem, Security holes.
    `,
    'phase_05': `
    **PHASE 05: REAL WORLD SCENARIO (The Deep Dive)**
    - **GOAL**: Apply to a concrete business case.
    - **WIDGETS MANDATORY**: You MUST use 'code-walkthrough' OR 'mini-editor' at least once.
    - **WIDGETS ALLOWED**: 'fill-in' (Business logic), 'code-walkthrough' (Deep Code Review), 'mini-editor'.
    - **FOCUS**: "Design a User Service", "Refactor this legacy Payment module".
    `,
    'phase_06': `
    **PHASE 06: TESTING & VERIFICATION**
    - **GOAL**: How to ensure it works?
    - **WIDGETS MANDATORY**: You MUST use 'terminal' to simulate running tests or CLI tools.
    - **WIDGETS ALLOWED**: 'terminal' (Run tests/curl), 'interactive-code' (Unit tests), 'quiz'.
    - **FOCUS**: Mocking, Boundary testing, Security checks.
    `,
    'phase_07': `
    **PHASE 07: OPTIMIZATION & SCALE**
    - **GOAL**: Making it faster or cleaner.
    - **WIDGETS ALLOWED**: 'quiz' (Optimization choice), 'parsons' (Refactoring flow), 'comparison-table' (Trade-offs).
    - **FOCUS**: Caching, Lazy loading, Code splitting.
    `,
    'phase_08': `
    **PHASE 08: THE ARCHITECT'S CHALLENGE (Mastery)**
    - **GOAL**: Complete synthesis.
    - **WIDGETS MANDATORY**: You MUST use 'mini-editor'.
    - **FORBIDDEN**: 'dialogue' (No hand-holding), simple 'quiz'.
    - **FOCUS**: High difficulty. Design a full module or refactor a broken system.
    `
};

export const getSystemArchitectPrompt = (topic: string, keywords: string[], level: string, extraContext?: string) => {
    
    // Fallback logic: If level is not a specific phase ID, use regex to find "phase_X" or map standard levels
    let instruction = PHASE_STRATEGIES['phase_01'];
    let phaseId = 'phase_01';
    
    if (PHASE_STRATEGIES[level]) {
        instruction = PHASE_STRATEGIES[level];
        phaseId = level;
    } else if (level.includes('phase_')) {
        const match = level.match(/phase_\d+/);
        if (match && PHASE_STRATEGIES[match[0]]) {
            instruction = PHASE_STRATEGIES[match[0]];
            phaseId = match[0];
        }
    } else {
        // Fallback mapping for older data
        if (level.includes('Mastery')) { instruction = PHASE_STRATEGIES['phase_08']; phaseId='phase_08'; }
        else if (level.includes('Design')) { instruction = PHASE_STRATEGIES['phase_05']; phaseId='phase_05'; }
        else if (level.includes('Debug')) { instruction = PHASE_STRATEGIES['phase_06']; phaseId='phase_06'; }
        else if (level.includes('Code')) { instruction = PHASE_STRATEGIES['phase_03']; phaseId='phase_03'; }
    }

    return `
    ${BASE_SYSTEM_INSTRUCTION}

    **ROLE**: Principal Software Architect.
    **TOPIC**: "${topic}" (Software Engineering & Architecture)
    **CONTEXT**: ${extraContext || topic}
    **KEYWORDS**: ${keywords.join(', ')}.
    **CURRENT PHASE**: ${phaseId}

    **GOAL**: Teach software engineering principles. Focus on Code Quality, Modularity, and Robustness.

    **PHASE INSTRUCTION (STRICTLY FOLLOW WIDGET RULES)**:
    ${instruction}

    **SCREEN COMPOSITION RULES (CRITICAL)**:
    1. **MANDATORY INTERACTION**: Every single screen MUST contain EXACTLY ONE interactive widget.
    2. **WIDGET VARIETY**: 
       - If Phase >= 05, do NOT use simple 'quiz' for more than 1 screen. Use 'fill-in', 'code-walkthrough', 'mini-editor', or 'terminal'.
       - If Phase >= 08, usage of 'mini-editor' is REQUIRED.

    **WIDGET REQUIREMENTS**:
    - Generate EXACTLY 17 Screens.
    - Ensure "Code" examples are clean, modern, and idiomatic.
    `;
};
