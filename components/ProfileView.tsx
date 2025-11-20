
import React, { useState } from 'react';
import { UserStats, UserPreferences } from '../types';
import { Flame, Trophy, Zap, Target, Calendar, TrendingUp, Clock, Edit2, Check } from 'lucide-react';

interface ProfileViewProps {
    stats: UserStats;
    language: 'Chinese' | 'English';
    preferences: UserPreferences;
    onUpdateName: (name: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ stats, language, preferences, onUpdateName }) => {
    const isZh = language === 'Chinese';
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(preferences.userName);

    // Calculate Dynamic Memory Curve
    // Logic: Each day without activity drops memory by 10%. Each mistake today drops it by 2%.
    const calculateMemoryCurve = () => {
        const points = [];
        const today = new Date();
        
        for (let i = 9; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const activity = stats.history[dateStr] || 0;
            
            // Basic Heuristic
            let retention = 100;
            if (activity === 0) {
                // Decay
                 const daysSinceLast = Math.min(i + 1, 10); 
                 retention = Math.max(20, 100 - (daysSinceLast * 8));
            } else {
                 // Boost
                 retention = Math.min(100, 80 + (activity / 10));
            }
            points.push(Math.round(retention));
        }
        return points;
    };

    const memoryPoints = calculateMemoryCurve();
    
    // Generate last 14 days for calendar
    const days = Array.from({length: 14}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        return d.toISOString().split('T')[0];
    });

    const handleSaveName = () => {
        if (tempName.trim()) {
            onUpdateName(tempName);
            setIsEditing(false);
        }
    }

    const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

    return (
        <div className="space-y-6">
            {/* Profile Header */}
            <div className="bg-white dark:bg-dark-card rounded-3xl border-2 border-gray-200 dark:border-gray-700 p-6 flex items-center gap-6">
                <div className="w-24 h-24 bg-brand text-white rounded-full flex items-center justify-center text-3xl font-bold border-4 border-brand-bg dark:border-brand/20">
                    {getInitials(preferences.userName)}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                         {isEditing ? (
                             <div className="flex items-center gap-2">
                                 <input 
                                    className="text-xl font-extrabold text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 outline-none"
                                    value={tempName}
                                    onChange={e => setTempName(e.target.value)}
                                    autoFocus
                                 />
                                 <button onClick={handleSaveName} className="p-2 bg-brand text-white rounded-full hover:bg-brand-dark"><Check size={16}/></button>
                             </div>
                         ) : (
                             <>
                                <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white">{preferences.userName}</h2>
                                <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-brand"><Edit2 size={16}/></button>
                             </>
                         )}
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">{isZh ? '高级算法工程师' : 'Senior Algorithm Engineer'}</p>
                    <div className="flex gap-4 mt-3">
                        <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-sm font-bold">
                            <Clock size={16} /> 
                            {isZh ? '加入于 2024' : 'Joined 2024'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard 
                    icon={<Flame size={24} className="text-orange-500" />} 
                    value={stats.streak} 
                    label={isZh ? "连胜天数" : "Day Streak"} 
                    borderColor="border-orange-200 dark:border-orange-900/30"
                />
                <StatCard 
                    icon={<Zap size={24} className="text-yellow-500" />} 
                    value={stats.xp} 
                    label={isZh ? "总经验值" : "Total XP"} 
                    borderColor="border-yellow-200 dark:border-yellow-900/30"
                />
                 <StatCard 
                    icon={<Trophy size={24} className="text-purple-500" />} 
                    value={stats.gems} 
                    label={isZh ? "宝石数" : "Gems"} 
                    borderColor="border-purple-200 dark:border-purple-900/30"
                />
            </div>

            {/* Activity History */}
            <div className="bg-white dark:bg-dark-card rounded-3xl border-2 border-gray-200 dark:border-gray-700 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-extrabold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                        <Calendar className="text-brand" />
                        {isZh ? "打卡记录 (真实数据)" : "Activity Log (Real Data)"}
                    </h3>
                </div>
                <div className="flex justify-between gap-1">
                    {days.map(day => {
                        const xp = stats.history[day] || 0;
                        let bgClass = "bg-gray-100 dark:bg-gray-800";
                        if (xp > 0) bgClass = "bg-green-200 dark:bg-green-900/50";
                        if (xp > 50) bgClass = "bg-green-400 dark:bg-green-700";
                        if (xp > 100) bgClass = "bg-green-600 dark:bg-green-500";

                        return (
                            <div key={day} className="flex flex-col items-center gap-1 flex-1">
                                <div className={`w-full aspect-square rounded-md ${bgClass}`} title={`${day}: ${xp} XP`}></div>
                                <span className="text-[10px] text-gray-400 dark:text-gray-500">{day.split('-')[2]}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Memory Curve Visualization */}
            <div className="bg-white dark:bg-dark-card rounded-3xl border-2 border-gray-200 dark:border-gray-700 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-extrabold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                        <TrendingUp className="text-brand" />
                        {isZh ? "记忆保持率" : "Retention Rate"}
                    </h3>
                    <span className="bg-brand-bg dark:bg-brand/20 text-brand px-3 py-1 rounded-full text-xs font-bold">Based on Activity</span>
                </div>
                
                <div className="h-48 w-full flex items-end justify-between gap-2 px-4">
                    {memoryPoints.map((val, idx) => (
                        <div key={idx} className="w-full flex flex-col justify-end group relative">
                             <div 
                                className="w-full bg-brand rounded-t-lg transition-all hover:bg-brand-light"
                                style={{ height: `${val}%`, opacity: 0.3 + (val/200) }}
                             ></div>
                             <div className="h-1 bg-gray-200 dark:bg-gray-700 mt-1 rounded-full w-full"></div>
                             
                             {/* Tooltip */}
                             <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                {val}%
                             </div>
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex justify-between text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">
                    <span>{isZh ? "10天前" : "10 Days Ago"}</span>
                    <span>{isZh ? "今天" : "Today"}</span>
                </div>
            </div>
        </div>
    );
}

const StatCard = ({ icon, value, label, borderColor }: any) => (
    <div className={`bg-white dark:bg-dark-card p-4 rounded-2xl border-2 ${borderColor} shadow-sm flex flex-col items-center justify-center text-center`}>
        <div className="mb-2">{icon}</div>
        <div className="font-extrabold text-xl text-gray-800 dark:text-white">{value}</div>
        <div className="text-xs text-gray-400 font-bold uppercase">{label}</div>
    </div>
);
