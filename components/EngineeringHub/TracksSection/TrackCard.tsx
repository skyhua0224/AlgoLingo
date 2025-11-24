
import React from 'react';
import { SkillTrack, LocalizedContent } from '../../../types/engineering';
import { CATEGORY_META } from '../../../data/tracks';
import { Server, Code2, Globe, Gamepad2, Smartphone, Cloud, LayoutGrid, Database, ShieldAlert, CheckCircle, Layers, Brain, Zap, Activity, Box, Terminal, Hash, Star, LayoutTemplate, HardDrive, PenTool, Monitor, Anchor, Lock } from 'lucide-react';

// Icon Mapping for Categories
const ICON_MAP: Record<string, any> = {
    Server, Code2, Globe, Gamepad2, Smartphone, Cloud, LayoutGrid, Database, 
    ShieldAlert, CheckCircle, Layers, Brain, Zap, Activity, Box, Terminal,
    LayoutTemplate, HardDrive, PenTool, Monitor, Anchor, Lock
};

interface TrackCardProps {
    track: SkillTrack;
    language: 'Chinese' | 'English';
    onClick: () => void;
}

const getStr = (content: LocalizedContent | string | undefined, langKey: 'zh' | 'en') => {
    if (!content) return '';
    if (typeof content === 'string') return content;
    return content[langKey] || content['en'] || '';
};

export const TrackCard: React.FC<TrackCardProps> = ({ track, language, onClick }) => {
    const isZh = language === 'Chinese';
    const langKey = isZh ? 'zh' : 'en';
    
    const title = getStr(track.title, langKey);
    const desc = getStr(track.description, langKey);
    
    // Category Meta Resolution
    const catKey = track.category as keyof typeof CATEGORY_META;
    const catMeta = CATEGORY_META[catKey] || { title: { en: 'Other', zh: '其他' }, icon: 'Box' };
    const CatIcon = ICON_MAP[catMeta.icon] || Box;
    const catTitle = isZh ? catMeta.title.zh : catMeta.title.en;

    // Progress Calculation (Mock logic if modules exist)
    // In a real app, this would calculate completed steps / total steps
    const progressPercent = track.progress || 0;

    return (
        <div 
            onClick={onClick}
            className="w-full h-[240px] bg-white dark:bg-dark-card rounded-3xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col justify-between shadow-sm shrink-0 hover:border-brand transition-all cursor-pointer group relative overflow-hidden hover:shadow-md"
        >
            {/* Decorative Background Icon */}
            <div className="absolute -bottom-4 -right-4 p-0 opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-10 transition-opacity scale-150 pointer-events-none rotate-12">
                <CatIcon size={140} />
            </div>

            {/* Top: Category Badge & Official Mark */}
            <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10px] font-bold uppercase tracking-wider">
                    <CatIcon size={12} />
                    <span>{catTitle}</span>
                </div>
                {track.isOfficial && (
                    <div className="text-brand bg-brand/10 p-1 rounded-full" title="Official Track">
                        <Star size={12} fill="currentColor" />
                    </div>
                )}
            </div>

            {/* Middle: Title & Description */}
            <div className="relative z-10 flex-1 flex flex-col justify-center mt-2 mb-2">
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white leading-tight line-clamp-2 mb-2 group-hover:text-brand transition-colors">
                    {title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 font-medium leading-relaxed">
                    {desc}
                </p>
            </div>

            {/* Bottom: Tags & Progress */}
            <div className="relative z-10 space-y-4">
                {/* Tags (Keywords) */}
                <div className="flex gap-1.5 overflow-hidden h-6">
                    {track.keywords?.slice(0, 2).map((k, i) => (
                        <span key={i} className="text-[9px] font-bold px-2 py-1 rounded-md bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-500 whitespace-nowrap">
                            {k}
                        </span>
                    ))}
                    {(track.keywords?.length || 0) > 2 && (
                        <span className="text-[9px] font-bold px-2 py-1 rounded-md bg-gray-50 dark:bg-white/5 text-gray-400">
                            +{track.keywords!.length - 2}
                        </span>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                        <span>{isZh ? "学习进度" : "Progress"}</span>
                        <span>{progressPercent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-brand rounded-full transition-all duration-1000" 
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
