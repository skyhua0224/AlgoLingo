
import React, { useState, useEffect } from 'react';
import { Widget } from '../../../types';
import { BaseWidget } from '../BaseWidget';
import { MousePointerClick, Info, Terminal } from 'lucide-react';
import { MarkdownText } from '../../common/MarkdownText';

declare const Prism: any;

interface InteractiveCodeProps {
    widget: Widget;
    language: 'Chinese' | 'English';
}

const WIDGET_LOCALE = {
    Chinese: {
        tapPrompt: "点击代码行查看解释",
        lineInfo: "第 X 行", // We will replace X dynamically
        selectPrompt: "选择代码以查看逻辑。"
    },
    English: {
        tapPrompt: "Tap a line to explain it",
        lineInfo: "Line X",
        selectPrompt: "Select code to see logic."
    }
};

export const InteractiveCodeWidget: React.FC<InteractiveCodeProps> = ({ widget, language }) => {
  const content = widget.interactiveCode || widget.leetcode?.exampleCode;
  if (!content) return null;
  
  const { lines, language: codeLang, caption } = content;
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const safeLines = lines || [];
  const t = WIDGET_LOCALE[language];

  useEffect(() => {
    if (typeof Prism !== 'undefined') {
        Prism.highlightAll();
    }
  }, [codeLang, lines]);

  return (
    <BaseWidget>
        <div className="bg-[#1e1e1e] rounded-xl shadow-lg overflow-hidden border border-gray-700 relative group max-w-[calc(100vw-3rem)] md:max-w-full mx-auto">
            {/* Header */}
            <div className="bg-[#252526] px-3 py-2 flex items-center justify-between border-b border-gray-700">
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"/>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"/>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"/>
                </div>
                <span className="text-xs text-gray-400 font-mono">{codeLang}</span>
            </div>
            
            {/* Tap Prompt */}
            <div className="bg-blue-900/30 text-blue-200 px-3 py-1 text-xs border-b border-blue-900/50 flex items-center gap-2 justify-center">
                 <MousePointerClick size={12} />
                 <span className="font-bold uppercase tracking-wider">{t.tapPrompt}</span>
            </div>

            {/* Code Area */}
            <div className="overflow-x-auto relative z-0">
                {safeLines.map((line, idx) => (
                    <div 
                        key={idx}
                        onClick={() => setActiveLine(idx)}
                        className={`flex cursor-pointer transition-colors border-l-4 ${activeLine === idx ? 'bg-[#37373d] border-brand' : 'border-transparent hover:bg-[#2d2d2d] hover:border-gray-600'}`}
                    >
                        <div className="w-10 shrink-0 text-right text-gray-600 text-xs font-mono py-2 pr-3 select-none border-r border-gray-700 mr-3 bg-[#252526]">
                            {idx + 1}
                        </div>
                        <div className="py-2 font-mono text-sm text-gray-300 whitespace-pre pr-4">
                            <pre className={`language-${codeLang.toLowerCase()} !m-0 !p-0 !bg-transparent !text-sm`} style={{margin:0, padding:0}}>
                                <code dangerouslySetInnerHTML={{ 
                                    __html: typeof Prism !== 'undefined' 
                                        ? Prism.highlight(line.code, Prism.languages[codeLang.toLowerCase()] || Prism.languages.python, codeLang.toLowerCase())
                                        : line.code 
                                }} />
                            </pre>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Explanation Box */}
            <div className="bg-[#252526] p-4 border-t-4 border-brand-dark transition-all">
                 {activeLine !== null && safeLines[activeLine] ? (
                     <div className="animate-fade-in-up">
                         <div className="flex items-center gap-2 mb-2 text-brand-light font-bold text-xs uppercase tracking-wider">
                             <Info size={14} />
                             {t.lineInfo.replace('X', (activeLine + 1).toString())}
                         </div>
                         <div className="text-sm text-gray-200 leading-relaxed">
                            <MarkdownText content={safeLines[activeLine].explanation} />
                         </div>
                     </div>
                 ) : (
                     <div className="flex flex-col items-center justify-center text-gray-500 gap-1 py-2">
                        <Terminal size={20} />
                        <p className="text-xs italic">{t.selectPrompt}</p>
                     </div>
                 )}
            </div>
        </div>
        {caption && <p className="text-center text-xs text-gray-400 mt-2"><MarkdownText content={caption} /></p>}
    </BaseWidget>
  );
};
