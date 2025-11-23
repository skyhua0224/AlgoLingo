
// This file is now a facade for the modular AI services in ./ai/
// This ensures backward compatibility with existing imports in App.tsx

export { 
    generateLessonPlan, 
    generateLeetCodeContext, 
    validateUserCode, 
    generateReviewLesson, 
    generateSyntaxClinicPlan, 
    generateAiAssistance,
    generateVariantLesson,
    generateDailyWorkoutPlan
} from "./ai/generator";
