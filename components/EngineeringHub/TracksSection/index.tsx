
import React, { useState, useEffect } from 'react';
import { TrackRail } from './TrackRail';
import { CatalogModal } from './CatalogModal';
import { CreateTrackModal } from './CreateTrackModal';
import { SkillTrack } from '../../../types/engineering';
import { Search } from 'lucide-react';

interface TracksSectionProps {
    language: 'Chinese' | 'English';
    onSelectTrack?: (track: SkillTrack) => void;
}

export const TracksSection: React.FC<TracksSectionProps> = ({ language, onSelectTrack }) => {
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [myTracks, setMyTracks] = useState<SkillTrack[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const isZh = language === 'Chinese';

    // Load tracks from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('algolingo_my_tracks');
        if (saved) {
            try {
                setMyTracks(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load tracks", e);
            }
        }
    }, []);

    const saveTracks = (newTracks: SkillTrack[]) => {
        setMyTracks(newTracks);
        localStorage.setItem('algolingo_my_tracks', JSON.stringify(newTracks));
    };

    const addTrack = (track: SkillTrack) => {
        // Dedup by ID just in case
        if (myTracks.find(t => t.id === track.id)) return;
        saveTracks([track, ...myTracks]);
    };

    // Helper to safely get string for search
    const getStr = (content: any) => {
        if (typeof content === 'string') return content;
        if (content && typeof content === 'object') return content.en || content.zh || '';
        return '';
    };

    const filteredTracks = myTracks.filter(t => 
        getStr(t.title).toLowerCase().includes(searchQuery.toLowerCase()) || 
        getStr(t.description).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-4 pl-2">
                <div className="flex items-center gap-2">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        {isZh ? "动态专精" : "Specialization Tracks"}
                        <div className="h-px w-12 bg-gray-200 dark:bg-gray-800 ml-2"></div>
                    </h3>
                </div>
                
                <div className="relative hidden md:block">
                    <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                    <input 
                        type="text"
                        placeholder={isZh ? "搜索你的路径..." : "Search your tracks..."}
                        className="pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/20 w-48 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <TrackRail 
                tracks={filteredTracks}
                onCreate={() => setIsCreateOpen(true)}
                onOpenCatalog={() => setIsCatalogOpen(true)}
                language={language}
                onSelect={onSelectTrack}
            />

            {isCatalogOpen && (
                <CatalogModal 
                    onClose={() => setIsCatalogOpen(false)} 
                    language={language} 
                    onAddTrack={(track) => { addTrack(track); setIsCatalogOpen(false); }}
                />
            )}

            {isCreateOpen && (
                <CreateTrackModal 
                    onClose={() => setIsCreateOpen(false)}
                    onCreated={(track) => { addTrack(track); }}
                    language={language}
                />
            )}
        </div>
    );
};
