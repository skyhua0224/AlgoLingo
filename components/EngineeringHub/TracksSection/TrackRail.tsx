
import React from 'react';
import { TrackCard } from './TrackCard';
import { Plus, Search } from 'lucide-react';
import { SkillTrack } from '../../../types/engineering';

interface TrackRailProps {
    tracks: SkillTrack[];
    onCreate: () => void;
    onOpenCatalog: () => void;
    language: 'Chinese' | 'English';
    onSelect?: (track: SkillTrack) => void;
}

export const TrackRail: React.FC<TrackRailProps> = ({ tracks, onCreate, onOpenCatalog, language, onSelect }) => {
    const isZh = language === 'Chinese';

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8 animate-fade-in-up">
            
            {/* 1. Create Custom Card */}
            <button 
                onClick={onCreate}
                className="w-full h-[240px] rounded-3xl border-2 border-dashed border-brand/40 bg-brand/5 hover:bg-brand/10 hover:border-brand transition-all flex flex-col items-center justify-center gap-4 group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-dark-card group-hover:scale-110 transition-transform flex items-center justify-center shadow-sm text-brand">
                    <Plus size={24} strokeWidth={3} />
                </div>
                <div className="text-center px-2">
                    <span className="font-black text-sm text-brand block mb-1">{isZh ? "创建自定义" : "Create Custom"}</span>
                    <span className="text-[9px] text-brand/60 font-bold uppercase tracking-wide leading-tight block">
                        {isZh ? "AI 生成专精" : "AI Generated Track"}
                    </span>
                </div>
            </button>

            {/* 2. Browse Catalog Card */}
            <button 
                onClick={onOpenCatalog}
                className="w-full h-[240px] rounded-3xl border-2 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-dark-card transition-all flex flex-col items-center justify-center gap-4 group"
            >
                <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white flex items-center justify-center transition-colors shadow-sm">
                    <Search size={24} />
                </div>
                <div className="text-center px-2">
                    <span className="font-bold text-sm text-gray-700 dark:text-gray-200 block mb-1">{isZh ? "浏览目录" : "Catalog"}</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide leading-tight block">
                        {isZh ? "发现更多路径" : "Discover More"}
                    </span>
                </div>
            </button>

            {/* 3. User Tracks */}
            {tracks.map(track => (
                <TrackCard 
                    key={track.id}
                    track={track}
                    language={language}
                    onClick={() => onSelect && onSelect(track)}
                />
            ))}
            
            {tracks.length === 0 && (
                <div className="flex flex-col justify-center px-4 opacity-50 text-xs font-bold text-gray-400 italic h-[240px] border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl items-center bg-gray-50/50 dark:bg-black/20">
                    {isZh ? "暂无专精，点击左侧添加" : "No tracks yet, add one."}
                </div>
            )}
        </div>
    );
};
