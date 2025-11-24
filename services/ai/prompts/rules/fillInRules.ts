
export const FILL_IN_RULES = `
- **FILL-IN WIDGET CONSTRAINTS**:
    - If 'inputMode' is 'select' (default for early phases), you **MUST** provide the 'options' array with at least 3 choices (1 correct, 2 distractors).
    - 'correctValues' MUST correspond exactly to the __BLANK__ placeholders in the 'code'.
    - **CRITICAL - FORMATTING**:
        - Use '\\n' characters to ensure the code is multiline and readable.
        - Do NOT squash everything into one line.
    - **CRITICAL - NO TRIVIAL BLANKS**:
        - Do **NOT** place blanks in comments (e.g., # __BLANK__).
        - Do **NOT** place blanks for simple closing braces/brackets like '}' or ']'.
        - Do **NOT** place blanks for import statements unless it's a specific library lesson.
        - **TARGET**: Control flow keywords (if, for, while, return), key variable names, specific method calls (e.g. .append, .push), or logic operators.
    - Ensure there is **AT LEAST ONE** __BLANK__ in the code.
`;
