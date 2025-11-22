import React, { useState, useEffect, useRef } from 'react';
import { Widget, UserPreferences } from '../../types';
import { Bot, User, Lightbulb, Zap, Info, GripVertical, ArrowDown, ArrowUp, ArrowLeft, ArrowRight, Terminal, MousePointerClick, ListOrdered, Check, Eye, Sparkles, XCircle, Keyboard } from 'lucide-react';
import { Button } from '../Button';

// Helper to strip markdown ticks for cleaner dialogue. Safe against undefined.
const formatText = (text: string | undefined | null) => {
    if (!text) return "";
    return text.replace(/`([^`]+)`/g, "'$1'").replace(/\*\*/g, "");
};

// Helper to remove comments
const cleanCodeLine = (line: string) => {
    return line.replace(/\s*#.*$/, '').replace(/\s*\/\/.*$/, '').trim();
};

// Declare Prism for TypeScript
declare const Prism: any;

const usePrism = (code: string, language: string) => {
    useEffect(() => {
        if (typeof Prism !== 'undefined') {
            Prism.highlightAll();
        }
    }, [code, language]);
};

// --- 1. Dialogue Widget ---
export const DialogueWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
  if (!widget.dialogue) return null;
  const { text, speaker } = widget.dialogue;
  const isCoach = speaker === 'coach';

  return (
    <div className={`flex gap-4 mb-6 ${isCoach ? 'flex-row' : 'flex-row-reverse'}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm shrink-0 border-2 
        ${isCoach ? 'bg-brand text-white border-brand-dark' : 'bg-blue-500 text-white border-blue-700'}`}>
        {isCoach ? <Bot size={20} /> : <User size={20} />}
      </div>
      <div className={`relative p-4 rounded-2xl max-w-[85%] text-sm md:text-base leading-relaxed shadow-sm border-2
        ${isCoach 
          ? 'bg-white dark:bg-dark-card border-gray-200 dark:border-gray-700 text-gray-800 dark:text-dark-text rounded-tl-none' 
          : 'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800 text-blue-900 dark:text-blue-100 rounded-tr-none'
        }`}>
        <p>{formatText(text)}</p>
      </div>
    </div>
  );
};

// --- 2. Flip Card Widget (Redesigned) ---
interface FlipCardProps {
    widget: Widget;
    onAssessment?: (result: 'forgot' | 'remembered') => void;
}

export const FlipCardWidget: React.FC<FlipCardProps> = ({ widget, onAssessment }) => {
  if (!widget.flipcard) return null;
  const [flipped, setFlipped] = useState(false);
  const { front, back, hint, mode, model3d } = widget.flipcard;

  // Reset state when widget changes
  useEffect(() => {
    setFlipped(false);
  }, [widget.id, front]);

  // Safety check for content
  const frontContent = front || "Tap to reveal";
  const backContent = back || "...";

  return (
    <div className="mb-6 flex flex-col items-center w-full">
        <div 
            onClick={() => !flipped && setFlipped(true)}
            className={`relative w-full cursor-pointer transition-all duration-300 group`}
        >
            {/* Front */}
            <div className={`
                w-full min-h-[160px] bg-white dark:bg-dark-card rounded-2xl border-2 border-b-4 border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center shadow-sm
                ${flipped ? 'hidden' : 'flex'}
                group-hover:border-brand group-hover:translate-y-[-2px] transition-all
            `}>
                <div className="mb-3 p-2 bg-brand-bg dark:bg-brand/10 rounded-full text-brand">
                    <Eye size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-dark-text">{formatText(frontContent)}</h3>
                {hint && <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wide">{hint}</p>}
                <p className="mt-4 text-xs text-brand font-bold">Tap to flip</p>
            </div>

            {/* Back */}
            <div className={`
                w-full min-h-[160px] bg-brand-bg dark:bg-brand/10 rounded-2xl border-2 border-b-4 border-brand p-6 flex flex-col items-center justify-center text-center shadow-sm
                ${flipped ? 'flex animate-scale-in' : 'hidden'}
            `}>
                 <div className="mb-3 p-2 bg-white dark:bg-dark-card rounded-full text-brand">
                    <Sparkles size={24} />
                </div>
                <h3 className="text-lg font-bold text-brand-dark dark:text-brand-light">{formatText(backContent)}</h3>
                
                {/* v3.0: 3D Model placeholder */}
                {model3d && (
                     <div className="my-2 text-xs text-gray-500 italic">
                        [3D Model Viewer: {model3d}]
                     </div>
                )}
                
                {mode === 'assessment' && onAssessment && (
                    <div className="mt-6 flex gap-4 w-full">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onAssessment('forgot'); }}
                            className="flex-1 bg-white dark:bg-dark-card border-2 border-red-200 dark:border-red-900 text-red-500 py-2 rounded-xl font-bold text-xs hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            Forgot
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onAssessment('remembered'); }}
                            className="flex-1 bg-brand text-white py-2 rounded-xl font-bold text-xs hover:bg-brand-light shadow-sm"
                        >
                            Got it
                        </button>
                    </div>
                )}

                {!mode && <p className="mt-4 text-xs text-brand-dark/50 font-bold" onClick={() => setFlipped(false)}>Tap to flip back</p>}
            </div>
        </div>
    </div>
  );
};

// --- 3. Interactive Code Widget ---
export const InteractiveCodeWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
  // Handles both standard interactiveCode widget AND leetcode exampleCode structure
  const content = widget.interactiveCode || widget.leetcode?.exampleCode;
  if (!content) return null;
  
  const { lines, language, caption } = content;
  // Use a ref to track if we are inside a standalone widget (to manage state differently if needed, but here local state is fine)
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const safeLines = lines || [];
  
  // Trigger Prism Highlight
  const fullCode = safeLines.map(l => l.code).join('\n');
  usePrism(fullCode, language);

  return (
    <div className="mb-6 w-full">
        <div className="bg-[#1e1e1e] rounded-xl shadow-lg overflow-hidden border border-gray-700 relative group max-w-[calc(100vw-3rem)] md:max-w-full mx-auto">
            <div className="bg-[#252526] px-3 py-2 flex items-center justify-between border-b border-gray-700">
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"/>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"/>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"/>
                </div>
                <span className="text-xs text-gray-400 font-mono">{language}</span>
            </div>
            
            <div className="bg-blue-900/30 text-blue-200 px-3 py-1 text-xs border-b border-blue-900/50 flex items-center gap-2 justify-center">
                 <MousePointerClick size={12} />
                 <span className="font-bold uppercase tracking-wider">Tap a line to explain it</span>
            </div>

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
                            {/* Prism Highlighted Code Line */}
                            <pre className={`language-${language.toLowerCase()} !m-0 !p-0 !bg-transparent !text-sm`} style={{margin:0, padding:0}}>
                                <code dangerouslySetInnerHTML={{ 
                                    __html: typeof Prism !== 'undefined' 
                                        ? Prism.highlight(line.code, Prism.languages[language.toLowerCase()] || Prism.languages.python, language.toLowerCase())
                                        : line.code 
                                }} />
                            </pre>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="bg-[#252526] p-4 border-t-4 border-brand-dark min-h-[100px] transition-all">
                 {activeLine !== null && safeLines[activeLine] ? (
                     <div className="animate-fade-in-up">
                         <div className="flex items-center gap-2 mb-2 text-brand-light font-bold text-xs uppercase tracking-wider">
                             <Info size={14} />
                             Line {activeLine + 1}
                         </div>
                         <p className="text-sm text-gray-200 leading-relaxed">
                             {safeLines[activeLine].explanation}
                         </p>
                     </div>
                 ) : (
                     <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-1 py-2">
                        <Terminal size={20} />
                        <p className="text-xs italic">Select code to see logic.</p>
                     </div>
                 )}
            </div>
        </div>
        {caption && <p className="text-center text-xs text-gray-400 mt-2">{caption}</p>}
    </div>
  );
};

// --- 4. Steps Widget (Improved) ---
interface StepsWidgetProps {
    widget: Widget;
    onUpdateOrder?: (newOrder: string[]) => void; 
}

export const StepsWidget: React.FC<StepsWidgetProps> = ({ widget, onUpdateOrder }) => {
    if (!widget.stepsList) return null;
    const { items, mode } = widget.stepsList;
    
    // Guard against empty steps
    if (!items || items.length === 0) return null;

    // Use local state to store the SHUFFLED items
    const [currentItems, setCurrentItems] = useState<string[]>([]);

    useEffect(() => {
        if (items && items.length > 0) {
            if (mode === 'interactive') {
                 // Shuffle for interactive mode!
                 const shuffled = [...items].sort(() => Math.random() - 0.5);
                 setCurrentItems(shuffled);
            } else {
                 setCurrentItems(items);
            }
        }
    }, [items, mode, widget.id]); // Reset on widget.id change

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
            <div className="mb-6 bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
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
                                {item}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Interactive Mode
    return (
        <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 mb-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-900/50 text-orange-800 dark:text-orange-400">
                 <ListOrdered size={20}/>
                 <p className="text-sm font-bold">Sort the steps:</p>
            </div>
            {currentItems.map((item, idx) => (
                <div key={idx} className="bg-white dark:bg-dark-card border-2 border-gray-200 dark:border-gray-700 border-b-4 p-4 rounded-xl flex items-center gap-4 group hover:border-brand transition-all hover:shadow-md">
                    <div className="text-gray-300 font-black font-mono text-xl w-6 text-center">{idx + 1}</div>
                    <div className="flex-1 text-sm text-gray-800 dark:text-gray-200 font-bold">{item}</div>
                    <div className="flex flex-col gap-1">
                        <button onClick={() => move(idx, -1)} disabled={idx === 0} className="text-gray-400 hover:text-brand disabled:opacity-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-1"><ArrowUp size={20}/></button>
                        <button onClick={() => move(idx, 1)} disabled={idx === currentItems.length -1} className="text-gray-400 hover:text-brand disabled:opacity-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-1"><ArrowDown size={20}/></button>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- 5. Parsons Puzzle Widget (Overhauled with Indentation) ---
interface ParsonsProps {
    widget: Widget;
    onUpdateOrder: (newOrder: string[]) => void;
    status?: string; // 'idle', 'correct', 'wrong'
}
export const ParsonsWidget: React.FC<ParsonsProps> = ({ widget, onUpdateOrder, status }) => {
    if (!widget.parsons) return null;
    const [items, setItems] = useState<string[]>([]);
    const [indents, setIndents] = useState<number[]>([]);
    const draggingItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);
    const { indentation } = widget.parsons; 

    // Shuffle on mount or ID change
    useEffect(() => {
        if (widget.parsons?.lines) {
            // Filter comments and shuffle
            const cleaned = widget.parsons.lines.map(cleanCodeLine).filter(line => line.length > 0);
            const shuffled = [...cleaned].sort(() => Math.random() - 0.5);
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
        // Indent up to 6 levels
        const newVal = Math.max(0, Math.min(6, (newIndents[idx] || 0) + dir));
        newIndents[idx] = newVal;
        setIndents(newIndents);
    };

    // HTML5 DnD Handlers
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
        <div className="space-y-2 mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide mb-2 flex justify-between">
                <span>Reorder {indentation ? '& Indent ' : ''}Code:</span>
                {status === 'wrong' && <span className="text-red-500 flex items-center gap-1"><XCircle size={14}/> Incorrect</span>}
            </p>
            
            {status === 'wrong' && widget.parsons.lines && (
                 <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-900/50 rounded-xl animate-fade-in-up shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-red-400"></div>
                    <h4 className="text-red-800 dark:text-red-300 font-extrabold text-xs uppercase mb-3 tracking-wider flex items-center gap-2">
                        <Check size={14} /> Correct Solution
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
                    className={`bg-white dark:bg-dark-card border-2 ${borderClass} p-2 mb-1 rounded-lg flex items-center gap-3 group transition-all cursor-grab active:cursor-grabbing min-h-[42px]`}
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
                                    <button onClick={() => indent(idx, -1)} className="p-1 text-gray-400 hover:text-brand bg-gray-50 dark:bg-gray-800 rounded"><ArrowLeft size={14}/></button>
                                    <button onClick={() => indent(idx, 1)} className="p-1 text-gray-400 hover:text-brand bg-gray-50 dark:bg-gray-800 rounded"><ArrowRight size={14}/></button>
                                </>
                             )}
                             <button onClick={() => move(idx, -1)} disabled={idx === 0} className="p-1 text-gray-400 hover:text-brand disabled:opacity-20 bg-gray-50 dark:bg-gray-800 rounded"><ArrowUp size={14}/></button>
                             <button onClick={() => move(idx, 1)} disabled={idx === items.length -1} className="p-1 text-gray-400 hover:text-brand disabled:opacity-20 bg-gray-50 dark:bg-gray-800 rounded"><ArrowDown size={14}/></button>
                        </div>
                    </div>
                </div>
            )})}
        </div>
    );
};

// --- 6. Fill-In Widget (Enhanced with Type Mode & Virtual Keyboard) ---
interface FillInProps {
    widget: Widget;
    onUpdateAnswers: (answers: string[]) => void;
}
export const FillInWidget: React.FC<FillInProps> = ({ widget, onUpdateAnswers }) => {
    if (!widget.fillIn) return null;
    const { code, options, inputMode } = widget.fillIn;
    const parts = code ? code.split('__BLANK__') : [];
    const [answers, setAnswers] = useState<string[]>([]);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    // Reset answers when widget ID or code changes
    useEffect(() => {
        const blankCount = Math.max(0, (code?.split('__BLANK__').length || 0) - 1);
        setAnswers(new Array(blankCount).fill(""));
        setFocusedIndex(null);
    }, [widget.id, code]);

    useEffect(() => {
        onUpdateAnswers(answers);
    }, [answers]);

    const fill = (val: string) => {
        const targetIndex = focusedIndex !== null ? focusedIndex : answers.findIndex(a => !a);
        if (targetIndex !== -1) {
            const newAnswers = [...answers];
            // If type mode, append. If select mode, replace.
            if (inputMode === 'type') {
                 newAnswers[targetIndex] = (newAnswers[targetIndex] || '') + val;
            } else {
                 newAnswers[targetIndex] = val;
            }
            setAnswers(newAnswers);
        }
    };

    const handleTextChange = (val: string, idx: number) => {
         const newAnswers = [...answers];
         newAnswers[idx] = val;
         setAnswers(newAnswers);
    };

    const clear = (idx: number) => {
        const newAnswers = [...answers];
        newAnswers[idx] = "";
        setAnswers(newAnswers);
    }

    const isTypeMode = inputMode === 'type';
    const helperKeys = ['[', ']', '{', '}', '(', ')', ':', ';', '=', '->', '"', "'", '_'];

    return (
        <div className="mb-6">
             <div className="bg-[#1e1e1e] p-5 rounded-xl mb-4 border-l-4 border-brand overflow-x-auto shadow-lg max-w-[calc(100vw-3rem)] md:max-w-full mx-auto">
                 <pre className="font-mono text-sm text-gray-300 leading-loose whitespace-pre-wrap font-medium">
                     {parts.map((part, i) => (
                         <React.Fragment key={i}>
                             {part}
                             {i < parts.length - 1 && (
                                isTypeMode ? (
                                    <input 
                                        type="text" 
                                        value={answers[i] || ''}
                                        onFocus={() => setFocusedIndex(i)}
                                        onChange={(e) => handleTextChange(e.target.value, i)}
                                        className={`bg-gray-800 border-b-2 text-brand-light font-bold px-2 mx-1 min-w-[60px] h-6 focus:outline-none focus:border-brand text-center transition-colors ${focusedIndex === i ? 'border-brand bg-gray-700' : 'border-gray-500'}`}
                                        placeholder="..."
                                    />
                                ) : (
                                 <span 
                                    onClick={() => clear(i)}
                                    className={`inline-flex items-center justify-center px-2 min-w-[60px] h-6 mx-1 border-b-2 rounded cursor-pointer align-middle transition-all select-none ${answers[i] ? 'text-brand-light border-brand-light bg-brand/20 font-bold' : 'border-gray-600 bg-gray-800 hover:bg-gray-700 animate-pulse'}`}
                                 >
                                     {answers[i] || '?'}
                                 </span>
                                )
                             )}
                         </React.Fragment>
                     ))}
                 </pre>
             </div>
             
             {!isTypeMode && (
                <div className="flex flex-wrap gap-3 justify-center">
                    {(options || []).map((opt, idx) => (
                        <button 
                            key={idx} 
                            onClick={() => fill(opt)}
                            className="px-4 py-2 bg-white dark:bg-dark-card rounded-xl border-2 border-gray-200 dark:border-gray-700 border-b-4 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-brand hover:text-brand transition-all font-mono text-sm font-bold active:translate-y-1 active:border-b-2 shadow-sm text-gray-700 dark:text-gray-200"
                        >
                            {opt}
                        </button>
                    ))}
                </div>
             )}
             {isTypeMode && (
                 <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-xl">
                     <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-2">
                         <Keyboard size={14} />
                         Helper Keys
                     </div>
                     <div className="flex flex-wrap gap-2 justify-center">
                         {helperKeys.map((key) => (
                             <button
                                key={key}
                                onClick={() => fill(key)}
                                className="w-10 h-10 bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm hover:bg-brand hover:text-white hover:border-brand transition-colors font-mono font-bold text-lg text-gray-700 dark:text-gray-200 active:scale-95"
                             >
                                 {key}
                             </button>
                         ))}
                     </div>
                 </div>
             )}
        </div>
    );
};

// --- 7. Callout Widget (Redesigned as Chat Bubble) ---
export const CalloutWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
  if (!widget.callout) return null;
  const { title, text, variant } = widget.callout;
  
  const styles = {
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-200 border-green-200 dark:border-green-800',
    tip: 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800',
  };

  return (
    <div className={`flex gap-4 mb-6`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm shrink-0 border-2 bg-white dark:bg-dark-card border-gray-200 dark:border-gray-700`}>
            {variant === 'tip' ? <Zap size={20} className="text-purple-500"/> : <Lightbulb size={20} className="text-yellow-500"/>}
        </div>
        <div className={`relative p-4 rounded-2xl rounded-tl-none max-w-[85%] text-sm shadow-sm border-2 ${styles[variant]}`}>
             <h4 className="font-extrabold text-xs uppercase mb-1 opacity-70 flex items-center gap-1">
                {title}
             </h4>
             <p className="font-medium">{formatText(text)}</p>
        </div>
    </div>
  );
};

