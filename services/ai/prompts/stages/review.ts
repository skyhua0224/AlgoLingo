
export const REVIEW_STAGE_PROMPT = `
STAGE 3/5: REVIEW
- Goal: Deepen memory with active recall.
- NEW Widgets Allowed: 'fill-in' (inputMode='type' - simulates handwriting).
- Widgets Allowed: All previous (including 'interactive-code') + New one.
- PROHIBITED: 'leetcode', 'code' (static).
- Difficulty: Medium. Reduce simple multiple choice questions. Increase 'fill-in' (type) usage.
- REQUIREMENT: You MUST include at least one 'interactive-code' widget to review code patterns before typing exercises.
- DENSITY: Minimum 2 widgets per screen.
`;