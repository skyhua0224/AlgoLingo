
import React, { useState, useEffect } from 'react';
import { UserPreferences } from '../../../types';
import { Github, HelpCircle, RefreshCw, Check, Copy, Loader2, Cloud, AlertCircle, History, Clock, ArrowDown, RotateCcw } from 'lucide-react';
import { getGistCommits, GistCommit } from '../../../services/githubService';

interface SyncTabProps {
    preferences: UserPreferences;
    onChange: (p: Partial<UserPreferences>) => void;
    onSync: (mode: 'create' | 'sync', version?: string) => void; 
    syncStatus: string; 
    syncMessage?: string;
    isZh: boolean;
}

export const SyncTab: React.FC<SyncTabProps> = ({ preferences, onChange, onSync, syncStatus, syncMessage, isZh }) => {
    const [showHelp, setShowHelp] = useState(false);
    const [commits, setCommits] = useState<GistCommit[]>([]);
    const [loadingCommits, setLoadingCommits] = useState(false);
    const config = preferences.syncConfig;

    useEffect(() => {
        if (config.gistId && config.githubToken) {
            setLoadingCommits(true);
            getGistCommits(config.githubToken, config.gistId).then(setCommits).finally(() => setLoadingCommits(false));
        }
    }, [config.gistId]);

    const handleRestoreClick = (sha: string) => {
        // Delegate confirmation to parent (SettingsModal) which shows a proper UI
        onSync('sync', sha);
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-brand font-bold text-sm uppercase tracking-wider"><Github size={16} />{isZh ? 'GitHub 云端同步' : 'GitHub Cloud Sync'}</div>
                <button onClick={() => setShowHelp(!showHelp)} className="text-brand hover:text-brand-dark text-xs font-bold flex items-center gap-1"><HelpCircle size={14} />{isZh ? "配置指南" : "Guide"}</button>
            </div>

            {showHelp && <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs space-y-2 mb-4 animate-fade-in-down">
                <p>{isZh ? "AlgoLingo 会在 Gist 中维护名为 'AlgoLingo Sync Data' 的存档。" : "AlgoLingo maintains a gist named 'AlgoLingo Sync Data'."}</p>
                <p>{isZh ? "系统将基于本地与云端的时间戳进行自动脏检查同步。" : "Auto-sync with dirty check based on timestamps."}</p>
            </div>}

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 block mb-2">{isZh ? 'GitHub Token (需勾选 gist 权限)' : 'GitHub Token (Gist Scope)'}</label>
                    <input type="password" className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white font-mono text-sm focus:border-brand outline-none" value={config.githubToken} onChange={(e) => onChange({ syncConfig: { ...config, githubToken: e.target.value } })} placeholder="ghp_..." />
                </div>

                <div className="flex items-center gap-2">
                    <input type="checkbox" id="autosync" checked={config.autoSync} onChange={(e) => onChange({ syncConfig: { ...config, autoSync: e.target.checked } })} className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand" />
                    <label htmlFor="autosync" className="text-sm font-bold text-gray-700 dark:text-gray-300">{isZh ? '开启静默同步' : 'Enable Silent Sync'}</label>
                </div>

                <button onClick={() => onSync('sync')} disabled={!config.githubToken || syncStatus === 'loading'} className="w-full px-6 py-4 bg-brand text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-3 transition-all hover:bg-brand-light">
                    {syncStatus === 'loading' ? <Loader2 size={18} className="animate-spin" /> : <Cloud size={18} />}
                    {isZh ? '立即同步 / 检查更新' : 'Sync Now / Check Updates'}
                </button>

                {syncMessage && <div className={`p-4 rounded-xl text-center flex items-center justify-center gap-2 ${syncStatus === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}><AlertCircle size={16}/><p className="text-xs font-bold">{syncMessage}</p></div>}

                {/* Recovery Slots */}
                {config.gistId && (
                    <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><History size={14}/> {isZh ? "时光机 (Time Machine)" : "Time Machine"}</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                            {loadingCommits ? <div className="py-4 text-center animate-pulse text-gray-400"><RefreshCw size={16} className="animate-spin mx-auto mb-1"/>Loading history...</div> :
                            commits.map((c, idx) => (
                                <div key={c.version} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl group hover:bg-brand/5 transition-all border border-transparent hover:border-brand/20">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white dark:bg-gray-900 rounded-lg text-gray-400"><Clock size={14}/></div>
                                        <div>
                                            <div className="text-xs font-bold text-gray-800 dark:text-gray-200">{new Date(c.committedAt).toLocaleString()}</div>
                                            <div className="text-[10px] text-gray-500 font-mono flex items-center gap-2">
                                                {c.version.substring(0, 7)}
                                                {idx === 0 && <span className="bg-green-100 text-green-600 px-1 rounded text-[9px] font-bold">LATEST</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleRestoreClick(c.version)}
                                        className="text-[10px] font-bold bg-white dark:bg-gray-900 text-gray-500 hover:text-brand hover:bg-brand/10 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                                    >
                                        <RotateCcw size={12}/> {isZh ? "回档" : "Restore"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
