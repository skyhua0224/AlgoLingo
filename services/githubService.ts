
import { UserStats, ProgressMap, UserPreferences, MistakeRecord, SavedLesson } from "../types";
import { CareerSession } from "../types/career";
import { INITIAL_STATS } from "../constants";

const GIST_FILENAME = "algolingo-data.json";
const GIST_DESC = "AlgoLingo Sync Data (Do not edit manually unless you know what you are doing)";

export interface SyncPayload {
    version: string;
    updatedAt: number;
    stats: UserStats;
    progress: ProgressMap;
    mistakes: MistakeRecord[];
    savedLessons: SavedLesson[]; // Added
    careerSessions: CareerSession[]; // Added
    preferences: Partial<UserPreferences>;
    engineeringData?: Record<string, any>;
}

// Helper: Sanitize Input (Remove non-ASCII characters and whitespace)
const sanitize = (str: string | undefined): string => {
    if (!str) return "";
    return str.trim().replace(/[^\x20-\x7E]/g, '');
};

// Helper: Get Headers
const getHeaders = (token: string) => {
    const cleanToken = sanitize(token);
    if (!cleanToken) throw new Error("Invalid Token: Token is empty or contains invalid characters.");
    
    return {
        'Authorization': `token ${cleanToken}`,
        'Accept': 'application/vnd.github.v3+json'
    };
};

// 1. Check Status
export const checkCloudStatus = async (token: string, gistId?: string): Promise<{ 
    exists: boolean; 
    gistId?: string; 
    cloudData?: SyncPayload; 
    error?: string 
}> => {
    const cleanToken = sanitize(token);
    if (!cleanToken) return { exists: false, error: "No Token" };

    try {
        let targetGistId = sanitize(gistId);
        let foundGist: any = null;

        // A. If ID provided, check directly
        if (targetGistId) {
            const res = await fetch(`https://api.github.com/gists/${targetGistId}`, { headers: getHeaders(cleanToken) });
            if (res.ok) {
                foundGist = await res.json();
            } else if (res.status !== 404) {
                throw new Error(`Gist Check Failed: ${res.status}`);
            }
        }

        // B. If no ID or ID failed, search by description
        if (!foundGist) {
            const res = await fetch(`https://api.github.com/gists`, { headers: getHeaders(cleanToken) });
            if (res.ok) {
                const gists = await res.json();
                if (Array.isArray(gists)) {
                    foundGist = gists.find((g: any) => g.description === GIST_DESC);
                }
            }
        }

        if (foundGist && foundGist.files[GIST_FILENAME]) {
            const fileRes = await fetch(foundGist.files[GIST_FILENAME].raw_url);
            if (fileRes.ok) {
                const content = await fileRes.json();
                return { exists: true, gistId: foundGist.id, cloudData: content };
            }
        }

        return { exists: false };

    } catch (e: any) {
        console.error("Cloud Check Error:", e);
        return { exists: false, error: e.message };
    }
};

// 2. Push Local -> Cloud
export const pushToGist = async (token: string, data: any, gistId?: string): Promise<{ success: boolean; newGistId?: string; timestamp?: number; error?: string }> => {
    const cleanToken = sanitize(token);
    const cleanGistId = sanitize(gistId);
    
    const now = Date.now();
    let payloadString = "";

    try {
        // Construct clean payload
        const payload: SyncPayload = {
            version: "3.2", // Bump version
            updatedAt: now,
            stats: data.stats || INITIAL_STATS,
            progress: data.progress || {},
            mistakes: data.mistakes || [],
            savedLessons: data.savedLessons || [], // Include History
            careerSessions: data.careerSessions || [], // Include Career
            engineeringData: data.engineeringData || {},
            preferences: {
                userName: data.preferences?.userName,
                targetLanguage: data.preferences?.targetLanguage,
                spokenLanguage: data.preferences?.spokenLanguage,
                theme: data.preferences?.theme,
            }
        };
        
        // Safe stringify with duplicate detection
        const cache: any[] = [];
        payloadString = JSON.stringify(payload, (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (cache.includes(value)) return;
                cache.push(value);
            }
            return value;
        }, 2);
    } catch (e: any) {
        return { success: false, error: "Data serialization failed" };
    }

    try {
        const body = {
            description: GIST_DESC,
            public: false,
            files: { [GIST_FILENAME]: { content: payloadString } }
        };

        const url = cleanGistId ? `https://api.github.com/gists/${cleanGistId}` : `https://api.github.com/gists`;
        const method = cleanGistId ? 'PATCH' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: getHeaders(cleanToken),
            body: JSON.stringify(body)
        });

        if (!res.ok) throw new Error(`GitHub API ${res.status}`);
        const savedGist = await res.json();
        
        return { success: true, newGistId: savedGist.id, timestamp: now };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
};

// 3. Pull Cloud -> Local
export const pullFromGist = async (token: string, gistId: string): Promise<{ success: boolean; data?: SyncPayload; error?: string }> => {
    const cleanToken = sanitize(token);
    const cleanGistId = sanitize(gistId);
    
    const status = await checkCloudStatus(cleanToken, cleanGistId);
    if (status.exists && status.cloudData) {
        return { success: true, data: status.cloudData };
    }
    return { success: false, error: status.error || "No data found" };
};
