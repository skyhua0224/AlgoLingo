
import { UserStats, ProgressMap, UserPreferences, MistakeRecord } from "../types";
import { INITIAL_STATS } from "../constants";

const GIST_FILENAME = "algolingo-data.json";
const GIST_DESC = "AlgoLingo Sync Data (Do not edit manually unless you know what you are doing)";

interface SyncData {
    version: string;
    updatedAt: number;
    stats: UserStats;
    progress: ProgressMap;
    mistakes: MistakeRecord[];
    preferences: Partial<UserPreferences>;
}

export const syncWithGist = async (
    token: string, 
    gistId: string | undefined, 
    currentData: { stats: UserStats, progress: ProgressMap, mistakes: MistakeRecord[], preferences: UserPreferences }
): Promise<{ success: boolean, data?: Partial<SyncData>, newGistId?: string, error?: string, action?: 'pulled' | 'pushed' | 'none' }> => {
    
    if (!token) return { success: false, error: "No Token" };

    // 1. Construct Payload
    // Robustly handle potentially null stats from local storage by falling back to INITIAL_STATS
    const payload: SyncData = {
        version: "3.0",
        updatedAt: Date.now(),
        stats: currentData.stats || INITIAL_STATS,
        progress: currentData.progress || {},
        mistakes: currentData.mistakes || [],
        preferences: {
            userName: currentData.preferences?.userName,
            targetLanguage: currentData.preferences?.targetLanguage,
            spokenLanguage: currentData.preferences?.spokenLanguage,
            theme: currentData.preferences?.theme,
            // Do not sync API keys or Token itself for security
        }
    };

    try {
        let targetGistId = gistId;
        let existingData: SyncData | null = null;

        // 2. If we have an ID, try to fetch it first
        if (targetGistId) {
            const res = await fetch(`https://api.github.com/gists/${targetGistId}`, {
                headers: { 
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (res.ok) {
                const gist = await res.json();
                // DEFENSIVE CODING: Use Optional Chaining for safe access
                const file = gist.files?.[GIST_FILENAME];
                
                if (file && file.content) {
                    try {
                        existingData = JSON.parse(file.content);
                    } catch (e) {
                        console.warn("Failed to parse existing Gist content", e);
                        existingData = null;
                    }
                }
            } else if (res.status === 404) {
                targetGistId = undefined; // ID Invalid, treat as new
            }
        } else {
            // Try to find existing gist by description if ID not provided
             const res = await fetch(`https://api.github.com/gists`, {
                headers: { 
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
             if (res.ok) {
                 const gists = await res.json();
                 const found = gists.find((g: any) => g.description === GIST_DESC);
                 if (found) {
                     targetGistId = found.id;
                     if (found.files && found.files[GIST_FILENAME] && found.files[GIST_FILENAME].raw_url) {
                        const fileRes = await fetch(found.files[GIST_FILENAME].raw_url);
                        existingData = await fileRes.json();
                     }
                 }
             }
        }

        // 3. Conflict Resolution (Last Write Wins based on updatedAt)
        if (existingData) {
            // Cloud is newer -> PULL
            const localTime = currentData.preferences.syncConfig?.lastSynced || 0;
            if ((existingData.updatedAt || 0) > localTime) {
                console.log("Cloud is newer. Pulling...");
                return { success: true, data: existingData, newGistId: targetGistId, action: 'pulled' };
            }
        }

        // Local is newer or Cloud doesn't exist -> PUSH
        const body = {
            description: GIST_DESC,
            public: false,
            files: {
                [GIST_FILENAME]: {
                    content: JSON.stringify(payload, null, 2)
                }
            }
        };

        const url = targetGistId ? `https://api.github.com/gists/${targetGistId}` : `https://api.github.com/gists`;
        const method = targetGistId ? 'PATCH' : 'POST';

        const saveRes = await fetch(url, {
            method: method,
            headers: { 
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!saveRes.ok) throw new Error("Failed to save to GitHub");
        const savedGist = await saveRes.json();

        return { success: true, newGistId: savedGist.id, action: 'pushed' };

    } catch (e: any) {
        return { success: false, error: e.message || "Sync Failed" };
    }
};
