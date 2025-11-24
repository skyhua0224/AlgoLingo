
import React, { useState, useEffect } from 'react';
import { SyntaxProfile, SyntaxUnit, SyntaxLesson } from '../../../../types/engineering';
import { StudioMain } from './StudioMain';
import { SetupWizard } from './SetupWizard';
import { generateSyntaxLesson } from '../../../../services/geminiService';
import { UserPreferences } from '../../../../types';
import { LanguageSelector } from './LanguageSelector';
import { Settings } from 'lucide-react';

interface LanguageConsoleProps {
    currentLang: string;
    onUpdateLang: (lang: any) => void;
    language: 'Chinese' | 'English';
    preferences: UserPreferences;
    onStartSyntaxLesson: (plan: any, isSkip?: boolean) => void; 
}

export const LanguageConsole: React.FC<LanguageConsoleProps> = ({ currentLang, onUpdateLang, language, preferences, onStartSyntaxLesson }) => {
    const [profile, setProfile] = useState<SyntaxProfile | null>(null);
    const [loading, setLoading] = useState(false);

    // Sync profile when language changes
    useEffect(() => {
        const saved = localStorage.getItem(`algolingo_syntax_v3_${currentLang}`);
        if (saved) {
            try {
                setProfile(JSON.parse(saved));
            } catch (e) {
                setProfile(null);
            }
        } else {
            setProfile(null);
        }
    }, [currentLang]);

    const handleSetupComplete = (newProfile: SyntaxProfile) => {
        localStorage.setItem(`algolingo_syntax_v3_${currentLang}`, JSON.stringify(newProfile));
        setProfile(newProfile);
    };

    const handleReset = () => {
        if (window.confirm(language === 'Chinese' ? "确定要重置该语言的学习进度吗？" : "Are you sure you want to reset progress for this language?")) {
            setProfile(null);
            localStorage.removeItem(`algolingo_syntax_v3_${currentLang}`);
        }
    };

    const handleStartLesson = async (unit: SyntaxUnit, lesson: SyntaxLesson, stageId: string, isSkip: boolean = false) => {
        if (!profile) return;
        setLoading(true);
        try {
            const plan = await generateSyntaxLesson(unit, lesson, stageId, profile, preferences);
            onStartSyntaxLesson(plan, isSkip);
        } catch (e) {
            console.error("Failed to start lesson", e);
            alert("Failed to generate lesson content.");
        } finally {
            setLoading(false);
        }
    };

    const isZh = language === 'Chinese';

    return (
        <div className="w-full h-[700px] bg-white dark:bg-dark-card rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl relative flex flex-col z-10">
            
            {/* --- PERSISTENT HEADER --- */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-dark-card z-50 shadow-sm shrink-0 rounded-t-3xl">
                <div className="flex items-center gap-4">
                    {/* Main Selector */}
                    <LanguageSelector 
                        currentLang={currentLang} 
                        onSwitch={onUpdateLang} 
                        language={language}
                    />
                    
                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 hidden md:block"></div>
                    
                    {/* Status / Mode Badge */}
                    <div className="hidden md:block">
                        {profile ? (
                            <div className="flex flex-col justify-center">
                                <h1 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight mb-0.5">{profile.strategyName}</h1>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase">Active</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                <span className="text-[10px] font-bold text-yellow-700 dark:text-yellow-400 uppercase">
                                    {isZh ? "未配置" : "Setup Required"}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                
                {profile && (
                    <button 
                        onClick={handleReset} 
                        className="p-2.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors border border-transparent hover:border-red-100"
                        title={isZh ? "重置此语言配置" : "Reset configuration"}
                    >
                        <Settings size={20} />
                    </button>
                )}
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="flex-1 relative overflow-hidden bg-gray-50/50 dark:bg-black/20 flex flex-col rounded-b-3xl z-0">
                {loading && (
                    <div className="absolute inset-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
                        <div className="animate-pulse font-bold text-brand text-lg">Generating Lesson Content...</div>
                    </div>
                )}

                {profile ? (
                    <StudioMain 
                        profile={profile}
                        language={language}
                        onStartLesson={handleStartLesson}
                    />
                ) : (
                    <SetupWizard 
                        targetLang={currentLang}
                        onComplete={handleSetupComplete}
                        language={language}
                        preferences={preferences}
                    />
                )}
            </div>
        </div>
    );
};
