
import React, { useState } from 'react';
import { SyntaxOrigin } from '../../../../types';
import { Sparkles, ArrowRight, GraduationCap, Layers, Code2, Zap } from 'lucide-react';

interface SetupViewProps {
    targetLang: string;
    onInitialize: (mode: SyntaxOrigin, sourceLang?: string) => void;
    language: 'Chinese' | 'English';
}

export const SetupView: React.FC<SetupViewProps> = ({ targetLang, onInitialize, language }) => {
    const isZh = language === 'Chinese';
    const [step, setStep] = useState<'intro' | 'mode'>('intro');

    const MODES = [
        { 
            id: 'null', 
            icon: GraduationCap, 
            title: isZh ? "从零开始" : "Novice", 
            desc: isZh ? "我是编程新手，从变量开始学" : "I'm new to coding. Start from scratch." 
        },
        { 
            id: 'mapped', 
            icon: Layers, 
            title: isZh ? "语言迁移" : "Migrator", 
            desc: isZh ? "我精通其他语言，教我差异" : "I know other langs. Teach me the diffs." 
        },
        { 
            id: 'augmented', 
            icon: Sparkles, 
            title: isZh ? "AI 补完" : "Vibe Coder", 
            desc: isZh ? "我常靠 AI 写代码，需要补基础" : "I use AI a lot. Fix my syntax gaps." 
        },
        { 
            id: 'rusty', 
            icon: Zap, 
            title: isZh ? "底层深潜" : "Expert Deep Dive", 
            desc: isZh ? "我是老手，直接讲内存与并发" : "Skip basics. Memory, Async, Internals." 
        }
    ];

    if (step === 'intro') {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 dark:bg-black/20">
                <div className="w-20 h-20 bg-white dark:bg-dark-card rounded-3xl shadow-xl flex items-center justify-center mb-6 animate-bounce-slow">
                    <Code2 size={40} className="text-brand" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">
                    {isZh ? `初始化 ${targetLang} 链接` : `Initialize ${targetLang} Uplink`}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8 text-sm font-medium leading-relaxed">
                    {isZh 
                     ? "我们将为你构建专属的神经语法树。请告诉我们你的背景。" 
                     : "We will construct a neural syntax tree tailored to your background."}
                </p>
                <button 
                    onClick={() => setStep('mode')}
                    className="px-8 py-4 bg-brand text-white rounded-2xl font-bold shadow-lg hover:bg-brand-light hover:scale-105 transition-all flex items-center gap-2"
                >
                    {isZh ? "开始配置" : "Begin Setup"} <ArrowRight size={20} />
                </button>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 overflow-y-auto p-6 md:p-12 bg-gray-50/50 dark:bg-black/20 animate-fade-in-up">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-8 text-center">
                {isZh ? "选择你的修炼模式" : "Select Your Path"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {MODES.map(mode => (
                    <button
                        key={mode.id}
                        onClick={() => onInitialize(mode.id as SyntaxOrigin, mode.id === 'mapped' ? 'Java' : undefined)} // Mock Java as source for demo
                        className="flex flex-col items-start p-6 bg-white dark:bg-dark-card border-2 border-gray-100 dark:border-gray-800 rounded-2xl hover:border-brand dark:hover:border-brand hover:shadow-lg transition-all group text-left"
                    >
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl mb-4 text-gray-500 group-hover:text-brand group-hover:bg-brand/10 transition-colors">
                            <mode.icon size={24} />
                        </div>
                        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-1">{mode.title}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{mode.desc}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};
