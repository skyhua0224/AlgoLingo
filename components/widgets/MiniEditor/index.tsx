
import React, { useState, useRef, useEffect } from 'react';
import { Widget } from '../../../types';
import { BaseWidget } from '../BaseWidget';
import { Play, Check, AlertTriangle, ChevronDown, Loader2, RefreshCw } from 'lucide-react';
import { validateUserCode } from '../../../services/geminiService';
import { useAppManager } from '../../../hooks/useAppManager';

const SUPPORTED_LANGUAGES = ['python', 'javascript', 'java', 'c++', 'go', 'c', 'c#', 'rust', 'typescript', 'glsl'];

interface MiniEditorProps {
    widget: Widget;
    onValidationChange?: (isValid: boolean) => void;
}

export const MiniEditorWidget: React.FC<MiniEditorProps> = ({ widget, onValidationChange }) => {
    if (!widget.miniEditor) return null;
    const { startingCode, validationRegex, taskDescription, language: initialLang } = widget.miniEditor;
    const { state } = useAppManager(); 
    
    const [code, setCode] = useState(startingCode);
    const [language, setLanguage] = useState(initialLang || 'python');
    const [isRunning, setIsRunning] = useState(false);
    const [consoleOutput, setConsoleOutput] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'fail'>('idle');
    const [showLangMenu, setShowLangMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowLangMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Reset validation on code edit
    const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCode(e.target.value);
        if (status !== 'idle') {
            setStatus('idle');
            if (onValidationChange) onValidationChange(false);
        }
    };

    const handleRun = async () => {
        setIsRunning(true);
        setStatus('running');
        setConsoleOutput("Running code analysis...");

        try {
            // Use AI Judge for robust simulation
            const result = await validateUserCode(
                code, 
                taskDescription || "Analyze this code.", 
                state.preferences, 
                language
            );

            let isValid = false;
            let outputMsg = "";

            // Strict Validation: Must be 'Accepted'. Partial passes are insufficient for mastery.
            if (result.status === 'Accepted') {
                isValid = true;
                outputMsg = result.test_cases?.[0]?.stdout || result.analysis?.pros?.[0] || "Execution successful.";
                setStatus('success');
            } else {
                isValid = false;
                outputMsg = `Error: ${result.error_message || result.test_cases?.find(t => !t.passed)?.actual || "Logic incorrect."}\nHint: ${result.analysis?.cons?.[0] || "Check your logic."}`;
                setStatus('fail');
            }
            
            setConsoleOutput(`> [${isValid ? 'SUCCESS' : 'FAILED'}] ${result.status}\n${outputMsg}`);
            if (onValidationChange) onValidationChange(isValid);

        } catch (e) {
            // Fallback to regex if AI fails
            if (validationRegex) {
                try {
                    const regex = new RegExp(validationRegex, 'i');
                    if (regex.test(code)) {
                        setStatus('success');
                        setConsoleOutput("> [LOCAL CHECK] Pattern matched. Output simulated: Valid.");
                        if (onValidationChange) onValidationChange(true);
                    } else {
                        setStatus('fail');
                        setConsoleOutput("> [LOCAL CHECK] Output incorrect. Validation pattern failed.");
                        if (onValidationChange) onValidationChange(false);
                    }
                } catch (err) {
                    setStatus('fail');
                    setConsoleOutput("> System Error: Validation Failed.");
                    if (onValidationChange) onValidationChange(false);
                }
            } else {
                // If no regex and AI failed, assume failure to be safe, or just log it.
                // Changing default behavior to 'fail' to prevent false positives when API is down.
                setStatus('fail');
                setConsoleOutput("> Error: Validation service unavailable. Please try again.");
                if (onValidationChange) onValidationChange(false);
            }
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <BaseWidget>
            {/* Main Container - Removed overflow-hidden to allow dropdown to pop out */}
            <div className="rounded-xl border border-gray-700 shadow-xl flex flex-col h-[400px] relative bg-[#1e1e1e]">
                {/* Toolbar */}
                <div className="bg-[#252526] px-4 py-2 flex justify-between items-center border-b border-black/50 z-30 relative rounded-t-xl">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Mini Editor</span>
                        <div className="h-4 w-px bg-gray-600 mx-2"></div>
                        
                        {/* Language Selector */}
                        <div className="relative" ref={menuRef}>
                            <button 
                                onClick={() => setShowLangMenu(!showLangMenu)}
                                className="flex items-center gap-1 text-xs text-gray-300 bg-[#37373d] px-2 py-0.5 rounded cursor-pointer hover:bg-[#45454d] transition-colors border border-transparent hover:border-gray-500"
                            >
                                {language} <ChevronDown size={12}/>
                            </button>
                            
                            {showLangMenu && (
                                <div className="absolute top-full left-0 mt-1 w-32 bg-[#252526] border border-gray-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
                                    {SUPPORTED_LANGUAGES.map(lang => (
                                        <button
                                            key={lang}
                                            onClick={() => { setLanguage(lang); setShowLangMenu(false); }}
                                            className={`w-full text-left px-3 py-2 text-xs hover:bg-[#37373d] transition-colors ${language === lang ? 'text-brand-light font-bold' : 'text-gray-400'}`}
                                        >
                                            {lang}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => { setCode(startingCode); setConsoleOutput(null); setStatus('idle'); if(onValidationChange) onValidationChange(false); }}
                            className="p-1.5 hover:bg-[#37373d] rounded text-gray-400 transition-colors"
                            title="Reset Code"
                        >
                            <RefreshCw size={14}/>
                        </button>
                    </div>
                </div>
                
                {/* Editor Area */}
                <div className="flex-1 relative flex flex-col z-0">
                    <div className="p-4 bg-[#1e1e1e] flex-1 overflow-auto">
                        <div className="text-gray-500 text-xs mb-2 font-mono italic border-l-2 border-gray-600 pl-2">
                            # Task: {taskDescription}
                        </div>
                        <textarea 
                            className="w-full h-full bg-transparent text-gray-200 font-mono text-sm outline-none resize-none leading-relaxed"
                            value={code}
                            onChange={handleCodeChange}
                            spellCheck={false}
                        />
                    </div>

                    {/* Console Drawer */}
                    {consoleOutput && (
                        <div className={`border-t border-gray-700 p-3 font-mono text-xs text-gray-300 max-h-[120px] overflow-y-auto animate-slide-in-bottom ${status === 'fail' ? 'bg-red-900/20' : 'bg-black/50'}`}>
                            <pre className="whitespace-pre-wrap">{consoleOutput}</pre>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="bg-[#252526] p-3 flex justify-between items-center border-t border-black/50 rounded-b-xl z-10">
                    <div className="text-xs font-mono">
                        {status === 'success' && <span className="text-green-400 flex items-center gap-1"><Check size={14}/> PASSED</span>}
                        {status === 'fail' && <span className="text-red-400 flex items-center gap-1"><AlertTriangle size={14}/> FAILED</span>}
                        {status === 'idle' && <span className="text-gray-500">Ready to run</span>}
                    </div>
                    <button 
                        onClick={handleRun}
                        disabled={isRunning}
                        className={`px-5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${isRunning ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : (status === 'fail' ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white')} shadow-lg active:translate-y-0.5`}
                    >
                        {isRunning ? <Loader2 size={14} className="animate-spin"/> : <Play size={14} fill="currentColor"/>}
                        {isRunning ? "Running..." : (status === 'fail' ? "Retry Run" : "Run Code")}
                    </button>
                </div>
            </div>
        </BaseWidget>
    );
};
