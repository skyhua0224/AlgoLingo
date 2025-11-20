
import React, { useState, useEffect } from 'react';
import { GameContent } from '../../types';

interface MatchingGameProps {
  content: GameContent;
  onComplete: () => void;
}

// This component is mainly for legacy purposes or if we introduce a matching level type.
// Currently, our Gemini service doesn't generate 'matching' type for the 6 levels, 
// but we'll keep it functional in case we add a 'Vocabulary' level later.

export const MatchingGame: React.FC<MatchingGameProps> = ({ content, onComplete }) => {
    // Placeholder simple implementation in case it's used
    return (
        <div className="text-center p-8">
            <h2 className="text-2xl font-bold mb-4">暂未开放</h2>
            <p>此模式正在构建中...</p>
            <button onClick={onComplete} className="mt-4 px-4 py-2 bg-brand text-white rounded">Skip</button>
        </div>
    )
};
