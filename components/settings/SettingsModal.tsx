
import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { UserPreferences } from '../../types';
import { syncWithGist } from '../../services/githubService';
import { GistModal } from './GistModal';

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
    const [syncStatus, setSyncStatus] = useState('');
    const [showGistIdModal, setShowGistIdModal] = useState<string | null>(null);

    // Sync temp state with props when opening
    useEffect(() => {
        if (isOpen) {
            setTempPrefs(preferences);
        }
    }, [isOpen, preferences]);

    if (!isOpen) return null;

    const handleSave = () => {
        onUpdatePreferences(tempPrefs);
        onClose();
    };

    const handleSyncAction = async (mode: 'create' | 'sync') => {
        setSyncStatus(isZh ? '同步中...' : 'Syncing...');
        
        // Capture Engineering & Forge Data
        const engineeringData: Record<string, any> = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('algolingo_syntax_v3_') || key.startsWith('algolingo_eng_v3_'))) {
                try { engineeringData[key] = JSON.parse(localStorage.getItem(key)!); } catch (e) {}
            }
        }
        ['algolingo_my_tracks', 'algolingo_forge_history_v2', 'algolingo_discovered_tracks'].forEach(key => {
             const val = localStorage.getItem(key);
             if (val) try { engineeringData[key] = JSON.parse(val); } catch(e) {}
        });

        const currentData = {
            stats: JSON.parse(localStorage.getItem('algolingo_stats') || '{}'),
            progress: JSON.parse(localStorage.getItem('algolingo_progress_v2') || '{}'),
            mistakes: JSON.parse(localStorage.getItem('algolingo_mistakes') || '[]'),
            preferences: tempPrefs, // Use current temp prefs which has the token
            engineeringData
        };
  
        const token = tempPrefs.syncConfig?.githubToken;
        const gistId = tempPrefs.syncConfig?.gistId;
  
        if (!token) {
            setSyncStatus("Error: Token missing");
            return;
        }
  
        const res = await syncWithGist(token, gistId, currentData as any);
        
        if (res.success) {
            setSyncStatus(isZh ? `成功: ${res.action}` : `Success: ${res.action}`);
            if (res.newGistId) {
                const newSyncConfig = { ...tempPrefs.syncConfig, gistId: res.newGistId, enabled: true };
                // Update local temp state immediately
                setTempPrefs(prev => ({ ...prev, syncConfig: newSyncConfig as any }));
                // Also update persistent state immediately to avoid data loss
                onUpdatePreferences({ syncConfig: newSyncConfig as any });
                
                if (mode === 'create') {
                    setShowGistIdModal(res.newGistId);
                }
            }
            
            if (res.action === 'pulled' && res.data) {
                 alert(isZh ? "从云端拉取了较新的数据，正在刷新..." : "Newer data pulled from cloud. Refreshing...");
                 if(res.data.stats) localStorage.setItem('algolingo_stats', JSON.stringify(res.data.stats));
                 if(res.data.progress) localStorage.setItem('algolingo_progress_v2', JSON.stringify(res.data.progress));
                 if(res.data.mistakes) localStorage.setItem('algolingo_mistakes', JSON.stringify(res.data.mistakes));
                 
                 if (res.data.engineeringData) {
                     Object.entries(res.data.engineeringData).forEach(([key, value]) => {
                        if (
                            key.startsWith('algolingo_syntax_v3_') || 
                            key.startsWith('algolingo_eng_v3_') ||
                            ['algolingo_my_tracks', 'algolingo_forge_history_v2', 'algolingo_discovered_tracks'].includes(key)
                        ) {
                            localStorage.setItem(key, JSON.stringify(value));
                        }
                     });
                 }

                 window.location.reload();
            }
        } else {
            setSyncStatus(`Error: ${res.error}`);
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
            case 'sync': return <SyncTab {...commonProps} onSync={handleSyncAction} syncStatus={syncStatus} />;
            case 'appearance': return <AppearanceTab {...commonProps} />;
            case 'notifications': return <NotificationTab {...commonProps} />;
            case 'data': return <DataTab onExport={onExportData} onImport={onImportData} isZh={isZh} />;
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-up">
             {showGistIdModal && (
                <GistModal 
                    gistId={showGistIdModal} 
                    onClose={() => setShowGistIdModal(null)} 
                    t={t} 
                    isZh={isZh} 
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
                            {t.done} (Cancel)
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
