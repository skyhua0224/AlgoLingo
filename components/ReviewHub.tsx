
import React, { useState, useMemo } from 'react';
import { 
    Zap, RotateCcw, Dumbbell, ChevronDown, ChevronUp, Sparkles, Play, AlertCircle, 
    Clock, Shapes, LayoutGrid, Flame, ArrowDownWideNarrow, ShieldAlert, Stethoscope, CheckCircle2, Activity, Brain, Signal
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
}

const LOCALE = {
    Chinese: {
        title: "记忆修复中心",
        subtitle: "AI 驱动的遗忘防御系统",
        activeMistakes: "个认知断点",
        resolvedMistakes: "已修复",
        decayed: "个记忆衰退",
        startWorkout: "启动神经修复 (AI)",
        quickFix: "⚡ 紧急加固",
        vaultTitle: "错题保险箱",
        variant: "AI 生成变体",
        retry: "原题重试",
        emptyMistakes: "神经网络运行平稳。所有记忆节点在线。",
        trainingGround: "专项训练场",
        showAll: "展开全部",
        showLess: "收起列表",
        failCount: "次错误",
        tabs: {
            units: "知识单元",
            types: "题型特训",
            time: "记忆象限"
        },
        timeLabels: {
            fresh: "急救 (24h)",
            week: "巩固 (7天)",
            old: "深层 (>7天)"
        },
        status: {
            stable: "系统稳定",
            warning: "检测到衰退",
            critical: "记忆受损"
        },
        typeMap: {
            'quiz': '选择题',
            'parsons': '逻辑拼图',
            'fill-in': '代码填空',
            'interactive-code': '交互代码',
            'flipcard': '概念卡片',
            'leetcode': '实战模拟',
            'steps-list': '步骤排序'
        } as Record<string, string>
    },
    English: {
        title: "Memory Repair Hub",
        subtitle: "AI-Driven Forgetting Defense",
        activeMistakes: "Active Faults",
        resolvedMistakes: "Resolved",
        decayed: "Decayed Nodes",
        startWorkout: "Start Neural Repair (AI)",
        quickFix: "⚡ Quick Patch",
        vaultTitle: "Mistake Vault",
        variant: "Generate Variant",
        retry: "Retry Original",
        emptyMistakes: "Neural Network Stable. All systems nominal.",
        trainingGround: "Training Ground",
        showAll: "Show All",
        showLess: "Show Less",
        failCount: "fails",
        tabs: {
            units: "Units",
            types: "Types",
            time: "Retention"
        },
        timeLabels: {
            fresh: "Fresh (24h)",
            week: "Review (7d)",
            old: "Deep (>7d)"
        },
        status: {
            stable: "SYSTEM STABLE",
            warning: "DECAY DETECTED",
            critical: "CRITICAL LOSS"
        },
        typeMap: {
            'quiz': 'Quiz',
            'parsons': 'Parsons',
            'fill-in': 'Fill-in',
            'interactive-code': 'Interactive',
            'flipcard': 'Flipcard',
            'leetcode': 'LeetCode',
            'steps-list': 'Steps'
        } as Record<string, string>
    }
};

