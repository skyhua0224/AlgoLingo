
import React, { useRef, useState, useEffect } from 'react';
import { Terminal, ChevronDown, Box, Hash, Type, Minus, Plus } from 'lucide-react';

const SUPPORTED_LANGUAGES = ['Python', 'Java', 'C++', 'JavaScript', 'Go', 'C'];

// VSCode-like Snippets (unchanged)
const SNIPPETS: Record<string, { label: string, code: string, detail: string }> = {
    'def': { label: 'def', code: 'def function_name(args):\n    pass', detail: 'Function definition' },
    'for': { label: 'for', code: 'for i in range(n):\n    pass', detail: 'For Loop' },
    'if': { label: 'if', code: 'if condition:\n    pass', detail: 'If Statement' },
    'elif': { label: 'elif', code: 'elif condition:\n    pass', detail: 'Else If' },
    'else': { label: 'else', code: 'else:\n    pass', detail: 'Else' },
    'class': { label: 'class', code: 'class ClassName:\n    def __init__(self):\n        pass', detail: 'Class Definition' },
    'print': { label: 'print', code: 'print("value")', detail: 'Print to console' },
    'while': { label: 'while', code: 'while condition:\n    pass', detail: 'While Loop' },
    'return': { label: 'return', code: 'return value', detail: 'Return value' },
    'import': { label: 'import', code: 'import module', detail: 'Import module' },
};

interface CodeEditorProps {
    code: string;
    language: string;
    onChange: (val: string) => void;
    onLanguageChange: (lang: string) => void;
}

declare const Prism: any;

