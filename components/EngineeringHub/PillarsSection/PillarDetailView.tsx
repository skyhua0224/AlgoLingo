
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, Layers, Server, Hash, Maximize2, Minimize2 } from 'lucide-react';
import { EngineeringTopic, EngineeringModule, EngineeringPillar } from '../../../../types/engineering';

interface PillarDetailViewProps {
    data: EngineeringPillar;
    onBack: () => void;
    onSelectTopic: (topic: EngineeringTopic) => void;
    language: 'Chinese' | 'English';
}

export const PillarDetailView: React.FC<PillarDetailViewProps> = ({ data, onBack, onSelectTopic, language }) => {
    const isZh = language === 'Chinese';
    const langKey = isZh ? 'zh' : 'en';
    
    // Default expanded state
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

    // Initialize: Expand first group by default
    useEffect(() => {
        if (data && data.modules && data.modules.length > 0) {
            const firstId = data.modules[0].id;
            setExpandedModules({ [firstId]: true });
        }
    }, [data]);

    const toggleModule = (id: string) => {
        setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleAll = (expand: boolean) => {
        const newState: Record<string, boolean> = {};
        data.modules.forEach((m: EngineeringModule) => newState[m.id] = expand);
        setExpandedModules(newState);
    };

    const isSystem = data.id === 'system';
    
    // Grouping Logic
    const groupedModules = useMemo(() => {
        const groups: Record<string, EngineeringModule[]> = {};
        const order: string[] = []; // Keep order of appearance
        
        data.modules.forEach(m => {
            const lvl = m.level || "Core Modules";
            if (!groups[lvl]) {
                groups[lvl] = [];
                order.push(lvl);
            }
            groups[lvl].push(m);
        });
        
        return order.map(lvl => ({ title: lvl, modules: groups[lvl] }));
    }, [data]);

    // Theme Config (Updated for better Level separation)
    const theme = isSystem ? {
        bg: "bg-gray-50 dark:bg-[#0f172a]", // Slate
        pattern: "radial-gradient(#6366f1 0.5px, transparent 0.5px)", // Blueprint dots
        accent: "text-purple-600 dark:text-purple-400",
        border: "border-purple-200 dark:border-purple-900",
        cardBg: "bg-white dark:bg-[#1e293b]",
        iconBg: "bg-purple-100 dark:bg-purple-900/30",
        tag: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300",
        levelHeader: "text-purple-800 dark:text-purple-200 bg-purple-50/50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800",
        levelBorder: "border-l-4 border-purple-500"
    } : {
        bg: "bg-gray-50 dark:bg-[#0a0a0a]", // Pitch black
        pattern: "linear-gradient(0deg, transparent 24%, rgba(34, 197, 94, .05) 25%, rgba(34, 197, 94, .05) 26%, transparent 27%, transparent 74%, rgba(34, 197, 94, .05) 75%, rgba(34, 197, 94, .05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(34, 197, 94, .05) 25%, rgba(34, 197, 94, .05) 26%, transparent 27%, transparent 74%, rgba(34, 197, 94, .05) 75%, rgba(34, 197, 94, .05) 76%, transparent 77%, transparent)", // Circuit grid
        accent: "text-emerald-500 dark:text-emerald-400",
        border: "border-emerald-200 dark:border-emerald-900",
        cardBg: "bg-white dark:bg-[#111]",
        iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
        tag: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300",
        levelHeader: "text-emerald-800 dark:text-emerald-200 bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800",
        levelBorder: "border-l-4 border-emerald-500"
    };

    return (
        <div className={`min-h-screen flex flex-col ${theme.bg} relative text-gray-900 dark:text-gray-100`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-50 pointer-events-none" style={{ backgroundImage: theme.pattern, backgroundSize: '20px 20px' }}></div>

            {/* Header */}
            <div className={`sticky top-0 z-30 px-4 md:px-6 py-4 bg-white/90 dark:bg-dark-card/90 backdrop-blur-xl border-b ${theme.border} shadow-sm flex items-center justify-between`}>
                <div className="flex items-center gap-3 md:gap-4">
                    <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${theme.iconBg} ${theme.accent}`}>
                            {isSystem ? <Layers size={20}/> : <Server size={20}/>}
                        </div>
                        <div>
                            <h1 className="text-lg md:text-xl font-black text-gray-900 dark:text-white leading-none tracking-tight">
                                {data.title[langKey]}
                            </h1>
                            <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mt-1 truncate max-w-[150px] md:max-w-none">
                                {data.description[langKey]}
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                    <button onClick={() => toggleAll(true)} className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors rounded-md hover:bg-white dark:hover:bg-gray-700" title="Expand All">
                        <Maximize2 size={16} />
                    </button>
                    <div className="w-px bg-gray-300 dark:bg-gray-600 my-1"></div>
                    <button onClick={() => toggleAll(false)} className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors rounded-md hover:bg-white dark:hover:bg-gray-700" title="Collapse All">
                        <Minimize2 size={16} />
                    </button>
                </div>
            </div>

            {/* Content Modules */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 max-w-5xl mx-auto w-full relative z-10 space-y-8 pb-24">
                
                {groupedModules.map((group, gIdx) => (
                    <div key={gIdx} className="animate-fade-in-up" style={{ animationDelay: `${gIdx * 100}ms` }}>
                        
                        {/* Level Header */}
                        <div className={`flex items-center gap-3 mb-4 p-3 rounded-lg border ${theme.levelHeader} ${theme.levelBorder}`}>
                            <div className="flex-1">
                                <h3 className="text-sm font-black uppercase tracking-wider">{group.title}</h3>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                            {group.modules.map((module: EngineeringModule, idx: number) => {
                                const isExpanded = !!expandedModules[module.id];
                                
                                return (
                                    <div key={module.id} className={`${theme.cardBg} border-2 ${theme.border} rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? 'shadow-xl ring-1 ring-opacity-50 ' + theme.border : 'shadow-sm hover:shadow-md hover:translate-x-1'}`}>
                                        <button 
                                            onClick={() => toggleModule(module.id)}
                                            className={`w-full p-5 flex items-center justify-between text-left ${isExpanded ? 'bg-gray-50/50 dark:bg-white/5' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                        >
                                            <div className="flex-1 pr-4">
                                                <h2 className={`text-lg font-extrabold mb-1 ${isExpanded ? theme.accent : 'text-gray-800 dark:text-gray-200'}`}>
                                                    {module.title[langKey]} 
                                                </h2>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                                                    {module.description[langKey]}
                                                </p>
                                                
                                                {/* Preview Tags */}
                                                {!isExpanded && (
                                                    <div className="flex flex-wrap gap-2 mt-3 opacity-70 hover:opacity-100 transition-opacity">
                                                        {module.topics.slice(0, 4).map((t, i) => (
                                                            <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 whitespace-nowrap">
                                                                {t.title[langKey]}
                                                            </span>
                                                        ))}
                                                        {module.topics.length > 4 && <span className="text-[10px] px-2 py-0.5 text-gray-400">+{module.topics.length - 4}</span>}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`p-2 rounded-full transition-transform duration-300 shrink-0 ${isExpanded ? 'rotate-180 bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                                <ChevronDown size={20} className={isExpanded ? theme.accent : 'text-gray-400'}/>
                                            </div>
                                        </button>

                                        {/* Topics Grid */}
                                        {isExpanded && (
                                            <div className="p-5 border-t border-gray-100 dark:border-gray-800 animate-fade-in-down bg-gray-50/30 dark:bg-black/20">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {module.topics.map((topic: EngineeringTopic) => (
                                                        <button
                                                            key={topic.id}
                                                            onClick={() => onSelectTopic(topic)}
                                                            className={`group relative p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card hover:border-transparent transition-all text-left flex flex-col justify-between min-h-[100px] hover:shadow-lg overflow-hidden`}
                                                        >
                                                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${theme.iconBg}`}></div>
                                                            
                                                            <div className="relative z-10">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <Hash size={12} className="text-gray-300"/>
                                                                        <span className="text-[10px] font-mono text-gray-400 font-bold uppercase truncate max-w-[80px]">{topic.id.split('_')[0]}</span>
                                                                    </div>
                                                                    <div className={`p-1 rounded-full bg-gray-50 dark:bg-gray-800 group-hover:${theme.accent} transition-colors`}>
                                                                        <ChevronRight size={14} className="text-gray-400 group-hover:text-current" />
                                                                    </div>
                                                                </div>
                                                                <h3 className="font-bold text-sm text-gray-800 dark:text-white mb-3 group-hover:translate-x-1 transition-transform leading-tight">
                                                                    {topic.title[langKey]}
                                                                </h3>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {topic.keywords.slice(0, 2).map((k: string) => (
                                                                        <span key={k} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${theme.tag} truncate max-w-full`}>
                                                                            {k}
                                                                        </span>
                                                                    ))}
                                                                    {topic.keywords.length > 2 && <span className="text-[9px] text-gray-400 px-1 py-0.5">...</span>}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
