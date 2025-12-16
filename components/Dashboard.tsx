
import React, { useState } from 'react';
import { Problem, UserStats, DailyQuest, SavedLesson, MistakeRecord } from '../types';
import { PROBLEM_CATEGORIES, PROBLEM_MAP } from '../constants';
import { Flame, Trophy, Search, Zap, ChevronDown, ChevronRight, Medal, Shield, Target, CheckCircle2, History, Play, Sparkles, AlertTriangle, ArrowRight, XCircle, RotateCcw } from 'lucide-react';

interface DashboardProps {
  progressMap: Record<string, number>; 
  stats: UserStats;
  savedLessons: SavedLesson[];
  mistakes: MistakeRecord[];
  onSelectProblem: (problemId: string, problemName: string, currentLevel: number) => void;
  onLoadSaved: (lesson: SavedLesson) => void;
  onStartReview: () => void;
  language: 'Chinese' | 'English';
}

const LOCALE = {
    Chinese: {
        unitReview: "单元黄金挑战",
        mastered: "已精通",
        start: "开始",
        search: "搜索...",
        dailyQuests: "每日任务",
        league: "段位",
        viewAll: "查看全部",
        continue: "继续学习",
        recent: "最近记录",
        aiSuggest: "AI 智能推荐",
        fixMistakes: "修复薄弱点",
        fixMistakesDesc: "AI 检测到认知断点。生成针对性训练？",
        startFix: "开始修复",
        noHistory: "暂无学习记录",
        historyLabel: "历史",
        archiveTitle: "历史档案",
        replay: "重做",
        score: "得分",
        mistakes: "错题"
    },
    English: {
        unitReview: "Gold Unit Challenge",
        mastered: "Mastered",
        start: "Start",
        search: "Search...",
        dailyQuests: "Daily Quests",
        league: "League",
        viewAll: "View All",
        continue: "Continue",
        recent: "Recent Activity",
        aiSuggest: "AI Suggestion",
        fixMistakes: "Fix Weak Spots",
        fixMistakesDesc: "AI detected knowledge gaps. Generate targeted drill?",
        startFix: "Start Repair",
        noHistory: "No recent history",
        historyLabel: "History",
        archiveTitle: "Training Archive",
        replay: "Replay",
        score: "Score",
        mistakes: "Mistakes"
    }
};

// Mock Quests if none exist (Fallback)
const DEFAULT_QUESTS: DailyQuest[] = [
    { id: 'q1', description: 'Complete 1 Lesson', target: 1, current: 0, rewardGems: 10, completed: false },
    { id: 'q2', description: 'Get a Perfect Score', target: 1, current: 0, rewardGems: 20, completed: false },
    { id: 'q3', description: 'Review 5 Mistakes', target: 5, current: 0, rewardGems: 15, completed: false }
];

