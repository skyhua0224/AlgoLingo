
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
                "focus": "concept", // Choose from: "concept", "code", "debug", "design", "mastery"
                "tags": ["Theory", "Visual"] // Must list specific content types e.g., "Mini-Editor", "Terminal", "Quiz", "Parsons"
            },
            ...
        ]
    }

    **PROGRESSION RULES (STRICT)**:
    1. **Steps 1-2 (Novice)**: Focus on "Intuition", "Analogy". 
       - **TAGS MUST INCLUDE**: "Theory", "Visual", "Quiz".
    2. **Steps 3-5 (Junior/Mid)**: Focus on "Mechanics", "Implementation". 
       - **TAGS MUST INCLUDE**: "Interactive Code", "Parsons", "Fill-In".
    3. **Steps 6-8 (Senior)**: Focus on "Internals", "Edge Cases", "Debugging". 
       - **TAGS MUST INCLUDE**: "Terminal", "Code Walkthrough", "Debug".
    4. **Steps 9+ (Expert)**: Focus on "Real-world Scenarios", "Complex Architecture". 
       - **TAGS MUST INCLUDE**: "Mini-Editor", "Arch Canvas", "Mastery".

    **CONSTRAINTS**:
    - Generate between 8 and 12 steps.
    - Use the provided KEYWORDS to ensure the content covers the syllabus requirements.
    - **TAGS**: Are used to preview the lesson content. Be accurate. If the step is "Debugging", the tag MUST be "Terminal" or "Debug". If the step is "Implementation", tags MUST include "Mini-Editor" or "Code".
    `;
};
