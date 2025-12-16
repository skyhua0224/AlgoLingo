
export const PARSONS_RULES = `
- **PARSONS PUZZLE CONSTRAINTS (CRITICAL)**:
    - **MINIMUM LINES**: You MUST generate **AT LEAST 5 LINES** of code items.
      - **STRICT PROHIBITION**: NEVER generate a puzzle with fewer than 5 lines. It is too easy.
      - **NO FILLER**: Do NOT use comments (lines starting with # or //) as standalone draggable items to pad the count.
      - **NO TRIVIAL LINES**: Do NOT use lines like "pass", "return;", or "..." in isolation unless strictly necessary for control flow logic.
      - **STRATEGY**: If the core logic is short, you MUST include the surrounding context (function signature, return statement, variable initialization) to reach the 5-line minimum.
    
    - **NO "ORPHAN" BRACES (C++/Java/Go)**:
      - **FORBIDDEN**: A line containing ONLY \`}\` or \`};\` or \`{\`.
      - **FIX**: Append the closing brace to the previous logic line, or include it in the next block.
      - ❌ BAD: \`["if (x) {", "doWork();", "}"]\` (3 lines, one is just a brace)
      - ✅ GOOD: \`["if (x) {", "    doWork();", "    return true;", "}"]\` (More content is better)

    - **LOGIC INTEGRITY**:
      - Every line must be a meaningful logical step.
      - **Imports**: Include imports/includes as separate lines if needed to increase difficulty.

    - **INDENTATION**: 
      - Set \`indentation: true\` for Python.
      - For C++/Java, indentation is visual but the sorting logic relies on the order.
`;
