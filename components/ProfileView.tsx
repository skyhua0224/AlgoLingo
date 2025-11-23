
import React, { useState, useMemo } from 'react';
import { UserStats, UserPreferences, ProgressMap, MistakeRecord } from '../types';
import { PROBLEM_CATEGORIES } from '../constants';
import { 
    Flame, Trophy, Zap, Edit2, Check, 
    Hexagon, Activity, TrendingUp, 
    ShieldAlert, MapPin, Share2, ShieldCheck
} from 'lucide-react';

interface ProfileViewProps {
    stats: UserStats;
    progressMap: ProgressMap;
    mistakes: MistakeRecord[]; // Added real data source
    language: 'Chinese' | 'English';
    preferences: UserPreferences;
    onUpdateName: (name: string) => void;
}

// --- Sub-Components ---

const StatBox = ({ icon, value, label, subLabel, colorClass }: any) => (
    <div className="bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 p-4 rounded-2xl flex items-center gap-4 transition-transform hover:scale-[1.02]">
        <div className={`p-3 rounded-xl ${colorClass} text-white shadow-lg`}>
            {icon}
        </div>
        <div>
            <div className="text-2xl font-black text-gray-800 dark:text-white font-mono tracking-tight">{value}</div>
            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</div>
            {subLabel && <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{subLabel}</div>}
        </div>
    </div>
);

const SectionHeader = ({ icon, title, action }: any) => (
    <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-gray-800 dark:text-white font-extrabold text-sm uppercase tracking-widest">
            {icon}
            <span>{title}</span>
        </div>
        {action}
    </div>
);

// --- Logic Helpers ---

const RADAR_LABELS: Record<string, { en: string, zh: string }> = {
    DP: { en: 'DP', zh: '动态规划' },
    DS: { en: 'Data Struct', zh: '数据结构' },
    Tree: { en: 'Trees', zh: '树与图' },
    Alg: { en: 'Algorithms', zh: '基础算法' },
    Sys: { en: 'System', zh: '系统设计' },
    Vel: { en: 'Speed', zh: '编码速度' },
};

const getRadarData = (progressMap: Record<string, number>, isZh: boolean) => {
    // Mapping Units to Dimensions
    const dimensions = [
        { key: 'DP', units: ['unit_dp_basic', 'unit_dp_adv'] }, 
        { key: 'DS', units: ['unit_hashing', 'unit_stack_queue', 'unit_linkedlist'] }, 
        { key: 'Tree', units: ['unit_trees', 'unit_graphs'] }, 
        { key: 'Alg', units: ['unit_search', 'unit_greedy', 'unit_pointers'] }, 
        { key: 'Sys', units: [] }, 
        { key: 'Vel', units: [] }, 
    ];

    return dimensions.map(dim => {
        const label = isZh ? RADAR_LABELS[dim.key].zh : RADAR_LABELS[dim.key].en;
        
        if (dim.key === 'Sys') return { key: dim.key, label, value: 15 }; // Starter value
        if (dim.key === 'Vel') return { key: dim.key, label, value: 40 }; // Starter value

        let totalLevels = 0;
        let completedLevels = 0;

        dim.units.forEach(uid => {
            const category = PROBLEM_CATEGORIES.find(c => c.id === uid);
            if (category) {
                category.problems.forEach(pid => {
                    totalLevels += 6; // Max level per problem
                    completedLevels += Math.min(6, progressMap[pid] || 0);
                });
            }
        });

        const percentage = totalLevels === 0 ? 0 : Math.round((completedLevels / totalLevels) * 100);
        // Normalize: ensure it's at least 20 so the chart looks ok for beginners
        const normalized = percentage === 0 ? 20 : Math.max(20, percentage); 
        return { key: dim.key, label, value: normalized };
    });
};

const getContributionData = (history: Record<string, number> = {}) => {
    const days = [];
    const today = new Date();
    const safeHistory = history || {}; 
    
    // Generate last ~16 weeks (16 * 7 = 112 days) to fill the width nicely
    for (let i = 111; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const xp = safeHistory[key] || 0;
        
        let level = 0;
        if (xp > 0) level = 1;
        if (xp > 50) level = 2;
        if (xp > 150) level = 3;
        if (xp > 300) level = 4;

        days.push({ date: key, level, xp });
    }
    return days;
};

const getRetentionData = (mistakes: MistakeRecord[], progressMap: Record<string, number>) => {
    // 1. Identify problems with mistakes (High Risk)
    const mistakeCounts: Record<string, number> = {};
    mistakes.forEach(m => {
        mistakeCounts[m.problemName] = (mistakeCounts[m.problemName] || 0) + 1;
    });

    // Map to array
    const riskItems = Object.entries(mistakeCounts).map(([name, count]) => ({
        name,
        decay: Math.max(20, 100 - (count * 15)), // More mistakes = lower retention %
        type: 'Mistake',
        riskLevel: count > 2 ? 'high' : 'medium'
    }));

    // Sort by lowest retention (highest risk)
    return riskItems.sort((a, b) => a.decay - b.decay).slice(0, 4); // Top 4
};

