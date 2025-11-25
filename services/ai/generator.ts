
import { getClient } from "./client";
import { getLessonPlanSystemInstruction, getLeetCodeContextSystemInstruction, getJudgeSystemInstruction, getVariantSystemInstruction, getDailyWorkoutSystemInstruction } from "./prompts";
import { getSystemArchitectPrompt } from "./prompts/engineering/system_architect";
import { getCSKernelPrompt } from "./prompts/engineering/cs_kernel";
import { getSyntaxRoadmapPrompt } from "./prompts/engineering/syntax_roadmap";
import { getSyntaxTrainerPrompt } from "./prompts/engineering/syntax_trainer";
import { lessonPlanSchema, leetCodeContextSchema, judgeResultSchema } from "./schemas";
import { UserPreferences, MistakeRecord, LessonPlan, Widget, LeetCodeContext, SavedLesson } from "../../types";
import { PROBLEM_MAP } from "../../constants";
import { SyntaxProfile, SyntaxUnit, SyntaxLesson } from "../../types/engineering";

// --- CUSTOM ERROR CLASS ---
export class AIGenerationError extends Error {
    rawOutput?: string;
    constructor(message: string, rawOutput?: string) {
        super(message);
        this.name = "AIGenerationError";
        this.rawOutput = rawOutput;
    }
}

// --- VALIDATION HELPER ---
const isValidWidget = (w: Widget): boolean => {
    if (!w || !w.type) {
        return false;
    }
    
    const type = w.type.toLowerCase();
    
    switch (type) {
        case 'dialogue': 
            return !!w.dialogue && typeof w.dialogue.text === 'string';
        case 'flipcard': 
            return !!w.flipcard && (!!w.flipcard.front || !!w.flipcard.back); 
        case 'quiz': 
            return !!w.quiz && !!w.quiz.question && Array.isArray(w.quiz.options);
        case 'code': 
            // 'code' is deprecated, but we validate it before conversion
            return !!w.code && !!w.code.content;
        case 'interactive-code': 
            // Relaxed check because we repair it in generator
            return !!w.interactiveCode || !!(w as any).code; 
        case 'parsons': 
            return !!w.parsons && Array.isArray(w.parsons.lines);
        case 'fill-in': 
            return !!w.fillIn && !!w.fillIn.code;
        case 'leetcode': 
            return !!w.leetcode && !!w.leetcode.problemSlug;
        case 'steps-list': 
            return !!w.stepsList && Array.isArray(w.stepsList.items);
        case 'callout': 
            return !!w.callout && !!w.callout.title;
        // New Widgets
        case 'terminal':
            return !!w.terminal && !!w.terminal.command;
        case 'code-walkthrough':
            return !!w.codeWalkthrough && !!w.codeWalkthrough.code;
        case 'mini-editor':
            return !!w.miniEditor && !!w.miniEditor.startingCode;
        case 'arch-canvas':
            return !!w.archCanvas && !!w.archCanvas.goal;
        default: 
            return false;
    }
};

