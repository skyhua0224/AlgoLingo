
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
       - description: Full problem text in Markdown.
       - examples: 2-3 examples with input/output/explanation.
       - constraints: List of constraints (e.g. 1 <= nums.length <= 10^5).
    3. starterCode: A valid, idiomatic ${targetLang} starter template (e.g. "class Solution:\n    def twoSum(self, nums, target):").
    4. starterCodeMap: Provide starter templates for: Python, Java, C++, C, JavaScript, Go. The function name/class must be standard LeetCode style.
    5. sidebar: The standard helper content (concept card, solution code, suggestions).
    `;
};