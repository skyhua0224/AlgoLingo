import React from 'react';
import { UserPreferences } from '../../../types';
import { Cpu, Key } from 'lucide-react';
import { GEMINI_MODELS } from '../../../constants';

interface AITabProps {
    preferences: UserPreferences;
    onChange: (p: Partial<UserPreferences>) => void;
    isZh: boolean;
}

export const AITab: React.FC<AITabProps> = ({ preferences, onChange, isZh }) => {
    const apiConfig = preferences.apiConfig;

    const updateApiConfig = (newConfig: any) => {
        onChange({ apiConfig: { ...apiConfig, ...newConfig } });
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-4 text-brand font-bold text-sm uppercase tracking-wider">
                <Cpu size={16} />
                {isZh ? 'AI 引擎配置' : 'AI Engine Configuration'}
            </div>

            {/* Provider Switch */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-4">
                <button 
                    onClick={() => updateApiConfig({ provider: 'gemini-official' })}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${apiConfig.provider === 'gemini-official' ? 'bg-white dark:bg-dark-card text-brand shadow-sm' : 'text-gray-500'}`}
                >
                    Gemini (Official)
                </button>
                 <button 
                    onClick={() => updateApiConfig({ provider: 'gemini-custom' })}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${apiConfig.provider === 'gemini-custom' ? 'bg-white dark:bg-dark-card text-brand shadow-sm' : 'text-gray-500'}`}
                >
                    Gemini (Custom)
                </button>
                <button 
                    onClick={() => updateApiConfig({ provider: 'openai' })}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${apiConfig.provider === 'openai' ? 'bg-white dark:bg-dark-card text-brand shadow-sm' : 'text-gray-500'}`}
                >
                    OpenAI / Compatible
                </button>
            </div>

            {/* Config Areas */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                
                {/* Gemini Official/Custom */}
                {(apiConfig.provider === 'gemini-official' || apiConfig.provider === 'gemini-custom') && (
                    <div className="space-y-4">
                        {apiConfig.provider === 'gemini-custom' && (
                            <div>
                                <label className="text-xs font-bold text-gray-500 block mb-2">Proxy Base URL</label>
                                <input 
                                    className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white text-sm focus:border-brand outline-none font-mono"
                                    value={apiConfig.gemini.baseUrl || ''}
                                    onChange={(e) => updateApiConfig({ gemini: { ...apiConfig.gemini, baseUrl: e.target.value } })}
                                    placeholder="https://generativelanguage.googleapis.com"
                                />
                            </div>
                        )}
                        
                        {apiConfig.provider === 'gemini-custom' && (
                            <div>
                                <label className="text-xs font-bold text-gray-500 block mb-2">API Key</label>
                                <div className="relative">
                                    <Key size={16} className="absolute top-3.5 left-3 text-gray-400"/>
                                    <input 
                                        type="password"
                                        className="w-full pl-10 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white text-sm focus:border-brand outline-none font-mono"
                                        value={apiConfig.gemini.apiKey || ''}
                                        onChange={(e) => updateApiConfig({ gemini: { ...apiConfig.gemini, apiKey: e.target.value } })}
                                        placeholder="sk-..."
                                    />
                                </div>
                            </div>
                        )}

                        {apiConfig.provider === 'gemini-official' && (
                             <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl text-center">
                                <p className="text-xs text-blue-700 dark:text-blue-400 font-bold">
                                    {isZh ? "使用 AI Studio 内置环境变量连接。" : "Using Built-in AI Studio Environment Variables."}
                                </p>
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-bold text-gray-500 block mb-2">{isZh ? "模型选择" : "Model Selection"}</label>
                            <select 
                                className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white text-sm focus:border-brand outline-none"
                                value={apiConfig.gemini.model}
                                onChange={(e) => updateApiConfig({ gemini: { ...apiConfig.gemini, model: e.target.value } })}
                            >
                                {GEMINI_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <p className="text-[10px] text-gray-400 mt-2">
                                {isZh 
                                ? "推荐使用 gemini-2.5-flash 以获得最快响应速度。" 
                                : "Recommended: gemini-2.5-flash for fastest response speed."}
                            </p>
                        </div>
                    </div>
                )}

                {/* OpenAI / Compatible Config */}
                {apiConfig.provider === 'openai' && (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 block mb-2">Base URL</label>
                            <input 
                                className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white text-sm focus:border-brand outline-none font-mono"
                                value={apiConfig.openai.baseUrl}
                                onChange={(e) => updateApiConfig({ openai: { ...apiConfig.openai, baseUrl: e.target.value } })}
                                placeholder="https://api.openai.com/v1"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 block mb-2">API Key</label>
                            <input 
                                type="password"
                                className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white text-sm focus:border-brand outline-none font-mono"
                                value={apiConfig.openai.apiKey}
                                onChange={(e) => updateApiConfig({ openai: { ...apiConfig.openai, apiKey: e.target.value } })}
                                placeholder="sk-..."
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 block mb-2">Model Name</label>
                            <input 
                                className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white text-sm focus:border-brand outline-none font-mono"
                                value={apiConfig.openai.model}
                                onChange={(e) => updateApiConfig({ openai: { ...apiConfig.openai, model: e.target.value } })}
                                placeholder="gpt-4o, deepseek-chat, etc."
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};