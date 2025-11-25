
export const INTRO_STAGE_PROMPT = `
STAGE 1: CONCEPT INTRODUCTION
- **GOAL**: Introduce the core concept clearly and visually.
- **WIDGETS ALLOWED**: 'dialogue', 'callout', 'flipcard' (mode='learn'), 'quiz', 'fill-in' (inputMode='select'), 'interactive-code'.
- **PROHIBITED**: 'parsons', 'flipcard' (mode='assessment'), 'fill-in' (inputMode='type'), 'leetcode', 'code' (static).

- **SCREEN COMPOSITION RULES (CRITICAL)**:
  1. **NO LONELY DIALOGUE**: Every screen starting with 'dialogue' MUST be followed by an 'interactive-code', 'quiz', or 'flipcard'.
  2. **MANDATORY CODE**: You MUST include an 'interactive-code' widget on **Screen 2** and **Screen 4** at minimum to show the algorithm in action.
  3. **INTERACTIVITY**: The user must have something to click or read on every screen.
  
- **STRUCTURE VIOLATION WARNING**: 
  - Do **NOT** put a "code" property inside a "dialogue" widget. 
  - **WRONG**: { "type": "dialogue", "code": { ... }, "dialogue": { ... } }
  - **CORRECT**: 
    [
      { "type": "dialogue", "dialogue": { "text": "Look at this code:", "speaker": "coach" } },
      { "type": "interactive-code", "interactiveCode": { "language": "python", "lines": [...] } }
    ]

- **METHOD**: Use Socratic questioning. Guide the user step-by-step.
`;