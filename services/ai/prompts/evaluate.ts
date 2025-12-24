
export const getEvaluationPrompt = (
    code: string,
    timeSeconds: number,
    failCount: number,
    problemDesc: string,
    lang: string
) => {
    return `
    ROLE: Senior Technical Interviewer (The Evaluator).
    TASK: Rate the candidate's successful submission on a scale of 0-3 (Q-Score).
    
    CONTEXT:
    - Problem: "${problemDesc.substring(0, 100)}..."
    - Time Spent: ${timeSeconds} seconds. (Reference: Easy < 300s, Medium < 900s)
    - Failed Attempts (Current Session): ${failCount}. (Note: If 0, it means they got it right on the first try in this session).
    - Candidate Code:
    \`\`\`
    ${code}
    \`\`\`

    SCORING CRITERIA (Strict):
    - **3 (Perfect)**: 
      - Optimal Time/Space complexity.
      - Clean, idiomatic syntax.
      - Fast completion (relative to difficulty) AND Zero or very few retries.
    - **2 (Good)**: 
      - Correct logic, passing complexity.
      - Code is readable but maybe verbose.
      - Reasonable time.
    - **1 (Hard)**: 
      - Struggled significantly (high time OR high retries).
      - Code is messy ("spaghetti") or barely passes constraints.
    - **0 (Weak)**: 
      - Brute force where optimal exists.
      - Clearly trial-and-error approach.

    OUTPUT FORMAT (JSON ONLY):
    {
        "score": 0 | 1 | 2 | 3,
        "reason": "Brief, constructive feedback in ${lang}. Focus on style/efficiency. If failCount > 0, mention it gently as an area for improvement. If failCount is 0, acknowledge the clean shot.",
        "nextIntervalRecommendation": "Optional hint: '3 days' or '1 day'"
    }
    `;
};
