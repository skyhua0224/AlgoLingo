
import { useState, useRef, useCallback, useEffect } from 'react';
import { SyncStatus, SyncConfig } from '../types';
import { pushToGist, checkCloudStatus } from '../services/githubService';

interface UseSyncProps {
    config: SyncConfig;
    onGetFreshData: () => any; // Callback to get latest state ref
    onSyncComplete: (newConfig: Partial<SyncConfig>) => void;
}

export const useSync = ({ config, onGetFreshData, onSyncComplete }: UseSyncProps) => {
    const [status, setStatus] = useState<SyncStatus>('idle');
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Immediate or Debounced Sync Trigger
    const requestSync = useCallback((options?: { force?: boolean; delay?: number }) => {
        const { force = false, delay = 5000 } = options || {};

        if (!config.enabled || !config.githubToken) return;

        // Clear existing timer
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        const execute = async () => {
            setStatus('syncing');
            try {
                // 1. Conflict Check (Lightweight)
                // We optimize by trusting local timestamp mostly, but robust check is safer
                const cloud = await checkCloudStatus(config.githubToken, config.gistId);
                
                if (cloud.exists && cloud.cloudData) {
                    const cloudTime = new Date(cloud.updatedAt || 0).getTime();
                    const localTime = config.lastSynced || 0;
                    
                    // Simple Conflict Safety: If cloud is significantly newer (> 5 mins), warn user
                    // Otherwise, we assume local is the truth source for this session
                    if (cloudTime > localTime + 1000 * 60 * 5) {
                        setStatus('conflict');
                        return;
                    }
                }

                // 2. Capture Data (Latest Snapshot)
                const payload = onGetFreshData();
                
                // 3. Push
                const res = await pushToGist(config.githubToken, payload, config.gistId);
                
                if (res.success) {
                    setStatus('synced');
                    onSyncComplete({ 
                        gistId: res.newGistId, 
                        lastSynced: res.timestamp 
                    });
                } else {
                    setStatus('error');
                }
            } catch (e) {
                console.error("Sync failed", e);
                setStatus('error');
            }
        };

        if (force) {
            execute();
        } else {
            setStatus('syncing'); // Optimistic UI: Show we are "pending save"
            timeoutRef.current = setTimeout(execute, delay);
        }
    }, [config, onGetFreshData, onSyncComplete]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return { status, requestSync };
};
