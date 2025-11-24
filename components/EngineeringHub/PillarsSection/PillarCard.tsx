
import React from 'react';

interface PillarCardProps {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    colorClass: string; // bg/text colors
    accentColor: string; // progress bar color
    progress: number;
    tags: string[];
}

export const PillarCard: React.FC<PillarCardProps> = ({ title, subtitle, icon, colorClass, accentColor, progress, tags }) => {
    return (
        <div className={`border p-6 rounded-3xl relative overflow-hidden group cursor-pointer hover:shadow-md transition-all ${colorClass}`}>
            {/* Icon Badge */}
            <div className="absolute top-4 right-4 p-3 bg-white dark:bg-dark-card rounded-2xl shadow-sm opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
                {icon}
            </div>

            <div className="mt-8">
                <div className="text-xs font-bold opacity-60 uppercase tracking-wider mb-1">{subtitle}</div>
                <h3 className="text-2xl font-extrabold mb-6">{title}</h3>
                
                <div className="flex gap-2 flex-wrap mb-8">
                    {tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-white/50 dark:bg-black/20 rounded-md text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm">
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Progress Bar */}
                <div className="relative">
                    <div className="h-2 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full ${accentColor} transition-all duration-1000`} style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="mt-2 text-xs font-bold text-right opacity-60">{progress}% Complete</div>
                </div>
            </div>
        </div>
    );
};
