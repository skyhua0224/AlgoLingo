
import React, { useState, useEffect } from 'react';
import { GameContent } from '../../types';
import { Button } from '../Button';
import { ArrowUp, ArrowDown, GripVertical, Play } from 'lucide-react';

interface ParsonsGameProps {
  content: GameContent;
  onComplete: () => void;
}

export const ParsonsGame: React.FC<ParsonsGameProps> = ({ content, onComplete }) => {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    if (content.scrambledLines) {
      setLines([...content.scrambledLines]);
    }
  }, [content]);

  const moveLine = (index: number, direction: 'up' | 'down') => {
    const newLines = [...lines];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex >= 0 && swapIndex < newLines.length) {
      [newLines[index], newLines[swapIndex]] = [newLines[swapIndex], newLines[index]];
      setLines(newLines);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h3 className="text-2xl font-extrabold text-center mb-2 text-gray-800">{content.levelTitle}</h3>
      <p className="text-center text-gray-500 mb-8">拖拽或点击箭头重新排序代码逻辑</p>

      <div className="space-y-3 mb-8 bg-gray-100 p-6 rounded-2xl border-inner">
        {lines.map((line, index) => (
          <div key={index} className="flex items-center gap-3 group animate-fade-in-left" style={{ animationDelay: `${index * 50}ms` }}>
            {/* Line Number (Fake) */}
            <span className="text-gray-400 font-mono text-xs w-4 text-right">{index + 1}</span>
            
            <div className="flex-1 bg-white border-2 border-gray-200 border-b-4 p-4 rounded-xl font-mono text-sm md:text-base text-gray-800 shadow-sm group-hover:border-brand/50 transition-all flex items-center gap-3">
              <GripVertical className="text-gray-300 cursor-grab" size={16} />
              <span className="flex-1">{line}</span>
            </div>

            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={() => moveLine(index, 'up')}
                    disabled={index === 0}
                    className="p-2 bg-white rounded-lg shadow border hover:bg-gray-50 disabled:opacity-0 text-gray-600"
                >
                    <ArrowUp size={14} />
                </button>
                <button 
                    onClick={() => moveLine(index, 'down')}
                    disabled={index === lines.length - 1}
                    className="p-2 bg-white rounded-lg shadow border hover:bg-gray-50 disabled:opacity-0 text-gray-600"
                >
                    <ArrowDown size={14} />
                </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <Button variant="primary" onClick={onComplete} className="w-full max-w-xs flex items-center justify-center gap-2">
            <Play size={18} fill="currentColor" />
            运行代码逻辑
        </Button>
      </div>
    </div>
  );
};
