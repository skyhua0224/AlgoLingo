
export const FILL_IN_RULES = `
- **FILL-IN WIDGET CONSTRAINTS**:
    - If 'inputMode' is 'select' (default for early phases), you **MUST** provide the 'options' array with at least 3 choices (1 correct, 2 distractors).
    - 'correctValues' MUST correspond exactly to the __BLANK__ placeholders in the 'code'.
    - **CRITICAL - FORMATTING**:
        - Use '\\n' characters to ensure the code is multiline and readable.
        - **ALWAYS** include the function definition line (e.g., \`def maxArea(height):\`) to provide context. Never show a loop or condition in isolation without its parent function context.
    - **CRITICAL - QUALITY CONTROL**:
        - **NO TRIVIAL ASSIGNMENTS**: Do **NOT** create blanks for simple literal values in assignments (e.g., 'x = __BLANK__', 'flag = __BLANK__'). This is too easy and meaningless.
        - **NO VARIABLE DECLARATIONS**: Do **NOT** ask the user to guess a variable name on the left side of an assignment (e.g., \`__BLANK__ = {}\` or \`__BLANK__ = [0] * n\`) UNLESS that variable name was explicitly defined and emphasized in a previous line or a surrounding dialogue.
          - *Reason*: Without context, any variable name (map, dict, seen, table) is valid, but the system only accepts one.
          - *Correction*: Instead, blank out the logic or the value: \`seen = __BLANK__\` (answer: {}).
        - **NO COMMENTS**: Do **NOT** place blanks in comments.
        - **TARGET**: Focus blanks on **Control Flow** (if, for, while, return), **Method Calls** (.append, .pop, .join), **Logic Operators** (and, or, not, in), or **Complex Variable Usage** (e.g. index access 'arr[__BLANK__]').
    - Ensure there is **AT LEAST ONE** __BLANK__ in the code.
`;