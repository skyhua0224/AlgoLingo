
import React, { useState, useEffect } from 'react';
import { Search, Sparkles, History, Code2, BookOpen, MousePointer2, Eye, GraduationCap, Wrench, Zap, Layers, Maximize, ArrowRight, Gauge, Loader2, RotateCcw, XCircle } from 'lucide-react';
import { generateForgeRoadmap } from '../services/geminiService';
import { ForgeRoadmap, ForgeGenConfig, ForgeDensity } from '../types/forge';
import { UserPreferences } from '../types';

interface ForgeProps {
    language: 'Chinese' | 'English';
    onViewItem: (item: ForgeRoadmap) => void;
    preferences: UserPreferences;
}

export const Forge: React.FC<ForgeProps> = ({ language, onViewItem, preferences }) => {
    const isZh = language === 'Chinese';
    
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [loadingTime, setLoadingTime] = useState(0); // Track seconds
    const [history, setHistory] = useState<ForgeRoadmap[]>([]);
    
    // Configuration State
    const [config, setConfig] = useState<ForgeGenConfig>({
        mode: 'technical',
        difficultyStart: 'intermediate',
        stageCount: 6,
        screensPerStage: 18 // Default as requested
    });
    const [showConfig, setShowConfig] = useState(false);

    // Load History
    useEffect(() => {
        const saved = localStorage.getItem('algolingo_forge_history_v2');
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch (e) { console.error(e); }
        }
    }, []);

    // Timer for loading
    useEffect(() => {
        let interval: any;
        if (loading) {
            setLoadingTime(0);
            interval = setInterval(() => setLoadingTime(t => t + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [loading]);

    // Validate Config Consistency
    useEffect(() => {
        // Auto-correct density if invalid for current mode
        if (config.screensPerStage === 6 && config.mode !== 'general') {
            setConfig(prev => ({ ...prev, screensPerStage: 18 }));
        }
        if ((config.screensPerStage === 24 || config.screensPerStage === 32) && config.difficultyStart !== 'expert') {
            setConfig(prev => ({ ...prev, screensPerStage: 18 }));
        }
    }, [config.mode, config.difficultyStart]);

    // Save History
    const saveHistory = (item: ForgeRoadmap) => {
        const newHistory = [item, ...history.filter(h => h.id !== item.id)].slice(0, 20); // Keep top 20
        setHistory(newHistory);
        localStorage.setItem('algolingo_forge_history_v2', JSON.stringify(newHistory));
    };

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setLoadingStep(0);

        // Fake steps progress visually while waiting for API
        const interval = setInterval(() => {
            setLoadingStep(prev => Math.min(prev + 1, 3));
        }, 1000);

        try {
            // 1. Generate Roadmap (Search & Structure) - PRO Model
            const roadmap = await generateForgeRoadmap(query, config, preferences);
            
            saveHistory(roadmap);
            onViewItem(roadmap);

        } catch (e) {
            console.error(e);
            alert(isZh ? "生成失败，请重试" : "Generation failed, please try again.");
        } finally {
            clearInterval(interval);
            setLoading(false);
        }
    };

    const LOADING_STEPS = isZh ? [
        "正在分析意图...",
        "正在连接全球知识库 (Google Search)...",
        "阅读检索到的信息源...",
        "构建学习地图..."
    ] : [
        "Analyzing intent...",
        "Searching global knowledge base...",
        "Reading retrieved sources...",
        "Forging roadmap..."
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white dark:bg-dark-bg animate-fade-in-up">
                <div className="w-24 h-24 relative mb-8">
                    <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping"></div>
                    <div className="relative w-24 h-24 bg-white dark:bg-dark-card rounded-full flex items-center justify-center shadow-xl border-4 border-purple-100 dark:border-purple-900">
                        <Sparkles size={40} className="text-purple-500 animate-pulse" />
                    </div>
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 text-center">
                    {LOADING_STEPS[loadingStep] || LOADING_STEPS[3]}
                </h2>
                <p className="text-sm text-gray-500 font-mono mb-6">{loadingTime}s</p>
                
                <div className="w-64 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-8">
                    <div 
                        className="h-full bg-purple-500 transition-all duration-500"
                        style={{ width: `${(loadingStep + 1) * 25}%` }}
                    ></div>
                </div>

                {loadingTime > 60 && (
                    <div className="flex gap-4 animate-fade-in-up">
                        <button 
                            onClick={handleSearch}
                            className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded-xl font-bold text-sm hover:bg-purple-200 transition-colors flex items-center gap-2"
                        >
                            <RotateCcw size={16}/> {isZh ? "重试" : "Retry"}
                        </button>
                        {loadingTime > 120 && (
                            <button 
                                onClick={() => setLoading(false)}
                                className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-xl font-bold text-sm hover:bg-red-200 transition-colors flex items-center gap-2"
                            >
                                <XCircle size={16}/> {isZh ? "停止" : "Stop"}
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    }

    const DENSITY_OPTIONS: { val: ForgeDensity, label: string, requires?: string }[] = [
        { val: 6, label: "Lite (6)", requires: "General Mode Only" },
        { val: 12, label: "Basic (12)" },
        { val: 18, label: "Std (18)" },
        { val: 24, label: "Deep (24)", requires: "Expert Only" },
        { val: 32, label: "Max (32)", requires: "Expert Only" },
    ];

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen flex flex-col">
            {/* Hero Search */}
            <div className="flex flex-col items-center justify-center py-10 md:py-16 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in-down">
                    <Sparkles size={14} />
                    {isZh ? "知识工坊 AI 引擎" : "Knowledge Forge AI Engine"}
                </div>
                
                <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-8 tracking-tight leading-tight">
                    {isZh ? "今天你想学什么？" : "What do you want to know today?"}
                </h1>

                <div className="w-full max-w-2xl relative z-20">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl opacity-20 blur transition duration-1000"></div>
                    <div className="relative bg-white dark:bg-dark-card rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="flex items-center p-2">
                            <Search className="text-gray-400 ml-4" size={24} />
                            <input 
                                type="text"
                                className="w-full p-4 text-lg font-medium bg-transparent outline-none text-gray-800 dark:text-white placeholder-gray-300 dark:placeholder-gray-600"
                                placeholder={isZh ? "输入关键词... (例如: OpenGL 渲染管线)" : "Type a topic... (e.g. OpenGL Pipeline)"}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <button 
                                onClick={handleSearch}
                                disabled={!query.trim()}
                                className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                Go
                            </button>
                        </div>
                        
                        {/* Config Toggle */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 p-2 flex justify-center">
                            <button 
                                onClick={() => setShowConfig(!showConfig)}
                                className="text-xs font-bold text-gray-500 hover:text-purple-500 flex items-center gap-1 transition-colors"
                            >
                                {showConfig ? (isZh ? "收起配置" : "Hide Config") : (isZh ? "定制课程参数 (难度/体量)" : "Customize Course (Difficulty/Length)")}
                                <Sparkles size={12} />
                            </button>
                        </div>

                        {/* Configuration Console */}
                        {showConfig && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-down text-left">
                                
                                {/* 1. Mode & Level */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 block">{isZh ? "学习模式" : "Mode"}</label>
                                        <div className="flex gap-2">
                                            <button onClick={() => setConfig({...config, mode: 'technical'})} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all flex flex-col items-center gap-1 ${config.mode === 'technical' ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-500 text-purple-700 dark:text-purple-300' : 'bg-white dark:bg-dark-card border-gray-200 dark:border-gray-700 text-gray-500'}`}>
                                                <Code2 size={14}/> {isZh ? "技术实战" : "Tech"}
                                            </button>
                                            <button onClick={() => setConfig({...config, mode: 'general'})} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all flex flex-col items-center gap-1 ${config.mode === 'general' ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300' : 'bg-white dark:bg-dark-card border-gray-200 dark:border-gray-700 text-gray-500'}`}>
                                                <BookOpen size={14}/> {isZh ? "通识理论" : "General"}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 block">{isZh ? "当前水平 (起步难度)" : "Current Skill Level"}</label>
                                        <div className="flex gap-2">
                                            <button onClick={() => setConfig({...config, difficultyStart: 'novice'})} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all flex flex-col items-center gap-1 ${config.difficultyStart === 'novice' ? 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300' : 'bg-white dark:bg-dark-card border-gray-200 dark:border-gray-700 text-gray-500'}`}>
                                                <GraduationCap size={14}/> {isZh ? "新手" : "Novice"}
                                            </button>
                                            <button onClick={() => setConfig({...config, difficultyStart: 'intermediate'})} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all flex flex-col items-center gap-1 ${config.difficultyStart === 'intermediate' ? 'bg-orange-100 dark:bg-orange-900/30 border-orange-500 text-orange-700 dark:text-orange-300' : 'bg-white dark:bg-dark-card border-gray-200 dark:border-gray-700 text-gray-500'}`}>
                                                <Wrench size={14}/> {isZh ? "有经验" : "Mid"}
                                            </button>
                                            <button onClick={() => setConfig({...config, difficultyStart: 'expert'})} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all flex flex-col items-center gap-1 ${config.difficultyStart === 'expert' ? 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300' : 'bg-white dark:bg-dark-card border-gray-200 dark:border-gray-700 text-gray-500'}`}>
                                                <Zap size={14}/> {isZh ? "专家" : "Expert"}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Structure & Density */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 block">{isZh ? "课程长度 (阶段数)" : "Course Length (Stages)"}</label>
                                        <div className="flex bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-gray-700 p-1">
                                            {[3, 6, 9, 12].map(num => (
                                                <button 
                                                    key={num}
                                                    onClick={() => setConfig({...config, stageCount: num as any})}
                                                    className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${config.stageCount === num ? 'bg-gray-900 dark:bg-white text-white dark:text-black shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                                                >
                                                    {num}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1 text-right">
                                            {config.stageCount === 3 ? (isZh ? "闪电概览" : "Quick Overview") : 
                                             config.stageCount === 6 ? (isZh ? "标准课程" : "Standard Course") : 
                                             (isZh ? "深度专精" : "Deep Dive")}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 block">{isZh ? "内容密度 (每课页数)" : "Content Density (Screens)"}</label>
                                        <div className="flex flex-wrap gap-2">
                                            {DENSITY_OPTIONS.map((opt) => {
                                                const isDisabled = 
                                                    (opt.val === 6 && config.mode !== 'general') ||
                                                    ((opt.val === 24 || opt.val === 32) && config.difficultyStart !== 'expert');
                                                
                                                return (
                                                    <button 
                                                        key={opt.val}
                                                        onClick={() => setConfig({...config, screensPerStage: opt.val})}
                                                        disabled={isDisabled}
                                                        className={`flex-1 min-w-[60px] py-2 rounded-lg text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1 
                                                            ${isDisabled ? 'opacity-40 cursor-not-allowed bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-300' : 
                                                              (config.screensPerStage === opt.val ? 'bg-gray-100 dark:bg-gray-800 border-gray-400 text-gray-900 dark:text-white' : 'bg-white dark:bg-dark-card border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50')}`}
                                                        title={isDisabled ? opt.requires : undefined}
                                                    >
                                                        <Gauge size={14}/> 
                                                        {opt.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <button 
                        onClick={() => { setQuery('OpenGL Triangle'); setConfig({...config, mode: 'technical', difficultyStart: 'novice', screensPerStage: 12}); }}
                        className="px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-500 hover:border-purple-500 hover:text-purple-500 transition-colors bg-white dark:bg-dark-card"
                    >
                        OpenGL (Novice)
                    </button>
                    <button 
                        onClick={() => { setQuery('Kafka Internals'); setConfig({...config, mode: 'technical', difficultyStart: 'expert', stageCount: 9, screensPerStage: 24}); }}
                        className="px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-500 hover:border-purple-500 hover:text-purple-500 transition-colors bg-white dark:bg-dark-card"
                    >
                        Kafka (Expert Deep)
                    </button>
                </div>
            </div>

            {/* History Grid */}
            <div className="flex-1 animate-fade-in-up delay-200">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <History size={16} />
                        {isZh ? "最近生成" : "Recently Generated"}
                    </h3>
                </div>

                {history.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl opacity-50">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <History size={24} className="text-gray-400"/>
                        </div>
                        <p className="text-sm font-bold text-gray-400">{isZh ? "暂无历史记录" : "No history yet"}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                        {history.map(item => (
                            <div 
                                key={item.id} 
                                onClick={() => onViewItem(item)}
                                className="group bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:border-purple-500/50 transition-all cursor-pointer flex flex-col h-full"
                            >
                                <div className="h-32 bg-gradient-to-br from-purple-500 to-blue-500 p-6 flex items-end relative overflow-hidden">
                                    {item.coverImage ? (
                                        <>
                                            <img src={item.coverImage} alt={item.topic} className="absolute inset-0 w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                                    )}
                                    
                                    <h4 className="text-2xl font-black text-white leading-none relative z-10 line-clamp-2 drop-shadow-md">{item.topic}</h4>
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex gap-2 mb-3">
                                        {item.config && (
                                            <>
                                            <span className="text-[9px] font-bold uppercase bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded">{item.config.mode}</span>
                                            <span className="text-[9px] font-bold uppercase bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded">{item.config.difficultyStart}</span>
                                            <span className="text-[9px] font-bold uppercase bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">{item.config.screensPerStage}pg</span>
                                            </>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3 mb-4 flex-1">
                                        {item.description}
                                    </p>
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <div className="text-xs font-bold text-gray-400">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs font-bold text-purple-500 group-hover:translate-x-1 transition-transform">
                                            {isZh ? "复习" : "Review"} <ArrowRight size={14}/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
