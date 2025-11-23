
import React from 'react';
import { Terminal, Layers, Cpu, Plus, Play, Zap, Globe, Server, Database, Network } from 'lucide-react';
import { UserPreferences } from '../types';

interface EngineeringHubProps {
    preferences: UserPreferences;
    onUpdatePreferences: (p: Partial<UserPreferences>) => void;
    language: 'Chinese' | 'English';
}

const LANGUAGES = [
    { id: 'Python', name: 'Python', desc: 'AI & Scripts', color: 'bg-blue-500' },
    { id: 'Java', name: 'Java', desc: 'Enterprise', color: 'bg-red-500' },
    { id: 'C++', name: 'C++', desc: 'High Perf.', color: 'bg-blue-700' },
    { id: 'Go', name: 'Go', desc: 'Concurrency', color: 'bg-cyan-500' },
    { id: 'JavaScript', name: 'JS/TS', desc: 'Fullstack', color: 'bg-yellow-500' },
];

export const EngineeringHub: React.FC<EngineeringHubProps> = ({ preferences, onUpdatePreferences, language }) => {
    const isZh = language === 'Chinese';
    const currentLang = preferences.targetLanguage;
    const otherLangs = LANGUAGES.filter(l => l.id !== currentLang);

    return (
        <div className="p-4 md:p-8 pb-24 max-w-7xl mx-auto space-y-8 animate-fade-in-up">
            
            {/* Header */}
            <div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
                    {isZh ? "工程中心" : "Engineering Hub"}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                    {isZh ? "构建你的全栈武器库" : "Build your full-stack arsenal"}
                </p>
            </div>

            {/* SECTION 1: LANGUAGE SYNTAX (Bento Grid Layout) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Main Language Card (Current) */}
                <div className="lg:col-span-2 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-dark-card dark:to-black rounded-3xl p-8 relative overflow-hidden shadow-xl group min-h-[240px] flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-brand/30 transition-all duration-700"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-brand-light border border-white/10 backdrop-blur-sm">
                                {isZh ? "当前主力语言" : "Primary Language"}
                            </span>
                        </div>
                        <h2 className="text-5xl font-black text-white mb-2 tracking-tight">{currentLang}</h2>
                        <p className="text-gray-400 font-medium max-w-md text-sm leading-relaxed">
                            {isZh 
                             ? "掌握核心语法、内存模型与高级特性。专为算法面试与高频交易优化。" 
                             : "Master core syntax, memory models, and advanced features. Optimized for algorithm interviews and high-frequency trading."}
                        </p>
                    </div>

                    <div className="relative z-10 mt-6 flex gap-4">
                        <button className="flex-1 md:flex-none bg-brand hover:bg-brand-light text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95">
                            <Terminal size={18} />
                            {isZh ? "进入语法健身房" : "Enter Syntax Gym"}
                        </button>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                            <Zap size={16} className="text-yellow-400 fill-current" />
                            <span className="text-white font-mono font-bold">Lv. 4</span>
                        </div>
                    </div>
                </div>

                {/* Right: Other Languages (Mini Cards) */}
                <div className="grid grid-rows-4 gap-3">
                    {otherLangs.slice(0, 3).map(lang => (
                        <button 
                            key={lang.id}
                            onClick={() => onUpdatePreferences({ targetLanguage: lang.id as any })}
                            className="flex items-center gap-4 p-4 bg-white dark:bg-dark-card border-2 border-gray-100 dark:border-gray-800 rounded-2xl hover:border-brand dark:hover:border-brand transition-all group shadow-sm"
                        >
                            <div className={`w-10 h-10 rounded-lg ${lang.color} flex items-center justify-center text-white font-bold text-xs shadow-md group-hover:scale-110 transition-transform`}>
                                {lang.id.slice(0, 2)}
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-gray-800 dark:text-white text-sm group-hover:text-brand transition-colors">{lang.name}</div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{lang.desc}</div>
                            </div>
                            <div className="ml-auto text-gray-300 group-hover:text-brand opacity-0 group-hover:opacity-100 transition-all">
                                <Play size={16} fill="currentColor"/>
                            </div>
                        </button>
                    ))}
                    <button className="flex items-center justify-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-xs font-bold">
                        <Globe size={14} />
                        {isZh ? "更多语言" : "More Languages"}
                    </button>
                </div>
            </div>

            {/* SECTION 2: SYSTEM & CS (Twin Cards) */}
            <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 pl-2">
                    {isZh ? "架构与内功" : "Architecture & Foundation"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* System Design */}
                    <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 p-6 rounded-3xl relative overflow-hidden group cursor-pointer hover:shadow-md transition-all">
                        <div className="absolute top-4 right-4 p-3 bg-white dark:bg-dark-card rounded-2xl shadow-sm text-purple-500">
                            <Layers size={24} />
                        </div>
                        <h3 className="text-2xl font-extrabold text-purple-900 dark:text-purple-200 mb-2 mt-8">
                            {isZh ? "系统设计" : "System Design"}
                        </h3>
                        <div className="flex gap-2 flex-wrap mb-6">
                            {['Distributed ID', 'Rate Limiter', 'Short URL'].map(tag => (
                                <span key={tag} className="px-2 py-1 bg-white/50 dark:bg-black/20 rounded-md text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <div className="h-2 w-full bg-purple-200 dark:bg-purple-900/50 rounded-full overflow-hidden">
                            <div className="h-full w-1/3 bg-purple-500"></div>
                        </div>
                        <div className="mt-2 text-xs text-purple-400 font-bold text-right">33% Complete</div>
                    </div>

                    {/* CS Foundation */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-6 rounded-3xl relative overflow-hidden group cursor-pointer hover:shadow-md transition-all">
                        <div className="absolute top-4 right-4 p-3 bg-white dark:bg-dark-card rounded-2xl shadow-sm text-emerald-500">
                            <Server size={24} />
                        </div>
                        <h3 className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-200 mb-2 mt-8">
                            {isZh ? "计算机内功" : "CS Fundamentals"}
                        </h3>
                        <div className="flex gap-2 flex-wrap mb-6">
                            {['OS Process', 'TCP/IP', 'Threads', 'Linux'].map(tag => (
                                <span key={tag} className="px-2 py-1 bg-white/50 dark:bg-black/20 rounded-md text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <div className="h-2 w-full bg-emerald-200 dark:bg-emerald-900/50 rounded-full overflow-hidden">
                            <div className="h-full w-1/5 bg-emerald-500"></div>
                        </div>
                        <div className="mt-2 text-xs text-emerald-400 font-bold text-right">20% Complete</div>
                    </div>
                </div>
            </div>

            {/* SECTION 3: DYNAMIC TRACKS (Horizontal Scroll) */}
            <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 pl-2">
                    {isZh ? "动态专精路径" : "Dynamic Tracks"}
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {/* Add Button */}
                    <button className="min-w-[160px] h-[200px] rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-brand hover:border-brand hover:bg-brand-bg/5 transition-all group shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-brand group-hover:text-white flex items-center justify-center transition-colors">
                            <Plus size={24} />
                        </div>
                        <span className="font-bold text-sm">{isZh ? "添加路径" : "Add Track"}</span>
                    </button>

                    {/* Sample Track: Unity */}
                    <div className="min-w-[280px] h-[200px] bg-white dark:bg-dark-card rounded-3xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-between shadow-sm shrink-0 hover:border-brand transition-colors cursor-pointer relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Cpu size={80} />
                        </div>
                        <div>
                            <div className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center mb-4 shadow-lg">
                                <span className="font-bold text-xs">U3D</span>
                            </div>
                            <h4 className="text-xl font-extrabold text-gray-800 dark:text-white">Unity 3D</h4>
                            <p className="text-xs text-gray-500 mt-1">Game Dev Essentials</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div className="w-1/3 h-full bg-black dark:bg-white"></div>
                            </div>
                            <span>3/9</span>
                        </div>
                    </div>

                    {/* Sample Track: Spring */}
                    <div className="min-w-[280px] h-[200px] bg-white dark:bg-dark-card rounded-3xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-between shadow-sm shrink-0 hover:border-brand transition-colors cursor-pointer relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-green-500">
                            <Database size={80} />
                        </div>
                        <div>
                            <div className="w-10 h-10 bg-green-500 text-white rounded-lg flex items-center justify-center mb-4 shadow-lg">
                                <span className="font-bold text-xs">SP</span>
                            </div>
                            <h4 className="text-xl font-extrabold text-gray-800 dark:text-white">Spring Boot</h4>
                            <p className="text-xs text-gray-500 mt-1">Backend Architecture</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div className="w-0 h-full bg-green-500"></div>
                            </div>
                            <span>0/12</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};
