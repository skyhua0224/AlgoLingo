
export const getSolutionDeepDivePrompt = (
    problemName: string,
    strategyTitle: string,
    targetLang: string,
    speakLang: string,
    existingCode?: string
) => {
    return `
    **ROLE**: Senior Staff Algorithm Engineer at LeetCode (Official Solution Writer).
    **TASK**: Write a "Definitive Official Solution" for: "${problemName}".
    **STRATEGY**: Focus ONLY on the approach: "${strategyTitle}".
    **LANGUAGE**: Content in ${speakLang}. Code in ${targetLang}.
    
    ${existingCode ? `**REFERENCE CODE**: Use this logic if valid: \n\`\`\`${targetLang}\n${existingCode}\n\`\`\`` : ''}

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
