
import React, { useState, useEffect } from 'react';
import { Widget } from '../../../types';
import { BaseWidget } from '../BaseWidget';
import { ListOrdered, ArrowUp, ArrowDown, Check, X, Info } from 'lucide-react';
import { MarkdownText } from '../../common/MarkdownText';

interface StepsWidgetProps {
    widget: Widget;
    onUpdateOrder?: (newOrder: string[]) => void; 
    status?: 'idle' | 'correct' | 'wrong';
}

export const StepsWidget: React.FC<StepsWidgetProps> = ({ widget, onUpdateOrder, status = 'idle' }) => {
    if (!widget.stepsList) return null;
    const { items, mode, correctOrder } = widget.stepsList;
    
    if (!items || items.length === 0) return null;

    const [currentItems, setCurrentItems] = useState<string[]>([]);

    useEffect(() => {
        if (items && items.length > 0) {
            if (mode === 'interactive') {
                 // In review mode, we don't shuffle if we already have a status? 
                 // Actually, LessonRunner handles remounts, so this is fine.
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
        if (status !== 'idle') return;
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

            {/* Error Feedback Panel */}
            {status === 'wrong' && correctOrder && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-900/50 rounded-2xl animate-fade-in-down shadow-sm">
                    <div className="flex items-center gap-2 mb-3 text-red-700 dark:text-red-400 font-extrabold text-xs uppercase tracking-widest">
                        <Check size={14} /> Correct Logic Flow
                    </div>
                    <div className="space-y-2">
                        {correctOrder.map((step, i) => (
                            <div key={i} className="flex gap-3 text-xs bg-white/50 dark:bg-black/20 p-2 rounded-lg border border-red-100 dark:border-red-900/30">
                                <span className="font-bold text-red-500 w-4">{i + 1}.</span>
                                <span className="text-gray-700 dark:text-gray-300">{step}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {currentItems.map((item, idx) => {
                    let borderClass = "border-gray-200 dark:border-gray-700 border-b-4";
                    if (status === 'correct') borderClass = "border-green-500 bg-green-50 dark:bg-green-900/10";
                    if (status === 'wrong') borderClass = "border-red-300 bg-red-50 dark:bg-red-900/10 opacity-70";

                    return (
                        <div key={idx} className={`bg-white dark:bg-dark-card border-2 ${borderClass} p-4 rounded-xl flex items-center gap-4 group transition-all ${status === 'idle' ? 'hover:border-brand hover:shadow-md' : ''}`}>
                            <div className={`font-black font-mono text-xl w-6 text-center ${status === 'correct' ? 'text-green-500' : 'text-gray-300'}`}>
                                {idx + 1}
                            </div>
                            <div className="flex-1 text-sm text-gray-800 dark:text-gray-200 font-bold">
                                <MarkdownText content={item} />
                            </div>
                            {status === 'idle' && (
                                <div className="flex flex-col gap-1">
                                    <button 
                                        onClick={() => move(idx, -1)} 
                                        disabled={idx === 0} 
                                        className="text-gray-400 hover:text-brand disabled:opacity-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-1"
                                    >
                                        <ArrowUp size={20}/>
                                    </button>
                                    <button 
                                        onClick={() => move(idx, 1)} 
                                        disabled={idx === currentItems.length - 1} 
                                        className="text-gray-400 hover:text-brand disabled:opacity-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-1"
                                    >
                                        <ArrowDown size={20}/>
                                    </button>
                                </div>
                            )}
                            {status === 'correct' && <Check className="text-green-500" size={20} />}
                            {status === 'wrong' && <X className="text-red-500" size={20} />}
                        </div>
                    );
                })}
            </div>
        </BaseWidget>
    );
};
