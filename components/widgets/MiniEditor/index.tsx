
import React, { useState } from 'react';
import { Widget } from '../../../types';
import { BaseWidget } from '../BaseWidget';
import { Play, Check, AlertTriangle } from 'lucide-react';

export const MiniEditorWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
    if (!widget.miniEditor) return null;
    const { startingCode, validationRegex, taskDescription } = widget.miniEditor;
    const [code, setCode] = useState(startingCode);
    const [result, setResult] = useState<'idle' | 'success' | 'fail'>('idle');

    const handleRun = () => {
        if (!validationRegex) {
            setResult('success'); 
            return;
        }
        
        try {
            const regex = new RegExp(validationRegex, 'i');
            if (regex.test(code)) {
                setResult('success');
            } else {
                setResult('fail');
            }
        } catch (e) {
            setResult('fail');
        }
    };

    return (
        <BaseWidget>
            <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700 shadow-xl">
                <div className="bg-gray-800 px-4 py-2 text-xs text-gray-400 font-bold uppercase flex justify-between items-center">
                    <span>Mini Editor</span>
                    <span>{widget.miniEditor.language}</span>
                </div>
                
                <div className="p-4 bg-[#1e1e1e]">
                    <div className="text-gray-400 text-xs mb-2 font-mono">// {taskDescription}</div>
                    <textarea 
                        className="w-full h-48 bg-transparent text-gray-300 font-mono text-sm outline-none resize-none"
                        value={code}
                        onChange={(e) => { setCode(e.target.value); setResult('idle'); }}
                        spellCheck={false}
                    />
                </div>

                <div className="bg-gray-800 p-3 flex justify-between items-center">
                    <div className="text-xs">
                        {result === 'success' && <span className="text-green-400 flex items-center gap-1"><Check size={14}/> Passed</span>}
                        {result === 'fail' && <span className="text-red-400 flex items-center gap-1"><AlertTriangle size={14}/> Logic Missing</span>}
                    </div>
                    <button 
                        onClick={handleRun}
                        className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                        <Play size={14}/> Run
                    </button>
                </div>
            </div>
        </BaseWidget>
    );
};
