import React, { useState } from 'react';
import { UserPreferences } from '../../../types';
import { Github, HelpCircle, RefreshCw, Check, Copy } from 'lucide-react';

interface SyncTabProps {
    preferences: UserPreferences;
    onChange: (p: Partial<UserPreferences>) => void;
    onSync: (mode: 'create' | 'sync') => void;
    syncStatus: string;
    isZh: boolean;
}

export const SyncTab: React.FC<SyncTabProps> = ({ preferences, onChange, onSync, syncStatus, isZh }) => {
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

    const isConfigured = !!config.githubToken && !!config.gistId;

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
                            <li>{isZh ? "点击初始化同步。系统将自动创建一个 Gist ID。" : "Click Initialize Sync. System creates a Gist ID automatically."}</li>
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
                        {!isConfigured && (
                            <button 
                                onClick={() => onSync('create')}
                                disabled={!config.githubToken}
                                className="px-4 bg-gray-800 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-xs hover:opacity-90 disabled:opacity-50 flex items-center justify-center whitespace-nowrap"
                            >
                                {isZh ? "初始化同步" : "Initialize"}
                            </button>
                        )}
                    </div>
                </div>

                {isConfigured && (
                    <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-700 animate-fade-in-up">
                        <div>
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

                        <button 
                            onClick={() => onSync('sync')}
                            className="w-full px-6 py-4 bg-brand text-white rounded-xl font-bold text-sm hover:bg-brand-light shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={16} className={syncStatus.includes('...') ? 'animate-spin' : ''} />
                            {isZh ? "立即同步" : "Sync Now"}
                        </button>
                    </div>
                )}
                
                {syncStatus && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                        <p className="text-xs font-mono text-brand">{syncStatus}</p>
                    </div>
                )}
            </div>
        </div>
    );
};