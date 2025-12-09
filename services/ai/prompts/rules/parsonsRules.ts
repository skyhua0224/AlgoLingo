
export const PARSONS_RULES = `
- **PARSONS PUZZLE CONSTRAINTS**:
    - **LENGTH**: You MUST generate between **5 and 9 lines** of code. 
    - **STRICT PROHIBITION**: 
      - **NO** puzzles with fewer than 5 lines.
      - **NO** trivial lines like just \`pass\`, \`return\`, or \`}\`.
      - **NO** lines that are effectively identical (e.g. swapping \`x=1\` and \`y=2\` where order doesn't matter). Every line must have a logical dependency on the previous one.
    - **IMPORTS**: Include necessary standard library imports (e.g., \`import heapq\`) as separate lines to sort. This tests if the user knows where imports belong (at the top).
    - **FORBIDDEN SYNTAX**:
        - Do **NOT** use curly braces '{' or '}' (Assume Pythonic pseudo-code if teaching algorithms).
        - Do **NOT** use semicolons ';'.
    - **LOGIC**: The puzzle must test *control flow* or *logic* (loops, conditionals, recursion), not just variable definition.
    - **SYNTAX CLEANING**: The UI will strip whitespace. Focus on the core logic statements.
`;