import React from 'react';
import { UserPreferences } from '../../../types';
import { Bell, Send } from 'lucide-react';

interface NotificationTabProps {
    preferences: UserPreferences;
    onChange: (p: Partial<UserPreferences>) => void;
    isZh: boolean;
}

export const NotificationTab: React.FC<NotificationTabProps> = ({ preferences, onChange, isZh }) => {
    const config = preferences.notificationConfig || { enabled: false, webhookUrl: '', type: 'custom' };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-4 text-brand font-bold text-sm uppercase tracking-wider">
                <Bell size={16} />
                {isZh ? '学习提醒' : 'Study Reminders'}
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer">
                        <input 
                            type="checkbox" 
                            id="notify-toggle"
                            checked={config.enabled}
                            onChange={(e) => onChange({ notificationConfig: { ...config, enabled: e.target.checked } })}
                            className="absolute w-6 h-6 opacity-0 cursor-pointer z-10 inset-0"
                        />
                         <div className={`block w-12 h-6 rounded-full transition-colors ${config.enabled ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                         <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform ${config.enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                    <label htmlFor="notify-toggle" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                        {isZh ? '启用 AI 学习提醒' : 'Enable AI Reminders'}
                    </label>
                </div>

                {config.enabled && (
                    <div className="animate-fade-in-down space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div>
                            <label className="text-xs font-bold text-gray-500 block mb-2">{isZh ? 'Webhook 地址' : 'Webhook URL'}</label>
                            <div className="flex gap-2">
                                <input 
                                    className="flex-1 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white font-mono text-sm focus:border-brand outline-none"
                                    value={config.webhookUrl}
                                    onChange={(e) => onChange({ notificationConfig: { ...config, webhookUrl: e.target.value, type: e.target.value.includes('bark') ? 'bark' : 'telegram' } })}
                                    placeholder="https://api.day.app/..."
                                />
                                <button className="p-3 bg-brand text-white rounded-xl hover:bg-brand-dark shadow-sm">
                                    <Send size={16}/>
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2">
                                {isZh 
                                ? "支持 Bark (iOS), Telegram Bot, 或任意支持 GET/POST 的 Webhook。" 
                                : "Supports Bark (iOS), Telegram Bot, or any generic GET/POST Webhook."}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};