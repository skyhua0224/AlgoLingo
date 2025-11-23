import React from 'react';
import { UserPreferences } from '../../../types';
import { Globe, User } from 'lucide-react';

interface GeneralTabProps {
    preferences: UserPreferences;
    onChange: (p: Partial<UserPreferences>) => void;
    isZh: boolean;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({ preferences, onChange, isZh }) => {
    return (
        <div className="space-y-8 animate-fade-in-up">
            <div>
                <div className="flex items-center gap-2 mb-4 text-brand font-bold text-sm uppercase tracking-wider">
                    <User size={16} />
                    {isZh ? '个人信息' : 'Profile'}
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 block mb-2">{isZh ? '你的昵称' : 'Display Name'}</label>
                    <input 
                        type="text"
                        value={preferences.userName}
                        onChange={(e) => onChange({ userName: e.target.value })}
                        className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white font-bold text-sm focus:border-brand outline-none"
                    />
                </div>
            </div>

            <div>
                <div className="flex items-center gap-2 mb-4 text-brand font-bold text-sm uppercase tracking-wider">
                    <Globe size={16} />
                    {isZh ? '语言偏好' : 'Language Preferences'}
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 p-4 rounded-xl mb-6">
                    <p className="text-xs text-orange-800 dark:text-orange-400 font-medium leading-relaxed">
                        {isZh 
                         ? "注意：AI 讲师将严格遵循以下语言设置。例如，如果你选择“中文”教学和“Python”目标语言，AI 将用中文解释 Python 代码。" 
                         : "Note: The AI Coach will strictly follow these settings. It will generate content in your Instruction Language and teach the selected Target Code Language."}
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Spoken Language */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 block mb-2">{isZh ? '教学语言 (AI 使用语言)' : 'Instruction Language (AI Speaks)'}</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['Chinese', 'English'].map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => onChange({ spokenLanguage: lang as any })}
                                    className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                                        preferences.spokenLanguage === lang 
                                        ? 'border-brand bg-brand text-white shadow-sm' 
                                        : 'border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-dark-card text-gray-600 dark:text-gray-300 bg-transparent'
                                    }`}
                                >
                                    {lang === 'Chinese' ? '中文 (Chinese)' : 'English'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Target Language */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 block mb-2">{isZh ? '目标编程语言 (你想学的)' : 'Target Programming Language'}</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['Python', 'Java', 'C++', 'C', 'JavaScript', 'Go'].map(lang => (
                                <button
                                    key={lang}
                                    onClick={() => onChange({ targetLanguage: lang as any })}
                                    className={`py-2 rounded-xl border-2 font-bold text-xs transition-all ${
                                        preferences.targetLanguage === lang 
                                        ? 'border-brand bg-brand text-white shadow-sm' 
                                        : 'border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-dark-card text-gray-600 dark:text-gray-300 bg-transparent'
                                    }`}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};