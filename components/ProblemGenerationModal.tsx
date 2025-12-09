
import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, Brain, FileText, Zap } from 'lucide-react';
import { UserPreferences, LeetCodeContext, SolutionStrategy, ProblemData } from '../types';
import { generateLeetCodeContext, generateLeetCodeSolutions } from '../services/geminiService';

interface ProblemGenerationModalProps {
    problemName: string;
    preferences: UserPreferences;
    onComplete: (data: ProblemData) => void;
    onCancel: () => void;
}

export const ProblemGenerationModal: React.FC<ProblemGenerationModalProps> = ({ problemName, preferences, onComplete, onCancel }) => {
    const [step, setStep] = useState(1);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("Initializing...");
    const [context, setContext] = useState<LeetCodeContext | null>(null);

    // Auto-progress visual simulation
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (step === 1 && prev < 45) return prev + 1;
                if (step === 2 && prev < 90) return prev + 1;
                return prev;
            });
        }, 100);
        return () => clearInterval(interval);
    }, [step]);

    // Main Logic
    useEffect(() => {
        const generate = async () => {
            try {
                // Step 1: Context
                setStatus("Generating Problem Context (Description, Examples)...");
                const ctx = await generateLeetCodeContext(problemName, preferences);
                setContext(ctx);
                setStep(2);
                setProgress(50);

                // Step 2: Solutions
                setStatus("Generating 3 Optimal Solutions & Derivations...");
                const solData = await generateLeetCodeSolutions(ctx, preferences);
                setProgress(100);
                
                // Done
                const finalData: ProblemData = {
                    context: ctx,
                    solutions: solData.approaches,
                    timestamp: Date.now()
                };
                
                setTimeout(() => onComplete(finalData), 500);

            } catch (e) {
                console.error(e);
                alert("Generation failed. Please check connection.");
                onCancel();
            }
        };
        generate();
    }, []);

    return (
        <div className="fixed inset-0 z-[200] bg-white/95 dark:bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in-up">
            <div className="w-full max-w-md text-center">
                <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <div className="absolute inset-0 border-4 border-brand/20 rounded-full animate-spin-slow"></div>
                    <Brain size={40} className="text-brand animate-pulse" />
                </div>
                
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                    {step === 1 ? "Analyzing Problem..." : "Forging Solutions..."}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 font-medium">
                    Preparing specialized training data for "{problemName}"
                </p>

                {/* Steps Visualizer */}
                <div className="flex justify-between mb-2 text-xs font-bold uppercase tracking-wider text-gray-400 px-4">
                    <span className={step >= 1 ? "text-brand" : ""}>1. Context</span>
                    <span className={step >= 2 ? "text-brand" : ""}>2. Strategy</span>
                </div>
                
                {/* Progress Bar */}
                <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden relative mb-4">
                    <div 
                        className="h-full bg-brand transition-all duration-300 ease-out" 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-mono">
                    <Loader2 size={12} className="animate-spin" />
                    {status}
                </div>
            </div>
        </div>
    );
};