// --- GENERIC API CALL WRAPPER ---
const callAI = async (
    preferences: UserPreferences,
    systemInstruction: string,
    prompt: string,
    schema?: any,
    jsonMode: boolean = false
): Promise<string> => {
    const provider = preferences.apiConfig.provider;

    // 1. OpenAI Compatible
    if (provider === 'openai') {
        const { apiKey, baseUrl, model } = preferences.apiConfig.openai;
        const url = `${baseUrl || 'https://api.openai.com/v1'}/chat/completions`;
        
        try {
            const body: any = {
                model: model || 'gpt-4o',
                messages: [
                    { role: 'system', content: systemInstruction },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.4,
                frequency_penalty: 0.5,
            };

            if (jsonMode) {
                body.response_format = { type: "json_object" };
                body.messages[0].content += "\n\nIMPORTANT: OUTPUT MUST BE VALID JSON MATCHING THE REQUESTED SCHEMA.";
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`OpenAI API Error ${response.status}: ${err}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || "";
        } catch (e: any) {
            console.error("OpenAI Call Failed", e);
            throw e;
        }
    }

    // 2. Google Gemini
    const client = getClient(preferences);
    const modelId = preferences.apiConfig.gemini.model || 'gemini-2.5-flash';
    
    const safeSystemInstruction = systemInstruction + `
    
    CRITICAL SAFETY:
    - DO NOT generate infinite loops of emojis.
    - DO NOT repeat the same phrase more than once.
    - If you are stuck, stop generating.
    `;

    try {
        const response = await client.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                systemInstruction: safeSystemInstruction,
                responseMimeType: jsonMode ? "application/json" : undefined,
                responseSchema: jsonMode ? schema : undefined,
                temperature: 0.4,
            }
        });
        return response.text || "";
    } catch (e) {
        console.error("Gemini API Error", e);
        throw e;
    }
};


// --- LESSON PLAN GENERATOR ---
export const generateLessonPlan = async (
  problemName: string, 
  phaseIndex: number, 
  preferences: UserPreferences,
  mistakes: MistakeRecord[] = [],
  savedLessons: SavedLesson[] = []
): Promise<LessonPlan> => {
  
  const targetLang = preferences.targetLanguage;
  const speakLang = preferences.spokenLanguage;
  const systemInstruction = getLessonPlanSystemInstruction(problemName, targetLang, speakLang, phaseIndex);
  
  let userPrompt = `Generate the lesson plan for Phase ${phaseIndex + 1} of ${problemName}.`;
  if (mistakes.length > 0) {
      userPrompt += `\nContext: The user previously struggled with: ${mistakes.map(m => m.context).join(', ')}. Please reinforce these concepts.`;
  }

  let text = "";

  try {
      console.log(`[AI] Generating Plan for ${problemName} using ${preferences.apiConfig.provider}...`);
      
      text = await callAI(
          preferences, 
          systemInstruction, 
          userPrompt, 
          lessonPlanSchema, 
          true // JSON Mode
      );
      
      if (!text) throw new Error("Empty response from AI");
      
      let plan: LessonPlan;
      try {
          const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
          plan = JSON.parse(cleanText);
      } catch (e) {
          console.error("[AI] JSON Parse Error:", e);
          throw new AIGenerationError("JSON Parse Error: The AI response was not valid JSON.", text);
      }

      // --- CLIENT SIDE SANITIZATION & REPAIR ---
      if (!plan.screens) plan.screens = [];
      
      plan.screens = plan.screens.map(screen => {
          if (!screen.widgets) screen.widgets = [];
          
          let newWidgets: Widget[] = [];

          screen.widgets.forEach(w => {
              // Normalize Type
              if (w.type) w.type = w.type.toLowerCase() as any;

              // 1. REPAIR: Legacy 'code' type -> 'interactive-code'
              if (w.type === 'code' || (w as any).type === 'code-display') {
                   const codeContent = (w as any).code?.content || (w as any).content || "";
                   const lang = (w as any).code?.language || (w as any).language || targetLang.toLowerCase();
                   
                   if (codeContent) {
                       const lines = codeContent.split('\n').map((l: string) => ({ code: l, explanation: '' }));
                       newWidgets.push({
                           id: w.id || `fixed_code_${Math.random().toString(36).substr(2,5)}`,
                           type: 'interactive-code',
                           interactiveCode: {
                               language: lang,
                               lines: lines,
                               caption: (w as any).code?.caption
                           }
                       });
                   }
                   return; // Skip the old widget
              }

              // 2. REPAIR: Check for "code" nested inside "dialogue" (Common Hallucination)
              if (w.type === 'dialogue') {
                  newWidgets.push(w); // Push the dialogue itself first
                  
                  // Hallucination check: Does it have a 'code' property?
                  if ((w as any).code) {
                      const codeData = (w as any).code;
                      // Extract it into a separate valid InteractiveCode widget
                      newWidgets.push({
                          id: `auto_extracted_code_${w.id}_${Math.random().toString(36).substr(2,5)}`,
                          type: 'interactive-code',
                          interactiveCode: {
                              language: codeData.language || targetLang.toLowerCase(),
                              lines: codeData.content 
                                  ? codeData.content.split('\n').map((line: string) => ({
                                      code: line,
                                      explanation: "Code snippet from context."
                                  })) 
                                  : [],
                              caption: "Code Example"
                          }
                      });
                      delete (w as any).code; // Clean up the dirty property
                  }
              } 
              // 3. REPAIR: Malformed Interactive Code
              else if (w.type === 'interactive-code') {
                  // Case A: AI put data in 'code' instead of 'interactiveCode'
                  if (!w.interactiveCode && w.code) {
                      w.interactiveCode = {
                          language: w.code.language || 'python',
                          lines: w.code.content ? w.code.content.split('\n').map((line: string) => ({
                              code: line,
                              explanation: w.code?.caption || "Logic step"
                          })) : [],
                          caption: w.code.caption
                      };
                  }
                  
                  // Case B: AI put data in 'interactive_code' (snake_case)
                  if (!w.interactiveCode && (w as any).interactive_code) {
                      w.interactiveCode = (w as any).interactive_code;
                  }

                  // Case C: Missing structure entirely
                  if (!w.interactiveCode) {
                      w.interactiveCode = { language: 'python', lines: [] };
                  }

                  // Case D: Lines is string[] instead of object[]
                  if (w.interactiveCode.lines && Array.isArray(w.interactiveCode.lines)) {
                      if (w.interactiveCode.lines.length > 0 && typeof w.interactiveCode.lines[0] === 'string') {
                          w.interactiveCode.lines = (w.interactiveCode.lines as any as string[]).map(line => ({
                              code: line,
                              explanation: "Explanation generated by system."
                          }));
                      }
                  }
                  
                  newWidgets.push(w);
              }
              // 4. Fix Fill-In
              else if (w.type === 'fill-in' && w.fillIn) {
                  if (w.fillIn.inputMode === 'select' && (!w.fillIn.options || w.fillIn.options.length === 0)) {
                      w.fillIn.options = [...(w.fillIn.correctValues || []), "Option A", "Option B"];
                  }
                  newWidgets.push(w);
              }
              // 5. Fix Quiz
              else if (w.type === 'quiz' && w.quiz) {
                  if (typeof w.quiz.correctIndex === 'string') {
                      w.quiz.correctIndex = parseInt(w.quiz.correctIndex, 10);
                  }
                  if (isNaN(w.quiz.correctIndex)) w.quiz.correctIndex = 0;
                  newWidgets.push(w);
              }
              // Standard push for others
              else {
                  newWidgets.push(w);
              }
          });

          // --- FIX LONELY DIALOGUE (AGGRESSIVE MODE) ---
          // If a screen ends up with only 1 widget and it's a dialogue, we MUST inject a companion.
          if (newWidgets.length === 1 && newWidgets[0].type === 'dialogue') {
              const dialogueText = newWidgets[0].dialogue?.text || "";
              const textLower = dialogueText.toLowerCase();
              
              // Detect intent from text
              const isCodeMentioned = textLower.includes('code') || textLower.includes('example') || textLower.includes('代码') || textLower.includes('function') || textLower.includes('class');
              const isQuestion = textLower.includes('?') || textLower.includes('what') || textLower.includes('how') || textLower.includes('什么') || textLower.includes('如何');

              if (isCodeMentioned) {
                   // Inject Code Placeholder
                   newWidgets.push({
                      id: `auto_filler_code_${screen.id}`,
                      type: 'interactive-code',
                      interactiveCode: {
                          language: targetLang.toLowerCase(),
                          lines: [{ code: `# Code example for: ${screen.header || 'Concept'}`, explanation: "Visual aid generated by system." }, { code: "# (AI omitted code, this is a placeholder)", explanation: "..." }],
                          caption: "Code Example"
                      }
                   });
              } else if (isQuestion) {
                   // Inject Quiz Placeholder
                   newWidgets.push({
                       id: `auto_filler_quiz_${screen.id}`,
                       type: 'quiz',
                       quiz: {
                           question: "Quick Check: Did you understand the previous point?",
                           options: ["Yes, absolutely.", "Sort of.", "Not really."],
                           correctIndex: 0,
                           explanation: "This is a checkpoint to ensure you are following along."
                       }
                   });
              } else {
                   // Inject Callout
                   newWidgets.push({
                      id: `auto_filler_callout_${screen.id}`,
                      type: 'callout',
                      callout: {
                          title: "Key Takeaway",
                          text: "This concept is foundational for the next steps. Make sure you grasp it!",
                          variant: "info"
                      }
                   });
              }
          }

          // --- FINAL VALIDATION FILTER ---
          const validWidgets = newWidgets.filter(w => isValidWidget(w));

          // Ensure only one interactive widget per screen to prevent overwhelming user
          const interactiveTypes = ['quiz', 'parsons', 'fill-in', 'leetcode', 'steps-list', 'terminal', 'code-walkthrough', 'mini-editor', 'arch-canvas', 'interactive-code'];
          let interactiveCount = 0;
          
          const finalWidgets = validWidgets.filter(w => {
              const isInteractive = interactiveTypes.includes(w.type) || 
                                   (w.type === 'flipcard' && w.flipcard?.mode === 'assessment');
              
              if (isInteractive) {
                  if (interactiveCount > 0) return false; 
                  interactiveCount++;
                  return true;
              }
              return true; 
          });
          
          // Fallback: If filtering removed everything (rare), restore at least the dialogue
          if (finalWidgets.length === 0 && newWidgets.length > 0) {
              return { ...screen, widgets: [newWidgets[0]] };
          }
          
          return { ...screen, widgets: finalWidgets };
      });

      plan.screens = plan.screens.filter(s => s.widgets.length > 0);
      
      if (plan.screens.length === 0) {
          throw new AIGenerationError("Validation Error: AI generated 0 valid screens.", text);
      }

      return plan;

  } catch (error: any) {
      if (error instanceof AIGenerationError) {
          throw error;
      }
      throw new AIGenerationError(error.message || "Unknown Generation Error", text);
  }
};

