
import { BASE_SYSTEM_INSTRUCTION } from "./system";

export const getDisputeJudgePrompt = (
    widgetJson: string,
    userAnswer: string,
    context: string,
    lang: string
) => {
    return `
    ${BASE_SYSTEM_INSTRUCTION}

    **ROLE**: Impartial Senior Engineer Judge.
    **TASK**: Evaluate a user's claim that their answer is correct, despite the system marking it wrong.

    **CONTEXT**:
    - Problem Context: ${context}
    - User Language: ${lang}
    - Widget Data (The Question & Expected Answer):
      \`\`\`json
      ${widgetJson}
      \`\`\`
    
    **USER'S ANSWER**: "${userAnswer}"

    **JUDGMENT RULES**:
    1. **FLEXIBILITY**: If the user's answer is semantically identical (e.g., different variable name but valid logic, extra whitespace, synonym), MARK AS CORRECT.
    2. **STRICTNESS**: If the user is objectively wrong (logic error, syntax error in strict mode), MARK AS INCORRECT.
    3. **BAD QUESTION**: If the question itself is flawed/ambiguous and the user's interpretation is valid, MARK AS CORRECT.

    **OUTPUT FORMAT (JSON ONLY)**:
    {
        "verdict": "correct" | "incorrect",
        "explanation": "Brief explanation of why you accepted or rejected the appeal (in ${lang}).",
        "memoryTip": "If incorrect, provide a short 1-sentence memory aid. If correct, provide a reinforcement tip."
    }
    `;
};
