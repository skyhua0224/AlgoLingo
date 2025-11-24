
import React, { useState } from 'react';
import { TrackRail } from './TrackRail';
import { CatalogModal } from './CatalogModal';

interface TracksSectionProps {
    language: 'Chinese' | 'English';
}

export const TracksSection: React.FC<TracksSectionProps> = ({ language }) => {
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);
    const isZh = language === 'Chinese';

    return (
        <div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 pl-2 flex items-center gap-2">
                {isZh ? "动态专精" : "Specialization Tracks"}
                <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1 ml-2"></div>
            </h3>

            <TrackRail 
                onAddTrack={() => setIsCatalogOpen(true)} 
                language={language}
            />

            {/* Catalog Modal */}
            {isCatalogOpen && (
                <CatalogModal 
                    onClose={() => setIsCatalogOpen(false)} 
                    language={language} 
                />
            )}
        </div>
    );
};
