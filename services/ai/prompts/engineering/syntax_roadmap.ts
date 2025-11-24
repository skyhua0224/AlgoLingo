
import { SyntaxProfile } from "../../../../types/engineering";

export const getSyntaxRoadmapPrompt = (profile: SyntaxProfile) => {
    const lang = profile.language;
    const source = profile.sourceLanguage || "General Programming";
    const objective = profile.objective === 'custom' ? profile.customObjective : profile.objective;
    const attributes = profile.attributes;

    return `
    You are a Principal Engineer designing a **Matrix Curriculum** for learning **${lang}**.
    
    USER IDENTITY:
    - **Origin**: ${profile.origin} (Background: ${profile.origin === 'mapped' ? source : 'N/A'}).
    - **Objective**: ${objective}.
    - **Modality**: ${profile.modality} (Attributes: Handwriting=${attributes.handwriting}, Internals=${attributes.internals}).

    STRATEGY:
    1. **If Origin = 'mapped'**: Group units by concepts that map to ${source} (e.g., "Interfaces vs Protocols", "Concurrency Models").
    2. **If Origin = 'augmented'**: Focus on "Code Literacy", "Debugging Patterns", "Refactoring".
    3. **If Objective = 'internals'**: Include units on "Memory Management", "Bytecode", "Runtime".
    
    OUTPUT FORMAT (JSON):
    {
        "units": [
            {
                "id": "u1",
                "title": { "en": "Module Name", "zh": "单元名称" },
                "description": { "en": "Short desc", "zh": "简短描述" },
                "lessons": [
                    { 
                        "id": "l1", 
                        "title": { "en": "Topic A", "zh": "知识点 A" },
                        "description": { "en": "Desc", "zh": "描述" },
                        "type": "standard",
                        "phases": [
                            { "id": "0", "title": { "en": "Concept", "zh": "概念" }, "type": "learn" },
                            { "id": "1", "title": { "en": "Syntax", "zh": "语法" }, "type": "learn" },
                            { "id": "2", "title": { "en": "Drill", "zh": "训练" }, "type": "practice" },
                            { "id": "3", "title": { "en": "Logic", "zh": "逻辑" }, "type": "practice" },
                            { "id": "4", "title": { "en": "Debug", "zh": "调试" }, "type": "code" },
                            { "id": "5", "title": { "en": "Mastery", "zh": "精通" }, "type": "mastery" }
                        ]
                    }
                ]
            }
        ]
    }
    
    RULES:
    - Generate 4-6 UNITS.
    - Each Unit MUST have 3-5 LESSONS.
    - **IMPORTANT**: For 'standard' lessons, ALWAYS generate the 6 phases with IDs "0" through "5" as shown in the example. This structure is mandatory for the UI.
    - The LAST lesson of each unit MUST be type="sandbox" (The Boss Level / IDE Challenge).
    - Return ONLY valid JSON.
    `;
};
