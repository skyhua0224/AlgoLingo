
export const MASTERY_STAGE_PROMPT = `
STAGE 6: MASTERY CHALLENGE
- Goal: Prove full competence.
- STRUCTURE: Generate 16-18 Screens.
- **WIDGET MIX**:
    - **Primary**: 'quiz' and 'fill-in' (inputMode='type').
    - **Secondary**: 'parsons' (Keep to max 3-4 screens total).
    - **Context**: You MAY use 'callout' widgets to provide variable definitions or scenario context before a question.
- **CONTEXT RULE**: If a question asks about a variable (e.g. 'what is x?'), ensure 'x' was defined in a preceding 'callout' or 'interactive-code' on the SAME screen. Do NOT ask about undefined state.
- **NO REPETITION**: Do not generate duplicate logic puzzles. Each screen must test a slightly different angle (edge case, optimization, syntax variation).
- PROHIBITED: 'leetcode', long 'dialogue' sequences.
- Focus: High difficulty, minimal hand-holding.
`;
