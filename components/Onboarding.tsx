import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { Code2, Brain, Zap, ArrowRight, Check, Globe, Moon, Sun, Monitor, Cpu, Key, Box, Github, HelpCircle, RefreshCw, Copy, AlertTriangle, Cloud, Sparkles, Upload, FileJson, ChevronRight } from 'lucide-react';
import { UserPreferences, ApiConfig } from '../types';
import { GEMINI_MODELS, INITIAL_STATS } from '../constants';
import { syncWithGist } from '../services/githubService';

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
    
    // Local state for immediate visual feedback
    const [apiKeyBuffer, setApiKeyBuffer] = useState(preferences.apiConfig.gemini.apiKey || '');
    
    // New local state for connection type toggle
    const [connectionType, setConnectionType] = useState<'builtin' | 'custom'>(
        preferences.apiConfig.gemini.apiKey ? 'custom' : 'builtin'
    );

    // Sync State
    const [showSyncHelp, setShowSyncHelp] = useState(false);
    const [syncStatus, setSyncStatus] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isZh = preferences.spokenLanguage === 'Chinese';

    const steps = [
        { id: 'language', title: isZh ? "语言" : "Language" },
        { id: 'restore', title: isZh ? "恢复数据" : "Restore" },
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

    const handleSyncNow = async () => {
        setSyncStatus(isZh ? '同步中...' : 'Syncing...');
        
        // Use default empty state for sync fetch if local is empty
        const currentData = {
            stats: INITIAL_STATS,
            progress: {},
            mistakes: [],
            preferences: preferences
        };

        const token = preferences.syncConfig?.githubToken;
        const gistId = preferences.syncConfig?.gistId;
        
        if (!token) {
             setSyncStatus(isZh ? '错误: 需要 GitHub Token' : 'Error: Token required');
             return;
        }

        if (!gistId) {
            setSyncStatus(isZh ? '错误: 恢复模式必须填写 Gist ID' : 'Error: Gist ID required for restore');
            return;
        }

        const res = await syncWithGist(token, gistId, currentData as any);

        if (res.success) {
            setSyncStatus(isZh ? `成功: ${res.action}` : `Success: ${res.action}`);
            
            if (res.action === 'pulled' && res.data) {
                 // Call parent to update app state seamlessly (NO RELOAD)
                 onDataLoaded(res.data);
            } else {
                setSyncStatus(isZh ? '未找到数据，请检查 Gist ID' : 'No data found, check Gist ID');
            }
        } else {
            setSyncStatus(isZh ? `失败: ${res.error}` : `Error: ${res.error}`);
        }
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

                    <div className="mt-8 flex items-center justify-center gap-4 text-gray-400 text-sm">
                        <span className="flex items-center gap-1"><Sparkles size={14}/> AI Driven</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Github size={14}/> Open Source</span>
                    </div>
                 </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-white dark:bg-dark-bg z-[100] flex flex-col items-center justify-center p-4 md:p-8 text-gray-800 dark:text-white transition-colors duration-300">
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
                
                {/* STEP 0: LANGUAGE SELECTION */}
                {step === 0 && (
                    <div className="space-y-8">
                        <div className="text-center">
                            <div className="inline-flex p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6 text-blue-600 dark:text-blue-400 shadow-sm">
                                <Globe size={48} />
                            </div>
                            <h1 className="text-3xl font-extrabold mb-2">{isZh ? "选择你的语言" : "Choose your Language"}</h1>
                            <p className="text-gray-500 dark:text-gray-400">{isZh ? "我们将以此语言进行教学" : "We will teach in this language"}</p>
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

                {/* STEP 1: RESTORE DATA (IMPORT / SYNC) */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="text-center">
                             <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-6 text-gray-600 dark:text-gray-400 shadow-sm border-2 border-gray-200 dark:border-gray-700">
                                 <Cloud size={48} />
                             </div>
                             <h1 className="text-3xl font-extrabold mb-2">{isZh ? "恢复数据" : "Restore Data"}</h1>
                             <p className="text-gray-500 dark:text-gray-400">{isZh ? "已有账号？导入或同步进度" : "Returning user? Import or Sync progress"}</p>
                        </div>

                        <div className="space-y-4 max-h-[55vh] overflow-y-auto custom-scrollbar px-1">
                            {/* Option A: File Import */}
                            <div className="bg-white dark:bg-dark-card p-5 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-brand dark:hover:border-brand/50 transition-colors">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-blue-500"><FileJson size={20}/></div>
                                    <h3 className="font-bold text-gray-800 dark:text-white">{isZh ? "从 JSON 文件导入" : "Import from JSON File"}</h3>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Upload size={16} /> {isZh ? "选择文件..." : "Select File..."}
                                </button>
                            </div>

                            {/* Option B: GitHub Sync */}
                            <div className="bg-white dark:bg-dark-card p-5 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-brand dark:hover:border-brand/50 transition-colors">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-gray-700 dark:text-white"><Github size={20}/></div>
                                        <h3 className="font-bold text-gray-800 dark:text-white">{isZh ? "从 GitHub 同步" : "Sync from GitHub"}</h3>
                                    </div>
                                    <button
                                        onClick={() => setShowSyncHelp(!showSyncHelp)}
                                        className="text-brand text-xs font-bold flex items-center gap-1"
                                    >
                                        <HelpCircle size={14} /> {isZh ? "帮助" : "Help"}
                                    </button>
                                </div>

                                {showSyncHelp && (
                                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs text-gray-600 dark:text-gray-300">
                                       <ol className="list-decimal list-inside space-y-1">
                                          <li>GitHub Token (Scope: gist)</li>
                                          <li>Gist ID ({isZh ? "必填" : "Required"})</li>
                                       </ol>
                                  </div>
                                )}

                                <div className="space-y-3">
                                    <input 
                                        type="password"
                                        className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white font-mono text-xs focus:border-brand outline-none"
                                        value={preferences.syncConfig?.githubToken || ''}
                                        onChange={(e) => onUpdatePreferences({ syncConfig: { ...(preferences.syncConfig || { enabled: true, githubToken: '' }), githubToken: e.target.value } })}
                                        placeholder="GitHub Token (ghp_...)"
                                    />
                                    <div>
                                        <input 
                                            className={`w-full p-3 rounded-xl border-2 bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white font-mono text-xs focus:border-brand outline-none ${
                                                !preferences.syncConfig?.gistId ? 'border-red-300 dark:border-red-900' : 'border-gray-200 dark:border-gray-700'
                                            }`}
                                            value={preferences.syncConfig?.gistId || ''}
                                            onChange={(e) => onUpdatePreferences({ syncConfig: { ...(preferences.syncConfig || { enabled: true, githubToken: '' }), gistId: e.target.value } })}
                                            placeholder={isZh ? "Gist ID (必填)" : "Gist ID (Required)"}
                                        />
                                        {!preferences.syncConfig?.gistId && (
                                            <p className="text-[10px] text-red-500 mt-1 ml-1 font-bold">
                                                * {isZh ? "必须填写 Gist ID 才能同步" : "Gist ID is required to sync"}
                                            </p>
                                        )}
                                    </div>
                                    <button 
                                        onClick={handleSyncNow}
                                        disabled={!preferences.syncConfig?.githubToken || !preferences.syncConfig?.gistId}
                                        className="w-full py-3 bg-gray-800 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                                    >
                                        <RefreshCw size={16} className={syncStatus.includes('...') ? 'animate-spin' : ''} />
                                        {isZh ? "开始同步" : "Start Sync"}
                                    </button>
                                    {syncStatus && <p className="text-xs font-mono text-brand text-center">{syncStatus}</p>}
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleNext}
                            className="w-full py-4 text-center text-gray-400 hover:text-brand font-bold text-sm transition-colors flex items-center justify-center gap-1"
                        >
                            {isZh ? "我是新用户，跳过" : "I am a new user, Skip"} <ChevronRight size={16} />
                        </button>
                    </div>
                )}

                {/* STEP 2: PROFILE (Name & Target Language) */}
                {step === 2 && (
                    <div className="space-y-8">
                         <div className="text-center">
                            <div className="inline-flex p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-6 text-purple-600 dark:text-purple-400 shadow-sm">
                                <Code2 size={48} />
                            </div>
                            <h1 className="text-3xl font-extrabold mb-2">{isZh ? "你的目标" : "Your Goal"}</h1>
                            <p className="text-gray-500 dark:text-gray-400">{isZh ? "告诉我们你是谁，以及你想学什么" : "Tell us who you are and what you want to learn"}</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{isZh ? "你的昵称" : "Your Name"}</label>
                                <input 
                                    type="text"
                                    value={preferences.userName}
                                    onChange={(e) => onUpdatePreferences({ userName: e.target.value })}
                                    className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-transparent text-xl font-bold focus:border-brand outline-none text-gray-900 dark:text-white placeholder-gray-300"
                                    placeholder="Sky Hua"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{isZh ? "目标编程语言" : "Target Language"}</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Python', 'Java', 'C++', 'C', 'JavaScript'].map(lang => (
                                        <button
                                            key={lang}
                                            onClick={() => onUpdatePreferences({ targetLanguage: lang as any })}
                                            className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                                                preferences.targetLanguage === lang 
                                                ? 'border-brand bg-brand text-white' 
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

                {/* STEP 3: INTELLIGENCE (AI Config) */}
                {step === 3 && (
                    <div className="space-y-6">
                         <div className="text-center">
                            <div className="inline-flex p-4 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-6 text-orange-600 dark:text-orange-400 shadow-sm">
                                <Brain size={48} />
                            </div>
                            <h1 className="text-3xl font-extrabold mb-2">{isZh ? "配置大脑" : "Connect Intelligence"}</h1>
                            <p className="text-gray-500 dark:text-gray-400">{isZh ? "AlgoLingo 需要 LLM 驱动。选择你的连接方式。" : "AlgoLingo runs on LLMs. Select your connection method."}</p>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-6 max-h-[50vh] overflow-y-auto custom-scrollbar">
                             {/* Provider Tab */}
                             <div className="flex gap-2 bg-white dark:bg-dark-card p-1 rounded-xl border border-gray-200 dark:border-gray-700 mb-4">
                                {[
                                    {id: 'gemini-official', label: 'Gemini (Official)'},
                                    {id: 'openai', label: 'OpenAI'},
                                    {id: 'gemini-custom', label: 'Custom Proxy'}
                                ].map(p => (
                                    <button 
                                        key={p.id}
                                        onClick={() => onUpdatePreferences({ apiConfig: { ...preferences.apiConfig, provider: p.id as any } })}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                            preferences.apiConfig.provider === p.id 
                                            ? 'bg-brand text-white shadow-sm' 
                                            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>

                             {/* Gemini Official Config */}
                             {preferences.apiConfig.provider === 'gemini-official' && (
                                 <div className="space-y-4 animate-fade-in-up">
                                     
                                     {/* Connection Type Switch */}
                                     <div className="flex flex-col gap-2">
                                         <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{isZh ? "连接方式" : "Connection Type"}</label>
                                         <div className="grid grid-cols-2 gap-3">
                                            <button 
                                                onClick={() => handleConnectionTypeChange('builtin')}
                                                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                                                    connectionType === 'builtin'
                                                    ? 'border-brand bg-brand-bg/20 text-brand dark:text-brand-light' 
                                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-500'
                                                }`}
                                            >
                                                <Box size={20} />
                                                <span className="text-xs font-bold">{isZh ? "AI Studio 内置" : "Built-in"}</span>
                                            </button>
                                            <button 
                                                onClick={() => handleConnectionTypeChange('custom')}
                                                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                                                    connectionType === 'custom'
                                                    ? 'border-brand bg-brand-bg/20 text-brand dark:text-brand-light' 
                                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-500'
                                                }`}
                                            >
                                                <Key size={20} />
                                                <span className="text-xs font-bold">{isZh ? "自定义 Key" : "Custom Key"}</span>
                                            </button>
                                         </div>
                                     </div>

                                     {connectionType === 'custom' && (
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 block mb-2">API Key</label>
                                            <div className="relative">
                                                <Key size={16} className="absolute top-3.5 left-3 text-gray-400"/>
                                                <input 
                                                    type="password"
                                                    className="w-full pl-10 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white font-mono text-sm focus:border-brand outline-none"
                                                    value={apiKeyBuffer}
                                                    onChange={(e) => handleApiKeyChange(e.target.value)}
                                                    placeholder="sk-..."
                                                />
                                            </div>
                                        </div>
                                     )}

                                     {connectionType === 'builtin' && (
                                        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/50 rounded-xl text-center">
                                            <p className="text-xs text-green-700 dark:text-green-400 font-bold">
                                                {isZh ? "✅ 使用 AI Studio 环境变量连接" : "✅ Using AI Studio Environment Variables"}
                                            </p>
                                        </div>
                                     )}

                                     <div>
                                        <label className="text-xs font-bold text-gray-500 block mb-2">Model</label>
                                        <select 
                                            className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white text-sm focus:border-brand outline-none"
                                            value={preferences.apiConfig.gemini.model}
                                            onChange={(e) => onUpdatePreferences({ apiConfig: { ...preferences.apiConfig, gemini: { ...preferences.apiConfig.gemini, model: e.target.value } } })}
                                        >
                                            {GEMINI_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                     </div>
                                 </div>
                             )}

                             {preferences.apiConfig.provider === 'openai' && (
                                 <div className="space-y-3 animate-fade-in-up">
                                     <div>
                                        <label className="text-xs font-bold text-gray-500 block mb-2">Base URL</label>
                                        <input 
                                            className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white text-sm focus:border-brand outline-none font-mono"
                                            value={preferences.apiConfig.openai.baseUrl}
                                            onChange={(e) => onUpdatePreferences({ apiConfig: { ...preferences.apiConfig, openai: { ...preferences.apiConfig.openai, baseUrl: e.target.value } } })}
                                            placeholder="https://api.openai.com/v1"
                                        />
                                     </div>
                                     <div>
                                        <label className="text-xs font-bold text-gray-500 block mb-2">API Key</label>
                                        <input 
                                            type="password"
                                            className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white text-sm focus:border-brand outline-none font-mono"
                                            value={preferences.apiConfig.openai.apiKey}
                                            onChange={(e) => onUpdatePreferences({ apiConfig: { ...preferences.apiConfig, openai: { ...preferences.apiConfig.openai, apiKey: e.target.value } } })}
                                        />
                                     </div>
                                     <div>
                                        <label className="text-xs font-bold text-gray-500 block mb-2">Model</label>
                                        <input 
                                            className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white text-sm focus:border-brand outline-none font-mono"
                                            value={preferences.apiConfig.openai.model}
                                            onChange={(e) => onUpdatePreferences({ apiConfig: { ...preferences.apiConfig, openai: { ...preferences.apiConfig.openai, model: e.target.value } } })}
                                            placeholder="gpt-4o"
                                        />
                                     </div>
                                 </div>
                             )}
                             
                             {preferences.apiConfig.provider === 'gemini-custom' && (
                                 <div className="space-y-3 animate-fade-in-up">
                                     <div>
                                        <label className="text-xs font-bold text-gray-500 block mb-2">Proxy Base URL</label>
                                        <input 
                                            className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white text-sm focus:border-brand outline-none font-mono"
                                            value={preferences.apiConfig.gemini.baseUrl || ''}
                                            onChange={(e) => onUpdatePreferences({ apiConfig: { ...preferences.apiConfig, gemini: { ...preferences.apiConfig.gemini, baseUrl: e.target.value } } })}
                                            placeholder="https://generativelanguage.googleapis.com"
                                        />
                                     </div>
                                     <div>
                                        <label className="text-xs font-bold text-gray-500 block mb-2">API Key</label>
                                        <input 
                                            type="password"
                                            className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white text-sm focus:border-brand outline-none font-mono"
                                            value={apiKeyBuffer}
                                            onChange={(e) => handleApiKeyChange(e.target.value)}
                                        />
                                     </div>
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
                        
                        <h1 className="text-4xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-light">
                            AlgoLingo
                        </h1>
                        
                        <div className="space-y-4 text-left bg-gray-50 dark:bg-dark-card p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <FeatureItem icon={<Code2 className="text-brand"/>} text={isZh ? "无需死记硬背，像母语一样掌握代码" : "Master code naturally, no rote memorization."} />
                            <FeatureItem icon={<Brain className="text-purple-500"/>} text={isZh ? "将 LeetCode 拆解为概念、代码、优化三部曲" : "Break down LeetCode into Concept, Code, and Optimize."} />
                            <FeatureItem icon={<Cpu className="text-orange-500"/>} text={isZh ? "实时 AI 私教，Parsons 代码拼图训练" : "Real-time AI Coach & Parsons Logic Puzzles."} />
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
        <div className="mt-1 p-2 bg-white dark:bg-dark-bg rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 shrink-0">
            {icon}
        </div>
        <p className="text-gray-600 dark:text-gray-300 font-medium leading-relaxed">{text}</p>
    </div>
)