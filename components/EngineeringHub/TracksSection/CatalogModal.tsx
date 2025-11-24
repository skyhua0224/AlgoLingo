
import React from 'react';

interface CatalogModalProps {
    onClose: () => void;
    language: 'Chinese' | 'English';
}

/**
 * CatalogModal (Placeholder)
 * 
 * Features:
 * - Tab 1: Official Featured Tracks (JSON list)
 * - Tab 2: Custom Generator (Input field + AI trigger)
 */
export const CatalogModal: React.FC<CatalogModalProps> = ({ onClose, language }) => {
    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-dark-card w-full max-w-2xl h-[600px] rounded-3xl shadow-2xl p-8 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">Close</button>
                <h2 className="text-2xl font-bold mb-4">Skill Catalog</h2>
                <p className="text-gray-500">Select a track or generate a custom one.</p>
                {/* TODO: Implement Catalog Tabs and Grid */}
            </div>
        </div>
    );
};
