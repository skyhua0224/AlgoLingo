
import React, { useState } from 'react';
import { UserPreferences } from '../../types';
import { SyntaxSection } from './SyntaxSection';
import { PillarsSection } from './PillarsSection';
import { TracksSection } from './TracksSection';
import { PillarDetailView } from './PillarsSection/PillarDetailView';
import { TopicMap } from './PillarsSection/TopicMap';
import { SOFTWARE_ARCH_DATA, CS_FUNDAMENTALS_DATA } from '../../data/engineeringData';
import { generateEngineeringLesson, generateEngineeringRoadmap, generateCustomTrack } from '../../services/geminiService';
import { EngineeringTopic, TopicProfile, SkillTrack, EngineeringPillar, LocalizedContent } from '../../types/engineering';

interface EngineeringHubProps {
    preferences: UserPreferences;
    onUpdatePreferences: (p: Partial<UserPreferences>) => void;
    language: 'Chinese' | 'English';
    onStartLesson: (plan: any, isSkip?: boolean) => void;
}

export const EngineeringHub: React.FC<EngineeringHubProps> = ({ preferences, onUpdatePreferences, language, onStartLesson }) => {
    // Navigation State
    const [activePillarId, setActivePillarId] = useState<'system' | 'cs' | 'track' | null>(null);
    const [activeTopic, setActiveTopic] = useState<EngineeringTopic | null>(null);
    
    // Data State
    const [topicProfile, setTopicProfile] = useState<TopicProfile | null>(null);
    const [activeTrackData, setActiveTrackData] = useState<SkillTrack | null>(null); // For Tracks View
    
    // Loading State
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState("");

    // --- PILLAR LOGIC (System/CS) ---
    
    const handleSelectTopic = async (topic: EngineeringTopic, pillarId: string) => {
        setActiveTopic(topic);
        
        // 1. Check if we have a saved roadmap/profile for this specific topic
        const profileKey = `algolingo_eng_v3_${pillarId}_${topic.id}`;
        const saved = localStorage.getItem(profileKey);
        
        if (saved) {
            try {
                const profile = JSON.parse(saved);
                setTopicProfile(profile);
            } catch (e) {
                await generateAndSaveTopicRoadmap(topic, pillarId);
            }
        } else {
            await generateAndSaveTopicRoadmap(topic, pillarId);
        }
    };

    const generateAndSaveTopicRoadmap = async (topic: EngineeringTopic, pillarId: string) => {
        setLoading(true);
        setLoadingMsg(language === 'Chinese' ? "AI 正在规划课题路径..." : "AI is architecting topic path...");
        const isZh = language === 'Chinese';
        const langKey = isZh ? 'zh' : 'en';
        
        try {
            const roadmap = await generateEngineeringRoadmap(
                topic.title.en,
                pillarId as any,
                topic.keywords,
                preferences
            );
            
            const newProfile: TopicProfile = {
                topicId: topic.id,
                pillarId: pillarId,
                generatedAt: Date.now(),
                roadmap: roadmap,
                currentStepIndex: 0
            };
            
            localStorage.setItem(`algolingo_eng_v3_${pillarId}_${topic.id}`, JSON.stringify(newProfile));
            setTopicProfile(newProfile);
        } catch (e) {
            console.error("Failed to generate roadmap", e);
            alert("AI Connection Failed.");
            setActiveTopic(null);
        } finally {
            setLoading(false);
        }
    };

    // --- TRACK LOGIC (Dynamic) ---

    const handleSelectTrack = async (track: SkillTrack) => {
        setActivePillarId('track');
        setActiveTrackData(track);

        // If modules already exist (hydrated via AI previously), just show view
        if (track.modules && track.modules.length > 0) {
            return; 
        }

        // If no modules, we need to GENERATE the syllabus (Modules -> Topics)
        setLoading(true);
        setLoadingMsg(language === 'Chinese' ? "AI 正在生成专精大纲..." : "AI is generating specialization syllabus...");

        try {
            // Fix: safely extract string for API call
            const trackTitle = typeof track.title === 'string' ? track.title : (track.title.en || 'Custom Track');
            const trackDesc = typeof track.description === 'string' ? track.description : (track.description.en || '');

            const enrichedTrack = await generateCustomTrack(trackTitle, trackDesc, preferences);
            
            // Merge new modules into existing track object
            const updatedTrack = { ...track, modules: enrichedTrack.modules };
            
            // Save back to localStorage (Global User Tracks)
            const allTracks = JSON.parse(localStorage.getItem('algolingo_my_tracks') || '[]');
            const idx = allTracks.findIndex((t: SkillTrack) => t.id === track.id);
            if (idx !== -1) {
                allTracks[idx] = updatedTrack;
                localStorage.setItem('algolingo_my_tracks', JSON.stringify(allTracks));
            } else {
                // Handle case where track wasn't in list yet (e.g. brand new add)
                allTracks.push(updatedTrack);
                localStorage.setItem('algolingo_my_tracks', JSON.stringify(allTracks));
            }
            
            setActiveTrackData(updatedTrack);

        } catch (e) {
            console.error("Failed to generate track syllabus", e);
            alert("Syllabus Generation Failed.");
            setActivePillarId(null);
        } finally {
            setLoading(false);
        }
    };

    // --- LESSON START LOGIC ---

    const handleStartLevel = async (step: any) => {
        if (!activeTopic) return;
        
        setLoading(true);
        setLoadingMsg(language === 'Chinese' ? "AI 正在构建专属关卡..." : "AI is compiling the level...");
        const isZh = language === 'Chinese';
        const langKey = isZh ? 'zh' : 'en';

        try {
            const lessonTitle = `${activeTopic.title[langKey]}: ${step.title[langKey]}`;
            const contextDescription = step.description[langKey];
            
            const plan = await generateEngineeringLesson(
                activePillarId === 'cs' ? 'cs' : 'system', // Default to system prompt style for tracks
                lessonTitle, 
                [...activeTopic.keywords, step.focus], 
                step.focus, 
                preferences,
                contextDescription 
            );
            
            onStartLesson(plan);
        } catch (e) {
            console.error("Failed to generate lesson", e);
            alert("AI Connection Failed.");
        } finally {
            setLoading(false);
        }
    };

    // --- VIEW ROUTING ---

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] animate-fade-in-up">
                <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mb-6"></div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white animate-pulse">
                    {loadingMsg}
                </h2>
            </div>
        )
    }

    // 1. Detailed Topic Map (Steps View)
    if (activeTopic && topicProfile) {
        return (
            <TopicMap 
                topic={activeTopic}
                profile={topicProfile}
                pillarId={activePillarId as any}
                onBack={() => { setActiveTopic(null); setTopicProfile(null); }}
                onStartPhase={handleStartLevel} 
                language={language}
            />
        );
    }

    // 2. Track Detail View (Reusing PillarDetailView for structure consistency)
    if (activePillarId === 'track' && activeTrackData) {
        // Helper to ensure LocalizedContent format
        const ensureLocalized = (content: string | LocalizedContent): LocalizedContent => {
            if (typeof content === 'string') return { en: content, zh: content };
            return content;
        };

        // Convert SkillTrack to EngineeringPillar shape for the view
        const mockPillarData: EngineeringPillar = {
            id: activeTrackData.id,
            title: ensureLocalized(activeTrackData.title),
            description: ensureLocalized(activeTrackData.description),
            modules: activeTrackData.modules || []
        };

        return (
            <PillarDetailView 
                data={mockPillarData}
                onBack={() => { setActivePillarId(null); setActiveTrackData(null); }}
                onSelectTopic={(topic) => handleSelectTopic(topic, 'track')}
                language={language}
            />
        );
    }

    // 3. Pillar Detail View (Static Data)
    if (activePillarId === 'system' || activePillarId === 'cs') {
        const data = activePillarId === 'system' ? SOFTWARE_ARCH_DATA : CS_FUNDAMENTALS_DATA;
        return (
            <PillarDetailView 
                data={data}
                onBack={() => setActivePillarId(null)}
                onSelectTopic={(topic) => handleSelectTopic(topic, activePillarId)}
                language={language}
            />
        );
    }

    // 4. Main Hub View
    return (
        <div className="p-4 md:p-8 pb-24 max-w-7xl mx-auto space-y-10 animate-fade-in-up">
            <div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                    {language === 'Chinese' ? "工程中心" : "Engineering Hub"}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                    {language === 'Chinese' ? "构建全栈能力体系" : "Build your full-stack arsenal"}
                </p>
            </div>

            <SyntaxSection 
                preferences={preferences}
                onUpdatePreferences={onUpdatePreferences}
                language={language}
                onStartLesson={onStartLesson} 
            />

            <PillarsSection 
                language={language} 
                onSelectPillar={setActivePillarId}
            />

            <TracksSection 
                language={language}
                onSelectTrack={handleSelectTrack}
            />
        </div>
    );
};
