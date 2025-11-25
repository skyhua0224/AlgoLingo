
import { BASE_SYSTEM_INSTRUCTION } from "./system";

export const getForgeRoadmapPrompt = (topic: string, language: string) => {
    return `
    You are an Expert Curriculum Architect.
    
    TASK: Create a 6-stage learning roadmap for: "${topic}".
    USER LANGUAGE: ${language}.
    
    OBJECTIVE:
    - Use Google Search to find the most accurate, up-to-date, and structured information about the topic.
    - Break it down into exactly 6 progressive stages.
    
    STAGES TEMPLATE (Do not change the focus keys):
    1. Focus: "concept" (Origin/Definition)
    2. Focus: "structure" (Anatomy/Components)
    3. Focus: "process" (Flow/How it works)
    4. Focus: "nuance" (Comparison/Pros & Cons)
    5. Focus: "application" (Real world usage)
    6. Focus: "insight" (Expert Tips/Future)

    OUTPUT FORMAT (JSON ONLY):
    {
        "title": "Catchy Course Title",
        "description": "Brief summary of what will be learned.",
        "stages": [
            {
                "id": 1,
                "title": "Stage Title",
                "description": "What specific sub-topic does this stage cover?",
                "focus": "concept",
                "icon": "Lightbulb" // Valid Lucide Icon Name
            },
            ... (6 stages total)
        ]
    }
    `;
};

export const getForgeStagePrompt = (topic: string, stageTitle: string, stageDesc: string, focus: string, language: string) => {
    let widgetInstruction = "";
    switch (focus) {
        case 'concept': widgetInstruction = "Use 'callout' for definitions and 'flipcard' for key terms."; break;
        case 'structure': widgetInstruction = "Use 'visual-quiz' (if applicable) or 'mermaid' to show structure."; break;
        case 'process': widgetInstruction = "Use 'steps-list' or 'mermaid' (flowchart)."; break;
        case 'nuance': widgetInstruction = "Use 'comparison-table' to contrast ideas."; break;
        case 'application': widgetInstruction = "Use 'fill-in' or 'interactive-code' (if coding topic)."; break;
        case 'insight': widgetInstruction = "Use 'callout' (Expert Tip) or 'quiz'."; break;
    }

    return `
    ${BASE_SYSTEM_INSTRUCTION}

    TASK: Generate a Micro-Lesson (5-7 screens) for ONE specific stage.
    TOPIC: ${topic}
    STAGE: ${stageTitle} - ${stageDesc}
    USER LANGUAGE: ${language}

    WIDGET STRATEGY:
    - ${widgetInstruction}
    - You MAY use other standard widgets (dialogue, quiz) as fillers.
    
    CONSTRAINTS:
    - Generate EXACTLY 5-7 screens.
    - Ensure the content is specific to this stage ONLY.
    - If using 'mermaid', ensure valid syntax.
    
    OUTPUT: JSON matching LessonPlan schema.
    `;
};
