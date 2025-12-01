
import React, { useState } from 'react';
import { UserPreferences } from '../../../types';
import { Github, HelpCircle, RefreshCw, Check, Copy, Loader2, Cloud, AlertCircle } from 'lucide-react';

interface SyncTabProps {
    preferences: UserPreferences;
    onChange: (p: Partial<UserPreferences>) => void;
    onSync: (mode: 'create' | 'sync') => void;
    syncStatus: string; // "idle" | "loading" | "success" | "error"
    syncMessage?: string;
    isZh: boolean;
}

export const SyncTab: React.FC<SyncTabProps> = ({ preferences, onChange, onSync, syncStatus, syncMessage, isZh }) => {
    const [showHelp, setShowHelp] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const config = preferences.syncConfig || { enabled: false, githubToken: '' };

    const handleCopyId = () => {
        if (config.gistId) {
            navigator.clipboard.writeText(config.gistId);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const isConfigured = !!config.githubToken;
    const isLoading = syncStatus === 'loading';

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-brand font-bold text-sm uppercase tracking-wider">
                    <Github size={16} />
                    {isZh ? 'GitHub 云端同步' : 'GitHub Cloud Sync'}
                </div>
                <button
                    onClick={() => setShowHelp(!showHelp)}
                    className="text-brand hover:text-brand-dark dark:text-brand-light text-xs font-bold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-brand/10 transition-colors"
                >
                    <HelpCircle size={14} />
                    {isZh ? "如何配置？" : "Setup Guide"}
                </button>
            </div>

            {showHelp && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 shadow-sm animate-fade-in-down">
                        <p className="font-bold mb-2">{isZh ? "步骤指南：" : "Setup Guide:"}</p>
                        <ol className="list-decimal list-inside space-y-1.5">
                        <li>{isZh ? <span>访问 <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-brand underline">GitHub Tokens</a> 页面。</span> : <span>Visit <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-brand underline">GitHub Tokens</a> page.</span>}</li>
                            <li>{isZh ? "生成新 Token (Classic)，在 Scopes 中勾选 `gist`。" : "Generate new Token (Classic), check `gist` in Scopes."}</li>
                        <li>{isZh ? "复制 Token (以 ghp_ 开头) 填入下方。" : "Copy Token (starts with ghp_) and paste below."}</li>
                            <li>{isZh ? "点击立即同步。系统会自动检测或创建存档。" : "Click Sync Now. System will detect or create save."}</li>
                        </ol>
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 block mb-2">{isZh ? 'GitHub Token (需要 Gist 权限)' : 'GitHub Token (Gist Scope Required)'}</label>
                    <div className="flex gap-2">
                        <input 
                            type="password"
                            className="flex-1 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white font-mono text-sm focus:border-brand outline-none"
                            value={config.githubToken}
                            onChange={(e) => onChange({ syncConfig: { ...config, githubToken: e.target.value } })}
                            placeholder="ghp_..."
                        />
                    </div>
                </div>

                {config.gistId && (
                    <div className="animate-fade-in-up">
                        <label className="text-xs font-bold text-gray-500 block mb-2">Gist ID (Archive ID)</label>
                        <div className="flex gap-2">
                            <input 
                                className="flex-1 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 font-mono text-xs outline-none"
                                value={config.gistId || ''}
                                readOnly
                            />
                            <button 
                                onClick={handleCopyId}
                                className="p-3 bg-white dark:bg-dark-card border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500"
                            >
                                {isCopied ? <Check size={16} className="text-green-500"/> : <Copy size={16}/>}
                            </button>
                        </div>
                    </div>
                )}

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button 
                        onClick={() => onSync('sync')}
                        disabled={!config.githubToken || isLoading}
                        className={`w-full px-6 py-4 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-3 transition-all ${
                            isLoading 
                            ? 'bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed' 
                            : 'bg-brand text-white hover:bg-brand-light shadow-brand/20'
                        }`}
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Cloud size={18} />}
                        {isLoading 
                            ? (isZh ? "正在连接云端..." : "Connecting to Cloud...") 
                            : (config.gistId ? (isZh ? "立即同步 (检查更新)" : "Sync Now (Check Cloud)") : (isZh ? "初始化同步" : "Initialize Sync"))
                        }
                    </button>
                </div>
                
                {syncMessage && (
                    <div className={`p-4 rounded-xl text-center flex items-center justify-center gap-2 ${
                        syncStatus === 'error' 
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600' 
                        : (syncStatus === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-gray-50 dark:bg-gray-800 text-gray-500')
                    }`}>
                        {syncStatus === 'error' && <AlertCircle size={16}/>}
                        {syncStatus === 'success' && <Check size={16}/>}
                        <p className="text-xs font-bold">{syncMessage}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