export const generateDailyWorkoutPlan = async (
    mistakes: MistakeRecord[],
    learnedProblemIds: string[],
    preferences: UserPreferences
): Promise<LessonPlan> => {
    const learnedProblemNames = learnedProblemIds.map(id => PROBLEM_MAP[id]).filter(n => !!n);
    if (learnedProblemNames.length === 0) {
        return generateLessonPlan("Two Sum", 0, preferences);
    }

    const topMistakes = mistakes.slice(0, 5);
    const mistakeContext = topMistakes.map(m => `Problem: ${m.problemName}, Failed Logic: ${m.context}`).join('\n');

    const systemInstruction = getDailyWorkoutSystemInstruction(preferences.targetLanguage, preferences.spokenLanguage);
    const prompt = `
    GENERATE DAILY WORKOUT
    LEARNED PROBLEMS (ALLOWED CONTENT): ${learnedProblemNames.join(', ')}
    RECENT MISTAKES (PRIORITIZE FIXING THESE): ${mistakeContext || "None. Focus on general reinforcement."}
    `;

    const text = await callAI(preferences, systemInstruction, prompt, lessonPlanSchema, true);
    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
    
    const plan: LessonPlan = JSON.parse(cleanText);
    plan.title = preferences.spokenLanguage === 'Chinese' ? "📅 今日智能特训" : "📅 Daily Smart Workout";
    return plan;
};