export const CodeEditor: React.FC<CodeEditorProps> = ({ code, language, onChange, onLanguageChange }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const preRef = useRef<HTMLPreElement>(null);
    const measureRef = useRef<HTMLDivElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);
    
    // Snippet State
    const [suggestion, setSuggestion] = useState<{ word: string, top: number, left: number } | null>(null);
    const [fontSize, setFontSize] = useState(14); // Default 14px

    // --- EDITOR STYLE ---
    // Using simple box-sizing and padding ensures alignment.
    // We separate the gutter into a flex child.
    const getEditorStyle = () => ({
        fontFamily: '"JetBrains Mono", "Fira Code", "Menlo", "Consolas", monospace',
        fontSize: `${fontSize}px`,
        lineHeight: `${Math.round(fontSize * 1.5)}px`,
        letterSpacing: '0px',
        tabSize: 4,
        boxSizing: 'border-box' as const,
        whiteSpace: 'pre-wrap' as const,
        wordWrap: 'break-word' as const,
        margin: 0,
        padding: '16px', // Matches padding for both textarea and pre
        border: 'none',
        outline: 'none'
    });

    // --- 1. SCROLL SYNCHRONIZATION ---
    // Since we use flexbox, the textarea scrolls the container? No, textarea must be absolute overlay.
    // Reverting to overlay strategy but with cleaner container logic.
    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        if (preRef.current) {
            preRef.current.scrollTop = scrollTop;
            preRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }
        if (lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = scrollTop;
        }
        setSuggestion(null);
    };

    // --- 2. SYNTAX HIGHLIGHTING ---
    const getLangKey = (lang: string) => {
        const lower = lang.toLowerCase();
        if (lower === 'c++') return 'cpp';
        return lower;
    };
    
    const langKey = getLangKey(language);
    let highlighted = code;
    if (typeof Prism !== 'undefined' && Prism.languages[langKey]) {
        highlighted = Prism.highlight(code, Prism.languages[langKey], langKey);
    }

    // --- 3. CARET COORDINATE CALCULATION ---
    const updateCaretCoordinates = (cursorPos: number) => {
        if (!textareaRef.current || !measureRef.current) return;

        const text = textareaRef.current.value;
        const upToCursor = text.substring(0, cursorPos);
        
        // Ensure measure ref matches styles EXACTLY
        measureRef.current.innerHTML = upToCursor.replace(/\n/g, '<br/>') + '<span id="caret-marker">|</span>';
        
        const marker = measureRef.current.querySelector('#caret-marker') as HTMLElement;
        if (marker) {
            // Adjust for scroll
            const top = marker.offsetTop - textareaRef.current.scrollTop;
            const left = marker.offsetLeft - textareaRef.current.scrollLeft;
            // Add padding offset (16px)
            // Wait, measureRef is absolutely positioned AT TOP-LEFT of editor area (inside padding) or inclusive?
            // If measureRef has same style (padding: 16px), offsets are internal.
            // If offsetTop is relative to measureRef, we are good.
            
            // Actually, simplest is to make measureRef identical to pre/textarea
            return { top: top + Math.round(fontSize * 1.5), left: left };
        }
        return null;
    };

    // --- 4. INPUT HANDLING ---
    const detectKeyword = (text: string, cursorIndex: number) => {
        const textBeforeCursor = text.substring(0, cursorIndex);
        const match = textBeforeCursor.match(/([a-zA-Z0-9_]+)$/);
        
        if (match) {
            const word = match[1];
            if (SNIPPETS[word]) {
                const coords = updateCaretCoordinates(cursorIndex);
                if (coords) {
                    setSuggestion({ word, top: coords.top, left: coords.left });
                    return;
                }
            }
        }
        setSuggestion(null);
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        onChange(val);
        detectKeyword(val, e.target.selectionEnd);
    };

    const insertSnippet = () => {
        if (!suggestion || !textareaRef.current) return;
        
        const snippet = SNIPPETS[suggestion.word];
        if (!snippet) return;

        const val = textareaRef.current.value;
        const end = textareaRef.current.selectionEnd;
        const start = end - suggestion.word.length;
        
        if (val.substring(start, end) !== suggestion.word) return;

        const newVal = val.substring(0, start) + snippet.code + val.substring(end);
        onChange(newVal);
        setSuggestion(null);

        setTimeout(() => {
            if (textareaRef.current) {
                const indentIdx = snippet.code.indexOf('    ');
                const offset = indentIdx !== -1 ? indentIdx + 4 : snippet.code.length;
                textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + offset;
                textareaRef.current.focus();
            }
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (suggestion) {
            if (e.key === 'Tab' || e.key === 'Enter') {
                e.preventDefault();
                insertSnippet();
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                setSuggestion(null);
                return;
            }
        }

        if (e.key === 'Tab' && !suggestion) {
            e.preventDefault();
            const start = e.currentTarget.selectionStart;
            const end = e.currentTarget.selectionEnd;
            const val = e.currentTarget.value;
            const newVal = val.substring(0, start) + '    ' + val.substring(end);
            onChange(newVal);
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
                }
            }, 0);
        }
    };

    const editorStyle = getEditorStyle();
    // Line Numbers Style: Must match line-height and font-size
    const gutterStyle = {
        fontFamily: editorStyle.fontFamily,
        fontSize: editorStyle.fontSize,
        lineHeight: editorStyle.lineHeight,
        paddingTop: '16px', // Match editor padding
        paddingBottom: '16px'
    };

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] relative group select-none">
            {/* Toolbar */}
            <div className="h-10 bg-[#252526] border-b border-black/50 flex items-center px-4 justify-between shrink-0 z-20 select-none">
                <div className="flex items-center gap-3">
                    <Terminal size={14} className="text-blue-400"/>
                    <span className="text-xs font-bold text-gray-300 tracking-wide">CODE</span>
                </div>
                
                <div className="flex items-center gap-4">
                    {/* Font Controls */}
                    <div className="flex items-center gap-1 bg-[#333] rounded p-0.5">
                        <button onClick={() => setFontSize(Math.max(10, fontSize - 1))} className="p-1 hover:text-white text-gray-400 transition-colors">
                            <Minus size={10} />
                        </button>
                        <span className="text-[10px] text-gray-300 font-mono w-4 text-center">{fontSize}</span>
                        <button onClick={() => setFontSize(Math.min(24, fontSize + 1))} className="p-1 hover:text-white text-gray-400 transition-colors">
                            <Plus size={10} />
                        </button>
                    </div>

                    <div className="relative group/lang">
                        <button className="flex items-center gap-2 text-[10px] font-bold bg-[#333] hover:bg-[#444] px-3 py-1 rounded text-gray-300 transition-colors border border-gray-600">
                            {language} <ChevronDown size={12}/>
                        </button>
                        <div className="absolute top-full right-0 mt-1 w-32 bg-[#252526] border border-gray-600 rounded-lg shadow-2xl overflow-hidden hidden group-hover/lang:block z-50">
                             {SUPPORTED_LANGUAGES.map(lang => (
                                 <button 
                                    key={lang} 
                                    onClick={() => onLanguageChange(lang)} 
                                    className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-[#2a2d2e] hover:text-white ${lang === language ? 'text-brand bg-[#37373d]' : 'text-gray-400'}`}
                                 >
                                     {lang}
                                 </button>
                             ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Layout Container */}
            <div className="flex-1 flex overflow-hidden relative">
                
                {/* 1. Line Numbers Gutter */}
                <div 
                    ref={lineNumbersRef}
                    className="w-12 bg-[#1e1e1e] border-r border-[#333] text-right pr-3 text-[#858585] z-10 overflow-hidden select-none shrink-0"
                >
                    <div style={gutterStyle}>
                        {code.split('\n').map((_, i) => ( 
                            <div key={i}>{i + 1}</div> 
                        ))}
                    </div>
                </div>

                {/* 2. Editor Surface */}
                <div className="flex-1 relative">
                    {/* Measurement Div (Hidden) */}
                    <div 
                        ref={measureRef}
                        className="absolute top-0 left-0 w-full pointer-events-none invisible z-[-1]"
                        style={editorStyle}
                    />

                    {/* Syntax Highlight Layer (Passive) */}
                    <pre 
                        ref={preRef}
                        aria-hidden="true"
                        className={`absolute inset-0 w-full h-full m-0 pointer-events-none z-0 language-${langKey}`}
                        style={{ ...editorStyle, color: '#d4d4d4', overflow: 'hidden' }} // Hide scrollbars on pre, let textarea drive
                    >
                        <code dangerouslySetInnerHTML={{ __html: highlighted + '<br/>' }} />
                    </pre>

                    {/* Input Layer (Active) */}
                    <textarea 
                        ref={textareaRef}
                        value={code}
                        onChange={handleCodeChange}
                        onKeyDown={handleKeyDown}
                        onScroll={handleScroll}
                        className="absolute inset-0 w-full h-full m-0 bg-transparent text-transparent caret-white resize-none z-10 outline-none"
                        style={editorStyle}
                        spellCheck={false}
                        autoCapitalize="off"
                        autoComplete="off"
                        autoCorrect="off"
                    />

                    {/* VSCode-style Popup */}
                    {suggestion && (
                        <div 
                            className="absolute z-50 bg-[#252526] border border-[#454545] shadow-xl rounded-md w-64 overflow-hidden animate-fade-in-down"
                            style={{ 
                                top: suggestion.top, 
                                left: Math.min(suggestion.left, 200)
                            }}
                        >
                            <div className="flex items-center gap-2 p-2 bg-[#007acc] text-white text-xs font-bold border-b border-[#454545]">
                                <Box size={14} />
                                <span>Suggestion</span>
                                <span className="ml-auto opacity-75 text-[10px]">Tab to insert</span>
                            </div>
                            <div 
                                className="p-2 cursor-pointer hover:bg-[#2a2d2e] transition-colors flex items-start gap-3"
                                onClick={insertSnippet}
                            >
                                <div className="mt-0.5 p-1 bg-purple-500/20 text-purple-400 rounded">
                                    <Hash size={14}/>
                                </div>
                                <div>
                                    <div className="text-white text-sm font-bold font-mono">
                                        {SNIPPETS[suggestion.word].label}
                                    </div>
                                    <div className="text-gray-400 text-xs mt-0.5">
                                        {SNIPPETS[suggestion.word].detail}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Status Footer */}
            <div className="h-6 bg-[#007acc] text-white flex items-center px-3 text-[10px] font-bold justify-between select-none shrink-0">
                <div className="flex gap-4">
                    <span className="flex items-center gap-1">INSERT</span>
                    <span>{language}</span>
                </div>
                <div className="flex gap-2 opacity-80">
                    <span>Ln {code.substring(0, (textareaRef.current?.selectionStart || 0)).split('\n').length}</span>
                    <span>{fontSize}px</span>
                </div>
            </div>
        </div>
    );
};
