
import React, { useState } from 'react';
import { GameContent } from '../../types';
import { Button } from '../Button';
import { Code2, Check, RotateCcw } from 'lucide-react';

interface FillInGameProps {
  content: GameContent;
  onComplete: () => void;
}

export const FillInGame: React.FC<FillInGameProps> = ({ content, onComplete }) => {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>(content.missingWords || []);

  // Split by __BLANK__
  const parts = content.codeSnippet?.split('__BLANK__') || [];
  // Calculate how many blanks we have. 
  // If split gives 2 parts, there is 1 blank. 3 parts = 2 blanks.
  const blankCount = parts.length - 1;
  
  const isComplete = selectedWords.length === blankCount;

  const handleSelectWord = (word: string) => {
    if (selectedWords.length >= blankCount) return;
    
    setSelectedWords([...selectedWords, word]);
    setAvailableWords(availableWords.filter(w => w !== word)); // Simple removal, assumes unique words for now or by index
  };

  const handleReset = () => {
    setSelectedWords([]);
    setAvailableWords(content.missingWords || []);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h3 className="text-2xl font-extrabold text-center mb-2 text-gray-800">{content.levelTitle}</h3>
      <p className="text-center text-gray-500 mb-8 flex items-center justify-center gap-2">
        <Code2 size={16} /> 
        补全缺失的 Python 代码
      </p>

      {/* Code Block */}
      <div className="bg-[#1e1e1e] rounded-2xl p-6 mb-8 font-mono text-gray-300 text-sm md:text-base overflow-x-auto shadow-2xl border-4 border-gray-800 relative">
        <div className="absolute top-4 right-4 flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"/>
            <div className="w-3 h-3 rounded-full bg-yellow-500"/>
            <div className="w-3 h-3 rounded-full bg-green-500"/>
        </div>
        <pre className="mt-4 leading-relaxed">
          {parts.map((part, index) => (
            <span key={index}>
              {part}
              {index < parts.length - 1 && (
                <span className={`inline-flex items-center justify-center px-3 py-1 mx-1 rounded min-w-[60px] h-[30px] align-middle border-b-2 transition-all ${
                  selectedWords[index] 
                    ? 'bg-brand/20 border-brand text-brand-light font-bold' 
                    : 'bg-gray-700 border-gray-500 animate-pulse'
                }`}>
                  {selectedWords[index] || '?'}
                </span>
              )}
            </span>
          ))}
        </pre>
      </div>

      {/* Word Bank */}
      {!isComplete ? (
        <div className="flex flex-wrap justify-center gap-3">
          {availableWords.map((word, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectWord(word)}
              className="bg-white border-2 border-gray-200 border-b-4 px-6 py-3 rounded-xl font-mono font-bold text-gray-700 hover:bg-gray-50 hover:border-brand/50 hover:text-brand active:translate-y-1 active:shadow-none transition-all shadow-sm"
            >
              {word}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 justify-center animate-fade-in-up">
          <Button variant="secondary" onClick={handleReset} className="flex items-center gap-2">
            <RotateCcw size={18} /> 重置
          </Button>
          <Button variant="primary" onClick={onComplete} className="flex items-center gap-2">
            <Check size={18} /> 提交检查
          </Button>
        </div>
      )}
    </div>
  );
};
