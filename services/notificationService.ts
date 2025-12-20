
import { GoogleGenAI } from "@google/genai";
import { UserStats, UserPreferences } from "../types";

export const sendWebhookNotification = async (
    config: UserPreferences['notificationConfig'],
    message: string
): Promise<boolean> => {
    if (!config.enabled || !config.webhookUrl) return false;

    try {
        let url = config.webhookUrl;
        
        // Bark specific formatting
        if (config.type === 'bark') {
             // Bark format: URL/Title/Body
             // If URL doesn't end with /, add it
             if (!url.endsWith('/')) url += '/';
             // Encode params
             const title = encodeURIComponent("AlgoLingo");
             const body = encodeURIComponent(message);
             url = `${url}${title}/${body}?group=AlgoLingo&icon=https://cdn-icons-png.flaticon.com/512/10434/10434252.png`;
             
             await fetch(url);
             return true;
        } else if (config.type === 'telegram') {
             // Expected URL: https://api.telegram.org/bot<token>/sendMessage?chat_id=<id>
             // Or user just pastes the full hook. We assume they paste a full URL that accepts GET/POST
             // Simple generic webhook POST
             await fetch(url, {
                 method: 'POST',
                 headers: {'Content-Type': 'application/json'},
                 body: JSON.stringify({ text: message, body: message }) // Generic fields
             });
             return true;
        } else {
             // Generic GET
             await fetch(`${url}?msg=${encodeURIComponent(message)}`);
             return true;
        }
    } catch (e) {
        console.error("Notification Failed", e);
        return false;
    }
};

export const generateAiNotification = async (
    stats: UserStats,
    preferences: UserPreferences,
    event: 'lesson_complete' | 'streak_danger'
): Promise<string> => {
    let client: GoogleGenAI;
    if (preferences.apiConfig.provider === 'gemini-custom') {
        client = new GoogleGenAI({ apiKey: preferences.apiConfig.gemini.apiKey || '' });
    } else {
        client = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    }

    const lang = preferences.spokenLanguage;
    const context = `
    User Stats: Streak ${stats.streak}, XP ${stats.xp}.
    Event: ${event}.
    Language: ${lang}.
    Goal: Generate a short, witty, nerdy notification message (max 20 words).
    Style: Like a senior engineer colleague or a game RPG system.
    `;

    try {
        const res = await client.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: context
        });
        return res.text || (lang === 'Chinese' ? "任务完成！保持连胜！" : "Quest Complete! Keep the streak alive!");
    } catch (e) {
        return lang === 'Chinese' ? "系统消息：同步成功。" : "System: Sync complete.";
    }
};
