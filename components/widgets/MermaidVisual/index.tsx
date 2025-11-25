
import React, { useEffect, useRef } from 'react';
import { Widget } from '../../../types';
import { BaseWidget } from '../BaseWidget';

declare const mermaid: any;

export const MermaidVisualWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
    if (!widget.mermaid) return null;
    const { chart, caption } = widget.mermaid;
    const chartRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chartRef.current && typeof mermaid !== 'undefined') {
            try {
                mermaid.init(undefined, chartRef.current);
            } catch (e) {
                console.error("Mermaid rendering failed", e);
            }
        }
    }, [chart, widget.id]);

    return (
        <BaseWidget>
            <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm p-4 relative group">
                <div className="mermaid flex justify-center overflow-x-auto" ref={chartRef}>
                    {chart}
                </div>
                
                {caption && (
                    <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400 font-medium italic">
                        {caption}
                    </div>
                )}
            </div>
        </BaseWidget>
    );
};
