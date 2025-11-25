
import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Clock, TrendingUp, Zap, ArrowRight, Loader2, History } from 'lucide-react';
import { generateForgeRoadmap, generateForgeImage } from '../services/geminiService';
import { ForgeRoadmap } from '../types/forge';
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
    const [history, setHistory] = useState<ForgeRoadmap[]>([]);

    // Load History
    useEffect(() => {
        const saved = localStorage.getItem('algolingo_forge_history_v2');
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch (e) { console.error(e); }
        }
    }, []);

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
            const roadmap = await generateForgeRoadmap(query, preferences);
            
            // 2. Generate Cover Image (Parallel) - IMAGE Model
            // Don't block the UI if image fails
            try {
                const cover = await generateForgeImage(query, preferences);
                if (cover) roadmap.coverImage = cover;
            } catch (imgErr) {
                console.warn("Image gen failed", imgErr);
            }

            saveHistory(roadmap);
            
            // Navigate to Detail View
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
        "构建 6 阶段学习地图..."
    ] : [
        "Analyzing intent...",
        "Searching global knowledge base...",
        "Reading retrieved sources...",
        "Forging 6-stage roadmap..."
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
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4 text-center">
                    {LOADING_STEPS[loadingStep] || LOADING_STEPS[3]}
                </h2>
                <div className="w-64 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-purple-500 transition-all duration-500"
                        style={{ width: `${(loadingStep + 1) * 25}%` }}
                    ></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen flex flex-col">
            {/* Hero Search */}
            <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in-down">
                    <Sparkles size={14} />
                    {isZh ? "知识工坊 AI 引擎" : "Knowledge Forge AI Engine"}
                </div>
                
                <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-8 tracking-tight leading-tight">
                    {isZh ? "今天你想学什么？" : "What do you want to know today?"}
                </h1>

                <div className="w-full max-w-2xl relative group z-20">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative flex items-center bg-white dark:bg-dark-card rounded-xl shadow-2xl overflow-hidden p-2 border border-gray-100 dark:border-gray-700">
                        <Search className="text-gray-400 ml-4" size={24} />
                        <input 
                            type="text"
                            className="w-full p-4 text-lg font-medium bg-transparent outline-none text-gray-800 dark:text-white placeholder-gray-300 dark:placeholder-gray-600"
                            placeholder={isZh ? "输入关键词... (例如: 手冲咖啡技巧)" : "Type a topic... (e.g. Latte Art Basics)"}
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
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {['Quantum Computing', 'React 19', 'Latte Art', 'Docker Networking'].map(tag => (
                        <button 
                            key={tag} 
                            onClick={() => setQuery(tag)}
                            className="px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-500 hover:border-purple-500 hover:text-purple-500 transition-colors bg-white dark:bg-dark-card"
                        >
                            {tag}
                        </button>
                    ))}
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
