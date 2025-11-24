
import React from 'react';
import { Lock, Check, Sparkles, FastForward, Crown, Layout, Trophy } from 'lucide-react';

// --- LEVEL NODE COMPONENT ---
interface LevelNodeProps {
    id: string | number;
    label: string;
    subtitle?: string;
    icon: React.ReactNode;
    status: 'locked' | 'active' | 'completed';
    isCurrent?: boolean;
    onClick: () => void;
    showSkip?: boolean;
    skipLocked?: boolean;
    skipLabel?: string;
    startLabel?: string;
    completedLabel?: string;
    skipLockedLabel?: string;
}

export const LevelNode: React.FC<LevelNodeProps> = ({
    id, label, subtitle, icon, status, isCurrent, onClick, 
    showSkip, skipLocked, skipLabel, startLabel, completedLabel, skipLockedLabel
}) => {
    let borderColor = isCurrent ? 'border-brand' : 'border-gray-200 dark:border-gray-700';
    let bgColor = 'bg-white dark:bg-dark-card';
    let iconColor = 'text-gray-400 dark:text-gray-500';
    
    if (status === 'completed') {
        borderColor = 'border-yellow-500'; // Gold for completed
        bgColor = 'bg-yellow-50 dark:bg-yellow-900/10';
        iconColor = 'text-yellow-500';
    } else if (isCurrent) {
        borderColor = 'border-brand';
        bgColor = 'bg-white dark:bg-dark-card';
        iconColor = 'text-brand';
    } else if (showSkip) {
        borderColor = 'border-orange-400';
        bgColor = 'bg-orange-50 dark:bg-orange-900/10';
        iconColor = 'text-orange-500';
    } else if (status === 'locked') {
        bgColor = 'bg-gray-100 dark:bg-gray-800';
    }

    return (
        <button
            onClick={onClick}
            disabled={status === 'locked' && !showSkip}
            className={`
                relative p-6 md:p-8 rounded-3xl border-2 border-b-4 transition-all duration-200 text-left flex flex-col h-full min-h-[180px] justify-between
                ${borderColor} ${bgColor}
                ${(status !== 'locked' || showSkip) ? 'hover:-translate-y-1 hover:shadow-md active:translate-y-0 active:shadow-none active:border-b-2 cursor-pointer' : 'opacity-80 cursor-not-allowed'}
                ${isCurrent ? 'ring-4 ring-brand/20 dark:ring-brand/10' : ''}
                ${status === 'completed' ? 'shadow-sm' : ''}
            `}
        >
            <div className="flex justify-between items-start mb-4 w-full">
                 <div className={`p-3 md:p-4 rounded-2xl ${status === 'completed' ? 'bg-yellow-100 dark:bg-yellow-900/30' : (isCurrent ? 'bg-brand-bg dark:bg-brand/20' : 'bg-gray-200 dark:bg-gray-700')} ${iconColor}`}>
                     {status === 'completed' ? <Sparkles size={24} className="text-yellow-500" /> : 
                      showSkip ? <FastForward size={24} /> :
                      (status === 'locked' ? <Lock size={24} className="text-gray-400" /> : icon)
                     }
                 </div>
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{subtitle}</span>
            </div>
            
            <div className="mt-2">
                <h3 className={`text-lg font-extrabold mb-2 ${status === 'locked' && !showSkip ? 'text-gray-400' : 'text-gray-800 dark:text-white'}`}>
                    {label}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                    {isCurrent && (
                        <span className="inline-block bg-brand text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide animate-pulse">
                            {startLabel || "Start"}
                        </span>
                    )}
                    {showSkip && (
                        <span className="inline-block bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                            {skipLabel || "Skip"}
                        </span>
                    )}
                    {skipLocked && (
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{skipLockedLabel || "Locked"}</span>
                    )}
                    {status === 'completed' && (
                        <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400 uppercase">{completedLabel || "Done"}</span>
                    )}
                </div>
            </div>
        </button>
    );
};

// --- MASTERY PLATE COMPONENT ---
interface MasteryPlateProps {
    title: string;
    onLeetCodeClick: () => void;
    onMasteryLoopClick: () => void;
    leetcodeLabel: string;
    masteryLoopLabel: string;
}

export const MasteryPlate: React.FC<MasteryPlateProps> = ({ title, onLeetCodeClick, onMasteryLoopClick, leetcodeLabel, masteryLoopLabel }) => {
    return (
        <div className="col-span-1 md:col-span-2 lg:col-span-3 p-1 rounded-3xl bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 shadow-xl animate-pulse-soft w-full">
             <div className="bg-white dark:bg-dark-card rounded-[20px] p-8 h-full flex flex-col items-center justify-center text-center gap-6">
                 <div className="flex items-center gap-3 mb-2">
                     <Crown size={40} className="text-yellow-500 fill-yellow-500"/>
                     <h3 className="text-3xl font-extrabold text-gray-800 dark:text-white">{title}</h3>
                 </div>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full px-4">
                     <button 
                         onClick={onLeetCodeClick}
                         className="flex flex-col items-center p-6 rounded-2xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-brand hover:bg-brand-bg dark:hover:bg-brand/10 transition-all group"
                     >
                         <Layout size={32} className="text-gray-500 group-hover:text-brand mb-3"/>
                         <span className="font-bold text-base text-gray-700 dark:text-gray-200">{leetcodeLabel}</span>
                     </button>

                     <button 
                         onClick={onMasteryLoopClick}
                         className="flex flex-col items-center p-6 rounded-2xl bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-700 hover:border-yellow-500 hover:bg-yellow-100 transition-all group"
                     >
                         <Trophy size={32} className="text-yellow-600 dark:text-yellow-500 mb-3"/>
                         <span className="font-bold text-base text-yellow-800 dark:text-yellow-400">{masteryLoopLabel}</span>
                     </button>
                 </div>
             </div>
        </div>
    );
};
