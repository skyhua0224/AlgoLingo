
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
        lineInfo: "第 X 行", 
        selectPrompt: "点击代码行以查看逻辑解释。"
    },
    English: {
        tapPrompt: "Tap a line to explain it",
        lineInfo: "Line X",
        selectPrompt: "Select code to see logic."
    }
};

export const InteractiveCodeWidget: React.FC<InteractiveCodeProps> = ({ widget, language }) => {
  // Robust retrieval of content content
  const content = widget.interactiveCode || widget.leetcode?.exampleCode;
  
  if (!content) return null;
  
  // Polyfill for robust rendering: if 'lines' is missing but 'code' text exists (AI artifact)
  let safeLines = content.lines || [];
  if (!safeLines.length && (content as any).code && typeof (content as any).code === 'string') {
      safeLines = (content as any).code.split('\n').map((l: string) => ({ code: l, explanation: '' }));
  }

  const { language: codeLang, caption } = content;
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const t = WIDGET_LOCALE[language];

  // Helper to clean code for display (Removes comments, keeps omissions)
  const cleanDisplayCode = (raw: string) => {
      if (!raw) return "";
      // Keep omissions (e.g. ..., // ..., # ...)
      if (/^\s*(\/\/|#)?\s*\.{3,}/.test(raw)) return raw;
      // Strip comments (hash or double-slash) preceded by space or start of line
      return raw.replace(/(^|\s+)(\/\/|#).*$/, '$1').trimEnd();
  };

  // Pre-process lines: Identify empty lines as "Spacers"
  const displayedLines = safeLines.map(line => {
      const cleaned = cleanDisplayCode(line.code);
      // Identify if it was originally intended as a spacer (empty line) or became empty
      // We explicitly check for emptiness to mark as spacer.
      const isSpacer = (!line.code || line.code.trim().length === 0) || (!cleaned || cleaned.trim().length === 0);
      
      return {
          ...line,
          code: isSpacer ? '' : cleaned, 
          isSpacer: isSpacer,
          // We keep the line in the array to maintain line numbering, but render it differently
      };
  });

  useEffect(() => {
    if (typeof Prism !== 'undefined') {
        Prism.highlightAll();
    }
  }, [codeLang, displayedLines]);

  // If absolutely no lines, render nothing to avoid crash
  if (!displayedLines.length) return null;

  return (
    <BaseWidget>
        <div className="bg-[#1e1e1e] rounded-xl shadow-lg overflow-hidden border-2 border-gray-700 relative group max-w-[calc(100vw-3rem)] md:max-w-full mx-auto text-gray-200">
            {/* Header */}
            <div className="bg-[#252526] px-3 py-2 flex items-center justify-between border-b border-gray-700">
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"/>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"/>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"/>
                </div>
                <span className="text-xs text-gray-400 font-mono font-bold uppercase">{codeLang}</span>
            </div>
            
            {/* Tap Prompt */}
            <div className="bg-blue-900/40 text-blue-200 px-3 py-1.5 text-xs border-b border-blue-900/50 flex items-center gap-2 justify-center">
                 <MousePointerClick size={12} />
                 <span className="font-bold uppercase tracking-wider">{t.tapPrompt}</span>
            </div>

            {/* Code Area - Enforce Dark Mode for contrast with Prism Tomorrow Theme */}
            <div className="overflow-x-auto relative z-0 bg-[#1e1e1e] py-2">
                {displayedLines.map((line, idx) => {
                    const isActive = !line.isSpacer && activeLine === idx;
                    
                    return (
                        <div 
                            key={idx}
                            onClick={() => !line.isSpacer && setActiveLine(idx)}
                            className={`flex transition-colors border-l-4 ${
                                line.isSpacer 
                                ? 'border-transparent cursor-default' 
                                : (isActive ? 'bg-[#37373d] border-brand' : 'border-transparent hover:bg-[#2d2d2d] hover:border-gray-600 cursor-pointer')
                            }`}
                        >
                            {/* Line Number */}
                            <div className={`w-10 shrink-0 text-right text-xs font-mono py-1 pr-3 select-none mr-3 ${line.isSpacer ? 'text-gray-700' : 'text-gray-500'}`}>
                                {idx + 1}
                            </div>
                            
                            {/* Code Content */}
                            <div className="py-1 font-mono text-sm text-gray-300 whitespace-pre pr-4 min-h-[1.5em] w-full">
                                <pre className={`language-${codeLang.toLowerCase()} !m-0 !p-0 !bg-transparent !text-sm !text-inherit`} style={{margin:0, padding:0}}>
                                    <code dangerouslySetInnerHTML={{ 
                                        __html: line.isSpacer 
                                            ? ' ' // Just a space to keep height
                                            : (typeof Prism !== 'undefined' 
                                                ? Prism.highlight(line.code, Prism.languages[codeLang.toLowerCase()] || Prism.languages.python, codeLang.toLowerCase())
                                                : line.code)
                                    }} />
                                </pre>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* Explanation Box - FORCED TEXT-WHITE for contrast */}
            <div className="bg-[#252526] p-4 border-t-4 border-brand-dark transition-all min-h-[80px]">
                 {activeLine !== null && displayedLines[activeLine] && !displayedLines[activeLine].isSpacer ? (
                     <div className="animate-fade-in-up">
                         <div className="flex items-center gap-2 mb-2 text-brand-light font-bold text-xs uppercase tracking-wider">
                             <Info size={14} />
                             {t.lineInfo.replace('X', (activeLine + 1).toString())}
                         </div>
                         {/* Force MarkdownText to use white text via className */}
                         <div className="text-sm leading-relaxed font-medium">
                            <MarkdownText content={displayedLines[activeLine].explanation || (language === 'Chinese' ? "逻辑流转" : "Logic flow")} className="text-white" />
                         </div>
                     </div>
                 ) : (
                     <div className="flex flex-col items-center justify-center text-gray-500 gap-1 py-2">
                        <Terminal size={20} />
                        <p className="text-xs italic font-medium">{t.selectPrompt}</p>
                     </div>
                 )}
            </div>
        </div>
        {caption && <p className="text-center text-xs text-gray-400 mt-2 italic"><MarkdownText content={caption} /></p>}
    </BaseWidget>
  );
};
