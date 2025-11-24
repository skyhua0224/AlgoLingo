
export const PARSONS_RULES = `
- **PARSONS PUZZLE CONSTRAINTS**:
    - **LENGTH**: You MUST generate between **4 and 8 lines** of code. NO LESS THAN 4. NO MORE THAN 8.
    - **FORBIDDEN SYNTAX**:
        - Do **NOT** use 'import' statements.
        - Do **NOT** use curly braces '{' or '}' (Assume Pythonic pseudo-code if teaching algorithms).
        - Do **NOT** use semicolons ';'.
        - Do **NOT** use lines that are just closing statements (e.g. just 'return' or just 'pass').
    - **SEQUENTIAL DEPENDENCY**: 
        - Every line MUST logically depend on the previous one to ensure a UNIQUE sorting order.
        - BAD: "x = 1", "y = 2" (Order is ambiguous).
        - GOOD: "x = 1", "y = x + 1" (Order is fixed).
        - Avoid lines that can be swapped without affecting logic.
    - **SYNTAX CLEANING**: The UI will strip whitespace. Focus on the core logic statements.
`;
