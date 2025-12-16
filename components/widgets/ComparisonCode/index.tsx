
import React from 'react';
import { Widget } from '../../../types';
import { BaseWidget } from '../BaseWidget';
import { InteractiveCodeWidget } from '../InteractiveCode';
import { ArrowRightLeft, GitCompare, FileDiff } from 'lucide-react';

interface ComparisonCodeProps {
    widget: Widget;
    language: 'Chinese' | 'English';
}

export const ComparisonCodeWidget: React.FC<ComparisonCodeProps> = ({ widget, language }) => {
    if (!widget.comparisonCode) return null;
    const { left, right } = widget.comparisonCode;

    // Helper to construct a temporary widget structure for reuse
    const createSubWidget = (data: typeof left): Widget => ({
        id: `sub_${widget.id}_${data.title}`,
        type: 'interactive-code',
        interactiveCode: {
            language: data.language,
            lines: data.lines,
            caption: undefined // Hide caption in sub-widgets
        }
    });

    return (
        <BaseWidget className="w-full">
            <div className="flex items-center gap-2 mb-3 px-1 text-gray-500 font-bold uppercase text-xs tracking-wider">
                <FileDiff size={16} />
                <span>{language === 'Chinese' ? "代码差异分析" : "Diff Analysis"}</span>
            </div>
            
            <div className="bg-[#1e1e1e] rounded-xl border border-gray-700 shadow-xl overflow-hidden">
                {/* Diff Header */}
                <div className="flex border-b border-black/50 bg-[#252526]">
                    <div className="flex-1 px-4 py-2 border-r border-black/50 flex items-center justify-between">
                        <span className="text-xs font-bold text-red-400 truncate">{left.title}</span>
                        <span className="text-[10px] text-gray-500 font-mono">ORIGINAL</span>
                    </div>
                    <div className="flex-1 px-4 py-2 flex items-center justify-between bg-[#2d2d2d]">
                        <span className="text-xs font-bold text-green-400 truncate">{right.title}</span>
                        <span className="text-[10px] text-gray-500 font-mono">CORRECTED</span>
                    </div>
                </div>

                <div className="flex flex-col xl:flex-row divide-y xl:divide-y-0 xl:divide-x divide-black/50">
                    {/* Left Side (Red-ish background hint) */}
                    <div className="flex-1 min-w-0 bg-red-900/5 relative group/left">
                        {/* We use specific styling hack to make InteractiveCodeWidget blend in */}
                        <div className="comparison-pane-left">
                            <InteractiveCodeWidget widget={createSubWidget(left)} language={language} />
                        </div>
                    </div>

                    {/* Right Side (Green-ish background hint) */}
                    <div className="flex-1 min-w-0 bg-green-900/5 relative group/right">
                        <div className="comparison-pane-right">
                            <InteractiveCodeWidget widget={createSubWidget(right)} language={language} />
                        </div>
                    </div>
                </div>
            </div>
            
            <style>{`
                /* Override Interactive Code Widget styles to fit inside diff view */
                .comparison-pane-left .bg-\\[\\#1e1e1e\\],
                .comparison-pane-right .bg-\\[\\#1e1e1e\\] {
                    background-color: transparent !important;
                    border: none !important;
                    border-radius: 0 !important;
                    box-shadow: none !important;
                }
                .comparison-pane-left .bg-\\[\\#252526\\],
                .comparison-pane-right .bg-\\[\\#252526\\] {
                    display: none !important; /* Hide internal header of interactive code */
                }
            `}</style>
        </BaseWidget>
    );
};
