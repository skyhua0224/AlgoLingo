
import { BASE_SYSTEM_INSTRUCTION } from "../system";

export const getTopicRoadmapPrompt = (topic: string, pillar: string, keywords: string[], lang: string) => {
    return `
    ${BASE_SYSTEM_INSTRUCTION}

    **ROLE**: Elite Engineering Mentor (Google Principal Engineer level).
    **TASK**: Create a progressive 8-12 step learning syllabus for:
    **TOPIC**: "${topic}" (${pillar === 'system' ? 'System Design Pillar' : 'Computer Science Core Pillar'})
    **KEYWORDS**: ${keywords.join(', ')}
    **USER LANGUAGE**: ${lang}

    **GOAL**: Guide the user from a complete beginner (Intuition) to an expert (Mastery) in this specific topic.

    **OUTPUT FORMAT (JSON ONLY)**:
    {
        "roadmap": [
            {
                "id": "phase_1",
                "title": { "en": "English Title", "zh": "中文标题" },
                "description": { "en": "Short description of learning goal", "zh": "简短的学习目标描述" },
                "focus": "concept" // Choose from: "concept", "code", "debug", "design", "mastery"
            },
            ...
        ]
    }

    **PROGRESSION RULES**:
    1. **Steps 1-2 (Novice)**: Focus on "Intuition", "Analogy", "Why we need this". (Focus: "concept")
    2. **Steps 3-5 (Junior/Mid)**: Focus on "Mechanics", "API", "Basic Implementation", "Standard Flows". (Focus: "concept" or "code")
    3. **Steps 6-8 (Senior)**: Focus on "Internals", "Edge Cases", "Optimization", "Tuning". (Focus: "code" or "debug")
    4. **Steps 9+ (Expert)**: Focus on "Real-world Scenarios", "Complex Troubleshooting", "Mastery Challenge". (Focus: "design" or "mastery")

    **CONSTRAINTS**:
    - Generate between 8 and 12 steps.
    - Titles must be punchy and professional.
    - Ensure the progression is logical. Do not jump to complex internals in step 1.
    - Use the provided KEYWORDS to ensure the content covers the syllabus requirements.
    `;
};
