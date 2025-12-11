
import React, { useEffect, useRef, useState } from 'react';
import { Widget } from '../../../types';
import { BaseWidget } from '../BaseWidget';
import { AlertCircle, RefreshCw, Wand2, Maximize2 } from 'lucide-react';

declare const mermaid: any;

interface GraphNode {
    id: string;
    label: string;
    shape?: 'rect' | 'rounded' | 'diamond' | 'circle';
}

interface GraphEdge {
    from: string;
    to: string;
    label?: string;
    type?: 'solid' | 'dotted' | 'arrow_open';
}

interface GraphData {
    direction: 'TD' | 'LR' | 'BT' | 'RL';
    nodes: GraphNode[];
    edges: GraphEdge[];
}

interface MermaidVisualProps {
    widget: Widget;
    onRegenerate?: (instruction: string) => Promise<void>;
}

export const MermaidVisualWidget: React.FC<MermaidVisualProps> = ({ widget, onRegenerate }) => {
    if (!widget.mermaid) return null;
    const { chart, graphData, caption } = widget.mermaid;
    const chartRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isRepairing, setIsRepairing] = useState(false);

    // --- SANITIZER: Fix common AI syntax errors (e.g. nested brackets, missing quotes) ---
    const preProcessChart = (raw: string): string => {
        if (!raw) return "";
        let processed = raw;
        
        // Fix 1: Nested Brackets in labels like "Node[Group [A]]" -> "Node[Group (A)]"
        // Heuristic: Replace inner [ ] with ( )
        processed = processed.replace(/\[([^\]\[]*?)\[(.*?)\]([^\]\[]*?)\]/g, '[$1($2)$3]');
        
        // Fix 2: Force Quotes for labels inside [] that contain special chars like (), but aren't already quoted
        // Pattern: ID[Text(With)Parens] -> ID["Text(With)Parens"]
        // We look for [ followed by non-quote chars, containing potentially dangerous chars, ending with ]
        processed = processed.replace(/\[\s*([^"\]]*?[\(\)][^"\]]*?)\s*\]/g, '["$1"]');

        // Fix 3: General Quote Safety - If it looks like a label ID[...] and inside isn't quoted, quote it.
        // This is aggressive but safer for Chinese text mixed with symbols.
        // Avoid double quoting if already quoted.
        processed = processed.replace(/(\w+)\s*\[\s*(?!")([^\]\n]+?)(?!")\s*\]/g, '$1["$2"]');

        // Fix 4: Arrow syntax spacing protection (A-->B is fine, but A --> B is better)
        processed = processed.replace(/(\S)(-->|--|-.->)(\S)/g, '$1 $2 $3');

        return processed;
    };

    // --- COMPILER: JSON -> Mermaid String ---
    const compileMermaid = (data: any): string => {
        if (!data || !data.nodes) return "";
        const gd = data as GraphData;
        
        let output = `graph ${gd.direction || 'TD'}\n`;
        
        // Nodes
        gd.nodes.forEach(node => {
            const safeLabel = (node.label || "Node").replace(/"/g, "'"); // Escape quotes
            let shapeStart = '[', shapeEnd = ']';
            
            switch(node.shape) {
                case 'rounded': shapeStart = '('; shapeEnd = ')'; break;
                case 'diamond': shapeStart = '{'; shapeEnd = '}'; break;
                case 'circle': shapeStart = '(('; shapeEnd = '))'; break;
                default: shapeStart = '['; shapeEnd = ']';
            }
            
            // Syntax: ID["Label"]
            // Ensure ID is safe
            const safeId = node.id.replace(/[^a-zA-Z0-9_]/g, ''); 
            output += `    ${safeId}${shapeStart}"${safeLabel}"${shapeEnd}\n`;
        });

        // Edges
        gd.edges.forEach(edge => {
            let arrow = '-->';
            if (edge.type === 'dotted') arrow = '-.->';
            if (edge.type === 'arrow_open') arrow = '---'; 
            
            const safeFrom = edge.from.replace(/[^a-zA-Z0-9_]/g, '');
            const safeTo = edge.to.replace(/[^a-zA-Z0-9_]/g, '');

            if (edge.label) {
                const safeEdgeLabel = edge.label.replace(/"/g, "'");
                // Syntax: A -->|Label| B
                output += `    ${safeFrom} ${arrow}|"${safeEdgeLabel}"| ${safeTo}\n`;
            } else {
                output += `    ${safeFrom} ${arrow} ${safeTo}\n`;
            }
        });
        
        // Style cleanup (basic)
        output += `    classDef default fill:#fff,stroke:#333,stroke-width:2px,color:#333;\n`;
        
        return output;
    };

    // Determine content source
    const finalChart = graphData 
        ? compileMermaid(graphData) 
        : preProcessChart((chart || "").replace(/```mermaid/g, '').replace(/```/g, '').trim());

    useEffect(() => {
        setError(null);
        if (chartRef.current && typeof mermaid !== 'undefined' && finalChart) {
            try {
                // Config
                mermaid.initialize({ 
                    startOnLoad: false, 
                    theme: 'neutral',
                    securityLevel: 'loose',
                    fontFamily: 'monospace'
                });
                
                // Clear previous svg to force re-render cleanly
                chartRef.current.removeAttribute('data-processed');
                chartRef.current.innerHTML = finalChart; 
                
                mermaid.init(undefined, chartRef.current).catch((e: any) => {
                    console.error("Mermaid async init failed", e);
                    setError("Syntax Error: " + (e.message || "Unknown"));
                });
            } catch (e: any) {
                console.error("Mermaid rendering failed", e);
                setError(e.message || "Invalid Syntax");
            }
        }
    }, [finalChart, widget.id]);

    const handleRepair = async () => {
        if (!onRegenerate) return;
        setIsRepairing(true);
        // Feed the specific error context back to AI
        const instruction = `The mermaid diagram generation failed.
        Error: ${error}.
        Current Data: ${JSON.stringify(graphData || chart)}.
        Task: Fix the syntax or structure issues. Use the 'graphData' JSON format strictly if possible.
        IMPORTANT: Wrap all labels in double quotes. Do NOT use nested square brackets.`;
        
        await onRegenerate(instruction);
        setIsRepairing(false);
    };

    return (
        <BaseWidget>
            <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm p-4 relative group min-h-[120px]">
                {/* Manual Retry Tool - ALWAYS VISIBLE if handler provided */}
                <div className="absolute top-3 right-3 z-10 flex gap-2">
                    {onRegenerate && (
                        <button 
                            onClick={handleRepair}
                            disabled={isRepairing}
                            className="p-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-brand hover:text-white rounded-lg text-gray-500 shadow-sm transition-colors border border-gray-200 dark:border-gray-600"
                            title="Regenerate Diagram"
                        >
                            <RefreshCw size={14} className={isRepairing ? "animate-spin" : ""} />
                        </button>
                    )}
                </div>

                {error ? (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-xs font-mono flex flex-col gap-3">
                        <div className="flex items-center gap-2 font-bold text-red-600 dark:text-red-400">
                            <AlertCircle size={14}/> Visualization Error
                        </div>
                        <p className="text-red-800 dark:text-red-300 break-all opacity-80">{error}</p>
                        
                        {onRegenerate ? (
                            <button 
                                onClick={handleRepair}
                                disabled={isRepairing}
                                className="self-start px-3 py-1.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 rounded-md font-bold flex items-center gap-2 hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
                            >
                                <Wand2 size={12} className={isRepairing ? "animate-spin" : ""} />
                                {isRepairing ? "Fixing..." : "Auto-Repair Syntax"}
                            </button>
                        ) : (
                            <div className="text-[10px] text-red-400 italic">
                                (Repair unavailable in this view)
                            </div>
                        )}
                        
                        <div className="bg-gray-100 dark:bg-black/50 p-2 rounded text-gray-500 overflow-x-auto whitespace-pre max-h-32 mt-2 border border-gray-200 dark:border-gray-700">
                            {finalChart}
                        </div>
                    </div>
                ) : (
                    <div className="mermaid flex justify-center overflow-x-auto" ref={chartRef} key={finalChart}>
                        {finalChart}
                    </div>
                )}
                
                {caption && !error && (
                    <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400 font-medium italic">
                        {caption}
                    </div>
                )}
            </div>
        </BaseWidget>
    );
};
