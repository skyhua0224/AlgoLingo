export const getProblemStrategiesPrompt = (problemName: string, description: string, speakLang: string) => {
    return `
    ROLE: Senior Algorithm Tech Lead & Pedagogical Expert.
    TASK: Brainstorm 3 distinct solution strategies for the LeetCode problem: "${problemName}".
    
    CONTEXT: "${description.substring(0, 300)}..."
    OUTPUT LANGUAGE: ${speakLang}.

    **PART 1: KNOWLEDGE TAGS**:
    - Identify 3-4 core concepts (e.g. "HashMap", "Two Pointers", "Sorting").
    - For each, provide a 1-sentence definition and a 1-line code snippet in the target language syntax.

    **PART 2: STRATEGIES**:
    1. **Strategy 1 (The Baseline)**: Brute Force or Naive approach.
    2. **Strategy 2 (The Recommended/Optimal)**: 
       - **CRITICAL "OPTIMAL" RULE**: Tag "Optimal" ONLY if it has the best possible Big-O Time Complexity (e.g. O(N) vs O(N log N)). 
       - Do NOT tag a slower solution as "Optimal" just because it is shorter code.
       - Tag "Recommended" if it strikes the best balance of readability and performance.
    3. **Strategy 3 (Alternative)**: Different tradeoff (e.g. Iterative vs Recursive, or Space-optimized).

    **RICH CONTENT REQUIREMENTS (CRITICAL)**:
    - **Analogy**: A specific, non-technical real-world metaphor to explain the *feeling* of the algorithm.
    - **Memory Tip**: A short, catchy phrase or rhyme (max 10 words) to help remember this approach.
    - **Logic Steps**: A structured array describing the high-level flow. Use types: 'init', 'loop', 'condition', 'action', 'result'.
    - **Keywords**: Extract 2-3 specific language features used (e.g. 'enumerate', 'set', 'two-pointers').

    **VISUALIZATION RULES**:
    - You MUST generate an \`interactive-code\` widget for EVERY strategy.
    - **NO EMPTY LINES**: The \`lines\` array MUST NOT contain empty strings.
    - **EVERY LINE EXPLAINED**: Each line of code must have a meaningful \`explanation\`.

    OUTPUT FORMAT (JSON ONLY):
    {
        "commonTags": [
            { "name": "HashMap", "definition": "Key-value store...", "codeSnippet": "map = {}" }
        ],
        "approaches": [
            {
                "id": "strat_X",
                "title": "Strategy Title",
                "complexity": "Time: O(...) | Space: O(...)",
                "summary": "One-sentence high-level summary.",
                "rationale": "Deep technical explanation of WHY this works. Markdown supported.",
                
                // PEDAGOGICAL CONTENT
                "analogy": "Imagine you are organizing a deck of cards...",
                "memoryTip": "Two pointers meet in the middle, avoiding the riddle.",
                
                "tags": ["Tag1", "Tag2"], // e.g. "Optimal", "Recommended"
                
                // NATIVE LOGIC FLOW (UI RENDERED)
                "logicSteps": [
                    { "title": "Initialize", "detail": "Create a \`HashMap\` to store value->index.", "type": "init" },
                    { "title": "Iterate", "detail": "Loop through \`nums\` array once.", "type": "loop" },
                    { "title": "Check", "detail": "If \`target - current\` exists in map, return indices.", "type": "condition" },
                    { "title": "Store", "detail": "Otherwise, add current value to map.", "type": "action" }
                ],

                // SYNTAX HIGHLIGHTS
                "keywords": [
                    { "term": "enumerate", "definition": "Get index and value simultaneously" }
                ],
                
                // COMPLETE CODE LOGIC
                "code": "full_raw_code_string_here...",
                
                // INTERACTIVE WIDGET (STRICT FORMAT)
                "widgets": [
                    {
                        "type": "interactive-code",
                        "interactiveCode": {
                            "language": "python", // or target lang
                            "lines": [
                                { "code": "def solve(nums):", "explanation": "Function entry" },
                                { "code": "    map = {}", "explanation": "Init storage" },
                                // NO EMPTY LINES HERE
                                { "code": "    return -1", "explanation": "Fallback" }
                            ]
                        }
                    }
                ]
            }
        ]
    }
    `;
};