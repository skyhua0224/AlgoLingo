
import React from 'react';
import { EngineeringTopic, TopicProfile } from '../../../../types/engineering';
import { ArrowLeft, BookOpen, Code2, Bug, Crown, Lock, CheckCircle, Network, History, Tag, Terminal, PenTool, Layout } from 'lucide-react';

interface TopicMapProps {
    topic: EngineeringTopic;
    profile: TopicProfile;
    pillarId: 'system' | 'cs';
    onBack: () => void;
    onStartPhase: (step: any) => void;
    language: 'Chinese' | 'English';
}

export const TopicMap: React.FC<TopicMapProps> = ({ topic, profile, pillarId, onBack, onStartPhase, language }) => {
    const isZh = language === 'Chinese';
    const langKey = isZh ? 'zh' : 'en';
    const isSystem = pillarId === 'system';

    // Theme Config
    const theme = isSystem ? {
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
    } : {
        bg: "bg-stone-50 dark:bg-[#0a0a0a]",
        text: "text-stone-900 dark:text-white",
        subText: "text-stone-500 dark:text-stone-400",
        headerBg: "bg-white/80 dark:bg-[#0a0a0a]/80",
        accent: "text-emerald-600 dark:text-emerald-400",
        border: "border-emerald-200 dark:border-emerald-900/50",
        nodeActive: "bg-emerald-500 dark:bg-emerald-600 border-emerald-100 dark:border-white text-white",
        nodeLocked: "bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500",
        nodeCompleted: "bg-emerald-100 dark:bg-emerald-900/20 border-emerald-500 text-emerald-600 dark:text-emerald-400",
        line: "bg-emerald-200 dark:bg-emerald-900/30",
        card: "bg-white dark:bg-white/5 border-emerald-100 dark:border-white/10 hover:shadow-lg hover:border-emerald-300 dark:hover:border-white/20"
    };

    const getIcon = (focus: string, index: number) => {
        if (focus === 'concept') return <BookOpen size={20} />;
        if (focus === 'code') return <Code2 size={20} />;
        if (focus === 'debug') return <Bug size={20} />;
        if (focus === 'design') return <Network size={20} />;
        if (focus === 'mastery') return <Crown size={20} />;
        return <BookOpen size={20} />;
    };

    // Helper to get icon for specific tags
    const getTagIcon = (tag: string) => {
        const lower = tag.toLowerCase();
        if (lower.includes('terminal')) return <Terminal size={10}/>;
        if (lower.includes('editor') || lower.includes('code')) return <PenTool size={10}/>;
        if (lower.includes('arch') || lower.includes('canvas')) return <Layout size={10}/>;
        if (lower.includes('quiz') || lower.includes('check')) return <CheckCircle size={10}/>;
        return <Tag size={10}/>;
    };

    // Dynamic Grouping: Every 2 steps form a "Chapter"
    const groups = [];
    for (let i = 0; i < profile.roadmap.length; i += 2) {
        const chapterNum = Math.floor(i / 2) + 1;
        let title = isZh ? `第 ${chapterNum} 章` : `Chapter ${chapterNum}`;
        let desc = "";
        
        const progress = i / profile.roadmap.length;
        if (progress < 0.25) { 
            title += isZh ? "：认知基石" : ": Cognition"; 
            desc = isZh ? "建立直觉" : "Intuition";
        } else if (progress < 0.5) { 
            title += isZh ? "：核心机制" : ": Mechanics";
            desc = isZh ? "理解原理" : "Understanding"; 
        } else if (progress < 0.75) { 
            title += isZh ? "：实战落地" : ": Implementation";
            desc = isZh ? "动手实践" : "Hands-on";
        } else { 
            title += isZh ? "：精通挑战" : ": Mastery";
            desc = isZh ? "综合应用" : "Advanced";
        }

        groups.push({
            title,
            desc,
            steps: profile.roadmap.slice(i, i + 2)
        });
    }

    return (
        <div className={`flex flex-col h-full min-h-screen relative ${theme.bg} ${theme.text} transition-colors duration-500`}>
            {/* Header */}
            <div className={`p-6 border-b ${theme.border} flex items-center gap-4 ${theme.headerBg} backdrop-blur-sm sticky top-0 z-20 shrink-0`}>
                <button onClick={onBack} className={`p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 ${theme.subText} hover:${theme.text} transition-colors`}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="text-xl font-black leading-tight tracking-tight">
                        {topic.title[langKey]}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${isSystem ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
                            {isZh ? "AI 动态演进" : "AI Dynamic Path"}
                        </span>
                        <p className={`text-xs ${theme.subText} font-mono uppercase tracking-wider`}>
                            {profile.roadmap.length} Steps
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

                            {group.steps.map((step: any, idx: number) => {
                                const isLocked = step.status === 'locked';
                                const isActive = step.status === 'active';
                                const isCompleted = step.status === 'completed';
                                const globalIdx = gIdx * 2 + idx;
                                const hasCache = !!step.cachedPlan;

                                let nodeStyle = theme.nodeLocked;
                                if (isActive) nodeStyle = theme.nodeActive;
                                if (isCompleted) nodeStyle = theme.nodeCompleted;

                                return (
                                    <div key={step.id} className="relative z-10 mb-8 group">
                                        <div className="flex items-start gap-6">
                                            {/* Node Circle */}
                                            <button 
                                                disabled={isLocked}
                                                onClick={() => onStartPhase(step)}
                                                className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all duration-300 shrink-0 shadow-lg ${nodeStyle} ${isActive ? 'scale-110 animate-pulse-soft ring-4 ring-opacity-20 ring-current' : ''}`}
                                            >
                                                {isLocked ? <Lock size={24}/> : (isCompleted ? <CheckCircle size={28}/> : getIcon(step.focus, globalIdx))}
                                            </button>

                                            {/* Content Card */}
                                            <button 
                                                disabled={isLocked}
                                                onClick={() => onStartPhase(step)}
                                                className={`flex-1 text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden
                                                    ${isLocked 
                                                        ? 'bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/5 opacity-50 cursor-not-allowed' 
                                                        : `${theme.card} cursor-pointer ${isActive ? 'ring-1 ring-current' : ''}`
                                                    }
                                                `}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isLocked ? 'text-gray-400 dark:text-gray-500' : theme.accent}`}>
                                                        PHASE {String(globalIdx + 1).padStart(2, '0')}
                                                    </span>
                                                    {isActive && <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>}
                                                    {hasCache && isCompleted && (
                                                        <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                                                            <History size={10}/> {isZh ? "回放" : "Replay"}
                                                        </div>
                                                    )}
                                                </div>
                                                <h3 className={`text-lg font-bold mb-1 ${isLocked ? 'text-gray-500' : theme.text}`}>
                                                    {step.title[langKey]}
                                                </h3>
                                                <p className={`text-xs ${theme.subText} leading-relaxed font-medium mb-3`}>
                                                    {step.description[langKey]}
                                                </p>
                                                
                                                {/* Tags (Content Preview) */}
                                                {step.tags && step.tags.length > 0 && !isLocked && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {step.tags.map((tag: string, tIdx: number) => (
                                                            <span key={tIdx} className="text-[9px] font-bold px-2 py-1 rounded-md bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 flex items-center gap-1 border border-gray-200 dark:border-gray-700">
                                                                {getTagIcon(tag)} {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
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