// --- Main Component ---

export const ProfileView: React.FC<ProfileViewProps> = ({ stats, progressMap, mistakes, language, preferences, onUpdateName }) => {
    const isZh = language === 'Chinese';
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(preferences.userName);

    // Data Calculations
    const langProgress = (progressMap && progressMap[preferences.targetLanguage]) || {};
    const radarData = useMemo(() => getRadarData(langProgress, isZh), [langProgress, isZh]);
    const heatmapData = useMemo(() => getContributionData(stats?.history), [stats?.history]);
    const retentionData = useMemo(() => getRetentionData(mistakes, langProgress), [mistakes, langProgress]);

    // SVG Radar Logic
    const radius = 70; // Slightly smaller to fit labels
    const centerX = 110; // Center in 220x220 viewbox
    const centerY = 110;
    const angleSlice = (Math.PI * 2) / 6;
    
    const getPoint = (index: number, value: number) => {
        const angle = index * angleSlice - Math.PI / 2; 
        const r = (value / 100) * radius;
        return `${centerX + r * Math.cos(angle)},${centerY + r * Math.sin(angle)}`;
    };

    const radarPath = radarData.map((d, i) => getPoint(i, d.value)).join(' ');
    
    // Rank Logic
    const currentXP = stats?.xp || 0;
    const rankLevels = [
        { name: isZh ? '青铜学徒' : 'Bronze Apprentice', threshold: 0, color: 'text-orange-500' },
        { name: isZh ? '白银极客' : 'Silver Geek', threshold: 500, color: 'text-gray-400' },
        { name: isZh ? '黄金架构师' : 'Gold Architect', threshold: 1500, color: 'text-yellow-500' },
        { name: isZh ? '钻石算法神' : 'Diamond Algo-God', threshold: 3000, color: 'text-purple-500' },
    ];
    
    // Find current rank
    let currentRank = rankLevels[0];
    let nextRank = rankLevels[1];
    
    for (let i = 0; i < rankLevels.length; i++) {
        if (currentXP >= rankLevels[i].threshold) {
            currentRank = rankLevels[i];
            nextRank = rankLevels[i + 1] || { name: 'MAX', threshold: currentXP * 2, color: 'text-brand' };
        }
    }

    const xpForNext = nextRank.threshold - currentXP;
    const progressToNext = Math.min(100, ((currentXP - currentRank.threshold) / (nextRank.threshold - currentRank.threshold)) * 100);

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 min-h-screen pb-24">
            
            {/* Top Grid: Identity & Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Identity Card (Left Large) */}
                <div className="lg:col-span-2 bg-white dark:bg-dark-card rounded-3xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 relative overflow-hidden shadow-xl">
                    {/* Ambient Background */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
                        {/* Avatar Box */}
                        <div className="relative group">
                            <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-gray-800 to-black rounded-2xl flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-2xl overflow-hidden">
                                <span className="text-4xl md:text-5xl font-black text-brand select-none">
                                    {(preferences.userName || 'U').slice(0, 2).toUpperCase()}
                                </span>
                                <div className="absolute inset-0 bg-brand mix-blend-overlay opacity-0 group-hover:opacity-20 transition-opacity cursor-pointer"></div>
                            </div>
                            <div className="absolute -bottom-3 -right-3 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 px-3 py-1 rounded-full text-xs font-bold text-brand shadow-sm flex items-center gap-1">
                                <MapPin size={10} /> Lv.{Math.floor(currentXP / 500) + 1}
                            </div>
                        </div>

                        {/* Info & Edit */}
                        <div className="flex-1 w-full">
                            <div className="flex items-center justify-between mb-2">
                                {isEditing ? (
                                    <div className="flex items-center gap-2 w-full max-w-xs">
                                        <input 
                                            className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1 rounded-lg outline-none border-2 border-brand w-full font-bold"
                                            value={tempName}
                                            onChange={(e) => setTempName(e.target.value)}
                                            autoFocus
                                        />
                                        <button onClick={() => { onUpdateName(tempName); setIsEditing(false); }} className="p-2 bg-brand text-white rounded-lg"><Check size={16}/></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 group">
                                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                                            {preferences.userName}
                                        </h1>
                                        <button onClick={() => setIsEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-400">
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="text-lg text-gray-500 dark:text-gray-400 font-medium mb-6 flex items-center gap-2">
                                <span className={`font-bold ${currentRank.color}`}>[{currentRank.name}]</span>
                            </div>

                            {/* XP Progress */}
                            <div className="w-full bg-gray-100 dark:bg-gray-800 h-4 rounded-full overflow-hidden mb-2 border border-gray-200 dark:border-gray-700 relative">
                                <div 
                                    className="h-full bg-gradient-to-r from-brand to-brand-light relative transition-all duration-1000"
                                    style={{ width: `${progressToNext}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-gray-500 mix-blend-difference uppercase tracking-wider">
                                    {currentXP} / {nextRank.threshold} XP
                                </div>
                            </div>
                            <div className="flex justify-end text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                                <span>{xpForNext} XP to {nextRank.name}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Stats Stack (Right Column) */}
                <div className="grid grid-rows-3 gap-4">
                    <StatBox 
                        icon={<Flame size={20} />} 
                        value={stats?.streak || 0} 
                        label={isZh ? "连胜天数" : "Day Streak"} 
                        subLabel={isZh ? "保持火热!" : "On Fire!"}
                        colorClass="bg-orange-500"
                    />
                    <StatBox 
                        icon={<Zap size={20} />} 
                        value={stats?.xp || 0} 
                        label={isZh ? "总经验值" : "Total XP"} 
                        subLabel="Lifetime"
                        colorClass="bg-yellow-500"
                    />
                    <StatBox 
                        icon={<Trophy size={20} />} 
                        value={stats?.gems || 0} 
                        label={isZh ? "宝石数" : "Gems"} 
                        subLabel={isZh ? "可兑换" : "Spendable"}
                        colorClass="bg-purple-500"
                    />
                </div>
            </div>

            {/* Middle Grid: Radar & Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 3. Competency Radar (Left) */}
                <div className="bg-white dark:bg-dark-card rounded-3xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col shadow-sm h-full min-h-[300px]">
                    <SectionHeader 
                        icon={<Hexagon size={16} className="text-purple-500" />}
                        title={isZh ? "能力雷达" : "Competency Radar"}
                    />
                    <div className="flex-1 flex items-center justify-center relative">
                        <svg viewBox="-10 -10 240 240" className="w-full h-full max-w-[280px] drop-shadow-xl">
                            {/* Background Grid */}
                            {[20, 40, 60, 80, 100].map(r => (
                                <circle key={r} cx={centerX} cy={centerY} r={(r/100)*radius} fill="none" stroke="currentColor" className="text-gray-100 dark:text-gray-800" strokeWidth="1" />
                            ))}
                            {/* Spokes */}
                            {[0, 1, 2, 3, 4, 5].map(i => {
                                const angle = i * angleSlice - Math.PI / 2;
                                return (
                                    <line 
                                        key={i}
                                        x1={centerX} y1={centerY}
                                        x2={centerX + radius * Math.cos(angle)}
                                        y2={centerY + radius * Math.sin(angle)}
                                        stroke="currentColor"
                                        className="text-gray-100 dark:text-gray-800"
                                        strokeWidth="1"
                                    />
                                );
                            })}
                            {/* The Radar Polygon */}
                            <polygon points={radarPath} fill="rgba(132, 204, 22, 0.2)" stroke="#84cc16" strokeWidth="2" className="transition-all duration-1000 ease-out" />
                            
                            {/* Labels */}
                            {radarData.map((d, i) => {
                                const angle = i * angleSlice - Math.PI / 2;
                                // Push labels out further
                                const x = centerX + (radius + 25) * Math.cos(angle);
                                const y = centerY + (radius + 25) * Math.sin(angle);
                                return (
                                    <text 
                                        key={i} 
                                        x={x} y={y} 
                                        textAnchor="middle" 
                                        dominantBaseline="middle" 
                                        className="text-[10px] font-bold fill-gray-500 dark:fill-gray-400 uppercase tracking-wider"
                                    >
                                        {d.label}
                                    </text>
                                );
                            })}
                        </svg>
                        
                        {/* Overlay Stats */}
                        <div className="absolute bottom-0 right-0 flex flex-col items-end">
                            <div className="text-2xl font-black text-gray-800 dark:text-white">
                                {Math.round(radarData.reduce((a, b) => a + b.value, 0) / 6)}
                            </div>
                            <div className="text-[10px] text-gray-400 font-bold uppercase">Avg Score</div>
                        </div>
                    </div>
                </div>

                {/* 4. Activity Heatmap (Right Wide) */}
                <div className="lg:col-span-2 bg-white dark:bg-dark-card rounded-3xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm h-full flex flex-col">
                    <SectionHeader 
                        icon={<Activity size={16} className="text-green-500" />}
                        title={isZh ? "贡献热力图" : "Contribution Graph"}
                        action={
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 transition-colors">
                                <Share2 size={16} />
                            </button>
                        }
                    />
                    
                    <div className="flex flex-col justify-center flex-1">
                        <div className="flex justify-center overflow-hidden">
                            <div className="grid grid-rows-7 grid-flow-col gap-1">
                                {heatmapData.map((day, i) => (
                                    <div 
                                        key={day.date}
                                        title={`${day.date}: ${day.xp} XP`}
                                        className={`
                                            w-3 h-3 md:w-4 md:h-4 rounded-[2px] transition-all hover:scale-125 hover:z-10 border border-transparent hover:border-black/20 dark:hover:border-white/20
                                            ${day.level === 0 ? 'bg-gray-100 dark:bg-gray-800' : ''}
                                            ${day.level === 1 ? 'bg-emerald-200 dark:bg-emerald-900/60' : ''}
                                            ${day.level === 2 ? 'bg-emerald-300 dark:bg-emerald-700' : ''}
                                            ${day.level === 3 ? 'bg-emerald-400 dark:bg-emerald-600' : ''}
                                            ${day.level === 4 ? 'bg-emerald-500 dark:bg-emerald-500' : ''}
                                        `}
                                    />
                                ))}
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-400 pt-4 px-4">
                            <span className="font-mono text-[10px] hidden md:block">{heatmapData[0]?.date}</span>
                            <div className="flex items-center gap-2 ml-auto">
                                <span className="text-[10px] uppercase font-bold">Less</span>
                                <div className="flex gap-1">
                                    <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded-[2px]"></div>
                                    <div className="w-3 h-3 bg-emerald-200 dark:bg-emerald-900/60 rounded-[2px]"></div>
                                    <div className="w-3 h-3 bg-emerald-400 dark:bg-emerald-600 rounded-[2px]"></div>
                                    <div className="w-3 h-3 bg-emerald-500 dark:bg-emerald-500 rounded-[2px]"></div>
                                </div>
                                <span className="text-[10px] uppercase font-bold">More</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom: Retention & Risk Monitor */}
            <div className="bg-gray-900 dark:bg-black rounded-3xl p-6 md:p-8 text-white relative overflow-hidden border border-gray-800 shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-brand"></div>
                
                {/* Conditional Render: Healthy vs Risk */}
                {retentionData.length === 0 ? (
                    <div className="relative z-10 flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
                            <ShieldCheck size={32} className="text-green-400"/>
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-green-400">
                            {isZh ? "大脑状态极佳" : "Brain Health: Excellent"}
                        </h3>
                        <p className="text-gray-400 text-sm max-w-md">
                            {isZh 
                             ? "目前没有检测到明显的记忆衰退风险。继续保持！" 
                             : "No significant memory decay detected based on your recent activity. Keep it up!"}
                        </p>
                    </div>
                ) : (
                    <div className="relative z-10 flex flex-col md:flex-row gap-8">
                        <div className="md:w-1/3">
                            <div className="flex items-center gap-2 text-red-400 font-black text-sm uppercase tracking-widest mb-4">
                                <ShieldAlert size={18} />
                                {isZh ? "记忆衰退警告" : "Retention Decay Monitor"}
                            </div>
                            <h3 className="text-2xl font-bold mb-2">
                                {isZh ? `${retentionData.length} 个知识点急需修复` : `${retentionData.length} Concepts At Risk`}
                            </h3>
                            <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                {isZh 
                                ? "根据你的错题记录和艾宾浩斯遗忘曲线分析，以下知识点的记忆强度已降至危险水平。" 
                                : "Based on your mistake history and Ebbinghaus Forgetting Curve, retention for these concepts has dropped to critical levels."}
                            </p>
                            <button className="px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors flex items-center gap-2">
                                <TrendingUp size={16} />
                                {isZh ? "一键修复 (快速复习)" : "Quick Repair Session"}
                            </button>
                        </div>

                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {retentionData.map((item, i) => (
                                <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between group hover:bg-white/10 transition-colors">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                                item.riskLevel === 'high' ? 'border-red-500/50 text-red-400 bg-red-500/10' : 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10'
                                            }`}>
                                                {item.riskLevel === 'high' ? 'HIGH RISK' : 'DECAY'}
                                            </span>
                                            <span className="font-bold text-sm truncate max-w-[120px]">{item.name}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 font-mono">Analysis: High Error Rate</div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`font-mono font-bold text-lg ${item.riskLevel === 'high' ? 'text-red-500' : 'text-yellow-500'}`}>
                                            {item.decay}%
                                        </span>
                                        <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${item.riskLevel === 'high' ? 'bg-red-500' : 'bg-yellow-500'}`} 
                                                style={{ width: `${item.decay}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};
