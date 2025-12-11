
import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { UserPreferences } from '../../types';
import { checkCloudStatus, pushToGist, pullFromGist, SyncPayload } from '../../services/githubService';
import { GistModal } from './GistModal';
import { SyncConflictModal } from './SyncConflictModal';

import { SettingsSidebar } from './SettingsSidebar';
import { GeneralTab } from './tabs/GeneralTab';
import { AITab } from './tabs/AITab';
import { SyncTab } from './tabs/SyncTab';
import { AppearanceTab } from './tabs/AppearanceTab';
import { NotificationTab } from './tabs/NotificationTab';
import { DataTab } from './tabs/DataTab';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (p: Partial<UserPreferences>) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  t: any;
  isZh: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, preferences, onUpdatePreferences, onExportData, onImportData, t, isZh 
}) => {
    const [activeTab, setActiveTab] = useState('general');
    const [tempPrefs, setTempPrefs] = useState<UserPreferences>(preferences);
    
    // Sync State
    const [syncState, setSyncState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [syncMessage, setSyncMessage] = useState('');
    const [showGistIdModal, setShowGistIdModal] = useState<string | null>(null);
    const [conflictData, setConflictData] = useState<{local: any, cloud: any} | null>(null);

    // Sync temp state with props when opening OR when preferences change externally (e.g. import)
    useEffect(() => {
        setTempPrefs(preferences);
        if (isOpen) {
            setSyncState('idle');
            setSyncMessage('');
        }
    }, [isOpen, preferences]);

    if (!isOpen) return null;

    const handleSave = () => {
        onUpdatePreferences(tempPrefs);
        onClose();
    };

    // Helper to collect all local data
    const collectLocalData = () => {
        const engineeringData: Record<string, any> = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            // Collect Engineering V3 keys, Solution Strategy keys, AND Context keys (problem details)
            if (key && (
                key.startsWith('algolingo_syntax_v3_') || 
                key.startsWith('algolingo_eng_v3_') || 
                key.startsWith('algolingo_sol_v3_') || 
                key.startsWith('algolingo_ctx_v3_')
            )) {
                try { engineeringData[key] = JSON.parse(localStorage.getItem(key)!); } catch (e) {}
            }
        }
        ['algolingo_my_tracks', 'algolingo_forge_history_v2', 'algolingo_discovered_tracks', 'algolingo_career_sessions'].forEach(key => {
                const val = localStorage.getItem(key);
                if (val) try { engineeringData[key] = JSON.parse(val); } catch(e) {}
        });

        return {
            stats: JSON.parse(localStorage.getItem('algolingo_stats') || '{}'),
            progress: JSON.parse(localStorage.getItem('algolingo_progress_v2') || '{}'),
            mistakes: JSON.parse(localStorage.getItem('algolingo_mistakes') || '[]'),
            preferences: tempPrefs, // Use current temp prefs
            engineeringData
        };
    };

    const handleSyncTrigger = async () => {
        const token = tempPrefs.syncConfig?.githubToken;
        const gistId = tempPrefs.syncConfig?.gistId;

        if (!token) {
            setSyncState('error');
            setSyncMessage(isZh ? "缺少 Token" : "Missing Token");
            return;
        }

        setSyncState('loading');
        setSyncMessage(isZh ? "正在连接 GitHub..." : "Connecting to GitHub...");

        // 1. Check Cloud Status
        const status = await checkCloudStatus(token, gistId);

        if (status.error) {
            setSyncState('error');
            setSyncMessage(status.error);
            return;
        }

        if (!status.exists || !status.cloudData) {
            // Case A: No cloud data -> Create/Push immediately
            setSyncMessage(isZh ? "未找到存档，正在创建..." : "No save found. Creating...");
            await executeSync('push', token, gistId);
        } else {
            // Case B: Cloud data exists -> Always check for conflicts/versions
            const localData = collectLocalData();
            const localTime = tempPrefs.syncConfig?.lastSynced || 0;
            const cloudTime = status.cloudData.updatedAt;

            // Show Conflict Modal to let user decide, even if timestamps imply one direction
            setConflictData({
                local: { updatedAt: localTime, stats: localData.stats, userName: localData.preferences.userName },
                cloud: { updatedAt: cloudTime, stats: status.cloudData.stats, userName: status.cloudData.preferences.userName }
            });
            setSyncState('idle'); 
        }
    };

    const executeSync = async (direction: 'push' | 'pull', token: string, gistId?: string) => {
        setConflictData(null); // Close modal if open
        setSyncState('loading');

        try {
            if (direction === 'push') {
                setSyncMessage(isZh ? "正在上传数据..." : "Uploading data...");
                const localData = collectLocalData();
                const res = await pushToGist(token, localData, gistId);
                
                if (res.success) {
                    const newConfig = { 
                        ...tempPrefs.syncConfig, 
                        enabled: true, 
                        githubToken: token, // Ensure token is saved
                        lastSynced: res.timestamp,
                        gistId: res.newGistId || gistId 
                    };
                    setTempPrefs(prev => ({ ...prev, syncConfig: newConfig }));
                    onUpdatePreferences({ syncConfig: newConfig });
                    
                    setSyncState('success');
                    setSyncMessage(isZh ? "同步成功 (已上传)" : "Sync Successful (Uploaded)");
                    if (!gistId && res.newGistId) setShowGistIdModal(res.newGistId);
                } else {
                    throw new Error(res.error);
                }
            } else {
                setSyncMessage(isZh ? "正在下载数据..." : "Downloading data...");
                const res = await pullFromGist(token, gistId!);
                if (res.success && res.data) {
                    // APPLY DATA
                    if(res.data.stats) localStorage.setItem('algolingo_stats', JSON.stringify(res.data.stats));
                    if(res.data.progress) localStorage.setItem('algolingo_progress_v2', JSON.stringify(res.data.progress));
                    if(res.data.mistakes) localStorage.setItem('algolingo_mistakes', JSON.stringify(res.data.mistakes));
                    if (res.data.engineeringData) {
                        Object.entries(res.data.engineeringData).forEach(([key, value]) => {
                           localStorage.setItem(key, JSON.stringify(value));
                        });
                    }
                    
                    const newConfig = { 
                        ...tempPrefs.syncConfig, 
                        enabled: true, 
                        githubToken: token,
                        lastSynced: res.data.updatedAt,
                        gistId: gistId 
                    };
                    setTempPrefs(prev => ({ ...prev, syncConfig: newConfig }));
                    onUpdatePreferences({ syncConfig: newConfig });

                    setSyncState('success');
                    setSyncMessage(isZh ? "同步成功，正在刷新..." : "Sync Successful. Refreshing...");
                    
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    throw new Error(res.error);
                }
            }
        } catch (e: any) {
            setSyncState('error');
            setSyncMessage(e.message);
        }
    };

    const renderContent = () => {
        const commonProps = {
            preferences: tempPrefs,
            onChange: (p: Partial<UserPreferences>) => setTempPrefs(prev => ({ ...prev, ...p })),
            isZh
        };

        switch (activeTab) {
            case 'general': return <GeneralTab {...commonProps} />;
            case 'ai': return <AITab {...commonProps} />;
            case 'sync': return (
                <SyncTab 
                    {...commonProps} 
                    onSync={handleSyncTrigger} 
                    syncStatus={syncState} 
                    syncMessage={syncMessage}
                />
            );
            case 'appearance': return <AppearanceTab {...commonProps} />;
            case 'notifications': return <NotificationTab {...commonProps} />;
            case 'data': return <DataTab onExport={onExportData} onImport={onImportData} isZh={isZh} />;
            default: return null;
        }
    };

    // Safe translation object to prevent crashes
    const safeT = t || { done: 'Done' };

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-up">
             {showGistIdModal && (
                <GistModal 
                    gistId={showGistIdModal} 
                    onClose={() => setShowGistIdModal(null)} 
                    t={safeT} 
                    isZh={isZh} 
                />
            )}

            {conflictData && (
                <SyncConflictModal 
                    localData={conflictData.local}
                    cloudData={conflictData.cloud}
                    isZh={isZh}
                    onCancel={() => { setConflictData(null); setSyncState('idle'); setSyncMessage(isZh ? "已取消" : "Cancelled"); }}
                    onResolve={(action) => executeSync(action, tempPrefs.syncConfig!.githubToken, tempPrefs.syncConfig!.gistId)}
                />
            )}

            <div className="bg-white dark:bg-dark-card w-full max-w-4xl h-[85vh] md:h-[700px] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
                
                {/* Mobile Close Button (Top Right) */}
                <button 
                    onClick={onClose} 
                    className="md:hidden absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 z-10"
                >
                    <X size={20}/>
                </button>

                {/* Sidebar */}
                <SettingsSidebar activeTab={activeTab} onSelectTab={setActiveTab} isZh={isZh} />

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 relative">
                        <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white mb-6 md:hidden">
                            {isZh ? '设置' : 'Settings'}
                        </h2>
                        {renderContent()}
                    </div>
                    
                    {/* Footer Action Bar */}
                    <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-4 shrink-0">
                        <button 
                            onClick={onClose}
                            className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                        >
                            {safeT.done} (Cancel)
                        </button>
                        <button 
                            onClick={handleSave}
                            className="px-8 py-3 bg-brand text-white font-bold rounded-xl shadow-lg hover:bg-brand-light transition-colors flex items-center gap-2"
                        >
                            <Check size={18} />
                            {isZh ? "保存更改" : "Save Changes"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
