
import React, { useState, useRef, useEffect } from 'react';
import { SmartTagData } from '../../types/lesson';
import { BookOpen, Terminal, X } from 'lucide-react';

interface SmartTagProps {
    data: SmartTagData;
}

export const SmartTag: React.FC<SmartTagProps> = ({ data }) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node) && 
                triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative inline-block">
            <button
                ref={triggerRef}
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    px-3 py-1 rounded-full text-[11px] font-bold transition-all border shadow-sm
                    ${isOpen 
                        ? 'bg-brand text-white border-brand ring-2 ring-brand/20' 
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-brand hover:text-brand dark:hover:text-brand'
                    }
                `}
            >
                {data.name}
            </button>

            {isOpen && (
                <div 
                    ref={popoverRef}
                    className="absolute z-[100] top-full left-0 mt-2 w-72 md:w-80 bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-scale-in origin-top-left"
                >
                    <div className="bg-gray-50 dark:bg-black/30 px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-brand font-bold text-xs uppercase tracking-widest">
                            <BookOpen size={14} />
                            Concept
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                            <X size={14} />
                        </button>
                    </div>
                    
                    <div className="p-5">
                        <h4 className="text-base font-black text-gray-900 dark:text-white mb-2">{data.name}</h4>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4 font-medium">
                            {data.definition}
                        </p>
                        
                        <div className="bg-gray-50 dark:bg-[#1e1e1e] rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2 mb-2 text-gray-400 text-[10px] font-bold uppercase pb-1 border-b border-gray-200 dark:border-gray-700">
                                <Terminal size={12} /> Syntax
                            </div>
                            <code className="text-xs font-mono text-blue-600 dark:text-green-400 block whitespace-pre-wrap">
                                {data.codeSnippet}
                            </code>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
