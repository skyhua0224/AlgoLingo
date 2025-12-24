
import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { UserPreferences } from '../../types';
import { checkCloudStatus, pushToGist, pullFromGist } from '../../services/githubService';
import { GistModal } from './GistModal';
import { SyncConflictModal } from './SyncConflictModal';

import { SettingsSidebar } from './SettingsSidebar';
import { GeneralTab } from './tabs/GeneralTab';
import { AITab } from './tabs/AITab';
import { SyncTab } from './tabs/SyncTab';
import { AppearanceTab } from './tabs/AppearanceTab';
import { NotificationTab } from './tabs/NotificationTab';
import { DataTab } from './DataTab';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (p: Partial<UserPreferences>) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onDataLoaded: (data: any) => void;
  onResetData: () => void;
  t: any;
  isZh: boolean;
  collectFullState: () => any;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, preferences, onUpdatePreferences, onExportData, onImportData, onDataLoaded, onResetData, t, isZh, collectFullState
}) => {
    const [activeTab, setActiveTab] = useState('general');
    const [tempPrefs, setTempPrefs] = useState<UserPreferences>(preferences);
    
    // Sync State
    const [syncState, setSyncState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [syncMessage, setSyncMessage] = useState('');
    const [showGistIdModal, setShowGistIdModal] = useState<string | null>(null);
    const [conflictData, setConflictData] = useState<{local: any, cloud: any} | null>(null);
    const [restoreVersion, setRestoreVersion] = useState<string | null>(null);

    useEffect(() => {
        setTempPrefs(preferences);
        if (isOpen) {
            setSyncState('idle');
            setSyncMessage('');
            setRestoreVersion(null);
        }
    }, [isOpen, preferences]);

    // Live Preview for Theme: Apply immediately when tempPrefs changes
    useEffect(() => {
        if (!isOpen) return;
        const theme = tempPrefs.theme;
        const root = document.documentElement;
        const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        root.classList.toggle('dark', isDark);
    }, [tempPrefs.theme, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        onUpdatePreferences(tempPrefs);
        onClose();
    };

    const handleClose = () => {
        const theme = preferences.theme;
        const root = document.documentElement;
        const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        root.classList.toggle('dark', isDark);
        onClose();
    };

    const handleSyncTrigger = async (mode: 'create' | 'sync', version?: string) => {
        if (version) {
            // Instead of direct execute, show confirmation overlay
            setRestoreVersion(version);
            return;
        }

        const token = tempPrefs.syncConfig?.githubToken;
        const gistId = tempPrefs.syncConfig?.gistId;

        if (!token) {
            setSyncState('error');
            setSyncMessage(isZh ? "缺少 Token" : "Missing Token");
            return;
        }

        setSyncState('loading');
        setSyncMessage(isZh ? "正在连接 GitHub..." : "Connecting to GitHub...");

        const status = await checkCloudStatus(token, gistId);

        if (status.error) {
            setSyncState('error');
            setSyncMessage(status.error);
            return;
        }

        if (!status.exists || !status.cloudData) {
            setSyncMessage(isZh ? "未找到存档，正在创建..." : "No save found. Creating...");
            await executeSync('push', token, gistId);
        } else {
            const localFull = collectFullState();
            const localTime = tempPrefs.syncConfig?.lastSynced || 0;
            const cloudTime = new Date(status.updatedAt || 0).getTime();

            setConflictData({
                local: { updatedAt: localTime, stats: localFull.stats, userName: localFull.preferences.userName },
                cloud: { updatedAt: cloudTime, stats: status.cloudData.stats, userName: status.cloudData.preferences.userName }
            });
            setSyncState('idle'); 
        }
    };

    const executeRestore = async () => {
        if (!restoreVersion) return;
        setRestoreVersion(null); // Close modal
        const token = tempPrefs.syncConfig?.githubToken!;
        const gistId = tempPrefs.syncConfig?.gistId!; // Assumed valid if listing versions
        await executeSync('pull', token, gistId, restoreVersion);
    };

    const executeSync = async (direction: 'push' | 'pull', token: string, gistId?: string, version?: string) => {
        setConflictData(null); 
        setSyncState('loading');

        try {
            if (direction === 'push') {
                setSyncMessage(isZh ? "正在上传全量数据..." : "Uploading full state...");
                const localData = collectFullState();
                const res = await pushToGist(token, localData, gistId);
                
                if (res.success) {
                    const newConfig = { 
                        ...tempPrefs.syncConfig, 
                        enabled: true, 
                        githubToken: token,
                        lastSynced: res.timestamp,
                        gistId: res.newGistId || gistId 
                    };
                    setTempPrefs(prev => ({ ...prev, syncConfig: newConfig }));
                    onUpdatePreferences({ syncConfig: newConfig });
                    
                    setSyncState('success');
                    setSyncMessage(isZh ? "同步成功 (Time Machine 已备份)" : "Sync Successful (Snapshot Taken)");
                    if (!gistId && res.newGistId) setShowGistIdModal(res.newGistId);
                } else {
                    throw new Error(res.error);
                }
            } else {
                setSyncMessage(isZh ? (version ? "正在回档..." : "正在还原...") : (version ? "Restoring version..." : "Restoring state..."));
                const res = await pullFromGist(token, gistId!, version);
                
                if (res.success && res.data) {
                    onDataLoaded(res.data);
                    
                    const newConfig = { 
                        ...tempPrefs.syncConfig, 
                        enabled: true, 
                        githubToken: token,
                        lastSynced: res.data.updatedAt,
                        gistId: gistId 
                    };
                    setTempPrefs(prev => ({ ...prev, syncConfig: newConfig }));
                    
                    setSyncState('success');
                    setSyncMessage(isZh ? "恢复成功" : "Restore Successful");
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
            case 'data': return <DataTab onExport={onExportData} onImport={onImportData} onReset={onResetData} isZh={isZh} />;
            default: return null;
        }
    };

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
                    onResolve={(action) => executeSync(action, tempPrefs.syncConfig!.githubToken, tempPrefs.syncConfig!.gistId || conflictData.cloud.gistId)}
                />
            )}

            {restoreVersion && (
                <SyncConflictModal 
                    localData={{ updatedAt: Date.now(), stats: collectFullState().stats, userName: "Current State" }}
                    cloudData={{ updatedAt: 0, stats: { xp: 0, streak: 0, gems: 0, lastPlayed: "", history: {} }, userName: `Version: ${restoreVersion.substring(0,7)}` }} 
                    // Reuse conflict modal UI but customized for restore confirmation
                    isZh={isZh}
                    isNewUserFlow={true} // Using new user flow styling for overwrite warning
                    onCancel={() => setRestoreVersion(null)}
                    onResolve={() => executeRestore()}
                />
            )}

            <div className="bg-white dark:bg-dark-card w-full max-w-4xl h-[85vh] md:h-[700px] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
                <button 
                    onClick={handleClose} 
                    className="md:hidden absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 z-10"
                >
                    <X size={20}/>
                </button>

                <SettingsSidebar activeTab={activeTab} onSelectTab={setActiveTab} isZh={isZh} />

                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 relative">
                        <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white mb-6 md:hidden">
                            {isZh ? '设置' : 'Settings'}
                        </h2>
                        {renderContent()}
                    </div>
                    
                    <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-4 shrink-0">
                        <button 
                            onClick={handleClose}
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
