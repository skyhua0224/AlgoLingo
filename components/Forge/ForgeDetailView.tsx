
import React, { useState } from 'react';
import { ForgeRoadmap, ForgeStage } from '../../types/forge';
import { ArrowLeft, Lightbulb, Layers, ArrowRight, Play, Sparkles, BookOpen, CheckCircle, Lock, Loader2 } from 'lucide-react';
import { generateForgeStage } from '../../services/geminiService';
import { UserPreferences } from '../../types';
import { LevelNode } from '../common/GamifiedMap';

interface ForgeDetailViewProps {
    roadmap: ForgeRoadmap;
    onBack: () => void;
    onStartStage: (plan: any) => void;
    preferences: UserPreferences;
    language: 'Chinese' | 'English';
}

const ICON_MAP: Record<string, any> = {
    Lightbulb, Layers, ArrowRight, Play, Sparkles, BookOpen
};

export const ForgeDetailView: React.FC<ForgeDetailViewProps> = ({ roadmap, onBack, onStartStage, preferences, language }) => {
    const [loadingStageId, setLoadingStageId] = useState<number | null>(null);
    const isZh = language === 'Chinese';

    const handleStageClick = async (stage: ForgeStage) => {
        // If plan already cached, use it
        if (stage.lessonPlan) {
            onStartStage(stage.lessonPlan);
            return;
        }

        setLoadingStageId(stage.id);
        try {
            const plan = await generateForgeStage(roadmap, stage.id, preferences);
            
            // Cache the plan in the roadmap object
            stage.lessonPlan = plan; 
            
            // Trigger Lesson Runner
            onStartStage(plan);
        } catch (e) {
            alert("Failed to generate stage content. Please try again.");
        } finally {
            setLoadingStageId(null);
        }
    };

    // Theme Configuration (Purple for Forge)
    const theme = {
        bg: "bg-slate-50 dark:bg-[#0f172a]",
        text: "text-slate-900 dark:text-white",
        subText: "text-slate-500 dark:text-slate-400",
        headerBg: "bg-white/80 dark:bg-[#0f172a]/80",
        accent: "text-purple-600 dark:text-purple-400",
        border: "border-purple-200 dark:border-purple-900/50",
        nodeActive: "bg-purple-500 dark:bg-purple-600 border-purple-100 dark:border-white text-white",
        nodeLocked: "bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500",
        nodeCompleted: "bg-purple-100 dark:bg-purple-900/20 border-purple-500 text-purple-600 dark:text-purple-400",
        line: "bg-purple-200 dark:bg-purple-900/30",
        card: "bg-white dark:bg-white/5 border-purple-100 dark:border-white/10 hover:shadow-lg hover:border-purple-300 dark:hover:border-white/20"
    };

    // Helper to group stages into chapters
    const groups = [
        {
            title: isZh ? "第一章：核心概念" : "Chapter 1: Core Concepts",
            desc: isZh ? "建立认知基石" : "Foundations & Structure",
            stages: roadmap.stages.slice(0, 2)
        },
        {
            title: isZh ? "第二章：深度机制" : "Chapter 2: Mechanics",
            desc: isZh ? "理解流程与细节" : "Process & Nuance",
            stages: roadmap.stages.slice(2, 4)
        },
        {
            title: isZh ? "第三章：实战精通" : "Chapter 3: Mastery",
            desc: isZh ? "应用与洞察" : "Application & Insight",
            stages: roadmap.stages.slice(4, 6)
        }
    ];

    const renderIcon = (iconName: string) => {
        const Icon = ICON_MAP[iconName] || BookOpen;
        return <Icon size={20} />;
    };

    return (
        <div className={`flex flex-col h-full min-h-screen relative ${theme.bg} ${theme.text} transition-colors duration-500`}>
            {/* Header */}
            <div className={`p-6 border-b ${theme.border} flex items-center gap-4 ${theme.headerBg} backdrop-blur-sm sticky top-0 z-20 shrink-0`}>
                <button onClick={onBack} className={`p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 ${theme.subText} hover:${theme.text} transition-colors`}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="text-xl font-black leading-tight tracking-tight">
                        {roadmap.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                            {isZh ? "知识工坊" : "Knowledge Forge"}
                        </span>
                        <p className={`text-xs ${theme.subText} font-medium truncate max-w-[200px]`}>
                            {roadmap.description}
                        </p>
                    </div>
                </div>
            </div>

            {/* Campaign Path */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 relative z-10">
                <div className="max-w-xl mx-auto relative pb-24">
                    {/* Vertical Line */}
                    <div className={`absolute left-8 top-4 bottom-4 w-1 ${theme.line} rounded-full z-0`}></div>

                    {groups.map((group, gIdx) => (
                        <div key={gIdx} className="mb-12 relative">
                            {/* Group Header */}
                            <div className="flex items-center gap-4 mb-6 ml-16">
                                <div>
                                    <h3 className={`text-sm font-black ${theme.subText} uppercase tracking-widest`}>{group.title}</h3>
                                    <p className="text-[10px] text-gray-400 font-medium">{group.desc}</p>
                                </div>
                            </div>

                            {group.stages.map((stage, idx) => {
                                const status = stage.status; // 'locked' | 'unlocked' | 'completed'
                                const isLocked = status === 'locked';
                                const isActive = status === 'unlocked'; // Map 'unlocked' to active visual
                                const isCompleted = status === 'completed';
                                const isLoading = loadingStageId === stage.id;
                                
                                const globalIdx = gIdx * 2 + idx;

                                let nodeStyle = theme.nodeLocked;
                                if (isActive) nodeStyle = theme.nodeActive;
                                if (isCompleted) nodeStyle = theme.nodeCompleted;

                                return (
                                    <div key={stage.id} className="relative z-10 mb-8 group">
                                        <div className="flex items-start gap-6">
                                            {/* Node Circle */}
                                            <button 
                                                disabled={isLocked || isLoading}
                                                onClick={() => handleStageClick(stage)}
                                                className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all duration-300 shrink-0 shadow-lg ${nodeStyle} ${isActive ? 'scale-110 animate-pulse-soft ring-4 ring-opacity-20 ring-current' : ''}`}
                                            >
                                                {isLoading ? <Loader2 size={24} className="animate-spin"/> : (isLocked ? <Lock size={24}/> : (isCompleted ? <CheckCircle size={28}/> : renderIcon(stage.icon)))}
                                            </button>

                                            {/* Content Card */}
                                            <button 
                                                disabled={isLocked || isLoading}
                                                onClick={() => handleStageClick(stage)}
                                                className={`flex-1 text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden
                                                    ${isLocked 
                                                        ? 'bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/5 opacity-50 cursor-not-allowed' 
                                                        : `${theme.card} cursor-pointer ${isActive ? 'ring-1 ring-current' : ''}`
                                                    }
                                                `}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isLocked ? 'text-gray-400 dark:text-gray-500' : theme.accent}`}>
                                                        STAGE {String(globalIdx + 1).padStart(2, '0')}
                                                    </span>
                                                    {isActive && <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>}
                                                </div>
                                                <h3 className={`text-lg font-bold mb-1 ${isLocked ? 'text-gray-500' : theme.text}`}>
                                                    {stage.title}
                                                </h3>
                                                <p className={`text-xs ${theme.subText} leading-relaxed font-medium`}>
                                                    {stage.description}
                                                </p>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
