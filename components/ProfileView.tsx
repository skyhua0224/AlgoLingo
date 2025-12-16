
import React, { useState, useMemo } from 'react';
import { UserStats, UserPreferences, ProgressMap, MistakeRecord } from '../types';
import { PROBLEM_CATEGORIES, PROBLEM_MAP } from '../constants';
import { 
    Flame, Trophy, Zap, Edit2, Check, 
    Hexagon, Activity, Share2, MapPin,
    Sprout, BookOpen, Crown, Lock, ArrowRight
} from 'lucide-react';

interface ProfileViewProps {
    stats: UserStats;
    progressMap: ProgressMap;
    mistakes: MistakeRecord[]; 
    language: 'Chinese' | 'English';
    preferences: UserPreferences;
    onUpdateName: (name: string) => void;
    onSelectProblem?: (id: string, name: string, level: number) => void;
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
        
        if (dim.key === 'Sys') return { key: dim.key, label, value: 15 }; 
        if (dim.key === 'Vel') return { key: dim.key, label, value: 40 }; 

        let totalLevels = 0;
        let completedLevels = 0;

        dim.units.forEach(uid => {
            const category = PROBLEM_CATEGORIES.find(c => c.id === uid);
            if (category) {
                category.problems.forEach(pid => {
                    totalLevels += 6; 
                    completedLevels += Math.min(6, progressMap[pid] || 0);
                });
            }
        });

        const percentage = totalLevels === 0 ? 0 : Math.round((completedLevels / totalLevels) * 100);
        const normalized = percentage === 0 ? 20 : Math.max(20, percentage); 
        return { key: dim.key, label, value: normalized };
    });
};

