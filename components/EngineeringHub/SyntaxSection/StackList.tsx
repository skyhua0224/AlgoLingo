
import React from 'react';
import { Globe, Plus } from 'lucide-react';

interface StackListProps {
    currentLang: string;
    onSwitch: (lang: any) => void;
    language: 'Chinese' | 'English';
}

/**
 * StackList
 * Allows quick switching between the user's active languages.
 * Shows a small progress ring for each language.
 */
export const StackList: React.FC<StackListProps> = ({ currentLang, onSwitch, language }) => {
    const isZh = language === 'Chinese';
    
    // Mock Data
    const languages = [
        { id: 'Python', label: 'Python', color: 'bg-blue-500' },
        { id: 'Java', label: 'Java', color: 'bg-red-500' },
        { id: 'Go', label: 'Go', color: 'bg-cyan-500' },
    ];

    return (
        <div className="flex flex-col gap-3 h-full">
            {languages.map(lang => (
                <button 
                    key={lang.id}
                    onClick={() => onSwitch(lang.id)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group shadow-sm flex-1 ${
                        currentLang === lang.id 
                        ? 'bg-white dark:bg-dark-card border-brand ring-1 ring-brand/20' 
                        : 'bg-white dark:bg-dark-card border-gray-100 dark:border-gray-800 hover:border-brand/50'
                    }`}
                >
                    <div className={`w-10 h-10 rounded-lg ${lang.color} flex items-center justify-center text-white font-bold text-xs shadow-md group-hover:scale-110 transition-transform`}>
                        {lang.id.slice(0, 2)}
                    </div>
                    <div className="text-left flex-1">
                        <div className="font-bold text-gray-800 dark:text-white text-sm">{lang.label}</div>
                    </div>
                    {currentLang === lang.id && (
                        <div className="w-2 h-2 bg-brand rounded-full shadow-[0_0_8px_rgba(132,204,22,0.8)]"></div>
                    )}
                </button>
            ))}
            
            <button className="flex items-center justify-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-xs font-bold">
                <Plus size={14} />
                {isZh ? "添加新语言" : "Add Language"}
            </button>
        </div>
    );
};
