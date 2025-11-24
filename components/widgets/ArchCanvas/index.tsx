
import React, { useState } from 'react';
import { Widget } from '../../../types';
import { BaseWidget } from '../BaseWidget';
import { Database, Server, Globe, Layout, HardDrive, Box, Check } from 'lucide-react';

export const ArchCanvasWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
    if (!widget.archCanvas) return null;
    const { goal, requiredComponents } = widget.archCanvas;
    
    const [placedItems, setPlacedItems] = useState<string[]>([]);
    const isComplete = requiredComponents.every(r => placedItems.includes(r));

    const TOOLBOX = [
        { id: 'LB', icon: Layout, label: 'Load Balancer' },
        { id: 'Server', icon: Server, label: 'API Server' },
        { id: 'DB', icon: Database, label: 'Database' },
        { id: 'Redis', icon: Box, label: 'Redis Cache' },
        { id: 'CDN', icon: Globe, label: 'CDN' },
        { id: 'MQ', icon: HardDrive, label: 'Message Queue' },
    ];

    const addItem = (id: string) => {
        if (!placedItems.includes(id)) {
            setPlacedItems([...placedItems, id]);
        }
    };

    return (
        <BaseWidget>
            <div className="bg-white dark:bg-dark-card border-2 border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden flex flex-col h-[500px]">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                    <div className="font-bold text-sm text-gray-700 dark:text-gray-200">Goal: {goal}</div>
                    {isComplete && <span className="text-green-500 text-xs font-bold flex items-center gap-1"><Check size={14}/> Architecture Valid</span>}
                </div>
                
                <div className="flex-1 flex relative">
                    {/* Toolbox */}
                    <div className="w-20 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center gap-4 p-4 overflow-y-auto">
                        {TOOLBOX.map(tool => (
                            <button 
                                key={tool.id}
                                onClick={() => addItem(tool.id)}
                                className="w-12 h-12 rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:border-brand hover:text-brand transition-all shadow-sm"
                                title={tool.label}
                            >
                                <tool.icon size={20} />
                            </button>
                        ))}
                    </div>

                    {/* Canvas Area */}
                    <div className="flex-1 bg-gray-100 dark:bg-[#0f172a] relative p-8" style={{backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
                        <div className="flex flex-wrap gap-8 items-center justify-center h-full content-center">
                            {placedItems.map((item, idx) => {
                                const tool = TOOLBOX.find(t => t.id === item);
                                return (
                                    <div key={item} className="relative animate-scale-in">
                                        <div className="w-24 h-24 bg-white dark:bg-dark-card rounded-2xl border-2 border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center shadow-lg z-10 relative">
                                            {tool && <tool.icon size={32} className="text-gray-600 dark:text-gray-300 mb-2"/>}
                                            <span className="text-[10px] font-bold uppercase">{tool?.label}</span>
                                        </div>
                                        {idx < placedItems.length - 1 && (
                                            <div className="absolute top-1/2 -right-8 w-8 h-0.5 bg-gray-400 -z-0"></div>
                                        )}
                                    </div>
                                )
                            })}
                            {placedItems.length === 0 && (
                                <div className="text-gray-400 text-sm font-bold opacity-50">Select components to build system</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </BaseWidget>
    );
};
