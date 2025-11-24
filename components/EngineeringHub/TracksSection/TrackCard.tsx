
import React from 'react';
import { Cpu } from 'lucide-react';

interface TrackCardProps {
    title: string;
    subtitle: string;
    progress: number;
    total: number;
    color: string;
}

export const TrackCard: React.FC<TrackCardProps> = ({ title, subtitle, progress, total, color }) => {
    return (
        <div className="min-w-[280px] h-[200px] bg-white dark:bg-dark-card rounded-3xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-between shadow-sm shrink-0 hover:border-brand transition-colors cursor-pointer relative overflow-hidden group">
            {/* Background Icon */}
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
                <Cpu size={100} />
            </div>

            <div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 shadow-lg text-white font-bold text-xs ${color === 'black' ? 'bg-black' : 'bg-green-500'}`}>
                    {title.slice(0, 2).toUpperCase()}
                </div>
                <h4 className="text-xl font-extrabold text-gray-800 dark:text-white">{title}</h4>
                <p className="text-xs text-gray-500 mt-1 font-medium">{subtitle}</p>
            </div>

            {/* Mini Progress Bar */}
            <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full ${color === 'black' ? 'bg-black dark:bg-white' : 'bg-green-500'}`} style={{ width: `${progress}%` }}></div>
                </div>
                <span>3/9</span>
            </div>
        </div>
    );
};
