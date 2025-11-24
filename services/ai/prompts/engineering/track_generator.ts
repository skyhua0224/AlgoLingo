
// Prompt for Dynamic Tracks
// Goal: Generate a hierarchical syllabus (Modules -> Topics) for a given track

export const getTrackSyllabusPrompt = (trackName: string, context: string, lang: string) => {
    return `
    ROLE: Senior Technical Curriculum Designer.
    TASK: Create a comprehensive, hierarchical learning syllabus for: "${trackName}".
    CONTEXT: "${context}".
    USER LANGUAGE: ${lang}.

    OUTPUT FORMAT (JSON ONLY):
    {
        "modules": [
            {
                "id": "mod_1",
                "title": { "en": "Module 1 Title", "zh": "模块1标题" },
                "description": { "en": "Module description", "zh": "模块描述" },
                "topics": [
                    {
                        "id": "topic_1",
                        "title": { "en": "Topic Title", "zh": "课题标题" },
                        "keywords": ["Key1", "Key2", "Key3"]
                    },
                    ...
                ]
            },
            ...
        ]
    }

    CONSTRAINTS:
    - Generate 3-5 **Modules** (Logical groupings, e.g., "Fundamentals", "Advanced Patterns", "Real-world Application").
    - Each Module must have 3-5 **Topics**.
    - Topics should be specific enough to be a single lesson (e.g. "Raft Leader Election", not just "Consensus").
    - Provide bilingual titles (English and Chinese).
    - Return VALID JSON only. No markdown formatting.
    `;
};
