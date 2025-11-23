
import { GoogleGenAI } from "@google/genai";
import { UserPreferences } from "../../types";

export const getClient = (preferences: UserPreferences) => {
    if (preferences.apiConfig.provider === 'gemini-custom') {
        return new GoogleGenAI({ apiKey: preferences.apiConfig.gemini.apiKey || '' });
    } else {
        return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    }
};
