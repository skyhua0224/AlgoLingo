
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

    REQUIRED DATA (JSON):
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
    problemContext: string
) => {
    return `
    Role: Elite Computer Science Professor (Specializing in Algorithm Interviews).
    Task: Deeply analyze the LeetCode problem and generate **3 distinct solution strategies** (e.g., Brute Force, Better, Optimal).
    
    **LANGUAGE REQUIREMENT**:
    - **ALL TITLES, TAGS, DERIVATIONS, AND EXPLANATIONS MUST BE IN CHINESE (Simplified).**
    - Code MUST be in **${targetLang}**.
    
    **PROBLEM CONTEXT**:
    ${problemContext.substring(0, 1500)}...

    **REQUIREMENTS FOR DERIVATION**:
    - **Very Detailed**: Don't just say "Use a hashmap". Explain *how* we arrived at that thought.
    - **Intuition**: What is the first thought? What patterns match this?
    - **Prerequisites**: What basics (e.g. Hash Collision, Sliding Window) are needed?
    - **Logic Flow**: Step-by-step breakdown.
    - **Analogy**: Use real-world analogies if possible.

    **OUTPUT FORMAT (JSON)**:
    {
        "approaches": [
            {
                "id": "approach_1",
                "title": "Strategy Name (e.g., '暴力枚举法', '哈希表优化')",
                "complexity": "Time: O(...) | Space: O(...)",
                "tags": ["Tag1", "Tag2"], // e.g. ["数组", "双指针"]
                
                // 1. DEEP DIVE DERIVATION (Markdown Supported)
                // Explain: How did we think of this? Why use this data structure? What are the edge cases?
                // Include Prerequisites, Similar Problems, and detailed Logic flow.
                "derivation": "### 解题直觉\\n\\n首先，我们要找...\\n\\n### 核心思路\\n利用哈希表记录...\\n\\n### 为什么不用暴力法？\\n因为 O(n^2) 会超时...",
                
                // 2. STRATEGY SPECIFIC CONCEPT CARD (For Sidebar)
                "concept": {
                    "front": "核心概念 (e.g. 哈希映射)",
                    "back": "简短解释这个概念在本题的作用 (e.g. 用空间换时间，实现 O(1) 查找)."
                },

                // 3. STRUCTURED INTERACTIVE CODE
                // Provide the full code split into logical lines with explanations for the interactive widget.
                // DO NOT USE COMMENTS inside the code string. Put explanations in the 'explanation' field.
                "codeLines": [
                    { "code": "class Solution:", "explanation": "定义解决方案类。" },
                    { "code": "    def twoSum(self, nums: List[int], target: int) -> List[int]:", "explanation": "函数入口，接收数组和目标值。" },
                    { "code": "        hash_map = {}", "explanation": "初始化哈希表，用于存储 \`数值 -> 索引\` 的映射，实现 O(1) 查找。" }
                ]
            }
        ]
    }
    `;
};