export const generateVariantLesson = async (
    mistake: MistakeRecord,
    preferences: UserPreferences
): Promise<LessonPlan> => {
    const systemInstruction = getVariantSystemInstruction(preferences.targetLanguage, preferences.spokenLanguage);
    const prompt = `Create VARIANT of: ${mistake.problemName}. Widget Data: ${JSON.stringify(mistake.widget)}`;
    const text = await callAI(preferences, systemInstruction, prompt, lessonPlanSchema, true);
    return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
};

export const generateLeetCodeContext = async (
    problemName: string,
    preferences: UserPreferences
): Promise<LeetCodeContext> => {
    const systemInstruction = getLeetCodeContextSystemInstruction(problemName, preferences.spokenLanguage, preferences.targetLanguage);
    try {
        const text = await callAI(preferences, systemInstruction, `Generate full LeetCode simulation data for ${problemName}`, leetCodeContextSchema, true);
        return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    } catch (error: any) {
        throw error;
    }
};

export const validateUserCode = async (code: string, problemDesc: string, preferences: UserPreferences, languageOverride?: string) => {
    const targetLang = languageOverride || preferences.targetLanguage;
    const systemInstruction = getJudgeSystemInstruction(targetLang, preferences.spokenLanguage);
    const prompt = `Problem: ${problemDesc}\nUser Code:\n\`\`\`${targetLang}\n${code}\n\`\`\``;
    try {
        const text = await callAI(preferences, systemInstruction, prompt, judgeResultSchema, true);
        return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    } catch (e) {
        return { status: "Runtime Error", error_message: "Judge Connection Failed.", test_cases: [] };
    }
};

