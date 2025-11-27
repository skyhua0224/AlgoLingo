
import { BASE_SYSTEM_INSTRUCTION } from "./system";
import { ForgeGenConfig } from "../../../types/forge";

export const getForgeRoadmapPrompt = (topic: string, language: string, config: ForgeGenConfig) => {
    const count = config.stageCount;

    return `
    You are an Expert Curriculum Architect.
    
    TASK: Create a ${count}-stage learning roadmap for: "${topic}".
    USER LANGUAGE: ${language}.
    CONTEXT MODE: ${config.mode.toUpperCase()}.
    USER LEVEL: ${config.difficultyStart.toUpperCase()}.
    
    OBJECTIVE:
    - Use Google Search to find the most accurate, up-to-date information.
    - Break it down into EXACTLY ${count} progressive stages.
    - **CRITICAL**: You MUST generate exactly ${count} items in the 'stages' array. Do not generate 6 if 12 are requested.
    - If User Level is 'novice', ensure the first 30% of stages are foundational (Concept/Structure).
    - If User Level is 'expert', jump straight to advanced topics (Optimization/Internals).
    
    STAGES TEMPLATE (Do not change the focus keys, distribute them logically):
    - Focus keys allowed: "concept", "structure", "process", "nuance", "application", "deep_dive", "edge_cases", "optimization", "insight".
    
    OUTPUT FORMAT (JSON ONLY):
    {
        "title": "Catchy Course Title",
        "description": "Brief summary of what will be learned.",
        "stages": [
            {
                "id": 1,
                "title": "Stage Title",
                "description": "Specific sub-topic description",
                "focus": "concept",
                "icon": "Lightbulb" // Valid Lucide Icon Name
            },
            ... (${count} stages total)
        ]
    }
    `;
};

export const getForgeStagePrompt = (
    topic: string, 
    stageTitle: string, 
    stageDesc: string, 
    focus: string, 
    language: string,
    config: ForgeGenConfig,
    stageIndex: number // 0-based index
) => {
    const isTech = config.mode === 'technical';
    const isNovice = config.difficultyStart === 'novice';
    // STRICTLY enforce screen count based on config
    const screenCount = config.screensPerStage || 6; 

    // --- WIDGET STRATEGY ---
    let widgetInstruction = "";
    
    // Base Strategy based on Topic Focus
    switch (focus) {
        case 'concept': widgetInstruction = "Use 'callout' for definitions and 'flipcard' for key terms."; break;
        case 'structure': widgetInstruction = "Use 'mermaid' (Diagram) or 'visual-quiz'."; break;
        case 'process': widgetInstruction = "Use 'steps-list' or 'mermaid' (Flowchart)."; break;
        case 'nuance': widgetInstruction = "Use 'comparison-table' to contrast ideas."; break;
        case 'application': widgetInstruction = isTech ? "Use 'mini-editor' OR 'interactive-code' with 'fill-in'." : "Use 'quiz' (Scenario)."; break;
        case 'insight': widgetInstruction = "Use 'callout' (Expert Tip)."; break;
        case 'deep_dive': widgetInstruction = isTech ? "Use 'code-walkthrough' or 'terminal'." : "Use 'flipcard'."; break;
        case 'edge_cases': widgetInstruction = "Use 'quiz' (Spot the error) or 'terminal'."; break;
        case 'optimization': widgetInstruction = isTech ? "Use 'comparison-table' or 'interactive-code'." : "Use 'callout'."; break;
    }

    // --- DIFFICULTY & INTERACTION LOGIC ---
    
    if (isNovice && stageIndex < 2) {
        widgetInstruction += `
        \n- **NOVICE PROTECTION ACTIVE**: 
          - Do NOT use 'parsons' or 'mini-editor' yet. The user is new.
          - Use 'interactive-code' (Read-only) to SHOW syntax first.
          - Use 'dialogue' to explain gently.
        `;
    } else if (isTech) {
        widgetInstruction += `
        \n- **TECHNICAL MODE (ACTIVE)**:
          - Include 'mini-editor', 'terminal', or 'parsons' where appropriate.
          - **Mini-Editor**: If using 'mini-editor', provide a valid 'startingCode' and 'taskDescription'.
          - **Code**: Ensure code examples are realistic GLSL/C++/Python/etc based on the topic.
        `;
    }

    return `
    ${BASE_SYSTEM_INSTRUCTION}

    TASK: Generate a Micro-Lesson (${screenCount} screens) for ONE specific stage.
    TOPIC: ${topic}
    STAGE: ${stageTitle} - ${stageDesc} (Stage #${stageIndex + 1})
    USER LANGUAGE: ${language}
    
    CONFIG:
    - Mode: ${config.mode}
    - Difficulty Level: ${config.difficultyStart}

    WIDGET STRATEGY:
    - ${widgetInstruction}
    
    CONSTRAINTS:
    - **SCREEN COUNT**: Generate EXACTLY ${screenCount} screens. This is a hard requirement.
    - Ensure the content is specific to this stage ONLY.
    - **SCREEN DENSITY**: Each screen must have at least 2 widgets (Instruction + Visual/Action) unless it's a complex dashboard like 'mini-editor'.
    - **VISUALS**: If using 'visual-quiz', do NOT invent URLs. Use 'icon' property (Lucide icon name) OR provide a descriptive 'imagePrompt' so the UI can generate it.
    
    OUTPUT: JSON matching LessonPlan schema.
    `;
};
