
import React, { useState, useEffect, useRef } from 'react';
import { CareerSession, InterviewTurn } from '../../types/career';
import { UserPreferences } from '../../types';
import { generateNextTurn } from '../../services/ai/career/generator';
import { VirtualWorkspace } from '../VirtualWorkspace';
import { QuizWidget } from '../widgets/Quiz';
import { FillInWidget } from '../widgets/FillIn';
import { X, Clock, Send, Loader2, Mic, CheckCircle2, Bot, User, AlertCircle, Volume2, VolumeX, Layout } from 'lucide-react';
import { Button } from '../Button';

interface InterviewRunnerProps {
    session: CareerSession;
    onUpdateSession: (session: CareerSession) => void;
    onExit: () => void;
    preferences: UserPreferences;
    language: 'Chinese' | 'English';
}

const PERSONA_AVATARS: Record<string, string> = {
    'google': 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png',
    'amazon': 'https://cdn-icons-png.flaticon.com/512/732/732200.png',
    'startup': 'https://cdn-icons-png.flaticon.com/512/4202/4202843.png'
};

export const InterviewRunner: React.FC<InterviewRunnerProps> = ({ session, onUpdateSession, onExit, preferences, language }) => {
    const isZh = language === 'Chinese';
    
    // State
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    
    // Voice State
    const [isListening, setIsListening] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Widget Interaction State
    const [quizSelection, setQuizSelection] = useState<number | null>(null);
    const [fillInAnswers, setFillInAnswers] = useState<string[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Get current active turn
    const turns = session.turns;
    const currentTurn = turns[turns.length - 1];
    const hasStarted = turns.length > 0;

    // --- SPEECH RECOGNITION SETUP ---
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = isZh ? 'zh-CN' : 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(prev => prev ? `${prev} ${transcript}` : transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech Error", event.error);
                setIsListening(false);
            };
            
            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, [isZh]);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition not supported in this browser.");
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setIsListening(true);
            recognitionRef.current.start();
        }
    };

    // --- TTS OUTPUT ---
    useEffect(() => {
        if (voiceEnabled && currentTurn && currentTurn.role === 'ai' && currentTurn.message && !isThinking) {
            // Cancel previous speech
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(currentTurn.message);
            utterance.lang = isZh ? 'zh-CN' : 'en-US';
            utterance.rate = 1.0;
            window.speechSynthesis.speak(utterance);
        }
    }, [currentTurn?.id, voiceEnabled, isThinking, isZh]);

    // Reset interaction state on new turn
    useEffect(() => {
        setQuizSelection(null);
        setFillInAnswers([]);
        // Auto scroll to bottom
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    }, [currentTurn?.id, turns.length]);

    // Timer Logic
    useEffect(() => {
        if (currentTurn && currentTurn.status === 'pending' && currentTurn.timeLimit) {
            setTimeLeft(currentTurn.timeLimit);
            
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleAutoSubmit(); 
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            
            return () => clearInterval(timer);
        }
    }, [currentTurn?.id]);

    const handleAutoSubmit = () => {
        if (currentTurn.status === 'pending') {
            handleUserAction("(System: Time limit exceeded. Auto-submitted state.)");
        }
    };

    const handleUserAction = async (content: string) => {
        if (isThinking) return;
        setIsThinking(true);
        window.speechSynthesis.cancel(); // Stop AI talking

        // 1. Update current turn
        const updatedTurns = [...session.turns];
        const lastTurn = updatedTurns[updatedTurns.length - 1];
        if (lastTurn) {
            lastTurn.status = 'completed';
            lastTurn.userResponse = content; 
        }
        
        const updatedSession = { ...session, turns: updatedTurns };
        onUpdateSession(updatedSession);
        setInput('');

        try {
            // 2. Generate Next Turn
            const nextTurn = await generateNextTurn(updatedSession, preferences);
            
            const finalTurns = [...updatedTurns, nextTurn];
            onUpdateSession({ ...updatedSession, turns: finalTurns });
            
        } catch (e) {
            console.error(e);
            alert("Connection lost. Please try again.");
        } finally {
            setIsThinking(false);
        }
    };

    const handleSubmitWidget = () => {
        // Handle Quiz Submission
        if (currentTurn.type === 'quiz' || (currentTurn.payload?.widgets?.some(w => w.type === 'quiz'))) {
            const widget = currentTurn.payload?.widgets?.find(w => w.type === 'quiz');
            if (widget && widget.quiz && quizSelection !== null) {
                const selectedText = widget.quiz.options[quizSelection];
                const isCorrect = quizSelection === widget.quiz.correctIndex;
                handleUserAction(`[Selected Option: "${selectedText}". (System Check: ${isCorrect ? 'Correct' : 'Incorrect'})]`);
                return;
            }
        }
        
        // Handle Fill-in Submission
        if (fillInAnswers.length > 0) {
            handleUserAction(`[Fill-in Answers: ${fillInAnswers.join(', ')}]`);
            return;
        }
    };

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    };

    const renderContent = (turn: InterviewTurn, isLast: boolean) => {
        const isPending = turn.status === 'pending';

        // 1. Coding Task
        if (turn.type === 'coding') {
            // Robustness Check: Ensure coding context is valid before rendering workspace
            if (!turn.payload?.codingContext || !turn.payload.codingContext.meta) {
                return (
                    <div className="w-full max-w-4xl my-4 p-4 bg-red-900/20 border border-red-700 rounded-xl text-red-400 flex items-center gap-2">
                        <AlertCircle size={20}/>
                        <p>System Error: Failed to load coding environment. Please skip or ask to proceed.</p>
                    </div>
                );
            }

            return (
                <div className="w-full max-w-4xl my-4 border border-gray-700 rounded-xl overflow-hidden bg-[#1e1e1e] shadow-2xl">
                    <div className="h-[600px]">
                        {isPending ? (
                            <VirtualWorkspace 
                                context={turn.payload.codingContext}
                                preferences={preferences}
                                onSuccess={() => handleUserAction("[CODE SUBMITTED: Passed test cases]")}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <CheckCircle2 size={48} className="mb-4 text-green-500"/>
                                <p>Code Submitted</p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // 2. System Design
        if (turn.type === 'system_design' && turn.payload?.systemDesign) {
            return (
                <div className="w-full max-w-4xl my-4 border border-gray-700 rounded-xl overflow-hidden bg-[#1e1e1e] shadow-2xl">
                    {isPending ? (
                        <div className="h-[400px] flex flex-col items-center justify-center p-8 text-center">
                            <div className="p-4 bg-gray-800 rounded-full mb-4">
                                <Layout size={48} className="text-gray-400"/>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">System Design Challenge</h3>
                            <p className="text-gray-400 mb-6 max-w-md text-sm">{turn.payload.systemDesign.goal}</p>
                            <Button size="md" onClick={() => handleUserAction("[DESIGN SUBMITTED]")}>
                                {isZh ? "提交架构设计" : "Submit Design"}
                            </Button>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">Architecture Diagram Submitted</div>
                    )}
                </div>
            );
        }

        // 3. Quiz / Widgets
        if ((turn.type === 'quiz' || turn.type === 'text') && turn.payload?.widgets && turn.payload.widgets.length > 0) {
            return (
                <div className="w-full max-w-2xl my-4 space-y-4">
                    {turn.payload.widgets.map((w, i) => (
                        <div key={i} className="bg-[#1e1e1e] p-4 rounded-2xl border border-gray-700">
                            {w.type === 'quiz' && (
                                <QuizWidget 
                                    widget={w} 
                                    selectedIdx={isPending ? quizSelection : null} // Only show selection if pending
                                    onSelect={isPending ? setQuizSelection : () => {}} 
                                    status={!isPending ? 'idle' : 'idle'} // Keep visual clean
                                    language={language}
                                />
                            )}
                            {w.type === 'fill-in' && (
                                <FillInWidget 
                                    widget={w} 
                                    onUpdateAnswers={setFillInAnswers} 
                                    language={language} 
                                    status={!isPending ? 'idle' : 'idle'} 
                                />
                            )}
                        </div>
                    ))}
                    {isPending && (
                        <div className="flex gap-2">
                            <Button 
                                onClick={handleSubmitWidget} 
                                disabled={quizSelection === null && fillInAnswers.length === 0}
                                className="flex-1 py-3 shadow-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isZh ? "提交答案" : "Submit Answer"}
                            </Button>
                            <div className="text-xs text-gray-500 flex items-center px-2">
                                {isZh ? "或直接在下方输入..." : "Or type below..."}
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return null;
    };

    return (
        <div className="fixed inset-0 bg-[#0f172a] text-white z-[150] flex flex-col overflow-hidden font-sans">
            {/* Header */}
            <div className="h-16 border-b border-gray-800 flex items-center justify-between px-4 md:px-8 bg-[#0a0a0a]/90 backdrop-blur shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-50 to-blue-500 p-0.5">
                        <img src={PERSONA_AVATARS[session.companyId] || PERSONA_AVATARS['startup']} className="w-full h-full rounded-full bg-black object-cover" alt="logo"/>
                    </div>
                    <div>
                        <div className="font-bold text-base leading-none mb-1">{session.companyName}</div>
                        <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            LIVE INTERVIEW
                        </div>
                    </div>
                </div>
                
                {currentTurn?.status === 'pending' && currentTurn.timeLimit && (
                    <div className={`flex items-center gap-3 font-mono text-lg font-bold px-4 py-1.5 rounded-full border ${timeLeft < 30 ? 'bg-red-900/20 border-red-500 text-red-500 animate-pulse' : 'bg-gray-900 border-gray-700 text-gray-300'}`}>
                        <Clock size={16} />
                        {formatTime(timeLeft)}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setVoiceEnabled(!voiceEnabled)}
                        className={`p-2 rounded-full transition-colors ${voiceEnabled ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
                        title={isZh ? "语音输出" : "Voice Output"}
                    >
                        {voiceEnabled ? <Volume2 size={20}/> : <VolumeX size={20}/>}
                    </button>
                    <button onClick={onExit} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
                        <X size={24}/>
                    </button>
                </div>
            </div>

            {/* Chat Stream */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-0 bg-[#0f172a]">
                <div className="max-w-4xl mx-auto w-full pb-32 pt-8 space-y-8 min-h-full flex flex-col justify-end">
                    {/* Intro Spacer */}
                    {turns.length === 0 && (
                        <div className="text-center text-gray-600 py-20">
                            <Loader2 size={32} className="animate-spin mx-auto mb-4"/>
                            <p>Connecting to interviewer...</p>
                        </div>
                    )}

                    {turns.map((turn, i) => {
                        const isLast = i === turns.length - 1;
                        return (
                            <div key={turn.id} className="space-y-2 animate-fade-in-up">
                                {/* AI Message */}
                                {turn.role === 'ai' && (
                                    <div className="flex gap-4 items-start">
                                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center shrink-0 mt-1 border border-gray-700">
                                            <Bot size={20} className="text-gray-400"/>
                                        </div>
                                        <div className="space-y-4 max-w-[90%] w-full">
                                            {turn.message && (
                                                <div className="bg-gray-800/80 border border-gray-700 rounded-2xl rounded-tl-none p-5 text-gray-200 leading-relaxed shadow-sm">
                                                    {turn.message}
                                                </div>
                                            )}
                                            {/* Interactive Payload */}
                                            {renderContent(turn, isLast)}
                                        </div>
                                    </div>
                                )}

                                {/* User Response */}
                                {turn.userResponse && (
                                    <div className="flex justify-end gap-4 items-start">
                                        <div className="max-w-[80%] bg-blue-600 text-white rounded-2xl rounded-tr-none p-4 text-base leading-relaxed shadow-md">
                                            {turn.userResponse.startsWith('[') 
                                                ? <span className="italic opacity-90 font-mono text-sm flex items-center gap-2"><CheckCircle2 size={14}/> {turn.userResponse}</span> 
                                                : turn.userResponse
                                            }
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center shrink-0 mt-1 border border-blue-700">
                                            <User size={20} className="text-blue-200"/>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    
                    {isThinking && (
                        <div className="flex gap-4 items-center animate-pulse">
                            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center shrink-0 border border-gray-700">
                                <Bot size={20} className="text-gray-400"/>
                            </div>
                            <div className="text-gray-500 text-sm italic">Thinking...</div>
                        </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-6 bg-[#0a0a0a]/90 backdrop-blur border-t border-gray-800 shrink-0">
                <div className="max-w-4xl mx-auto relative flex gap-2">
                    <button 
                        onClick={toggleListening}
                        className={`p-4 rounded-2xl transition-all flex items-center justify-center ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        <Mic size={20} />
                    </button>
                    <div className="flex-1 relative">
                        <input 
                            className="w-full bg-gray-900 border border-gray-700 rounded-2xl pl-5 pr-14 py-4 text-base text-white focus:border-blue-500 outline-none transition-all placeholder-gray-600 shadow-lg"
                            placeholder={isZh ? "输入回答 (支持语音)..." : "Type answer (voice supported)..."}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUserAction(input)}
                            disabled={isThinking}
                            autoFocus
                        />
                        <button 
                            onClick={() => handleUserAction(input)}
                            disabled={!input.trim() || isThinking}
                            className="absolute right-2 top-2 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-0 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                        >
                            <Send size={18}/>
                        </button>
                    </div>
                </div>
                <div className="text-center mt-2 text-[10px] text-gray-600 font-mono">
                    ALGO-LINGO AI INTERVIEW SIMULATION V3.1
                </div>
            </div>
        </div>
    );
};
