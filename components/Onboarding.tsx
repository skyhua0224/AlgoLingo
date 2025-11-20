import React, { useState } from 'react';
import { Button } from './Button';
import { Code2, Brain, Zap, ArrowRight, Check, Globe, Moon, Sun, Monitor, Cpu, Key, Link, Terminal, Box } from 'lucide-react';
import { UserPreferences, ApiConfig } from '../types';
import { GEMINI_MODELS } from '../constants';

interface OnboardingProps {
    preferences: UserPreferences;
    onUpdatePreferences: (p: Partial<UserPreferences>) => void;
    onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ preferences, onUpdatePreferences, onComplete }) => {
    const [step, setStep] = useState(0);
    
    // Local state for immediate visual feedback is mostly handled by props,
    // but we might want input buffers for text fields.
    const [apiKeyBuffer, setApiKeyBuffer] = useState(preferences.apiConfig.gemini.apiKey || '');
    
    // New local state for connection type toggle
    const [connectionType, setConnectionType] = useState<'builtin' | 'custom'>(
        preferences.apiConfig.gemini.apiKey ? 'custom' : 'builtin'
    );

    const isZh = preferences.spokenLanguage === 'Chinese';

    const steps = [
        { id: 'interface', title: isZh ? "界面设置" : "Interface" },
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
            // Clear the custom key so the service uses process.env.API_KEY
            onUpdatePreferences({
                apiConfig: {
                    ...preferences.apiConfig,
                    gemini: { ...preferences.apiConfig.gemini, apiKey: '' }
                }
            });
            setApiKeyBuffer('');
        }
    };

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

            <div className="max-w-lg w-full space-y-8 animate-fade-in-up">
                
                {/* STEP 1: INTERFACE (Language & Theme) */}
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

                        <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-center text-gray-400 font-bold text-xs uppercase tracking-wider mb-4">{isZh ? "外观模式" : "Appearance"}</p>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'light', label: isZh ? '浅色' : 'Light', icon: <Sun size={18}/> },
                                    { id: 'dark', label: isZh ? '深色' : 'Dark', icon: <Moon size={18}/> },
                                    { id: 'system', label: isZh ? '自动' : 'Auto', icon: <Monitor size={18}/> }
                                ].map(theme => (
                                    <button
                                        key={theme.id}
                                        onClick={() => onUpdatePreferences({ theme: theme.id as any })}
                                        className={`py-3 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                                            preferences.theme === theme.id 
                                            ? 'border-gray-800 dark:border-white bg-gray-800 dark:bg-white text-white dark:text-gray-900' 
                                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-600 dark:text-gray-400'
                                        }`}
                                    >
                                        {theme.icon} {theme.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: PROFILE (Name & Target Language) */}
                {step === 1 && (
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
                {step === 2 && (
                    <div className="space-y-6">
                         <div className="text-center">
                            <div className="inline-flex p-4 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-6 text-orange-600 dark:text-orange-400 shadow-sm">
                                <Brain size={48} />
                            </div>
                            <h1 className="text-3xl font-extrabold mb-2">{isZh ? "配置大脑" : "Connect Intelligence"}</h1>
                            <p className="text-gray-500 dark:text-gray-400">{isZh ? "AlgoLingo 需要 LLM 驱动。选择你的连接方式。" : "AlgoLingo runs on LLMs. Select your connection method."}</p>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-6">
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
                {step === 3 && (
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