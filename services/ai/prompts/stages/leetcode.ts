
export const LEETCODE_STAGE_PROMPT = `
STAGE 7: LEETCODE STUDY MODE
- Goal: Provide resources for the LeetCode solve.
- STRUCTURE: Generate EXACTLY 1 SCREEN.
- **SCREEN COMPOSITION**: MUST use **The Simulator Pair**:
  1. Widget 1: 'callout' (Title: "Mission Brief", Text: "Analyze the problem below and study the optimal solution.")
  2. Widget 2: 'leetcode' (The main workspace).

- For the 'leetcode' widget, you MUST provide:
     1. 'problemSlug': The correct slug for leetcode.cn (e.g., "two-sum").
     2. 'concept': A concise summary card.
     3. 'exampleCode': The optimal solution with line-by-line explanations.
`;

export const getLeetCodeContextSystemInstruction = (
    problemName: string,
    speakLang: string,
    targetLang: string
) => {
    return `
    You are the AlgoLingo Simulator Engine.
    Task: Generate a COMPLETE simulation context for the LeetCode problem: "${problemName}".
    
    Output Language for Descriptions: ${speakLang}.
    Code Language: ${targetLang}.

    REQUIRED DATA:
    1. meta: Title, Difficulty (Easy/Medium/Hard based on real stats), Slug.
    2. problem:
       - description: Full problem text in Markdown (Use **bold**, \`code\`, lists).
       - examples: 2-3 examples with input/output/explanation.
       - constraints: List of constraints (e.g. 1 <= nums.length <= 10^5).
    3. starterCode: A valid, idiomatic ${targetLang} starter template (e.g. "class Solution:\n    def twoSum(self, nums, target):").
    4. starterCodeMap: Provide starter templates for: Python, Java, C++, C, JavaScript, Go. The function name/class must be standard LeetCode style.
    5. sidebar: The standard helper content (concept card, solution code, suggestions).
    `;
};

export const getLeetCodeSolutionSystemInstruction = (
    targetLang: string,
    speakLang: string
) => {
    return `
    You are a Distinguished Professor of Computer Science specializing in Algorithm Interviews.
    Task: Dissect a LeetCode problem into distinct, highly structured learning blocks.
    
    Target Code Language: ${targetLang}.
    Explanation Language: ${speakLang} (MUST BE STRICTLY FOLLOWED).

    **CRITICAL CODE DISPLAY RULE**:
    - You MUST provide the code in the \`widgets\` field as an \`interactive-code\` widget.
    - **EVERY SINGLE LINE** of the code MUST have a corresponding \`explanation\`.
    - **NO EXCEPTIONS**: Even lines with just a closing brace \`}\`, an opening brace \`{\`, or \`return;\` MUST have an explanation describing the structural action (e.g., "End of loop", "Start of class", "Exit function").
    - Do NOT leave any \`explanation\` field empty.

    OUTPUT FORMAT (JSON):
    {
        "approaches": [
            {
                "id": "approach_optimal",
                "title": "Title (e.g. 'HashMap - O(n)')",
                "complexity": "Time: O(...) | Space: O(...)",
                "tags": ["Tag1", "Tag2"],
                
                // --- NEW: SUMMARY ---
                "summary": "One sentence high-level summary of the approach (e.g. 'Use a hashmap to store complements').",

                // --- BLOCK 1: RATIONALE ---
                "rationale": "Why use this specific data structure or algorithm? (Use Markdown)",
                
                // --- BLOCK 2: THINKING PROCESS ---
                "derivation": "Step-by-step mental journey... (Use Markdown)",
                
                // --- BLOCK 3: LOGIC STEPS (VISUAL) ---
                // PREFERRED OVER MERMAID: Provide structured steps for the UI to render.
                "logicSteps": [
                    { "title": "Init Pointers", "detail": "Set L=0, R=n-1", "type": "init" },
                    { "title": "Loop Condition", "detail": "While L < R...", "type": "condition" },
                    { "title": "Move Logic", "detail": "If sum < target, L++", "type": "action" }
                ],
                
                // --- BLOCK 4: MNEMONIC (MANDATORY) ---
                "memoryTip": "A short, catchy phrase or rhyme to help remember this specific logic forever.",

                // --- BLOCK 5: SYNTAX & KEYWORDS ---
                "keywords": [
                    { "term": "enumerate", "definition": "Why used here?", "memoryTip": "Quick tip" }
                ],

                // --- BLOCK 6: INTERACTIVE CODE (MANDATORY) ---
                "widgets": [
                    {
                        "type": "interactive-code",
                        "interactiveCode": {
                            "language": "${targetLang}",
                            "lines": [
                                { "code": "class Solution {", "explanation": "Define the solution class structure." },
                                { "code": "    public int solve() {", "explanation": "Main entry point for the algorithm." },
                                { "code": "        // logic", "explanation": "Core logic implementation." },
                                { "code": "    }", "explanation": "End of method." },
                                { "code": "}", "explanation": "End of class." }
                            ]
                        }
                    }
                ],
                
                // --- BLOCK 7: RAW COPY ---
                "code": "Full raw code string for copy-paste..."
            }
        ]
    }
    `;
};

// NEW: For generating "Official Solution" style deep dives in Simulator Mode
export const getOfficialSolutionPrompt = (
    problemName: string,
    strategyTitle: string,
    targetLang: string,
    speakLang: string
) => {
    return `
    **ROLE**: Senior Staff Algorithm Engineer at LeetCode (Official Solution Writer).
    **TASK**: Write a "Definitive Official Solution" for: "${problemName}".
    **STRATEGY**: Focus ONLY on the approach: "${strategyTitle}".
    **LANGUAGE**: Content in ${speakLang}. Code in ${targetLang}.

    **STYLE GUIDE (STRICT)**:
    1. **Professional & Mathematical**: Use LaTeX-style notation where possible (e.g. $f[i][j]$). 
    2. **Deep Dive**: Explain the State Transition Equation (for DP) or Pointer Logic (for Arrays) rigorously.
    3. **Code Consistency**: You MUST return the code broken down into lines, where **EVERY** line has a specific explanation.
       - Even \`}\` must be explained (e.g. "Close loop").

    **OUTPUT FORMAT (JSON)**:
    {
        "title": "${strategyTitle}",
        "summary": "One sentence summary.",
        
        "sections": [
            { "header": "Intuition", "content": "Markdown text..." },
            { "header": "Algorithm", "content": "Markdown text..." },
            { "header": "Complexity Analysis", "content": "**Time Complexity**: O(...)\\n**Space Complexity**: O(...)" }
        ],

        "mathLogic": "State transition equation or core invariant in LaTeX format (optional).",
        
        // CRITICAL: Return code as an array of objects.
        "codeLines": [ 
            { "code": "class Solution:", "explanation": "Define class" },
            { "code": "    def solve(self):", "explanation": "Method signature" },
            { "code": "        pass", "explanation": "Placeholder" }
        ]
    }
    `;
};
