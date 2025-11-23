
import React, { useState, useEffect } from 'react';
import { Widget } from '../../../types';
import { BaseWidget } from '../BaseWidget';
import { ListOrdered, ArrowUp, ArrowDown } from 'lucide-react';
import { MarkdownText } from '../../common/MarkdownText';

interface StepsWidgetProps {
    widget: Widget;
    onUpdateOrder?: (newOrder: string[]) => void; 
}

export const StepsWidget: React.FC<StepsWidgetProps> = ({ widget, onUpdateOrder }) => {
    if (!widget.stepsList) return null;
    const { items, mode } = widget.stepsList;
    
    if (!items || items.length === 0) return null;

    const [currentItems, setCurrentItems] = useState<string[]>([]);

    useEffect(() => {
        if (items && items.length > 0) {
            if (mode === 'interactive') {
                 const shuffled = [...items].sort(() => Math.random() - 0.5);
                 setCurrentItems(shuffled);
            } else {
                 setCurrentItems(items);
            }
        }
    }, [items, mode, widget.id]);

    useEffect(() => {
        if (mode === 'interactive' && onUpdateOrder) {
            onUpdateOrder(currentItems);
        }
    }, [currentItems, mode, onUpdateOrder]);

    const move = (idx: number, dir: -1 | 1) => {
        const newItems = [...currentItems];
        const swapIdx = idx + dir;
        if (swapIdx >= 0 && swapIdx < newItems.length) {
            [newItems[idx], newItems[swapIdx]] = [newItems[swapIdx], newItems[idx]];
            setCurrentItems(newItems);
        }
    };

    if (mode === 'static') {
        return (
            <BaseWidget>
                <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                        <ListOrdered size={16} className="text-gray-500" />
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Logic Flow</span>
                    </div>
                    <div className="p-4 space-y-3">
                        {currentItems.map((item, idx) => (
                            <div key={idx} className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-brand/10 text-brand font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                    {idx + 1}
                                </div>
                                <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                    <MarkdownText content={item} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </BaseWidget>
        );
    }

    return (
        <BaseWidget>
            <div className="flex items-center gap-2 mb-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-900/50 text-orange-800 dark:text-orange-400">
                 <ListOrdered size={20}/>
                 <p className="text-sm font-bold">Sort the steps:</p>
            </div>
            <div className="space-y-3">
                {currentItems.map((item, idx) => (
                    <div key={idx} className="bg-white dark:bg-dark-card border-2 border-gray-200 dark:border-gray-700 border-b-4 p-4 rounded-xl flex items-center gap-4 group hover:border-brand transition-all hover:shadow-md">
                        <div className="text-gray-300 font-black font-mono text-xl w-6 text-center">{idx + 1}</div>
                        <div className="flex-1 text-sm text-gray-800 dark:text-gray-200 font-bold">
                            <MarkdownText content={item} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <button onClick={() => move(idx, -1)} disabled={idx === 0} className="text-gray-400 hover:text-brand disabled:opacity-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-1"><ArrowUp size={20}/></button>
                            <button onClick={() => move(idx, 1)} disabled={idx === currentItems.length -1} className="text-gray-400 hover:text-brand disabled:opacity-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-1"><ArrowDown size={20}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </BaseWidget>
    );
};