export const generateEngineeringLesson = async (
    pillar: 'system' | 'cs',
    topic: string,
    keywords: string[],
    level: string, 
    preferences: UserPreferences,
    extraContext?: string 
): Promise<LessonPlan> => {
    const systemInstruction = pillar === 'system' 
        ? getSystemArchitectPrompt(topic, keywords, level, extraContext)
        : getCSKernelPrompt(topic, keywords, level); 
        
    const prompt = `Generate a comprehensive engineering lesson for: ${topic}. Phase: ${level}. Context: ${extraContext || 'General'}`;

    try {
        const text = await callAI(preferences, systemInstruction, prompt, lessonPlanSchema, true);
        const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
        const plan = JSON.parse(cleanText);
        plan.context = { type: 'pillar', pillar, topic, phaseIndex: 0, levelId: level }; 
        return plan;
    } catch (e: any) {
        console.error("Engineering Lesson Generation Failed", e);
        throw new AIGenerationError("Failed to generate engineering lesson.");
    }
};

// Re-exports
export const generateReviewLesson = async (mistakes: MistakeRecord[], preferences: UserPreferences) => generateDailyWorkoutPlan(mistakes, ["p_1"], preferences);
export const generateSyntaxClinicPlan = async (preferences: UserPreferences) => generateLessonPlan("Syntax Clinic", 1, preferences); 
export const generateSyntaxRoadmap = async (profile: any, preferences: UserPreferences) => {
    const prompt = getSyntaxRoadmapPrompt(profile);
    const text = await callAI(preferences, "You are a curriculum designer.", prompt, undefined, false); 
    try {
       const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
       const data = JSON.parse(cleanText);
       return data.units.map((u: any, idx: number) => ({
            ...u,
            status: idx === 0 ? 'active' : 'locked',
            lessons: u.lessons.map((l: any, lIdx: number) => ({
                ...l,
                status: (idx === 0 && lIdx === 0) ? 'active' : 'locked',
                currentPhaseIndex: 0
            }))
        }));
    } catch(e) {
        throw new Error("Roadmap Gen Failed");
    }
};

export const generateSyntaxLesson = async (unit: any, lesson: any, stageId: string, profile: any, preferences: UserPreferences) => {
    const systemInstruction = getSyntaxTrainerPrompt(profile, unit, lesson, stageId, preferences.spokenLanguage);
    const prompt = `Generate lesson for ${lesson.title.en}. Stage: ${stageId}.`;
    const text = await callAI(preferences, systemInstruction, prompt, lessonPlanSchema, true);
    const plan = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    plan.context = { type: 'syntax', language: profile.language, unitId: unit.id, lessonId: lesson.id, phaseIndex: stageId === 'sandbox' ? 6 : parseInt(stageId) };
    return plan;
}

export const generateAiAssistance = async (context: string, userQuery: string, preferences: UserPreferences, model: string) => {
    try {
        return await callAI(preferences, "You are a helpful coding assistant. Be brief.", `Context:\n${context}\n\nUser Question: ${userQuery}\n\nAnswer briefly.`, undefined, false);
    } catch (e) {
        return "AI is offline.";
    }
};
