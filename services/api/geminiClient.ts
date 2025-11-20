import { GoogleGenAI } from "@google/genai";
import { UserPreferences } from "../../types";

/**
 * Creates and configures a GoogleGenAI client based on user preferences.
 * @param preferences - The user's preferences, containing API configuration.
 * @returns A configured GoogleGenAI instance.
 */
export const getGeminiClient = (preferences: UserPreferences): GoogleGenAI => {
    const { provider, gemini } = preferences.apiConfig;

    // Use custom API key if provided
    if (provider === 'gemini-custom' && gemini.apiKey) {
        return new GoogleGenAI({ apiKey: gemini.apiKey });
    }

    // Fallback to environment variable for official/demo use
    // A real-world app should have more robust key management, possibly via a backend proxy.
    const apiKey = process.env.API_KEY || '';
    if (!apiKey) {
        console.warn("API key is not configured for the default provider. Please set the API_KEY environment variable.");
    }

    return new GoogleGenAI({ apiKey });
};