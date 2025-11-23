import React, { useState, useEffect, useRef } from 'react';
import { Widget } from '../../../types';
import { BaseWidget } from '../BaseWidget';
import { GripVertical, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, XCircle, Check } from 'lucide-react';

declare const Prism: any;

interface ParsonsProps {
    widget: Widget;
    onUpdateOrder: (newOrder: string[]) => void;
    status?: string; 
    language: 'Chinese' | 'English';
}

const WIDGET_LOCALE = {
    Chinese: {
        title: "重排代码逻辑:",
        indent: "包含缩进",
        correctSolution: "正确答案"
    },
    English: {
        title: "Reorder Code Logic:",
        indent: "& Indent",
        correctSolution: "Correct Solution"
    }
};

const cleanCodeLine = (line: string) => {
    return line.replace(/\s*#.*$/, '').replace(/\s*\/\/.*$/, '').trim();
};

export const ParsonsWidget: React.FC<ParsonsProps> = ({ widget, onUpdateOrder, status, language }) => {
    if (!widget.parsons) return null;
    const [items, setItems] = useState<string[]>([]);
    const [indents, setIndents] = useState<number[]>([]);
    
    // Drag Refs
    const draggingItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);
    
    const { indentation } = widget.parsons; 
    const t = WIDGET_LOCALE[language];

    useEffect(() => {
        if (widget.parsons?.lines) {
            const original = widget.parsons.lines.map(cleanCodeLine).filter(line => line.length > 0);
            
            if (original.length <= 1) {
                 setItems(original);
                 setIndents([0]);
                 return;
            }

            // Shuffle implementation
            // We want to ensure that the shuffled version is NOT the same as the original.
            let shuffled = [...original];
            
            const shuffleArray = (array: string[]) => {
                for (let i = array.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [array[i], array[j]] = [array[j], array[i]];
                }
                return array;
            };

            const originalJson = JSON.stringify(original);
            let attempts = 0;
            
            do {
                shuffled = shuffleArray([...original]);
                attempts++;
            } while (JSON.stringify(shuffled) === originalJson && attempts < 10);

            // FORCE SWAP: If randomness fails or original list is short/repetitive
            if (JSON.stringify(shuffled) === originalJson) {
                // If the first two items are different, swap them.
                if (shuffled[0] !== shuffled[1]) {
                     [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
                } else {
                     // If first two are same, try to find one to swap with the first
                     for(let i=1; i<shuffled.length; i++) {
                         if (shuffled[i] !== shuffled[0]) {
                             [shuffled[0], shuffled[i]] = [shuffled[i], shuffled[0]];
                             break;
                         }
                     }
                }
            }

            setItems(shuffled);
            setIndents(new Array(shuffled.length).fill(0));
        }
    }, [widget.parsons, widget.id]);

    useEffect(() => {
        onUpdateOrder(items);
    }, [items]);

    const move = (idx: number, dir: -1 | 1) => {
        if (status !== 'idle' && status !== undefined) return;
        const newItems = [...items];
        const newIndents = [...indents];
        const swapIdx = idx + dir;
        if (swapIdx >= 0 && swapIdx < newItems.length) {
            [newItems[idx], newItems[swapIdx]] = [newItems[swapIdx], newItems[idx]];
            [newIndents[idx], newIndents[swapIdx]] = [newIndents[swapIdx], newIndents[idx]];
            setItems(newItems);
            setIndents(newIndents);
        }
    };

    const indent = (idx: number, dir: -1 | 1) => {
        if (status !== 'idle' && status !== undefined) return;
        const newIndents = [...indents];
        const newVal = Math.max(0, Math.min(6, (newIndents[idx] || 0) + dir));
        newIndents[idx] = newVal;
        setIndents(newIndents);
    };

    const handleDragStart = (e: React.DragEvent, position: number) => {
        if (status !== 'idle' && status !== undefined) return;
        draggingItem.current = position;
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragEnter = (e: React.DragEvent, position: number) => {
        if (status !== 'idle' && status !== undefined) return;
        dragOverItem.current = position;
        e.preventDefault();
    };
    
    const handleDragEnd = () => {
        if (status !== 'idle' && status !== undefined) return;
        const dragIdx = draggingItem.current;
        const overIdx = dragOverItem.current;
        
        if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
            const newItems = [...items];
            const newIndents = [...indents];
            
            const draggedItemContent = newItems[dragIdx];
            const draggedItemIndent = newIndents[dragIdx];
            
            newItems.splice(dragIdx, 1);
            newIndents.splice(dragIdx, 1);
            
            newItems.splice(overIdx, 0, draggedItemContent);
            newIndents.splice(overIdx, 0, draggedItemIndent);
            
            setItems(newItems);
            setIndents(newIndents);
        }
        draggingItem.current = null;
        dragOverItem.current = null;
    };

    return (
        <BaseWidget>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide mb-3 flex justify-between">
                <span>{t.title} {indentation ? t.indent : ''}</span>
            </p>
            
            {status === 'wrong' && widget.parsons.lines && (
                 <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-900/50 rounded-xl animate-fade-in-up shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-red-400"></div>
                    <h4 className="text-red-800 dark:text-red-300 font-extrabold text-xs uppercase mb-3 tracking-wider flex items-center gap-2">
                        <Check size={14} /> {t.correctSolution}
                    </h4>
                    <div className="space-y-1">
                        {widget.parsons.lines.map(cleanCodeLine).filter(l => l.length > 0).map((line, i) => (
                            <div key={i} className="font-mono text-xs text-red-900 dark:text-red-200 flex gap-3 p-1 rounded bg-red-100/50 dark:bg-red-900/10">
                                <span className="opacity-50 select-none text-[10px] font-bold w-4 text-right mt-0.5">{i+1}</span>
                                <span className="flex-1 whitespace-pre">{line}</span>
                            </div>
                        ))}
                    </div>
                 </div>
            )}

            <div className="space-y-2">
                {items.map((line, idx) => {
                    let borderClass = "border-gray-200 dark:border-gray-700 border-b-4";
                    if (status === 'wrong') borderClass = "border-red-300 dark:border-red-800 border-b-4 bg-red-50 dark:bg-red-900/10 opacity-70";
                    if (status === 'correct') borderClass = "border-green-300 dark:border-green-800 border-b-4 bg-green-50 dark:bg-green-900/10";

                    return (
                    <div 
                        key={idx} 
                        style={{ marginLeft: indentation ? `${(indents[idx] || 0) * 24}px` : 0 }}
                        draggable={status === 'idle' || status === undefined}
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragEnter={(e) => handleDragEnter(e, idx)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                        className={`bg-white dark:bg-dark-card border-2 ${borderClass} p-3 rounded-xl flex items-center gap-3 group transition-all cursor-grab active:cursor-grabbing min-h-[48px]`}
                    >
                        <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded touch-none hidden md:block">
                            <GripVertical size={16} className="text-gray-400 dark:text-gray-500"/>
                        </div>
                        
                        <code className="flex-1 font-mono text-xs md:text-sm text-gray-800 dark:text-gray-200 select-none pointer-events-none whitespace-pre-wrap break-all">
                            <span dangerouslySetInnerHTML={{ 
                                    __html: typeof Prism !== 'undefined' 
                                        ? Prism.highlight(line, Prism.languages.python, 'python')
                                        : line 
                                }} />
                        </code>
                        
                        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <div className="flex gap-1">
                                {indentation && (
                                    <>
                                        <button onClick={() => indent(idx, -1)} className="p-1.5 text-gray-400 hover:text-brand bg-gray-50 dark:bg-gray-800 rounded-lg"><ArrowLeft size={14}/></button>
                                        <button onClick={() => indent(idx, 1)} className="p-1.5 text-gray-400 hover:text-brand bg-gray-50 dark:bg-gray-800 rounded-lg"><ArrowRight size={14}/></button>
                                    </>
                                )}
                                <button onClick={() => move(idx, -1)} disabled={idx === 0} className="p-1.5 text-gray-400 hover:text-brand disabled:opacity-20 bg-gray-50 dark:bg-gray-800 rounded-lg"><ArrowUp size={14}/></button>
                                <button onClick={() => move(idx, 1)} disabled={idx === items.length -1} className="p-1.5 text-gray-400 hover:text-brand disabled:opacity-20 bg-gray-50 dark:bg-gray-800 rounded-lg"><ArrowDown size={14}/></button>
                            </div>
                        </div>
                    </div>
                )})}
            </div>
        </BaseWidget>
    );
};