export const ReviewHub: React.FC<ReviewHubProps> = ({ 
    mistakeCount, mistakes, onStartReview, onStartMistakePractice, 
    onGenerateVariant, retentionStats = {}
}) => {
    const [expandedMistake, setExpandedMistake] = useState<string | null>(null);
    const [activeTrainingTab, setActiveTrainingTab] = useState<'units' | 'types' | 'time'>('units');
    const [vaultOpen, setVaultOpen] = useState(true); 
    const [showAllMistakes, setShowAllMistakes] = useState(false); 

    const language = 'Chinese'; 
    const t = LOCALE[language];

    // 1. Calculate Decay (Forgetting Curve)
    const decayedItems = useMemo(() => {
        const now = Date.now();
        return Object.entries(retentionStats).filter(([id, record]) => {
            // If time elapsed > interval, it's decayed
            return now > record.nextReview;
        }).map(([id, record]) => ({
            id,
            name: PROBLEM_MAP[id] || id,
            overdueDays: Math.ceil((now - record.nextReview) / (1000 * 60 * 60 * 24))
        }));
    }, [retentionStats]);

    // Filter Active vs Resolved
    const activeMistakes = useMemo(() => mistakes.filter(m => !m.isResolved), [mistakes]);
    const totalIssues = activeMistakes.length + decayedItems.length;
    
    // Dynamic Header Logic
    const systemStatus = useMemo(() => {
        if (totalIssues === 0) return { label: t.status.stable, color: 'from-emerald-900 to-teal-950', icon: Activity, score: 100 };
        if (totalIssues < 5) return { label: t.status.warning, color: 'from-yellow-900 to-orange-950', icon: AlertCircle, score: Math.max(70, 100 - totalIssues * 5) };
        return { label: t.status.critical, color: 'from-red-950 to-rose-950', icon: ShieldAlert, score: Math.max(0, 100 - totalIssues * 10) };
    }, [totalIssues, t]);

    // Grouping Logic (for Active mistakes mostly)
    const groupedByUnit = useMemo(() => {
        const groups: Record<string, { id: string, title: string, count: number }> = {};
        mistakes.forEach(m => { 
            const problemId = Object.keys(PROBLEM_MAP).find(key => PROBLEM_MAP[key] === m.problemName);
            const unit = PROBLEM_CATEGORIES.find(u => u.problems.includes(problemId || ''));
            if (unit) {
                if (!groups[unit.id]) {
                    groups[unit.id] = { 
                        id: unit.id, 
                        title: language === 'Chinese' ? unit.title_zh.split('：')[1] || unit.title_zh : unit.title, 
                        count: 0 
                    };
                }
                groups[unit.id].count++;
            }
        });
        return Object.values(groups).sort((a, b) => b.count - a.count);
    }, [mistakes, language]);

    const groupedByType = useMemo(() => {
        const groups: Record<string, { id: string, title: string, count: number }> = {};
        mistakes.forEach(m => {
            const type = m.questionType;
            if (!groups[type]) {
                groups[type] = { id: type, title: t.typeMap[type] || type, count: 0 };
            }
            groups[type].count++;
        });
        return Object.values(groups).sort((a, b) => b.count - a.count);
    }, [mistakes, language, t.typeMap]);

    const groupedByTime = useMemo(() => {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const buckets = {
            fresh: { id: 'fresh', title: t.timeLabels.fresh, count: 0, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
            week: { id: 'week', title: t.timeLabels.week, count: 0, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
            old: { id: 'old', title: t.timeLabels.old, count: 0, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' }
        };
        mistakes.forEach(m => {
            const diff = now - m.timestamp;
            if (diff <= oneDay) buckets.fresh.count++;
            else if (diff <= 7 * oneDay) buckets.week.count++;
            else buckets.old.count++;
        });
        return Object.values(buckets).filter(b => b.count > 0);
    }, [mistakes, language, t.timeLabels]);

    const sortedMistakes = useMemo(() => {
        return [...mistakes].sort((a, b) => {
            if (a.isResolved !== b.isResolved) return a.isResolved ? 1 : -1; 
            return b.timestamp - a.timestamp;
        });
    }, [mistakes]);

    const visibleMistakes = showAllMistakes ? sortedMistakes : sortedMistakes.slice(0, 5);
    const hiddenCount = sortedMistakes.length - visibleMistakes.length;

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 min-h-screen pb-24">
            
            {/* Header Title */}
            <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 pb-4 border-b border-gray-200 dark:border-gray-800 md:border-none">
                <div className="bg-gray-900 dark:bg-white/10 p-3 md:p-4 rounded-2xl text-white shadow-lg">
                    <Brain size={28} className="md:w-10 md:h-10" />
                </div>
                <div className="text-center md:text-left">
                    <h1 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight tracking-tight uppercase">
                        {t.title}
                    </h1>
                    <p className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest mt-1.5 md:mt-2 font-mono">{t.subtitle}</p>
                </div>
            </div>

            {/* System Monitor Card */}
            <div className={`relative overflow-hidden bg-gradient-to-br ${systemStatus.color} rounded-3xl p-6 md:p-8 text-white shadow-2xl group border border-white/10`}>
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-6 md:gap-10">
                        <div className="flex-1 w-full">
                            <div className="flex items-center justify-between md:justify-start gap-4 mb-6">
                                <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-md backdrop-blur-md border border-white/10">
                                    <systemStatus.icon size={16} className={totalIssues > 0 ? "animate-pulse text-red-400" : "text-emerald-400"} />
                                    <span className="font-mono text-xs font-bold tracking-widest uppercase">{systemStatus.label}</span>
                                </div>
                                <div className="font-mono text-xs text-white/50">
                                    SYS_ID: ALGO_CORE_V3
                                </div>
                            </div>
                            
                            <div className="flex flex-col md:flex-row gap-8 mb-8">
                                <div className="flex-1">
                                    <h2 className="text-4xl md:text-6xl font-black mb-2 leading-none tracking-tight font-mono">
                                        {systemStatus.score}%
                                    </h2>
                                    <p className="text-xs font-bold uppercase tracking-widest text-white/60">Synaptic Integrity</p>
                                </div>
                                
                                <div className="flex gap-6 text-right md:text-left">
                                    <div>
                                        <div className="text-2xl font-bold text-red-400 font-mono">{activeMistakes.length}</div>
                                        <div className="text-[10px] uppercase font-bold text-white/40">{t.activeMistakes}</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-orange-400 font-mono">{decayedItems.length}</div>
                                        <div className="text-[10px] uppercase font-bold text-white/40">{t.decayed}</div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Neural Map Viz */}
                            {(activeMistakes.length > 0 || decayedItems.length > 0) && (
                                <div className="flex flex-wrap gap-2 mb-8 p-4 bg-black/20 rounded-xl border border-white/5">
                                    {activeMistakes.slice(0, 8).map((m, i) => (
                                        <div key={m.id} className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" title="Active Fault" />
                                    ))}
                                    {decayedItems.slice(0, 8).map((m, i) => (
                                        <div key={m.id} className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] animate-pulse" style={{ animationDelay: '0.5s' }} title="Memory Decay" />
                                    ))}
                                    {(activeMistakes.length + decayedItems.length) > 16 && <span className="text-[10px] font-mono text-white/50">...</span>}
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3 w-full md:max-w-md">
                                <button 
                                    onClick={onStartReview}
                                    className="flex-1 px-6 py-4 bg-white text-gray-900 rounded-md font-black text-sm md:text-base hover:bg-gray-50 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-lg uppercase tracking-wider"
                                >
                                    <Signal size={18} className="text-black" />
                                    {t.startWorkout}
                                </button>
                                {totalIssues > 0 && (
                                    <button 
                                        onClick={() => onStartMistakePractice('urgent')}
                                        className="flex-1 px-6 py-4 bg-red-500/20 border border-red-500/50 text-white rounded-md font-bold text-sm md:text-base hover:bg-red-500/30 transition-all active:scale-95 backdrop-blur-sm flex items-center justify-center gap-2 uppercase tracking-wider"
                                    >
                                        <Zap size={18} className="fill-white" />
                                        {t.quickFix}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Training Ground */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                            <Dumbbell size={20} className="text-gray-800 dark:text-white" />
                        </div>
                        <h3 className="text-base md:text-lg font-extrabold text-gray-800 dark:text-white uppercase tracking-wide">
                            {t.trainingGround}
                        </h3>
                    </div>
                </div>

                <div className="flex p-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl gap-1 shadow-inner">
                    {[
                        { id: 'units', label: t.tabs.units, icon: LayoutGrid },
                        { id: 'types', label: t.tabs.types, icon: Shapes },
                        { id: 'time', label: t.tabs.time, icon: Clock }
                    ].map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTrainingTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTrainingTab(tab.id as any)}
                                className={`flex-1 py-3 rounded-lg text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                                    isActive 
                                    ? 'bg-white dark:bg-dark-card text-brand shadow-sm scale-[1.02]' 
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 min-h-[100px]">
                    {activeTrainingTab === 'units' && (
                        groupedByUnit.length > 0 ? groupedByUnit.map(group => (
                            <button key={group.id} onClick={() => onStartMistakePractice('category', group.id)} className="bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 p-4 rounded-xl text-left hover:border-brand dark:hover:border-brand transition-all group shadow-sm hover:shadow-md active:scale-95">
                                <div className="text-xs text-gray-400 font-bold mb-1.5">{group.count} Items</div>
                                <div className="font-extrabold text-gray-800 dark:text-white group-hover:text-brand transition-colors text-sm truncate leading-tight">{group.title}</div>
                            </button>
                        )) : <div className="col-span-full text-center text-gray-400 text-sm py-8">No items found.</div>
                    )}
                    {activeTrainingTab === 'types' && (
                        groupedByType.length > 0 ? groupedByType.map(group => (
                            <button key={group.id} onClick={() => onStartMistakePractice('type', group.id)} className="bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 p-4 rounded-xl text-left hover:border-brand dark:hover:border-brand transition-all group shadow-sm hover:shadow-md active:scale-95">
                                <div className="text-xs text-gray-400 font-bold mb-1.5">{group.count} Items</div>
                                <div className="font-extrabold text-gray-800 dark:text-white group-hover:text-brand transition-colors text-sm truncate leading-tight">{group.title}</div>
                            </button>
                        )) : <div className="col-span-full text-center text-gray-400 text-sm py-8">No items found.</div>
                    )}
                    {activeTrainingTab === 'time' && (
                        groupedByTime.length > 0 ? groupedByTime.map(group => (
                            <button key={group.id} onClick={() => onStartMistakePractice('time', group.id)} className={`border-2 border-transparent ${group.bg} p-4 rounded-xl text-left hover:scale-[1.02] transition-all group shadow-sm active:scale-95`}>
                                <div className={`text-xs font-bold mb-1.5 opacity-80 ${group.color}`}>{group.count} Items</div>
                                <div className={`font-extrabold text-sm ${group.color}`}>{group.title}</div>
                            </button>
                        )) : <div className="col-span-full text-center text-gray-400 text-sm py-8">No timed items found.</div>
                    )}
                </div>
            </div>

            {/* Mistake Vault */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <button onClick={() => setVaultOpen(!vaultOpen)} className="flex items-center gap-2 text-base font-extrabold text-gray-800 dark:text-white hover:opacity-80 transition-opacity">
                        <RotateCcw size={20} className="text-gray-400"/>
                        {t.vaultTitle}
                        <div className={`transition-transform ${vaultOpen ? 'rotate-180' : ''}`}><ChevronDown size={16} className="text-gray-400"/></div>
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 px-3 py-1 rounded-lg text-xs font-bold">{mistakes.length} Total</span>
                    </div>
                </div>

                {vaultOpen && sortedMistakes.length > 0 && (
                    <div className="grid grid-cols-1 gap-3 animate-fade-in-up">
                        {visibleMistakes.map((mistake) => {
                            const isResolved = mistake.isResolved;
                            const failCount = mistake.failureCount || 1;
                            
                            return (
                                <div key={mistake.id} className={`bg-white dark:bg-dark-card rounded-xl border transition-all overflow-hidden ${expandedMistake === mistake.id ? 'border-brand shadow-md' : 'border-gray-100 dark:border-gray-700'} ${isResolved ? 'opacity-70 hover:opacity-100' : ''}`}>
                                    <button onClick={() => setExpandedMistake(expandedMistake === mistake.id ? null : mistake.id)} className="w-full p-4 flex items-center justify-between text-left">
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <div className={`w-10 h-10 rounded-lg font-bold text-sm flex flex-col items-center justify-center shrink-0 ${isResolved ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                                                {isResolved ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <h4 className={`font-bold text-sm md:text-base truncate ${isResolved ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>{mistake.problemName}</h4>
                                                    {!isResolved && failCount > 1 && (
                                                        <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-600 text-[10px] font-black rounded uppercase tracking-wide">{failCount}x {t.failCount}</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-md bg-gray-50 dark:bg-gray-800/50">{t.typeMap[mistake.questionType] || mistake.questionType}</span>
                                                    <span className="text-[10px] text-gray-400">• {new Date(mistake.timestamp).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`text-gray-400 transition-transform duration-300 ${expandedMistake === mistake.id ? 'rotate-180' : ''}`}><ChevronDown size={20} /></div>
                                    </button>
                                    {expandedMistake === mistake.id && (
                                        <div className="px-4 pb-4 pt-0 bg-white dark:bg-dark-card animate-fade-in-down">
                                            <div className="h-px w-full bg-gray-100 dark:bg-gray-700 mb-4"></div>
                                            <div className="flex gap-3">
                                                <button onClick={() => onStartMistakePractice('specific', mistake.id)} className="flex-1 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-bold text-xs md:text-sm text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><RotateCcw size={16} />{t.retry}</button>
                                                <button onClick={() => onGenerateVariant && onGenerateVariant(mistake.id)} className="flex-[1.5] py-3 bg-brand text-white rounded-lg font-bold text-xs md:text-sm shadow-md flex items-center justify-center gap-2 hover:bg-brand-dark transition-colors"><Sparkles size={16} />{t.variant}</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {sortedMistakes.length > 5 && (
                            <button onClick={() => setShowAllMistakes(!showAllMistakes)} className="w-full py-3 text-sm font-bold text-gray-400 hover:text-gray-600 bg-gray-50 dark:bg-gray-800/50 rounded-xl transition-all">
                                {showAllMistakes ? t.showLess : `${t.showAll} (${hiddenCount})`}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
