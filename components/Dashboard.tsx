
import React, { useState } from 'react';
import { Problem, UserStats } from '../types';
import { PROBLEM_CATEGORIES, PROBLEM_MAP } from '../constants';
import { Flame, Trophy, Search, Zap, ChevronDown, ChevronRight, Medal } from 'lucide-react';

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
        search: "搜索..."
    },
    English: {
        unitReview: "Gold Unit Challenge",
        mastered: "Mastered",
        start: "Start",
        search: "Search..."
    }
};

export const Dashboard: React.FC<DashboardProps> = ({ progressMap, stats, onSelectProblem, language }) => {
  const [expandedUnit, setExpandedUnit] = useState<string | null>("unit_hashing");
  const t = LOCALE[language];

  return (
    <div className="w-full flex flex-col gap-6">
        {/* Stats Bar */}
        <div className="bg-white dark:bg-dark-card rounded-2xl p-4 flex justify-between items-center shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-brand text-white rounded-full flex items-center justify-center font-bold">SH</div>
                <div className="flex gap-3">
                    <div className="flex items-center gap-1 text-orange-500 font-bold"><Flame size={16}/> {stats.streak}</div>
                    <div className="flex items-center gap-1 text-yellow-500 font-bold"><Trophy size={16}/> {stats.xp}</div>
                </div>
            </div>
        </div>

        {/* Units List */}
        <div className="space-y-6">
            {PROBLEM_CATEGORIES.map((unit) => {
                // Calculate Unit Mastery
                const totalProblems = unit.problems.length;
                const completedProblems = unit.problems.filter(pid => (progressMap[pid] || 0) >= 6).length;
                const isUnitComplete = totalProblems > 0 && totalProblems === completedProblems;
                
                const title = language === 'Chinese' ? unit.title_zh : unit.title;
                const description = language === 'Chinese' ? unit.description_zh : unit.description;

                return (
                <div key={unit.id} className="bg-white dark:bg-dark-card rounded-3xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
                    <button 
                        onClick={() => setExpandedUnit(expandedUnit === unit.id ? null : unit.id)}
                        className={`w-full p-6 flex items-center justify-between transition-colors duration-300 ${expandedUnit === unit.id ? 'bg-brand text-white' : 'bg-white dark:bg-dark-card text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                        <div className="text-left">
                            <h2 className="text-xl font-extrabold uppercase tracking-tight">{title}</h2>
                            <p className={`text-sm mt-1 ${expandedUnit === unit.id ? 'text-brand-bg' : 'text-gray-500 dark:text-gray-400'}`}>{description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {isUnitComplete && <Medal size={24} className="text-yellow-400 fill-current"/>}
                            {expandedUnit === unit.id ? <ChevronDown size={24}/> : <ChevronRight size={24}/>}
                        </div>
                    </button>

                    {expandedUnit === unit.id && (
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-gray-50 dark:bg-dark-bg animate-fade-in-down">
                            {unit.problems.map(pid => {
                                const name = PROBLEM_MAP[pid];
                                const level = progressMap[pid] || 0;
                                const mastered = level >= 6;
                                if (!name) return null;

                                return (
                                    <button 
                                        key={pid}
                                        onClick={() => onSelectProblem(pid, name, level)}
                                        className={`p-4 rounded-2xl border-2 text-left transition-all active:translate-y-1 hover:shadow-md ${level > 0 ? 'bg-white dark:bg-dark-card border-brand' : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                                    >
                                        <div className="flex justify-between mb-2">
                                            <span className="text-xs font-mono text-gray-400">{pid}</span>
                                            {mastered && <Trophy size={14} className="text-yellow-500"/>}
                                        </div>
                                        <div className="font-bold text-gray-800 dark:text-gray-200 text-sm">{name}</div>
                                        {level > 0 && (
                                            <div className="mt-2 h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-brand" style={{ width: `${(level/6)*100}%`}}></div>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                            
                            {/* Golden Review Card */}
                            <button 
                                className={`p-4 rounded-2xl border-2 text-center flex flex-col items-center justify-center gap-2 transition-all ${isUnitComplete ? 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-400 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 cursor-pointer' : 'bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600 opacity-70 cursor-not-allowed'}`}
                                disabled={!isUnitComplete}
                            >
                                <Medal size={32} className={isUnitComplete ? "text-yellow-500" : "text-gray-400"} />
                                <div className="font-bold text-sm uppercase">{t.unitReview}</div>
                                {isUnitComplete && <div className="px-3 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full">{t.start}</div>}
                            </button>
                        </div>
                    )}
                </div>
            )})}
        </div>
    </div>
  );
};