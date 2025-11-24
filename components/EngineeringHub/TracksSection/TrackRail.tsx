
import React from 'react';
import { TrackCard } from './TrackCard';
import { Plus } from 'lucide-react';

interface TrackRailProps {
    onAddTrack: () => void;
    language: 'Chinese' | 'English';
}

export const TrackRail: React.FC<TrackRailProps> = ({ onAddTrack, language }) => {
    const isZh = language === 'Chinese';

    // Mock Data
    const tracks = [
        { id: '1', title: 'Unity 3D', subtitle: 'Game Dev Essentials', progress: 33, total: 100, color: 'black' },
        { id: '2', title: 'Spring Boot', subtitle: 'Backend Architecture', progress: 0, total: 100, color: 'green' }
    ];

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {/* Add Button Card */}
            <button 
                onClick={onAddTrack}
                className="min-w-[160px] h-[200px] rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-brand hover:border-brand hover:bg-brand-bg/5 transition-all group shrink-0"
            >
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-brand group-hover:text-white flex items-center justify-center transition-colors">
                    <Plus size={24} />
                </div>
                <span className="font-bold text-sm">{isZh ? "添加路径" : "Add Track"}</span>
            </button>

            {/* Track Cards */}
            {tracks.map(track => (
                <TrackCard key={track.id} {...track} />
            ))}
        </div>
    );
};