// --- 9. Quiz Presenter ---
export const QuizWidgetPresenter: React.FC<{ widget: Widget, selectedIdx: number | null, onSelect: (i: number) => void, status: string }> = ({ widget, selectedIdx, onSelect, status }) => {
    if (!widget.quiz) return null;
    return (
        <div className="mb-6">
            <div className="flex gap-4 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm shrink-0 border-2 bg-brand text-white border-brand-dark">
                    <Bot size={20} />
                </div>
                <div className="bg-white dark:bg-dark-card border-2 border-gray-200 dark:border-gray-700 p-4 rounded-2xl rounded-tl-none shadow-sm text-gray-800 dark:text-dark-text font-bold">
                    {formatText(widget.quiz.question)}
                </div>
            </div>

            <div className="pl-14 space-y-2">
                {(widget.quiz.options || []).map((opt, idx) => {
                    let style = "border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400";
                    if (status === 'idle' && selectedIdx === idx) style = "border-brand bg-brand-bg dark:bg-brand/20 text-brand-dark dark:text-brand-light ring-2 ring-brand ring-offset-1 dark:ring-offset-dark-bg";
                    if (status === 'correct' && idx === widget.quiz!.correctIndex) style = "border-green-500 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200";
                    if (status === 'wrong' && idx === selectedIdx) style = "border-red-500 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200";
                    
                    return (
                        <button 
                            key={idx} 
                            onClick={() => status === 'idle' && onSelect(idx)} 
                            className={`w-full text-left p-4 rounded-xl border-2 ${style} transition-all text-sm font-bold shadow-sm active:scale-[0.99]`}
                        >
                           {formatText(opt)}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}