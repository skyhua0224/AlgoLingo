
import React, { useState, useMemo, useEffect } from 'react';
import { X, Server, Code2, Globe, Gamepad2, Smartphone, Cloud, LayoutGrid, Plus, Search, Database, Box, Anchor, Coffee, HardDrive, Palette, Activity, PenTool, Monitor, Battery, Zap, Brain, Network, ShieldAlert, CheckCircle, LayoutTemplate, Braces, Sparkles, Loader2 } from 'lucide-react';
import { TRACK_PRESETS, CATEGORY_META } from '../../../data/tracks';
import { SkillTrack, LocalizedContent } from '../../../types/engineering';
import { generateTrackSuggestions } from '../../../services/geminiService';
import { useAppManager } from '../../../hooks/useAppManager';

interface CatalogModalProps {
    onClose: () => void;
    language: 'Chinese' | 'English';
    onAddTrack: (track: SkillTrack) => void; 
}

// Map icons string to components
const ICON_MAP: Record<string, any> = {
    Server, Code2, Globe, Gamepad2, Smartphone, Cloud, LayoutGrid, Database, Box, Anchor, Search,
    Coffee, HardDrive, Palette, Activity, PenTool, Monitor, Battery, Zap, Brain, Network, ShieldAlert, CheckCircle, LayoutTemplate, Braces
};

// Helper to safely get string from LocalizedContent or string
const getStr = (content: LocalizedContent | string, langKey: 'zh' | 'en'): string => {
    if (!content) return '';
    if (typeof content === 'string') return content;
    return content[langKey] || content['en'] || '';
};

