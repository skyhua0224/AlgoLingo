
import { BASE_SYSTEM_INSTRUCTION } from "../system";

// Map phases to widget strategies (8-Phase Mastery Model)
// UPDATED: Focus on General Software Architecture (Patterns, API, Quality)
const PHASE_STRATEGIES: Record<string, string> = {
    'phase_01': `
    **PHASE 01: THE PROBLEM & ANALOGY (Why do we need this?)**
    - **GOAL**: Explain the core software problem (e.g. "Tight Coupling", "Unclear Contracts").
    - **WIDGETS ALLOWED**: 'dialogue' (Scenario), 'flipcard' (Concept), 'quiz'.
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
    **PHASE 05: REAL WORLD SCENARIO**
    - **GOAL**: Apply to a concrete business case.
    - **WIDGETS ALLOWED**: 'fill-in' (Business logic), 'terminal' (API Calls), 'mini-editor'.
    - **FOCUS**: "Design a User Service", "Refactor this legacy Payment module".
    `,
    'phase_06': `
    **PHASE 06: TESTING & VERIFICATION**
    - **GOAL**: How to ensure it works?
    - **WIDGETS ALLOWED**: 'fill-in' (Test cases), 'interactive-code' (Unit tests), 'quiz'.
    - **FOCUS**: Mocking, Boundary testing, Security checks.
    `,
    'phase_07': `
    **PHASE 07: OPTIMIZATION & SCALE**
    - **GOAL**: Making it faster or cleaner.
    - **WIDGETS ALLOWED**: 'quiz' (Optimization choice), 'parsons' (Refactoring flow).
    - **FOCUS**: Caching, Lazy loading, Code splitting.
    `,
    'phase_08': `
    **PHASE 08: THE ARCHITECT'S CHALLENGE (Mastery)**
    - **GOAL**: Complete synthesis.
    - **WIDGETS ALLOWED**: 'arch-canvas' (Design a module), 'mini-editor' (Full implementation).
    - **FOCUS**: High difficulty. Zero hand-holding.
    `
};

export const getSystemArchitectPrompt = (topic: string, keywords: string[], level: string, extraContext?: string) => {
    
    const instruction = PHASE_STRATEGIES[level] || PHASE_STRATEGIES['phase_01'];

    return `
    ${BASE_SYSTEM_INSTRUCTION}

    **ROLE**: Principal Software Architect.
    **TOPIC**: "${topic}" (Software Engineering & Architecture)
    **CONTEXT**: ${extraContext || topic}
    **KEYWORDS**: ${keywords.join(', ')}.

    **GOAL**: Teach universal software engineering principles applicable to ANY stack (Frontend, Backend, Mobile, etc.). Do NOT focus solely on distributed systems unless explicitly asked. Focus on Code Quality, Modularity, APIs, and Robustness.

    **PHASE INSTRUCTION (STRICTLY FOLLOW WIDGET RULES)**:
    ${instruction}

    **SCREEN COMPOSITION RULES (CRITICAL)**:
    1. **COMBINE CONTEXT & ACTION**: Do NOT split "Teaching" and "Testing" into separate screens.
    2. **MANDATORY INTERACTION**: Every single screen MUST contain EXACTLY ONE interactive widget from the ALLOWED list for this phase.
    3. **STRUCTURE**: 
       - Start with 'dialogue' (The Architect speaking) or 'callout' (Context).
       - Follow immediately with the interactive widget.

    **WIDGET REQUIREMENTS**:
    - Generate EXACTLY 17 Screens.
    - Ensure "Code" examples are clean, modern, and idiomatic.
    `;
};
