
export const INTRO_STAGE_PROMPT = `
STAGE 1: CONCEPT INTRODUCTION
- Goal: Introduce the core concept.
- Widgets Allowed: 'dialogue', 'callout', 'flipcard' (mode='learn'), 'quiz', 'fill-in' (inputMode='select'), 'interactive-code'.
- PROHIBITED: 'parsons', 'flipcard' (mode='assessment'), 'fill-in' (inputMode='type'), 'leetcode'.
- Structure: Mix of teaching screens (dialogue/flipcard) and simple checks (quiz).
- REQUIREMENT: You MUST include at least one screen with an 'interactive-code' widget to visually explain the code logic/syntax.
- CRITICAL INSTRUCTION: Every screen MUST start with a 'dialogue' or 'callout' widget to explain the concept simply BEFORE showing any code or interactive widget. Do NOT assume prior knowledge. Guide the user gently.
- METHOD: Use Socratic questioning. Guide the user step-by-step.
`;
