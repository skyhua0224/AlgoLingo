import React, { useState } from 'react';
import { Problem, UserStats, DailyQuest } from '../types';
import { PROBLEM_CATEGORIES, PROBLEM_MAP } from '../constants';
import { Flame, Trophy, Search, Zap, ChevronDown, ChevronRight, Medal, Shield, Target, CheckCircle2 } from 'lucide-react';

interface DashboardProps {
  progressMap: Record<string, number>; 
  stats: UserStats;
  onSelectProblem: (problemId: string, problemName: string, currentLevel: number) => void;
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
        viewAll: "查看全部"
    },
    English: {
        unitReview: "Gold Unit Challenge",
        mastered: "Mastered",
        start: "Start",
        search: "Search...",
        dailyQuests: "Daily Quests",
        league: "League",
        viewAll: "View All"
    }
};

// Mock Quests if none exist (Fallback)
const DEFAULT_QUESTS: DailyQuest[] = [
    { id: 'q1', description: 'Complete 1 Lesson', target: 1, current: 0, rewardGems: 10, completed: false },
    { id: 'q2', description: 'Get a Perfect Score', target: 1, current: 0, rewardGems: 20, completed: false },
    { id: 'q3', description: 'Review 5 Mistakes', target: 5, current: 0, rewardGems: 15, completed: false }
];

export const Dashboard: React.FC<DashboardProps> = ({ progressMap, stats, onSelectProblem, language }) => {
  const [expandedUnit, setExpandedUnit] = useState<string | null>("unit_hashing");
  const t = LOCALE[language];

  const quests = (stats.quests && stats.quests.length > 0) ? stats.quests : DEFAULT_QUESTS;
  const currentTier = stats.league?.currentTier || 'Bronze';
  
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
                                    const name = PROBLEM_MAP[pid];
                                    const level = progressMap[pid] || 0;
                                    const mastered = level >= 6;
                                    if (!name) return null;

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