export const CatalogModal: React.FC<CatalogModalProps> = ({ onClose, language, onAddTrack }) => {
    const isZh = language === 'Chinese';
    const langKey = isZh ? 'zh' : 'en';
    const { state } = useAppManager();
    
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [discoveredTracks, setDiscoveredTracks] = useState<SkillTrack[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);

    // Load discovered tracks from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('algolingo_discovered_tracks');
        if (saved) {
            try {
                setDiscoveredTracks(JSON.parse(saved));
            } catch (e) {}
        }
    }, []);

    const saveDiscovered = (tracks: SkillTrack[]) => {
        const updated = [...discoveredTracks, ...tracks];
        setDiscoveredTracks(updated);
        localStorage.setItem('algolingo_discovered_tracks', JSON.stringify(updated));
    };

    // AI Suggestion Handler
    const handleAiSuggest = async () => {
        setIsSuggesting(true);
        try {
            const existingTitles = [...TRACK_PRESETS, ...discoveredTracks]
                .filter(t => activeCategory === 'all' || t.category === activeCategory)
                .map(t => getStr(t.title, 'en'));

            const newTracks = await generateTrackSuggestions(activeCategory, existingTitles, state.preferences);
            saveDiscovered(newTracks);
        } catch (e) {
            alert(isZh ? "AI 生成失败，请检查网络" : "AI generation failed, check connection");
        } finally {
            setIsSuggesting(false);
        }
    };

    // Filter Logic
    const filteredTracks = useMemo(() => {
        // Merge Presets + Discovered
        let tracks = [...TRACK_PRESETS, ...discoveredTracks];
        
        if (activeCategory !== 'all') {
            tracks = tracks.filter(t => t.category === activeCategory);
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            tracks = tracks.filter(t => {
                const title = getStr(t.title, langKey).toLowerCase();
                const desc = getStr(t.description, langKey).toLowerCase();
                const keywords = t.keywords?.some(k => k.toLowerCase().includes(q)) || false;
                return title.includes(q) || desc.includes(q) || keywords;
            });
        }
        return tracks;
    }, [activeCategory, searchQuery, langKey, discoveredTracks]);

    const handleAddPreset = (preset: SkillTrack) => {
        const fullTrack: SkillTrack = {
            ...preset,
            id: `${preset.id}_${Date.now()}`, // Unique ID instance
            // Store as localized content to preserve multilingual support for the user
            title: preset.title,
            description: preset.description,
            modules: [], // Will be lazy loaded via AI on first open
            progress: 0,
            isOfficial: true,
            createdAt: Date.now()
        };
        onAddTrack(fullTrack);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in-up">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            ></div>

            <div className="bg-white dark:bg-dark-card w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col md:flex-row relative z-10">
                
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 z-50 transition-colors">
                    <X size={20} />
                </button>

                {/* Left Sidebar: Categories */}
                <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col shrink-0 overflow-y-auto">
                    <div className="mb-6 px-2">
                        <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2 mb-4">
                            <Search size={18} className="text-brand"/>
                            {isZh ? "专精目录" : "Catalog"}
                        </h2>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                            <input 
                                type="text"
                                placeholder={isZh ? "搜索技术..." : "Search..."}
                                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand/20"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1 flex-1 custom-scrollbar pr-2">
                        <button
                            onClick={() => setActiveCategory('all')}
                            className={`w-full p-3 rounded-xl flex items-center gap-3 font-bold text-sm transition-all ${
                                activeCategory === 'all' 
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md' 
                                : 'text-gray-500 hover:bg-white dark:hover:bg-gray-800'
                            }`}
                        >
                            <LayoutGrid size={18} />
                            {isZh ? "全部" : "All Tracks"}
                        </button>
                        
                        {Object.entries(CATEGORY_META).map(([key, meta]) => {
                            const Icon = ICON_MAP[meta.icon] || Box;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setActiveCategory(key)}
                                    className={`w-full p-3 rounded-xl flex items-center gap-3 font-bold text-sm transition-all ${
                                        activeCategory === key 
                                        ? 'bg-brand text-white shadow-md' 
                                        : 'text-gray-500 hover:bg-white dark:hover:bg-gray-800'
                                    }`}
                                >
                                    <Icon size={18} />
                                    {isZh ? meta.title.zh : meta.title.en}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar bg-white dark:bg-dark-card">
                    <div className="mb-6 flex justify-between items-end">
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1">
                                {activeCategory === 'all' ? (isZh ? "所有路径" : "All Tracks") : (isZh ? CATEGORY_META[activeCategory as keyof typeof CATEGORY_META].title.zh : CATEGORY_META[activeCategory as keyof typeof CATEGORY_META].title.en)}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                                {filteredTracks.length} {isZh ? "个可用专精" : "tracks available"}
                            </p>
                        </div>
                        
                        <button 
                            onClick={handleAiSuggest}
                            disabled={isSuggesting}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded-xl font-bold text-xs hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50"
                        >
                            {isSuggesting ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>}
                            {isSuggesting ? (isZh ? "AI 正在挖掘..." : "AI Searching...") : (isZh ? "AI 推荐更多" : "Ask AI for More")}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
                        {filteredTracks.map((track, idx) => {
                            const Icon = ICON_MAP[track.icon || 'Server'] || Server;
                            
                            return (
                                <div key={idx} className="bg-gray-50 dark:bg-dark-bg/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 hover:border-brand hover:shadow-lg transition-all group relative overflow-hidden flex flex-col h-full cursor-pointer" onClick={() => handleAddPreset(track)}>
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity scale-150">
                                        <Icon size={80} />
                                    </div>
                                    
                                    <div className="relative z-10 flex-1">
                                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-dark-card shadow-sm text-gray-600 dark:text-gray-300 flex items-center justify-center mb-4 group-hover:bg-brand group-hover:text-white transition-colors">
                                            <Icon size={24} />
                                        </div>
                                        <h4 className="text-lg font-extrabold text-gray-800 dark:text-white mb-2 leading-tight">
                                            {getStr(track.title, langKey)}
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4 line-clamp-3">
                                            {getStr(track.description, langKey)}
                                        </p>
                                        
                                        {track.keywords && (
                                            <div className="flex flex-wrap gap-1 mb-4">
                                                {track.keywords.slice(0, 3).map((k, i) => (
                                                    <span key={i} className="text-[9px] px-1.5 py-0.5 bg-white dark:bg-dark-card rounded border border-gray-200 dark:border-gray-600 text-gray-400 font-mono">{k}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <button 
                                        className="w-full py-2.5 rounded-lg bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-600 font-bold text-xs text-gray-500 group-hover:border-brand group-hover:text-brand dark:group-hover:border-brand dark:group-hover:text-brand transition-all flex items-center justify-center gap-2 shadow-sm z-20 relative"
                                    >
                                        <Plus size={14}/> {isZh ? "添加路径" : "Add Track"}
                                    </button>
                                </div>
                            );
                        })}

                        {/* Add Custom Track Card (End of Grid) */}
                        <div className="bg-brand/5 border-2 border-dashed border-brand/30 rounded-2xl p-5 hover:border-brand hover:bg-brand/10 transition-all group flex flex-col items-center justify-center h-full cursor-pointer min-h-[220px]" onClick={() => { onAddTrack({ id: `custom_${Date.now()}`, title: { en: "Custom Track", zh: "自定义专精" }, icon: "Sparkles", category: "other", description: { en: "Define your own path.", zh: "自定义你的学习路径。" }, progress: 0, isOfficial: false, createdAt: Date.now() }); }}>
                            <div className="w-14 h-14 rounded-full bg-white dark:bg-dark-card shadow-sm text-brand flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Plus size={28} strokeWidth={3} />
                            </div>
                            <h4 className="text-lg font-black text-brand mb-1">{isZh ? "创建自定义" : "Create Custom"}</h4>
                            <p className="text-xs text-brand/70 font-bold uppercase tracking-wide">{isZh ? "AI 辅助生成" : "AI Assisted"}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