const getContributionData = (history: Record<string, number> = {}) => {
    const days = [];
    const today = new Date();
    const safeHistory = history || {}; 
    
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

// --- KANBAN LOGIC ---
const getKanbanData = (progressMap: Record<string, number>, mistakes: MistakeRecord[], langKey: 'en' | 'zh') => {
    const fresh: {id: string, name: string, level: number}[] = [];
    const pending: {id: string, name: string, level: number}[] = [];
    const mastered: {id: string, name: string, level: number}[] = [];

    // Helper: Check if problem has recent mistakes
    // Note: Mistakes store problemName as a string. We try to match loosely.
    const hasMistakes = (name: string) => mistakes.some(m => m.problemName === name);

    Object.entries(progressMap).forEach(([id, level]) => {
        const problemData = PROBLEM_MAP[id];
        const name = problemData ? problemData[langKey] : id;
        if (!problemData) return;

        // Check if mistakes exist using ANY language name from the map to be robust
        const hasError = mistakes.some(m => m.problemName === problemData.en || m.problemName === problemData.zh);

        if (level > 0 && level < 6) {
            // Level 1-5: In Progress -> Fresh
            fresh.push({ id, name, level });
        } else if (level >= 6) {
            // Level 6: Mastered... but is it retained?
            if (hasError) {
                pending.push({ id, name, level });
            } else {
                mastered.push({ id, name, level });
            }
        }
    });

    return { fresh, pending, mastered };
};

// --- Main Component ---

export const ProfileView: React.FC<ProfileViewProps> = ({ stats, progressMap, mistakes, language, preferences, onUpdateName, onSelectProblem }) => {
    const isZh = language === 'Chinese';
    const langKey = isZh ? 'zh' : 'en';
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(preferences.userName);

    const langProgress = (progressMap && progressMap[preferences.targetLanguage]) || {};
    const radarData = useMemo(() => getRadarData(langProgress, isZh), [langProgress, isZh]);
    const heatmapData = useMemo(() => getContributionData(stats?.history), [stats?.history]);
    const kanbanData = useMemo(() => getKanbanData(langProgress, mistakes, langKey), [langProgress, mistakes, langKey]);

    // SVG Radar Logic
    const radius = 70;
    const centerX = 110;
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
                {/* Identity Card */}
                <div className="lg:col-span-2 bg-white dark:bg-dark-card rounded-3xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
                        <div className="relative group">
                            <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-gray-800 to-black rounded-2xl flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-2xl overflow-hidden">
                                <span className="text-4xl md:text-5xl font-black text-brand select-none">
                                    {(preferences.userName || 'U').slice(0, 2).toUpperCase()}
                                </span>
                            </div>
                            <div className="absolute -bottom-3 -right-3 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 px-3 py-1 rounded-full text-xs font-bold text-brand shadow-sm flex items-center gap-1">
                                <MapPin size={10} /> Lv.{Math.floor(currentXP / 500) + 1}
                            </div>
                        </div>
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

                {/* Stats Stack */}
                <div className="grid grid-rows-3 gap-4">
                    <StatBox icon={<Flame size={20} />} value={stats?.streak || 0} label={isZh ? "连胜天数" : "Day Streak"} subLabel={isZh ? "保持火热!" : "On Fire!"} colorClass="bg-orange-500" />
                    <StatBox icon={<Zap size={20} />} value={stats?.xp || 0} label={isZh ? "总经验值" : "Total XP"} subLabel="Lifetime" colorClass="bg-yellow-500" />
                    <StatBox icon={<Trophy size={20} />} value={stats?.gems || 0} label={isZh ? "宝石数" : "Gems"} subLabel={isZh ? "可兑换" : "Spendable"} colorClass="bg-purple-500" />
                </div>
            </div>

            {/* Middle Grid: Radar & Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-dark-card rounded-3xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col shadow-sm h-full min-h-[300px]">
                    <SectionHeader icon={<Hexagon size={16} className="text-purple-500" />} title={isZh ? "能力雷达" : "Competency Radar"} />
                    <div className="flex-1 flex items-center justify-center relative">
                        <svg viewBox="-10 -10 240 240" className="w-full h-full max-w-[280px] drop-shadow-xl">
                            {[20, 40, 60, 80, 100].map(r => ( <circle key={r} cx={centerX} cy={centerY} r={(r/100)*radius} fill="none" stroke="currentColor" className="text-gray-100 dark:text-gray-800" strokeWidth="1" /> ))}
                            {[0, 1, 2, 3, 4, 5].map(i => {
                                const angle = i * angleSlice - Math.PI / 2;
                                return ( <line key={i} x1={centerX} y1={centerY} x2={centerX + radius * Math.cos(angle)} y2={centerY + radius * Math.sin(angle)} stroke="currentColor" className="text-gray-100 dark:text-gray-800" strokeWidth="1" /> );
                            })}
                            <polygon points={radarPath} fill="rgba(132, 204, 22, 0.2)" stroke="#84cc16" strokeWidth="2" className="transition-all duration-1000 ease-out" />
                            {radarData.map((d, i) => {
                                const angle = i * angleSlice - Math.PI / 2;
                                const x = centerX + (radius + 25) * Math.cos(angle);
                                const y = centerY + (radius + 25) * Math.sin(angle);
                                return ( <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-bold fill-gray-500 dark:fill-gray-400 uppercase tracking-wider">{d.label}</text> );
                            })}
                        </svg>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-dark-card rounded-3xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm h-full flex flex-col">
                    <SectionHeader icon={<Activity size={16} className="text-green-500" />} title={isZh ? "贡献热力图" : "Contribution Graph"} action={<button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 transition-colors"><Share2 size={16} /></button>} />
                    <div className="flex flex-col justify-center flex-1">
                        <div className="flex justify-center overflow-hidden">
                            <div className="grid grid-rows-7 grid-flow-col gap-1">
                                {heatmapData.map((day, i) => (
                                    <div key={day.date} title={`${day.date}: ${day.xp} XP`} className={`w-3 h-3 md:w-4 md:h-4 rounded-[2px] transition-all ${day.level === 0 ? 'bg-gray-100 dark:bg-gray-800' : ''} ${day.level === 1 ? 'bg-emerald-200 dark:bg-emerald-900/60' : ''} ${day.level === 2 ? 'bg-emerald-300 dark:bg-emerald-700' : ''} ${day.level === 3 ? 'bg-emerald-400 dark:bg-emerald-600' : ''} ${day.level === 4 ? 'bg-emerald-500 dark:bg-emerald-500' : ''}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom: Knowledge Kanban Board */}
            <div>
                <div className="flex items-center gap-2 mb-4 px-2">
                    <BookOpen size={20} className="text-gray-800 dark:text-white" />
                    <h2 className="text-xl font-extrabold text-gray-800 dark:text-white uppercase tracking-wide">
                        {isZh ? "记忆资产看板" : "Knowledge Assets"}
                    </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Column 1: Fresh */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 pb-2 border-b-4 border-green-400">
                            <Sprout size={18} className="text-green-500" />
                            <span className="font-bold text-gray-600 dark:text-gray-300 uppercase text-sm">
                                {isZh ? "刚学会 (In Progress)" : "Fresh / In Progress"}
                            </span>
                            <span className="ml-auto bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs px-2 py-0.5 rounded-full font-bold">
                                {kanbanData.fresh.length}
                            </span>
                        </div>
                        <div className="flex flex-col gap-3">
                            {kanbanData.fresh.map(item => (
                                <button 
                                    key={item.id} 
                                    onClick={() => onSelectProblem && onSelectProblem(item.id, item.name, item.level)}
                                    className="bg-white dark:bg-dark-card p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-green-400 transition-all text-left group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-mono text-gray-400">Lv.{item.level}</span>
                                        <ArrowRight size={14} className="text-gray-300 group-hover:text-green-500 transition-colors" />
                                    </div>
                                    <div className="font-bold text-gray-800 dark:text-gray-200 text-sm">{item.name}</div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 mt-3 rounded-full overflow-hidden">
                                        <div className="bg-green-500 h-full rounded-full" style={{width: `${(item.level/6)*100}%`}}></div>
                                    </div>
                                </button>
                            ))}
                            {kanbanData.fresh.length === 0 && (
                                <div className="text-center py-8 text-gray-400 text-xs italic border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                                    {isZh ? "暂无正在学习的内容" : "No active learning"}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Column 2: Pending */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 pb-2 border-b-4 border-blue-400">
                            <Lock size={18} className="text-blue-500" />
                            <span className="font-bold text-gray-600 dark:text-gray-300 uppercase text-sm">
                                {isZh ? "待精通 (Pending)" : "Pending Mastery"}
                            </span>
                            <span className="ml-auto bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs px-2 py-0.5 rounded-full font-bold">
                                {kanbanData.pending.length}
                            </span>
                        </div>
                        <div className="flex flex-col gap-3">
                            {kanbanData.pending.map(item => (
                                <button 
                                    key={item.id} 
                                    onClick={() => onSelectProblem && onSelectProblem(item.id, item.name, item.level)}
                                    className="bg-white dark:bg-dark-card p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-blue-400 transition-all text-left group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/5 rounded-bl-full -mr-2 -mt-2"></div>
                                    <div className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-1">{item.name}</div>
                                    <div className="text-xs text-blue-500 font-bold flex items-center gap-1">
                                        <Activity size={12}/> {isZh ? "需要复习" : "Needs Review"}
                                    </div>
                                </button>
                            ))}
                             {kanbanData.pending.length === 0 && (
                                <div className="text-center py-8 text-gray-400 text-xs italic border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                                    {isZh ? "没有待巩固的知识点" : "Nothing pending"}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Column 3: Mastered */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 pb-2 border-b-4 border-yellow-400">
                            <Crown size={18} className="text-yellow-500" />
                            <span className="font-bold text-gray-600 dark:text-gray-300 uppercase text-sm">
                                {isZh ? "已掌握 (Retained)" : "Mastered"}
                            </span>
                            <span className="ml-auto bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs px-2 py-0.5 rounded-full font-bold">
                                {kanbanData.mastered.length}
                            </span>
                        </div>
                        <div className="flex flex-col gap-3">
                            {kanbanData.mastered.map(item => (
                                <button 
                                    key={item.id} 
                                    onClick={() => onSelectProblem && onSelectProblem(item.id, item.name, item.level)}
                                    className="bg-white dark:bg-dark-card p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-yellow-400 transition-all text-left group bg-gradient-to-br from-white to-yellow-50/50 dark:from-dark-card dark:to-yellow-900/10"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="font-bold text-gray-800 dark:text-gray-200 text-sm">{item.name}</div>
                                        <Crown size={14} className="text-yellow-500 fill-yellow-500" />
                                    </div>
                                    <div className="text-xs text-gray-400 font-mono">{isZh ? "记忆强度: 极佳" : "Retention: High"}</div>
                                </button>
                            ))}
                             {kanbanData.mastered.length === 0 && (
                                <div className="text-center py-8 text-gray-400 text-xs italic border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                                    {isZh ? "继续努力解锁成就" : "Keep learning to master"}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};