export const Dashboard: React.FC<DashboardProps> = ({ 
    progressMap, stats, savedLessons, mistakes, 
    onSelectProblem, onLoadSaved, onStartReview, language 
}) => {
  const [expandedUnit, setExpandedUnit] = useState<string | null>("unit_hashing");
  const t = LOCALE[language];
  const langKey = language === 'Chinese' ? 'zh' : 'en';

  const quests = (stats.quests && stats.quests.length > 0) ? stats.quests : DEFAULT_QUESTS;
  const currentTier = stats.league?.currentTier || 'Bronze';
  
  // Recent 3 lessons for top widget
  const recentLessons = savedLessons.slice(0, 3);
  const activeMistakes = mistakes.filter(m => !m.isResolved).length;

  // Determine League Color
  const leagueColors: Record<string, string> = {
      'Bronze': 'text-orange-700 bg-orange-100',
      'Silver': 'text-gray-700 bg-gray-200',
      'Gold': 'text-yellow-700 bg-yellow-100',
      'Platinum': 'text-cyan-700 bg-cyan-100',
      'Diamond': 'text-purple-700 bg-purple-100'
  };

  const leagueColorClass = leagueColors[currentTier] || leagueColors['Bronze'];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Left Column: Main Content */}
        <div className="flex-1 flex flex-col gap-8">
             {/* Stats Bar (Mobile Friendly) */}
            <div className="bg-white dark:bg-dark-card rounded-2xl p-6 flex justify-between items-center shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-brand text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md">SH</div>
                    <div className="flex gap-6">
                        <div className="flex items-center gap-2 text-orange-500 font-bold text-lg"><Flame size={20} className="fill-current"/> {stats.streak}</div>
                        <div className="flex items-center gap-2 text-yellow-500 font-bold text-lg"><Trophy size={20} className="fill-current"/> {stats.xp}</div>
                        <div className="flex items-center gap-2 text-purple-500 font-bold text-lg hidden sm:flex"><Medal size={20} className="fill-current"/> {stats.gems}</div>
                    </div>
                </div>
            </div>

            {/* Smart Suggestion & History Area */}
            {(activeMistakes > 0 || recentLessons.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {/* AI Mistake Fixer */}
                    {activeMistakes > 0 ? (
                        <div className="bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-dark-card border border-red-100 dark:border-red-900/30 rounded-2xl p-5 relative overflow-hidden group min-h-[160px] flex flex-col">
                            <div className="absolute top-0 right-0 p-4 opacity-10 text-red-500 transform rotate-12 group-hover:scale-110 transition-transform">
                                <AlertTriangle size={80} />
                            </div>
                            <div className="relative z-10 flex flex-col h-full items-start">
                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider mb-2">
                                    <Sparkles size={14} /> {t.aiSuggest}
                                </div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">{t.fixMistakes}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 pr-8 leading-relaxed flex-1">
                                    {t.fixMistakesDesc} <span className="font-bold text-red-500">({activeMistakes} issues)</span>
                                </p>
                                <button 
                                    onClick={onStartReview}
                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md shadow-red-500/20 transition-all flex items-center gap-2"
                                >
                                    <Zap size={14} fill="currentColor"/> {t.startFix}
                                </button>
                            </div>
                        </div>
                    ) : (
                        // Placeholder if no mistakes (encouragement)
                        <div className="bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-dark-card border border-green-100 dark:border-green-900/30 rounded-2xl p-5 flex flex-col justify-center min-h-[160px]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full text-green-600 dark:text-green-300">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 dark:text-white">All Clear!</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">No pending mistakes. Keep it up!</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recent History List (Mini) */}
                    <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-2xl p-5 flex flex-col min-h-[160px]">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-gray-800 dark:text-white text-sm flex items-center gap-2">
                                <History size={16} className="text-gray-400"/> {t.recent}
                            </h3>
                        </div>
                        
                        <div className="flex-1 space-y-2">
                            {recentLessons.length > 0 ? (
                                recentLessons.map(lesson => (
                                    <button 
                                        key={lesson.id}
                                        onClick={() => onLoadSaved(lesson)}
                                        className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg group transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0 text-xs font-bold">
                                                L{Math.min((lesson.nodeIndex || 0) + 1, 6)}
                                            </div>
                                            <div className="truncate">
                                                <div className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate">{lesson.plan.title}</div>
                                                <div className="text-[10px] text-gray-400">{new Date(lesson.timestamp).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <Play size={14} className="text-gray-300 group-hover:text-brand"/>
                                    </button>
                                ))
                            ) : (
                                <div className="text-center text-xs text-gray-400 py-4 italic">{t.noHistory}</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Units List */}
            <div className="space-y-8">
                {PROBLEM_CATEGORIES.map((unit) => {
                    // Calculate Unit Mastery
                    const totalProblems = unit.problems.length;
                    const completedProblems = unit.problems.filter(pid => (progressMap[pid] || 0) >= 6).length;
                    const isUnitComplete = totalProblems > 0 && totalProblems === completedProblems;
                    
                    const title = language === 'Chinese' ? unit.title_zh : unit.title;
                    const description = language === 'Chinese' ? unit.description_zh : unit.description;

                    return (
                    <div key={unit.id} className="bg-white dark:bg-dark-card rounded-3xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md">
                        <button 
                            onClick={() => setExpandedUnit(expandedUnit === unit.id ? null : unit.id)}
                            className={`w-full p-6 md:p-8 flex items-center justify-between transition-colors duration-300 ${expandedUnit === unit.id ? 'bg-brand text-white' : 'bg-white dark:bg-dark-card text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                        >
                            <div className="text-left">
                                <h2 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight">{title}</h2>
                                <p className={`text-sm md:text-base mt-2 font-medium ${expandedUnit === unit.id ? 'text-brand-bg' : 'text-gray-500 dark:text-gray-400'}`}>{description}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                {isUnitComplete && <Medal size={28} className="text-yellow-400 fill-current"/>}
                                {expandedUnit === unit.id ? <ChevronDown size={28}/> : <ChevronRight size={28}/>}
                            </div>
                        </button>

                        {expandedUnit === unit.id && (
                            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 bg-gray-50 dark:bg-dark-bg animate-fade-in-down">
                                {unit.problems.map(pid => {
                                    const problemData = PROBLEM_MAP[pid];
                                    const name = problemData ? problemData[langKey] : pid;
                                    const level = progressMap[pid] || 0;
                                    const mastered = level >= 6;
                                    if (!problemData) return null;

                                    return (
                                        <button 
                                            key={pid}
                                            onClick={() => onSelectProblem(pid, name, level)}
                                            className={`p-5 rounded-2xl border-2 border-b-4 text-left transition-all active:translate-y-1 hover:shadow-md flex flex-col justify-between h-full min-h-[100px] ${level > 0 ? 'bg-white dark:bg-dark-card border-brand' : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                                        >
                                            <div>
                                                <div className="flex justify-between mb-2">
                                                    <span className="text-xs font-mono text-gray-400">{pid}</span>
                                                    {mastered && <Trophy size={16} className="text-yellow-500 fill-yellow-500"/>}
                                                </div>
                                                <div className="font-bold text-gray-800 dark:text-gray-200 text-base leading-tight">{name}</div>
                                            </div>
                                            
                                            {level > 0 && (
                                                <div className="mt-4 h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-brand transition-all duration-500" style={{ width: `${(level/6)*100}%`}}></div>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                                
                                {/* Golden Review Card */}
                                <button 
                                    className={`p-5 rounded-2xl border-2 border-b-4 text-center flex flex-col items-center justify-center gap-3 transition-all min-h-[100px] ${isUnitComplete ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-100 cursor-pointer' : 'bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600 opacity-70 cursor-not-allowed'}`}
                                    disabled={!isUnitComplete}
                                >
                                    <Medal size={36} className={isUnitComplete ? "text-yellow-500" : "text-gray-400"} />
                                    <div className="font-bold text-sm uppercase">{t.unitReview}</div>
                                    {isUnitComplete && <div className="px-4 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full shadow-sm">{t.start}</div>}
                                </button>
                            </div>
                        )}
                    </div>
                )})}
            </div>

            {/* --- DETAILED HISTORY ARCHIVE --- */}
            {savedLessons.length > 0 && (
                <div className="pt-8 border-t border-gray-200 dark:border-gray-700 animate-fade-in-up">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500">
                            <History size={20} />
                        </div>
                        <h2 className="text-xl font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">{t.archiveTitle}</h2>
                    </div>

                    <div className="bg-white dark:bg-dark-card rounded-3xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 font-bold uppercase text-xs border-b border-gray-100 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-4">Lesson / Date</th>
                                        <th className="px-6 py-4 text-center">{t.score}</th>
                                        <th className="px-6 py-4 text-center">{t.mistakes}</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {savedLessons.map((lesson) => {
                                        const mistakes = lesson.mistakeCount || 0;
                                        const xp = lesson.xpEarned || 0;
                                        const isPerfect = mistakes === 0 && xp > 0;
                                        const isFail = mistakes >= 3;

                                        return (
                                            <tr key={lesson.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                                        {lesson.plan.title}
                                                        {lesson.plan.context?.type === 'career_exam' && <span className="text-[9px] bg-purple-100 dark:bg-purple-900/30 text-purple-600 px-1.5 py-0.5 rounded">EXAM</span>}
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-0.5 font-mono">
                                                        {new Date(lesson.timestamp).toLocaleString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className={`font-black font-mono ${isPerfect ? 'text-yellow-500' : 'text-gray-600 dark:text-gray-300'}`}>
                                                        +{xp} XP
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {mistakes > 0 ? (
                                                        <div className="inline-flex items-center gap-1 text-red-500 font-bold bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md text-xs">
                                                            <XCircle size={12} /> {mistakes}
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-1 text-green-500 font-bold bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md text-xs">
                                                            <CheckCircle2 size={12} /> Perfect
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button 
                                                        onClick={() => onLoadSaved(lesson)}
                                                        className="px-4 py-2 bg-white dark:bg-dark-card border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-xs hover:border-brand hover:text-brand transition-all flex items-center gap-2 ml-auto shadow-sm"
                                                    >
                                                        <RotateCcw size={14} /> {t.replay}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Right Column: Gamification (Desktop) */}
        <div className="hidden lg:flex flex-col w-80 gap-6">
            
            {/* League Card */}
            <div className="bg-white dark:bg-dark-card rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
                <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-gray-800 dark:text-white uppercase tracking-wider text-sm">{t.league}</h3>
                     <Shield className="text-gray-400" size={20}/>
                </div>
                <div className={`p-4 rounded-xl ${leagueColorClass} flex items-center gap-4 mb-2`}>
                    <Shield size={32} className="fill-current opacity-80"/>
                    <div>
                        <div className="font-black text-xl uppercase">{currentTier}</div>
                        <div className="text-xs font-bold opacity-70">Top 20%</div>
                    </div>
                </div>
                <div className="text-xs text-center text-gray-400 font-bold mt-2">Next tier in 3 days</div>
            </div>

            {/* Daily Quests */}
            <div className="bg-white dark:bg-dark-card rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-gray-800 dark:text-white uppercase tracking-wider text-sm">{t.dailyQuests}</h3>
                     <Target className="text-gray-400" size={20}/>
                </div>
                <div className="space-y-4">
                    {quests.map((q) => (
                        <div key={q.id} className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${q.completed ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                                {q.completed ? <CheckCircle2 size={20}/> : <Zap size={20}/>}
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-bold text-gray-700 dark:text-gray-200">{q.description}</div>
                                <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${q.completed ? 'bg-green-500' : 'bg-brand'}`} 
                                        style={{ width: `${Math.min(100, (q.current / q.target) * 100)}%` }}
                                    />
                                </div>
                            </div>
                            <div className="text-xs font-bold text-yellow-500 flex flex-col items-center">
                                <span>+{q.rewardGems}</span>
                                <span className="text-[8px] text-gray-400">GEM</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    </div>
  );
};
