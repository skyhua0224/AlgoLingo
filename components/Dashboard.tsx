
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
    <div className="w-full max-w-5xl mx-auto px-6 md:px-12 py-8 flex flex-col gap-8">
        {/* Stats Bar */}
        <div className="bg-white dark:bg-dark-card rounded-2xl p-6 flex justify-between items-center shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-brand text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md">SH</div>
                <div className="flex gap-6">
                    <div className="flex items-center gap-2 text-orange-500 font-bold text-lg"><Flame size={20} className="fill-current"/> {stats.streak}</div>
                    <div className="flex items-center gap-2 text-yellow-500 font-bold text-lg"><Trophy size={20} className="fill-current"/> {stats.xp}</div>
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
  );
};
