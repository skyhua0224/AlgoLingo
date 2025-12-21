
import { UserStats, ProgressMap, UserPreferences, MistakeRecord, SavedLesson } from "../types";
import { CareerSession } from "../types/career";
import { INITIAL_STATS } from "../constants";

const GIST_FILENAME = "algolingo-data.json";
const GIST_DESC = "AlgoLingo Sync Data";

export interface SyncPayload {
    version: string;
    updatedAt: number;
    stats: UserStats;
    progress: ProgressMap;
    mistakes: MistakeRecord[];
    savedLessons: SavedLesson[];
    careerSessions: CareerSession[];
    preferences: Partial<UserPreferences>;
    engineeringData?: Record<string, any>;
}

export interface GistCommit {
    version: string;
    committedAt: string;
    stats?: { xp: number; streak: number };
}

// Helper: Sanitize Input
const sanitize = (str: string | undefined): string => {
    if (!str) return "";
    return str.trim().replace(/[^\x20-\x7E]/g, '');
};

// Helper: Get Headers
const getHeaders = (token: string) => {
    const cleanToken = sanitize(token);
    if (!cleanToken) throw new Error("Invalid Token.");
    
    return {
        'Authorization': `token ${cleanToken}`,
        'Accept': 'application/vnd.github.v3+json'
    };
};

// 1. Check Status / Discover Gist
export const checkCloudStatus = async (token: string, gistId?: string): Promise<{ 
    exists: boolean; 
    gistId?: string; 
    cloudData?: SyncPayload; 
    error?: string;
    updatedAt?: string;
}> => {
    const cleanToken = sanitize(token);
    if (!cleanToken) return { exists: false, error: "No Token" };

    try {
        let foundGist: any = null;

        // A. If ID provided, check directly
        if (gistId) {
            const res = await fetch(`https://api.github.com/gists/${gistId}`, { headers: getHeaders(cleanToken) });
            if (res.ok) {
                foundGist = await res.json();
            }
        }

        // B. Search by description (Boosted to 100 items for robust discovery)
        if (!foundGist) {
            const res = await fetch(`https://api.github.com/gists?per_page=100`, { headers: getHeaders(cleanToken) });
            if (res.ok) {
                const gists = await res.json();
                
                // Filter matches
                const matches = gists.filter((g: any) => g.description && g.description.trim() === GIST_DESC);
                
                // CRITICAL FIX: Sort by updated_at descending to find the LATEST used gist
                // This prevents picking up an old/stale gist if the user has multiple.
                if (matches.length > 0) {
                    matches.sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
                    foundGist = matches[0];
                }
            }
        }

        if (foundGist && foundGist.files[GIST_FILENAME]) {
            const fileRes = await fetch(foundGist.files[GIST_FILENAME].raw_url);
            if (fileRes.ok) {
                const content = await fileRes.json();
                return { 
                    exists: true, 
                    gistId: foundGist.id, 
                    cloudData: content, 
                    updatedAt: foundGist.updated_at 
                };
            }
        }

        return { exists: false };

    } catch (e: any) {
        return { exists: false, error: e.message };
    }
};

// 2. Fetch Commits (Recovery Slots)
export const getGistCommits = async (token: string, gistId: string): Promise<GistCommit[]> => {
    try {
        const res = await fetch(`https://api.github.com/gists/${gistId}/commits`, { headers: getHeaders(token) });
        if (!res.ok) return [];
        const data = await res.json();
        return data.slice(0, 10).map((c: any) => ({
            version: c.version,
            committedAt: c.committed_at
        }));
    } catch (e) {
        return [];
    }
};

// 3. Push Local -> Cloud
export const pushToGist = async (token: string, data: any, gistId?: string): Promise<{ success: boolean; newGistId?: string; timestamp?: number; error?: string }> => {
    const cleanToken = sanitize(token);
    const cleanGistId = sanitize(gistId);
    const now = Date.now();

    try {
        const payload: SyncPayload = {
            version: "3.5",
            updatedAt: now,
            stats: data.stats || INITIAL_STATS,
            progress: data.progress || {},
            mistakes: data.mistakes || [],
            savedLessons: data.savedLessons || [],
            careerSessions: data.careerSessions || [],
            engineeringData: data.engineeringData || {},
            preferences: {
                userName: data.preferences?.userName,
                targetLanguage: data.preferences?.targetLanguage,
                spokenLanguage: data.preferences?.spokenLanguage,
                theme: data.preferences?.theme,
            }
        };
        
        const payloadString = JSON.stringify(payload, null, 2);

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

        if (!res.ok) throw new Error(`GitHub API Error: ${res.status}`);
        const savedGist = await res.json();
        
        return { success: true, newGistId: savedGist.id, timestamp: now };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
};

// 4. Pull Cloud -> Local
export const pullFromGist = async (token: string, gistId: string): Promise<{ success: boolean; data?: SyncPayload; error?: string }> => {
    const status = await checkCloudStatus(token, gistId);
    if (status.exists && status.cloudData) {
        return { success: true, data: status.cloudData };
    }
    return { success: false, error: status.error || "Data not found" };
};
