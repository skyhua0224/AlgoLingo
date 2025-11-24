
import React, { useState, useEffect } from 'react';
import { Widget } from '../../../types';
import { BaseWidget } from '../BaseWidget';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { MarkdownText } from '../../common/MarkdownText';

declare const Prism: any;

export const CodeWalkthroughWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
    if (!widget.codeWalkthrough) return null;
    const { code, language, steps } = widget.codeWalkthrough;
    
    const [currentStep, setCurrentStep] = useState(0);
    
    const activeLines = steps[currentStep]?.lines || [];
    const lines = code.split('\n');

    return (
        <BaseWidget>
            <div className="flex flex-col md:flex-row gap-4 h-[400px]">
                {/* Code Side */}
                <div className="flex-1 bg-[#1e1e1e] rounded-xl overflow-y-auto custom-scrollbar p-4 border border-gray-700 font-mono text-xs">
                    {lines.map((line, i) => {
                        const isHighlighted = activeLines.includes(i + 1);
                        return (
                            <div key={i} className={`flex ${isHighlighted ? 'bg-[#37373d] -mx-4 px-4' : ''}`}>
                                <span className="w-8 text-gray-600 text-right pr-3 shrink-0 select-none">{i + 1}</span>
                                <pre className="text-gray-300 m-0 whitespace-pre">
                                    <code dangerouslySetInnerHTML={{ 
                                        __html: typeof Prism !== 'undefined' 
                                            ? Prism.highlight(line, Prism.languages[language.toLowerCase()] || Prism.languages.python, language.toLowerCase())
                                            : line 
                                    }} />
                                </pre>
                            </div>
                        );
                    })}
                </div>

                {/* Explanation Side */}
                <div className="w-full md:w-1/3 flex flex-col gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-xl flex-1 overflow-y-auto relative">
                        <div className="absolute top-2 right-2 text-[10px] font-bold text-blue-400 uppercase">
                            Step {currentStep + 1}/{steps.length}
                        </div>
                        <div className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed mt-4">
                            <MarkdownText content={steps[currentStep]?.content} />
                        </div>
                    </div>
                    
                    <div className="flex gap-2 shrink-0">
                        <button 
                            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                            disabled={currentStep === 0}
                            className="flex-1 py-3 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-xl disabled:opacity-50 flex items-center justify-center"
                        >
                            <ChevronLeft size={20}/>
                        </button>
                        <button 
                            onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                            disabled={currentStep === steps.length - 1}
                            className="flex-[3] py-3 bg-brand text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            Next <ChevronRight size={20}/>
                        </button>
                    </div>
                </div>
            </div>
        </BaseWidget>
    );
};
