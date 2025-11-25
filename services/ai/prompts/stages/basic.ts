
export const BASIC_STAGE_PROMPT = `
STAGE 2: BASICS & REINFORCEMENT
- Goal: Review concepts and strengthen syntax.
- NEW Widgets Allowed: 'flipcard' (mode='assessment' - "Forgot/Got it" buttons), 'parsons' (Ordering code).
- Widgets Allowed: All from Stage 1 (including 'interactive-code') + New ones.
- PROHIBITED: 'fill-in' (inputMode='type'), 'leetcode', 'code' (static).
- Structure: Start with 'flipcard' (assessment) to check memory. Use 'parsons' for logic flow.
- REQUIREMENT: You MUST include at least one 'interactive-code' widget to reinforce the algorithm structure.
- DENSITY: Minimum 2 widgets per screen.
`;