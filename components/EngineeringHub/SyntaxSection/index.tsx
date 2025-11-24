
import React from 'react';
import { UserPreferences } from '../../../types';
import { LanguageConsole } from './LanguageConsole';

interface SyntaxSectionProps {
    preferences: UserPreferences;
    onUpdatePreferences: (p: Partial<UserPreferences>) => void;
    language: 'Chinese' | 'English';
    onStartLesson: (plan: any, isSkip?: boolean) => void;
}

export const SyntaxSection: React.FC<SyntaxSectionProps> = ({ preferences, onUpdatePreferences, language, onStartLesson }) => {
    return (
        <div className="w-full mb-8">
            <LanguageConsole 
                currentLang={preferences.targetLanguage}
                onUpdateLang={(lang) => onUpdatePreferences({ targetLanguage: lang })}
                language={language}
                preferences={preferences}
                onStartSyntaxLesson={onStartLesson}
            />
        </div>
    );
};
