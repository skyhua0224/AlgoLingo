
export const getTrackSuggestionPrompt = (category: string, existingTitles: string[]) => {
    return `
    ROLE: Senior Tech Career Mentor.
    TASK: Recommend 5 high-value specialization tracks for a software engineer.
    CATEGORY: ${category === 'all' ? 'General Software Engineering' : category}.
    
    CONTEXT: The user already has these tracks: ${existingTitles.join(', ')}. DO NOT suggest duplicates.
    GOAL: Suggest trending, specific, and high-impact technologies or architectural patterns (e.g. "Micro-Frontends", "eBPF", "WebAssembly", "GraphQL Federation").

    OUTPUT FORMAT (JSON ONLY):
    {
        "tracks": [
            {
                "title": { "en": "English Title", "zh": "中文标题" },
                "description": { "en": "Short compelling description", "zh": "简短描述" },
                "icon": "Server", // Choose valid Lucide icon name
                "keywords": ["Key1", "Key2"]
            }
        ]
    }
    `;
};
