
import React, { useMemo } from 'react';
import { 
    Activity, Calendar, AlertTriangle, Sparkles, 
    RotateCcw, CheckCircle2, RefreshCw,
    Zap, Layers, Box, Hash, Clock, ArrowRight
} from 'lucide-react';
import { MistakeRecord, RetentionRecord } from '../types';
import { PROBLEM_CATEGORIES, PROBLEM_MAP } from '../constants';

interface ReviewHubProps {
    mistakeCount: number;
    mistakes: MistakeRecord[]; 
    onStartReview: () => void;
    onStartMistakePractice: (strategy: 'all' | 'specific' | 'category' | 'type' | 'time' | 'urgent', targetId?: string) => void; 
    onStartSyntaxClinic?: () => void; 
    onBack: () => void;
    onGenerateVariant?: (mistakeId: string) => void;
    targetLanguage: string;
    retentionStats?: Record<string, RetentionRecord>;
    language: 'Chinese' | 'English';
    progressMap: Record<string, number>;
    onOpenIDE: (id: string) => void;
    onStartSession: (ids: string[]) => void;
}

interface KanbanItem {
    id: string;
    title: string;
    category: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    isDue: boolean;
    nextReview: number;
    interval: number;
    stability: number;
}

const LOCALE = {
    Chinese: {
        retentionTitle: "当前全站记忆留存率",
        statusGood: "状态良好",
        pressureTitle: "未来 7 天复习压力",
        normal: "正常",
        heavy: "繁重",
        reviewList: "记忆循环看板 (Memory Loops)",
        dueToday: "今日待复习",
        startReview: "一键开始复习",
        mistakeTitle: "错题急诊 (Repair Track)",
        aiVariant: "AI 变式",
        retry: "重做",
        errors: "ERRORS",
        noReviews: "暂无复习任务",
        noMistakes: "错题库为空，继续保持！",
        kanban: {
            daily: "⚡️ 1 天循环区 (Immediate)",
            dailyDesc: "刚完成 / 核心错题 / 遗忘高发",
            weekly: "🧠 3-7 天循环区 (Consolidating)",
            weeklyDesc: "短期记忆巩固阶段",
            monthly: "💎 30 天循环区 (Deep Memory)",
            monthlyDesc: "长期封存 / 肌肉记忆",
            empty: "暂无条目"
        }
    },
    English: {
        retentionTitle: "Current Retention Rate",
        statusGood: "Status Good",
        pressureTitle: "7-Day Review Pressure",
        normal: "Normal",
        heavy: "Heavy",
        reviewList: "Memory Loops (Golden Track)",
        dueToday: "Due Today",
        startReview: "Start Session",
        mistakeTitle: "Mistake Clinic (Red Track)",
        aiVariant: "AI Variant",
        retry: "Retry",
        errors: "ERRORS",
        noReviews: "No reviews due today",
        noMistakes: "No mistakes found. Keep it up!",
        kanban: {
            daily: "⚡️ 1 Day Loop (Immediate)",
            dailyDesc: "Fresh / High Error Rate",
            weekly: "🧠 3-7 Days Loop (Consolidating)",
            weeklyDesc: "Short-term Stabilization",
            monthly: "💎 30 Days Loop (Deep Memory)",
            monthlyDesc: "Long-term Mastery",
            empty: "Empty"
        }
    }
};

const getDifficulty = (id: string): 'Easy' | 'Medium' | 'Hard' => {
    // Deterministic pseudo-random difficulty based on ID char codes
    const n = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    if (n % 3 === 0) return 'Easy';
    if (n % 3 === 1) return 'Medium';
    return 'Hard';
};

const formatDueTime = (nextReview: number, isZh: boolean) => {
    const diff = nextReview - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (diff < 0) {
        // Overdue
        const overdueDays = Math.abs(days);
        if (overdueDays === 0) return isZh ? "刚刚到期" : "Just now";
        return isZh ? `逾期 ${overdueDays} 天` : `Overdue ${overdueDays}d`;
    }

    if (hours < 24) {
        return isZh ? `${hours}小时后` : `${hours}h left`;
    }
    
    const date = new Date(nextReview);
    return `${date.getMonth() + 1}/${date.getDate()}`;
};

