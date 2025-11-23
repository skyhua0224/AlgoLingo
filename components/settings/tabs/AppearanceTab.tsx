import React from 'react';
import { UserPreferences } from '../../../types';
import { Palette, Moon, Sun, Monitor } from 'lucide-react';

interface AppearanceTabProps {
    preferences: UserPreferences;
    onChange: (p: Partial<UserPreferences>) => void;
    isZh: boolean;
}

export const AppearanceTab: React.FC<AppearanceTabProps> = ({ preferences, onChange, isZh }) => {
    return (
        <div className="space-y-6 animate-fade-in-up">
             <div className="flex items-center gap-2 mb-4 text-brand font-bold text-sm uppercase tracking-wider">
                <Palette size={16} />
                {isZh ? '主题设置' : 'Theme Settings'}
            </div>
            
            <div className="grid grid-cols-3 gap-3">
                {[
                    { id: 'light', label: isZh ? '浅色' : 'Light', icon: <Sun size={18}/> },
                    { id: 'dark', label: isZh ? '深色' : 'Dark', icon: <Moon size={18}/> },
                    { id: 'system', label: isZh ? '跟随系统' : 'System', icon: <Monitor size={18}/> }
                ].map(theme => (
                    <button
                        key={theme.id}
                        onClick={() => onChange({ theme: theme.id as any })}
                        className={`py-4 rounded-xl border-2 font-bold text-sm transition-all flex flex-col items-center justify-center gap-2 active:scale-95 ${
                            preferences.theme === theme.id 
                            ? 'border-brand bg-brand text-white' 
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 bg-white dark:bg-dark-card'
                        }`}
                    >
                        {theme.icon} 
                        <span>{theme.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};