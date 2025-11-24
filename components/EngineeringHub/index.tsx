
import React from 'react';
import { UserPreferences } from '../../types';
import { SyntaxSection } from './SyntaxSection';
import { PillarsSection } from './PillarsSection';
import { TracksSection } from './TracksSection';

interface EngineeringHubProps {
    preferences: UserPreferences;
    onUpdatePreferences: (p: Partial<UserPreferences>) => void;
    language: 'Chinese' | 'English';
    onStartLesson: (plan: any, isSkip?: boolean) => void; // Prop drilling for lesson runner
}

/**
 * EngineeringHub - The "Second Brain" for Engineers.
 */
export const EngineeringHub: React.FC<EngineeringHubProps> = ({ preferences, onUpdatePreferences, language, onStartLesson }) => {
    return (
        <div className="p-4 md:p-8 pb-24 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
            
            {/* Header */}
            <div className="mb-2">
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                    {language === 'Chinese' ? "工程中心" : "Engineering Hub"}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                    {language === 'Chinese' ? "构建全栈能力体系" : "Build your full-stack arsenal"}
                </p>
            </div>

            {/* Row 1: Language & Syntax (Pass lesson handler) */}
            <div className="w-full mb-8">
                <div className="flex items-center gap-2 mb-4 px-1">
                    <div className="h-6 w-1 bg-brand rounded-full"></div>
                    <h2 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-wide">
                        {language === 'Chinese' ? "语言控制台" : "Syntax Studio"}
                    </h2>
                </div>
                
                <SyntaxSection 
                    preferences={preferences}
                    onUpdatePreferences={onUpdatePreferences}
                    language={language}
                    onStartLesson={onStartLesson} // Pass it down
                />
            </div>

            {/* Row 2: Core Pillars */}
            <PillarsSection language={language} />

            {/* Row 3: Dynamic Tracks */}
            <TracksSection language={language} />

        </div>
    );
};
