
import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { 
    Code2, Brain, Zap, ArrowRight, Check, Globe, Box, Key, Github, 
    HelpCircle, RefreshCw, Copy, Cloud, Sparkles, Upload, ChevronRight, 
    PlusCircle, DownloadCloud, AlertTriangle, Loader2, Database
} from 'lucide-react';
import { UserPreferences } from '../types';
import { GEMINI_MODELS, INITIAL_STATS } from '../constants';
import { checkCloudStatus, pushToGist, pullFromGist } from '../services/githubService';
import { SyncConflictModal } from './settings/SyncConflictModal';

interface OnboardingProps {
    preferences: UserPreferences;
    onUpdatePreferences: (p: Partial<UserPreferences>) => void;
    onComplete: () => void;
    onImportData: (file: File) => void;
    onDataLoaded: (data: any) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ preferences, onUpdatePreferences, onComplete, onImportData, onDataLoaded }) => {
    const [hasStarted, setHasStarted] = useState(false);
    const [step, setStep] = useState(0);
    const [apiKeyBuffer, setApiKeyBuffer] = useState(preferences.apiConfig.gemini.apiKey || '');
    const [connectionType, setConnectionType] = useState<'builtin' | 'custom'>(
        preferences.apiConfig.gemini.apiKey ? 'custom' : 'builtin'
    );

    // Sync State
    const [showSyncHelp, setShowSyncHelp] = useState(false);
    const [syncStatus, setSyncStatus] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [createdGistId, setCreatedGistId] = useState<string | null>(null);
    const [showGistModal, setShowGistModal] = useState(false);
    
    // Conflict / Discovery State
    const [conflictData, setConflictData] = useState<{local: any, cloud: any} | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const isZh = preferences.spokenLanguage === 'Chinese';

    const steps = [
        { id: 'language', title: isZh ? "语言" : "Language" },
        { id: 'sync', title: isZh ? "同步" : "Sync" },
        { id: 'profile', title: isZh ? "个人档案" : "Profile" },
        { id: 'ai', title: isZh ? "配置大脑" : "Intelligence" },
        { id: 'intro', title: isZh ? "准备就绪" : "Ready" },
    ];

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(s => s + 1);
        } else {
            onComplete();
        }
    };

    const handleApiKeyChange = (val: string) => {
        setApiKeyBuffer(val);
        onUpdatePreferences({ 
            apiConfig: { 
                ...preferences.apiConfig, 
                gemini: { ...preferences.apiConfig.gemini, apiKey: val } 
            } 
        });
    }

    const handleConnectionTypeChange = (type: 'builtin' | 'custom') => {
        setConnectionType(type);
        if (type === 'builtin') {
            onUpdatePreferences({
                apiConfig: {
                    ...preferences.apiConfig,
                    gemini: { ...preferences.apiConfig.gemini, apiKey: '' }
                }
            });
            setApiKeyBuffer('');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onImportData(e.target.files[0]);
        }
    };

    // --- CONSOLIDATED GITHUB CONNECT ---
    const handleGitHubConnect = async () => {
        const token = preferences.syncConfig?.githubToken;
        if (!token) {
             setSyncStatus(isZh ? '错误: 需要 GitHub Token' : 'Error: Token required');
             return;
        }

        setIsSyncing(true);
        setSyncStatus(isZh ? '正在验证并搜索云端存档...' : 'Authenticating & Searching cloud...');

        try {
            // Automated discovery by description "AlgoLingo Sync Data"
            const status = await checkCloudStatus(token);

            if (status.error) {
                setSyncStatus(`Error: ${status.error}`);
                setIsSyncing(false);
                return;
            }

            if (status.exists && status.cloudData) {
                // SCENARIO: FOUND EXISTING SAVE
                setIsSyncing(false);
                setConflictData({
                    local: { updatedAt: Date.now(), stats: INITIAL_STATS, userName: preferences.userName || "New User" },
                    cloud: { 
                        gistId: status.gistId, // CRITICAL: Must pass ID to conflict handler
                        updatedAt: new Date(status.updatedAt || 0).getTime(), 
                        stats: status.cloudData.stats, 
                        userName: status.cloudData.preferences.userName 
                    }
                });
            } else {
                // SCENARIO: NO SAVE FOUND -> READY TO CREATE
                await executeSync('push', token);
            }

        } catch (e: any) {
            setSyncStatus(`Exception: ${e.message}`);
            setIsSyncing(false);
        }
    };

    const executeSync = async (direction: 'push' | 'pull', token: string, gistId?: string) => {
        setConflictData(null); 
        setIsSyncing(true);

        try {
            if (direction === 'push') {
                setSyncStatus(isZh ? '正在创建初始云存档...' : 'Creating initial cloud save...');
                
                const freshData = {
                    stats: INITIAL_STATS,
                    progress: {},
                    mistakes: [],
                    preferences: preferences,
                    version: "3.6"
                };

                const res = await pushToGist(token, freshData, gistId);
                
                if (res.success) {
                    onUpdatePreferences({ 
                        syncConfig: { 
                            enabled: true, 
                            githubToken: token,
                            gistId: res.newGistId,
                            lastSynced: res.timestamp,
                            autoSync: true
                        } 
                    });
                    setCreatedGistId(res.newGistId || '');
                    setShowGistModal(true); 
                    setSyncStatus(isZh ? '认证并创建成功!' : 'Authenticated & Created!');
                } else {
                    throw new Error(res.error);
                }
            } else {
                setSyncStatus(isZh ? '正在恢复Time Machine全量数据...' : 'Restoring Time Machine state...');
                const res = await pullFromGist(token, gistId || preferences.syncConfig?.gistId || '');
                
                if (res.success && res.data) {
                    onDataLoaded(res.data);
                    // Update sync config with recovered ID
                    onUpdatePreferences({
                        syncConfig: {
                            enabled: true,
                            githubToken: token,
                            gistId: gistId || res.data.preferences?.syncConfig?.gistId,
                            lastSynced: res.data.updatedAt,
                            autoSync: true
                        }
                    });
                    setSyncStatus(isZh ? '同步恢复成功!' : 'Restore Successful!');
                    handleNext(); // Move to profile
                } else {
                    throw new Error(res.error);
                }
            }
        } catch (e: any) {
            setSyncStatus(`Error: ${e.message}`);
        } finally {
            setIsSyncing(false);
        }
    };
    
    const handleCopyGistId = () => {
        if (createdGistId) navigator.clipboard.writeText(createdGistId);
    };

    const handleGistModalDone = () => {
        setShowGistModal(false);
        handleNext(); 
    };

    // --- WELCOME SCREEN ---
    if (!hasStarted) {
        return (
            <div className="fixed inset-0 bg-white dark:bg-dark-bg z-[100] flex flex-col items-center justify-center p-6 text-gray-800 dark:text-white">
                 <div className="max-w-md w-full text-center animate-fade-in-up">
                    <div className="inline-flex p-6 bg-brand-bg dark:bg-brand/20 rounded-full mb-8 shadow-lg animate-pulse-soft">
                         <Brain size={64} className="text-brand" />
                    </div>
                    <h1 className="text-5xl font-extrabold mb-4 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-light">
                        AlgoLingo
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-12 font-medium">
                        {isZh ? "你的私人 AI 算法教练" : "Your Personal AI Algorithm Coach"}
                    </p>

                    <div className="space-y-4">
                        <Button 
                            onClick={() => { setHasStarted(true); setStep(0); }}
                            variant="primary" 
                            size="lg" 
                            className="w-full py-4 text-lg shadow-xl"
                        >
                            {isZh ? "开始" : "Start"}
                        </Button>
                    </div>
                 </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-white dark:bg-dark-bg z-[100] flex flex-col items-center justify-center p-4 md:p-8 text-gray-800 dark:text-white transition-colors duration-300">
            
            {/* Loading Overlay */}
            {isSyncing && (
                <div className="fixed inset-0 z-[250] bg-white/90 dark:bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in-up">
                    <Loader2 size={48} className="text-brand animate-spin mb-4" />
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">{syncStatus}</h3>
                </div>
            )}

            {/* Discovery Conflict Modal */}
            {conflictData && (
                <SyncConflictModal 
                    localData={conflictData.local}
                    cloudData={conflictData.cloud}
                    isZh={isZh}
                    isNewUserFlow={true}
                    onCancel={() => { setConflictData(null); setIsSyncing(false); setSyncStatus(isZh ? "已取消" : "Cancelled"); }}
                    onResolve={(action) => {
                        const targetGistId = conflictData.cloud.gistId; 
                        executeSync(action, preferences.syncConfig!.githubToken, action === 'push' ? undefined : targetGistId);
                    }}
                />
            )}

            {/* Gist Success Modal */}
            {showGistModal && (
                <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in-up">
                    <div className="bg-white dark:bg-dark-card rounded-3xl p-8 w-full max-w-md text-center shadow-2xl border-2 border-green-100 dark:border-green-900/50">
                        <div className="mb-4 bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                <Check className="text-green-500" size={32} />
                        </div>
                        <h3 className="text-2xl font-extrabold text-gray-800 dark:text-white mb-2">{isZh ? "云端链路已就绪！" : "Cloud Link Ready!"}</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm leading-relaxed">
                            {isZh ? "我们将自动在后台同步你的进度。" : "We will automatically sync your progress in the background."}
                        </p>
                        
                        <div className="bg-gray-100 dark:bg-black p-4 rounded-xl border border-gray-200 dark:border-gray-800 mb-6 font-mono text-sm break-all select-all text-gray-800 dark:text-gray-200">
                            {createdGistId}
                        </div>

                        <button 
                            onClick={handleCopyGistId}
                            className="w-full py-3 bg-brand text-white rounded-xl font-bold shadow-lg hover:bg-brand-light mb-3 flex items-center justify-center gap-2"
                        >
                            <Copy size={18}/> {isZh ? "复制存档 ID (可选)" : "Copy Save ID (Optional)"}
                        </button>
                        <button 
                            onClick={handleGistModalDone} 
                            className="w-full py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center gap-2"
                        >
                            {isZh ? "继续下一步" : "Continue"} <ArrowRight size={16}/>
                        </button>
                    </div>
                </div>
            )}

            {/* Progress Steps */}
            <div className="absolute top-8 left-0 right-0 flex justify-center gap-2 px-8">
                {steps.map((_, i) => (
                    <div 
                        key={i} 
                        className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-12 bg-brand' : i < step ? 'w-4 bg-brand/40' : 'w-4 bg-gray-200 dark:bg-gray-700'}`} 
                    />
                ))}
            </div>

            <div className="max-w-lg w-full space-y-8 animate-fade-in-up h-[80vh] flex flex-col justify-center">
                
                {/* STEP 0: LANGUAGE */}
                {step === 0 && (
                    <div className="space-y-8">
                        <div className="text-center">
                            <div className="inline-flex p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6 text-blue-600 dark:text-blue-400 shadow-sm">
                                <Globe size={48} />
                            </div>
                            <h1 className="text-3xl font-extrabold mb-2">{isZh ? "选择你的语言" : "Choose Language"}</h1>
                            <p className="text-gray-500 dark:text-gray-400">{isZh ? "我们将以此语言进行教学" : "Instructional language"}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {['Chinese', 'English'].map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => onUpdatePreferences({ spokenLanguage: lang as any })}
                                    className={`p-6 rounded-2xl border-2 text-lg font-bold transition-all ${
                                        preferences.spokenLanguage === lang 
                                        ? 'border-brand bg-brand text-white shadow-md scale-105' 
                                        : 'border-gray-200 dark:border-gray-700 hover:border-brand/50 bg-white dark:bg-dark-card text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    {lang === 'Chinese' ? '中文 (Chinese)' : 'English'}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 1: CONSOLIDATED SYNC */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="text-center">
                             <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-6 text-gray-600 dark:text-gray-400 shadow-sm border-2 border-gray-200 dark:border-gray-700">
                                 <Cloud size={48} />
                             </div>
                             <h1 className="text-3xl font-extrabold mb-2">{isZh ? "云端同步" : "Cloud Sync"}</h1>
                             <p className="text-gray-500 dark:text-gray-400">{isZh ? "输入 GitHub Token，自动恢复或创建进度" : "Automated cloud discovery via GitHub Token"}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-white dark:bg-dark-card p-5 rounded-3xl border-2 border-gray-100 dark:border-gray-700 hover:border-brand transition-colors">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-gray-700 dark:text-white"><Github size={20}/></div>
                                    <h3 className="font-bold text-gray-800 dark:text-white">{isZh ? "连接 GitHub" : "Connect GitHub"}</h3>
                                </div>
                                
                                <div className="space-y-3">
                                    <input 
                                        type="password"
                                        className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white font-mono text-sm focus:border-brand outline-none"
                                        value={preferences.syncConfig?.githubToken || ''}
                                        onChange={(e) => onUpdatePreferences({ syncConfig: { ...(preferences.syncConfig || { enabled: true, githubToken: '' }), githubToken: e.target.value } })}
                                        placeholder="GitHub Token (ghp_...)"
                                    />
                                    
                                    <button 
                                        onClick={handleGitHubConnect}
                                        disabled={!preferences.syncConfig?.githubToken || isSyncing}
                                        className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95"
                                    >
                                        <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                                        {isZh ? "连接并探测存档" : "Connect & Discover"}
                                    </button>

                                    {syncStatus && <p className="text-[10px] font-mono text-center text-gray-400">{syncStatus}</p>}
                                </div>
                                
                                <div className="mt-4 flex flex-col gap-2">
                                     <button
                                        onClick={() => setShowSyncHelp(!showSyncHelp)}
                                        className="text-gray-400 hover:text-brand text-xs font-bold flex items-center justify-center gap-1 w-full"
                                    >
                                        <HelpCircle size={14} /> {isZh ? "如何获取 Token?" : "How to get Token?"}
                                    </button>
                                    {showSyncHelp && (
                                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
                                            {isZh ? (
                                                <span>前往 <a href="https://github.com/settings/tokens" target="_blank" className="text-brand underline font-bold">GitHub Tokens</a>，生成 Classic Token，勾选 <b>gist</b> 权限即可。</span>
                                            ) : (
                                                <span>Go to <a href="https://github.com/settings/tokens" target="_blank" className="text-brand underline font-bold">GitHub Tokens</a>, generate Classic Token, check <b>gist</b> scope.</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 px-2">
                                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{isZh ? "或者" : "OR"}</span>
                                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>
                            </div>

                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 text-gray-400 hover:text-brand hover:border-brand transition-all flex items-center justify-center gap-2 text-xs font-bold"
                            >
                                <Upload size={14} /> {isZh ? "从本地 .json 文件恢复" : "Restore from local .json"}
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                            </button>
                        </div>

                        <button 
                            onClick={handleNext}
                            className="w-full py-2 text-center text-gray-400 hover:text-gray-600 font-bold text-xs flex items-center justify-center gap-1"
                        >
                            {isZh ? "暂时跳过" : "Skip for now"} <ChevronRight size={14} />
                        </button>
                    </div>
                )}

                {/* STEP 2: PROFILE */}
                {step === 2 && (
                    <div className="space-y-8">
                         <div className="text-center">
                            <div className="inline-flex p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-6 text-purple-600 dark:text-purple-400 shadow-sm">
                                <Code2 size={48} />
                            </div>
                            <h1 className="text-3xl font-extrabold mb-2">{isZh ? "你的目标" : "Your Profile"}</h1>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{isZh ? "你的昵称" : "Your Name"}</label>
                                <input 
                                    type="text"
                                    value={preferences.userName}
                                    onChange={(e) => onUpdatePreferences({ userName: e.target.value })}
                                    className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-transparent text-xl font-bold focus:border-brand outline-none text-gray-900 dark:text-white"
                                    placeholder="Senior Engineer"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{isZh ? "目标编程语言" : "Target Language"}</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Python', 'Java', 'C++', 'C', 'JavaScript', 'Go'].map(lang => (
                                        <button
                                            key={lang}
                                            onClick={() => onUpdatePreferences({ targetLanguage: lang as any })}
                                            className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                                                preferences.targetLanguage === lang 
                                                ? 'border-brand bg-brand text-white shadow-md' 
                                                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 bg-white dark:bg-dark-card'
                                            }`}
                                        >
                                            {lang}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: INTELLIGENCE */}
                {step === 3 && (
                    <div className="space-y-6">
                         <div className="text-center">
                            <div className="inline-flex p-4 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-6 text-orange-600 dark:text-orange-400 shadow-sm">
                                <Brain size={48} />
                            </div>
                            <h1 className="text-3xl font-extrabold mb-2">{isZh ? "配置大脑" : "Intelligence"}</h1>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 space-y-6">
                             <div className="flex gap-2 bg-white dark:bg-dark-card p-1 rounded-xl border border-gray-100 dark:border-gray-800">
                                {['gemini-official', 'openai', 'gemini-custom'].map(p => (
                                    <button 
                                        key={p}
                                        onClick={() => onUpdatePreferences({ apiConfig: { ...preferences.apiConfig, provider: p as any } })}
                                        className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${preferences.apiConfig.provider === p ? 'bg-brand text-white shadow-sm' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                    >
                                        {p.split('-')[0]}
                                    </button>
                                ))}
                            </div>
                             {preferences.apiConfig.provider === 'gemini-official' && (
                                 <div className="space-y-4 animate-fade-in-up">
                                     <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => handleConnectionTypeChange('builtin')} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${connectionType === 'builtin' ? 'border-brand bg-brand-bg/20 text-brand' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}><Box size={20} /><span className="text-xs font-bold">{isZh ? "环境内置" : "Built-in"}</span></button>
                                        <button onClick={() => handleConnectionTypeChange('custom')} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${connectionType === 'custom' ? 'border-brand bg-brand-bg/20 text-brand' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}><Key size={20} /><span className="text-xs font-bold">{isZh ? "自定义 Key" : "Custom Key"}</span></button>
                                     </div>
                                     {connectionType === 'custom' && (
                                        <input type="password" className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white font-mono text-sm focus:border-brand outline-none" value={apiKeyBuffer} onChange={(e) => handleApiKeyChange(e.target.value)} placeholder="sk-..." />
                                     )}
                                     <select className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white text-sm focus:border-brand outline-none font-bold" value={preferences.apiConfig.gemini.model} onChange={(e) => onUpdatePreferences({ apiConfig: { ...preferences.apiConfig, gemini: { ...preferences.apiConfig.gemini, model: e.target.value } } })}>
                                        {GEMINI_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                                     </select>
                                 </div>
                             )}
                        </div>
                    </div>
                )}

                {/* STEP 4: INTRO & FINISH */}
                {step === 4 && (
                    <div className="space-y-8 text-center">
                        <div className="inline-flex p-6 bg-green-100 dark:bg-green-900/30 rounded-full mb-2 text-green-600 dark:text-green-400 shadow-sm">
                             <Zap size={64} />
                        </div>
                        <h1 className="text-4xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-light">AlgoLingo</h1>
                        <div className="space-y-4 text-left bg-gray-50 dark:bg-dark-card p-6 rounded-3xl border border-gray-200 dark:border-gray-700">
                            <FeatureItem icon={<Code2 className="text-brand"/>} text={isZh ? "无需死记硬背，像母语一样掌握代码" : "Master code naturally, no rote memorization."} />
                            <FeatureItem icon={<Brain className="text-purple-500"/>} text={isZh ? "将 LeetCode 拆解为概念、代码、优化三部曲" : "Break down LeetCode into Concept, Code, and Optimize."} />
                        </div>
                    </div>
                )}

                <div className="pt-4">
                    {step !== 1 && (
                        <Button 
                            variant="primary" 
                            size="lg" 
                            className="w-full shadow-xl text-lg py-4"
                            onClick={handleNext}
                        >
                            <div className="flex items-center justify-center gap-2">
                                {step === steps.length - 1 ? (isZh ? "开始旅程" : "Start Journey") : (isZh ? "下一步" : "Next")}
                                {step === steps.length - 1 ? <Check size={24}/> : <ArrowRight size={24} />}
                            </div>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

const FeatureItem = ({icon, text}: {icon: React.ReactNode, text: string}) => (
    <div className="flex items-start gap-4">
        <div className="mt-1 p-2 bg-white dark:bg-dark-bg rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 shrink-0">{icon}</div>
        <p className="text-gray-600 dark:text-gray-300 font-medium leading-relaxed">{text}</p>
    </div>
)