export const ReviewHub: React.FC<ReviewHubProps> = ({ 
    mistakes, onStartReview, onStartMistakePractice, 
    onGenerateVariant, retentionStats = {}, language,
    progressMap, onOpenIDE, onStartSession
}) => {
    const t = LOCALE[language];
    const isZh = language === 'Chinese';
    const langKey = isZh ? 'zh' : 'en';

    // --- 1. Data Processing: Retention + Progress Fallback ---
    const now = Date.now();
    
    // Calculate Retention Rate safely
    const retentionRate = useMemo(() => {
        const records = Object.values(retentionStats) as RetentionRecord[];
        if (records.length === 0) return 0;
        const totalStability = records.reduce((acc, curr) => acc + (curr.stability || 0), 0);
        return Math.round(totalStability / records.length);
    }, [retentionStats]);

    const kanbanData = useMemo(() => {
        const columns = {
            daily: [] as KanbanItem[],
            weekly: [] as KanbanItem[],
            monthly: [] as KanbanItem[]
        };

        const currentLangProgress = progressMap || {};

        // 1. Identify ALL problems that should be in the system (Retention OR Mastered)
        const allProblemIds = new Set<string>([
            ...Object.keys(retentionStats),
            ...Object.keys(currentLangProgress).filter(pid => currentLangProgress[pid] >= 6) // Level 6 = Mastered
        ]);

        allProblemIds.forEach(id => {
            const meta = PROBLEM_MAP[id];
            if (!meta) return;

            const rec = retentionStats[id] as RetentionRecord | undefined; // Might be undefined if it's a fresh master
            const cat = PROBLEM_CATEGORIES.find(c => c.problems.includes(id));
            
            // If record exists, use its data. If not, default to "Fresh/Daily" settings.
            const interval = rec ? rec.interval : 0;
            const stability = rec ? rec.stability : 0;
            
            // FIX: If nextReview is 0 (missing record), default to NOW (Due Immediately), NOT 1970
            const nextReview = rec ? rec.nextReview : now; 

            const item: KanbanItem = {
                id,
                title: meta[langKey],
                category: cat ? (isZh ? cat.title_zh.split('：')[1] || cat.title_zh : cat.title.split(': ')[1] || cat.title) : 'Algorithm',
                difficulty: getDifficulty(id),
                isDue: nextReview <= now,
                nextReview,
                interval,
                stability
            };

            // STRICT INTERVAL BUCKETING
            if (interval <= 1.5) {
                columns.daily.push(item);
            } else if (interval <= 7.5) {
                columns.weekly.push(item);
            } else {
                columns.monthly.push(item);
            }
        });

        // Sort: Due items first (Overdue by largest margin), then by stability
        const sorter = (a: KanbanItem, b: KanbanItem) => {
            if (a.isDue !== b.isDue) return a.isDue ? -1 : 1;
            if (a.isDue) return a.nextReview - b.nextReview; // Most overdue first (smallest timestamp)
            return a.nextReview - b.nextReview; // Soonest next
        };
        
        columns.daily.sort(sorter);
        columns.weekly.sort(sorter);
        columns.monthly.sort(sorter);

        return columns;
    }, [retentionStats, progressMap, now, langKey, isZh]);

    const dueCount = Object.values(kanbanData).flat().filter((i: KanbanItem) => i.isDue).length;

    // --- 2. Data Processing: Calendar (Projection) ---
    const calendarDays = useMemo(() => {
        const days = [];
        const oneDay = 24 * 60 * 60 * 1000;
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(now + i * oneDay);
            const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
            const endOfDay = startOfDay + oneDay;
            
            // Count items due on this specific day
            const count = Object.values(retentionStats).filter((r: RetentionRecord) => 
                r.nextReview >= startOfDay && r.nextReview < endOfDay
            ).length;

            // For today (i=0), include everything overdue + missing records (treated as due now)
            let finalCount = count;
            if (i === 0) {
                 const overdueCount = Object.values(retentionStats).filter((r: any) => (r as RetentionRecord).nextReview < startOfDay).length;
                 const freshCount = kanbanData.daily.filter(k => k.isDue && !retentionStats[k.id]).length;
                 finalCount = count + overdueCount + freshCount;
            }

            days.push({
                label: i === 0 ? (isZh ? "今天" : "Today") : `${date.getMonth() + 1}/${date.getDate()}`,
                count: finalCount,
                isToday: i === 0
            });
        }
        return days;
    }, [retentionStats, kanbanData, isZh, now]);

    // --- 3. Data Processing: Mistakes (Real Data) ---
    const activeMistakes = useMemo(() => {
        return mistakes.filter(m => !m.isResolved).slice(0, 10);
    }, [mistakes]);

    // --- ACTIONS ---
    const handleStartSession = () => {
        const priorityQueue = [
            ...kanbanData.daily.filter(i => i.isDue),
            ...kanbanData.weekly.filter(i => i.isDue),
            ...kanbanData.monthly.filter(i => i.isDue),
            // Buffer: if queue is small, add non-due items from daily
            ...kanbanData.daily.filter(i => !i.isDue) 
        ].map(i => i.id);
        
        const uniqueQueue = Array.from(new Set(priorityQueue));

        if (uniqueQueue.length > 0) {
            onStartSession(uniqueQueue);
        } else {
            alert(isZh ? "太棒了！所有复习任务已完成。" : "Great job! No reviews due.");
        }
    };

    const KanbanColumn = ({ title, desc, items, colorClass, bgClass, borderColor }: any) => (
        <div className={`flex-1 min-w-[280px] flex flex-col rounded-3xl p-5 border ${borderColor} ${bgClass} transition-colors`}>
            <div className={`flex flex-col mb-4 pb-3 border-b ${borderColor}`}>
                <div className={`flex items-center gap-2 text-sm font-black uppercase tracking-wider ${colorClass}`}>
                    {title}
                    <span className="ml-auto bg-white dark:bg-black/20 px-2 py-0.5 rounded text-xs opacity-70 font-mono">{items.length}</span>
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mt-1 opacity-80">{desc}</div>
            </div>
            
            <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1 max-h-[500px]">
                {items.length > 0 ? items.map((item: any) => {
                    const isOverdue = item.isDue && item.nextReview < now;
                    return (
                        <button 
                            key={item.id} 
                            className={`w-full text-left bg-white dark:bg-dark-card p-4 rounded-xl border-2 shadow-sm group hover:border-brand dark:hover:border-brand transition-all relative overflow-hidden active:scale-[0.98] cursor-pointer z-10 flex flex-col gap-2 ${
                                item.isDue 
                                ? (isOverdue ? 'border-l-4 border-l-red-500 border-t-red-50 dark:border-t-red-900/10 border-r-gray-100 border-b-gray-100' : 'border-l-4 border-l-blue-500 border-t-gray-100 border-r-gray-100 border-b-gray-100')
                                : 'border-transparent border-l-4 border-l-gray-200 dark:border-l-gray-700'
                            }`}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onOpenIDE(item.id);
                            }}
                        >
                            <div className="flex justify-between items-start w-full">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                        item.difficulty === 'Easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                        item.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                        {item.difficulty}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-mono">ID: {item.id.replace('p_', '')}</span>
                                </div>
                                <div className={`text-[10px] font-bold ${isOverdue ? 'text-red-500 animate-pulse' : (item.isDue ? 'text-blue-500' : 'text-gray-400')}`}>
                                    {formatDueTime(item.nextReview, isZh)}
                                </div>
                            </div>

                            <div className="font-bold text-gray-800 dark:text-gray-200 text-sm leading-tight line-clamp-2">
                                {item.title}
                            </div>
                            
                            <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-800 w-full mt-1">
                                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                    {item.category}
                                </div>
                                
                                <div className="p-1 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-300 group-hover:text-brand transition-colors">
                                    <ArrowRight size={12}/>
                                </div>
                            </div>
                        </button>
                    );
                }) : (
                    <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl opacity-50">
                        <Box size={24} className="text-gray-300 mb-2"/>
                        <span className="text-[10px] text-gray-400 font-bold">{t.kanban.empty}</span>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen bg-gray-50 dark:bg-[#050505] space-y-6 pb-24">
            
            {/* --- TOP DASHBOARD --- */}
            <div className="flex flex-col lg:flex-row gap-6">
                {/* 1. Retention Graph */}
                <div className="flex-1 bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden h-40 group hover:border-blue-200 transition-colors">
                    <div className="relative z-10">
                        <div className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                            <Activity size={14} className="text-blue-500"/>
                            {t.retentionTitle}
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
                                {retentionRate}%
                            </span>
                            <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-lg text-[10px] font-bold mb-1.5">
                                <Zap size={10} fill="currentColor"/> {t.statusGood}
                            </div>
                        </div>
                    </div>
                    {/* SVG Curve */}
                    <div className="absolute bottom-0 left-0 right-0 h-20 opacity-20 pointer-events-none">
                        <svg viewBox="0 0 400 100" className="w-full h-full" preserveAspectRatio="none">
                            <path d="M0,80 C100,60 200,40 400,20 L400,100 L0,100 Z" fill="url(#blueGrad)" />
                            <defs>
                                <linearGradient id="blueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style={{stopColor: '#3b82f6', stopOpacity: 0.4}} />
                                    <stop offset="100%" style={{stopColor: '#3b82f6', stopOpacity: 0}} />
                                </linearGradient>
                            </defs>
                            <path d="M0,80 C100,60 200,40 400,20" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                    </div>
                </div>

                {/* 2. Calendar Pressure */}
                <div className="flex-[1.5] bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col h-40">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-gray-800 dark:text-white font-bold text-sm">
                            <Calendar size={16} className="text-gray-400"/>
                            {t.pressureTitle}
                        </div>
                        <div className="flex gap-3 text-[9px] font-bold uppercase">
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> {t.normal}</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span> {t.heavy}</span>
                        </div>
                    </div>
                    <div className="flex gap-2 h-full items-end pb-1">
                        {calendarDays.map((day, idx) => (
                            <div key={idx} className={`flex-1 flex flex-col items-center justify-end rounded-xl py-2 border transition-all ${
                                day.isToday 
                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30 h-full justify-between scale-105 origin-bottom' 
                                : 'bg-gray-50 dark:bg-[#151515] border-transparent text-gray-400 h-[80%]'
                            }`}>
                                <span className={`text-[10px] font-bold ${day.isToday ? 'opacity-90' : ''}`}>{day.label}</span>
                                <span className={`text-xl font-black ${day.isToday ? 'text-white' : 'text-gray-300 dark:text-gray-600'}`}>{day.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- MAIN COLUMNS --- */}
            <div className="flex flex-col xl:flex-row gap-6 h-[calc(100vh-320px)] min-h-[600px]">
                
                {/* LEFT: KANBAN BOARD */}
                <div className="flex-[2.5] bg-white dark:bg-dark-card rounded-[32px] border border-gray-200 dark:border-gray-800 p-6 flex flex-col overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between mb-6 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="bg-amber-100 dark:bg-amber-900/30 p-2.5 rounded-xl text-amber-600 dark:text-amber-400">
                                <Layers size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900 dark:text-white">{t.reviewList}</h2>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mt-0.5 flex items-center gap-2">
                                    {t.dueToday}: <span className="text-white bg-red-500 px-1.5 rounded-md">{dueCount}</span>
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={handleStartSession}
                            className="bg-brand hover:bg-brand-dark text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-brand/20 flex items-center gap-2 transition-all active:scale-95 text-sm"
                        >
                            {t.startReview} <ArrowRight size={16}/>
                        </button>
                    </div>

                    <div className="flex gap-4 overflow-x-auto h-full pb-2">
                        <KanbanColumn 
                            title={t.kanban.daily} 
                            desc={t.kanban.dailyDesc}
                            items={kanbanData.daily}
                            colorClass="text-orange-600 dark:text-orange-400"
                            bgClass="bg-orange-50/50 dark:bg-orange-900/5"
                            borderColor="border-orange-100 dark:border-orange-900/30"
                        />
                        <KanbanColumn 
                            title={t.kanban.weekly} 
                            desc={t.kanban.weeklyDesc}
                            items={kanbanData.weekly}
                            colorClass="text-blue-600 dark:text-blue-400"
                            bgClass="bg-blue-50/50 dark:bg-blue-900/5"
                            borderColor="border-blue-100 dark:border-blue-900/30"
                        />
                        <KanbanColumn 
                            title={t.kanban.monthly} 
                            desc={t.kanban.monthlyDesc}
                            items={kanbanData.monthly}
                            colorClass="text-purple-600 dark:text-purple-400"
                            bgClass="bg-purple-50/50 dark:bg-purple-900/5"
                            borderColor="border-purple-100 dark:border-purple-900/30"
                        />
                    </div>
                </div>

                {/* RIGHT: MISTAKE CLINIC */}
                <div className="flex-1 bg-red-50/50 dark:bg-red-900/5 rounded-[32px] p-6 border border-red-100 dark:border-red-900/20 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center mb-6 shrink-0">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-black uppercase text-sm tracking-wide">
                            <AlertTriangle size={18} />
                            {t.mistakeTitle}
                        </div>
                        <span className="bg-white dark:bg-red-900/30 text-red-600 dark:text-red-300 px-2 py-0.5 rounded-md text-xs font-bold border border-red-100 dark:border-red-800">
                            {activeMistakes.length}
                        </span>
                    </div>

                    <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-1">
                        {activeMistakes.length > 0 ? (
                            activeMistakes.map((m, idx) => (
                                <div key={idx} className="bg-white dark:bg-dark-card p-4 rounded-xl border-l-4 border-red-400 shadow-sm hover:translate-x-1 transition-transform group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-gray-800 dark:text-white text-xs md:text-sm">{m.problemName}</h3>
                                            <p className="text-[10px] text-gray-500 font-mono mt-1 opacity-70 line-clamp-1">
                                                {m.context || "Logic Error"}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-black text-red-500 leading-none">{m.failureCount || 1}</div>
                                            <div className="text-[8px] font-bold text-red-300 uppercase mt-0.5">{t.errors}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => onGenerateVariant && onGenerateVariant(m.id)}
                                            className="flex-1 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-lg text-[10px] font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <Sparkles size={10}/> {t.aiVariant}
                                        </button>
                                        <button 
                                            onClick={() => onStartMistakePractice('specific', m.id)}
                                            className="flex-1 py-1.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-[10px] font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <RotateCcw size={10}/> {t.retry}
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-gray-400 opacity-60">
                                <CheckCircle2 size={32} className="mx-auto mb-2 text-green-400"/>
                                <p className="text-xs font-bold">{t.noMistakes}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
