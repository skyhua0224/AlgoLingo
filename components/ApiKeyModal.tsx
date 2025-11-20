import React, { useState } from 'react';
import { Button } from './Button';
import { Key } from 'lucide-react';

interface ApiKeyModalProps {
  onSave: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave }) => {
  const [key, setKey] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex justify-center mb-6">
            <div className="p-4 bg-brand-bg rounded-full">
                <Key className="w-8 h-8 text-brand" />
            </div>
        </div>
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">Unlock AlgoLingo</h2>
        <p className="text-gray-500 text-center mb-6">
          Enter your Gemini API Key to start your daily training session.
        </p>
        
        <input
          type="password"
          placeholder="Paste API Key here..."
          className="w-full p-4 border-2 border-gray-200 rounded-xl mb-6 focus:outline-none focus:border-brand font-mono text-sm"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        
        <Button 
            variant="primary" 
            className="w-full" 
            onClick={() => key && onSave(key)}
        >
            Start Coding
        </Button>
        
        <p className="mt-4 text-xs text-center text-gray-400">
            Your key is stored locally in memory only.
        </p>
      </div>
    </div>
  );
};
