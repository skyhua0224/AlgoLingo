
// Prompt for Dynamic Tracks
// 1. Syllabus Generation (JSON list of chapters)
// 2. Chapter Lesson Generation (Full 17-screen lesson)

export const getTrackSyllabusPrompt = (userQuery: string) => {
    return `Generate a structured syllabus for learning: ${userQuery}. Return JSON with chapters.`;
};

export const getTrackLessonPrompt = (chapterTitle: string, context: string) => {
    return `Generate a lesson for chapter "${chapterTitle}" within the context of "${context}".`;
};
