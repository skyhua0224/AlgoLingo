
import React, { useState, useMemo } from 'react';
import { SyntaxProfile, SyntaxOrigin, SyntaxObjective, LearningModality, LearningAttributes } from '../../../../types/engineering';
import { 
    ArrowRight, Layers, Sparkles, Zap, 
    BookOpen, PenTool, Cpu, Search, Check, Terminal,
    Keyboard, Activity, Eye, Crown, GraduationCap, Target, RefreshCw
} from 'lucide-react';
import { generateSyntaxRoadmap } from '../../../../services/geminiService';
import { UserPreferences } from '../../../../types';

interface SetupWizardProps {
    targetLang: string;
    onComplete: (profile: SyntaxProfile) => void;
    language: 'Chinese' | 'English';
    preferences: UserPreferences;
}

type Step = 'context' | 'goal' | 'manifest' | 'generating';

export const SetupWizard: React.FC<SetupWizardProps> = ({ targetLang, onComplete, language, preferences }) => {
    const isZh = language === 'Chinese';
    
    const [step, setStep] = useState<Step>('context');
    
    // Configuration State
    const [origin, setOrigin] = useState<SyntaxOrigin>('null');
    const [sourceLang, setSourceLang] = useState<string>('Java');
    const [objective, setObjective] = useState<SyntaxObjective>('algo');
    const [customObjective, setCustomObjective] = useState('');

    // --- AUTO-DERIVE LOGIC ---
    const derivedConfig = useMemo(() => {
        let modality: LearningModality = 'deep'; // Default
        let attributes: LearningAttributes = { 
            handwriting: false, repetition: false, visual: false, internals: false, audit: false 
        };
        let strategyName = isZh ? "标准路径" : "Standard Path";

        // 1. Base Modality from Goal
        switch (objective) {
            case 'algo': 
                modality = 'drill';
                strategyName = isZh ? "算法特训" : "Algorithm Drill";
                break;
            case 'backend': 
                modality = 'deep';
                strategyName = isZh ? "系统架构" : "System Architecture";
                break;
            case 'data': 
                modality = 'rapid';
                strategyName = isZh ? "数据脚本" : "Data Scripting";
                break;
            case 'internals': 
                modality = 'deep';
                strategyName = isZh ? "编译原理" : "Compiler Internals";
                break;
            case 'mastery': 
                modality = 'deep';
                strategyName = isZh ? "纯粹精通" : "Pure Mastery";
                break;
            case 'academic': 
                modality = 'audit';
                strategyName = isZh ? "学术理论" : "Academic Theory";
                break;
            case 'custom':
                modality = 'deep'; // Safer default
                strategyName = isZh ? "自定义路径" : "Custom Path";
                break;
        }

        // 2. Origin Overrides (The "Calibration")
        if (origin === 'null') {
            modality = 'drill';
            attributes.handwriting = true;
            attributes.repetition = true;
            attributes.visual = true; // Beginners need visuals
            strategyName = isZh ? "基石构建协议" : "Foundation Protocol";
        } else if (origin === 'augmented') {
            modality = 'drill'; // "Handwriting Rehab" - core feature for AI users
            attributes.handwriting = true;
            attributes.audit = true; // Also need to read AI code
            strategyName = isZh ? "神经强化" : "Neural Reinforcement";
        } else if (origin === 'mapped') {
            attributes.visual = true; // Diagrams comparing Lang A vs B
            // Modality keeps goal preference, but attributes tweaked
        } else if (origin === 'rusty') {
            attributes.repetition = false; // Don't bore them
            attributes.visual = true; // Quick memory joggers
        }

        // 3. Specific Attribute Tuning based on Modality (if not set by origin)
        if (!attributes.handwriting && modality === 'drill') attributes.handwriting = true;
        if (!attributes.internals && modality === 'deep') attributes.internals = true;
        if (!attributes.audit && modality === 'audit') attributes.audit = true;
        if (!attributes.visual && modality === 'rapid') attributes.visual = true;

        return { modality, attributes, strategyName };
    }, [origin, objective, isZh]);

    const handleGenerate = async () => {
        setStep('generating');
        
        const baseProfile: SyntaxProfile = {
            language: targetLang,
            origin,
            sourceLanguage: origin === 'mapped' ? sourceLang : undefined,
            objective,
            customObjective: objective === 'custom' ? customObjective : undefined,
            modality: derivedConfig.modality,
            attributes: derivedConfig.attributes,
            roadmap: [], // To be filled by AI
            strategyName: derivedConfig.strategyName,
            createdAt: Date.now()
        };

        try {
            const roadmap = await generateSyntaxRoadmap(baseProfile, preferences);
            
            const finalProfile: SyntaxProfile = {
                ...baseProfile,
                roadmap: roadmap,
                currentUnitId: roadmap[0]?.id || ''
            };
            
            onComplete(finalProfile);
        } catch (e) {
            console.error("Setup Failed", e);
            alert("Generation Failed. Please try again.");
            setStep('manifest');
        }
    };

    // --- STEP 1: CONTEXT (Origin) ---
    if (step === 'context') {
        return (
            <div className="h-full flex flex-col p-6 md:p-10 overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto w-full">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center justify-center w-10 h-10 bg-brand/10 rounded-xl text-brand">
                            <BookOpen size={20}/>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{isZh ? "学习背景" : "Learning Context"}</h2>
                            <p className="text-sm text-gray-500 font-medium">{isZh ? `你目前对 ${targetLang} 的熟悉程度如何？` : `What is your experience with ${targetLang}?`}</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { id: 'null', icon: GraduationCap, title: isZh ? '零基础入门' : 'Zero Basis', desc: isZh ? '我从未写过代码，或者刚开始接触。' : 'New to programming. Need foundations.' },
                            { id: 'mapped', icon: Layers, title: isZh ? '技术栈迁移' : 'Tech Stack Migration', desc: isZh ? '我精通其他语言，想快速上手这门语言。' : 'Expert in other langs. Mapping concepts.' },
                            { id: 'augmented', icon: Sparkles, title: isZh ? '实战补强' : 'Practical Reinforcement', desc: isZh ? '我常写代码（或用AI），但基础语法不扎实。' : 'I can build things, but syntax is shaky.' },
                            { id: 'rusty', icon: RefreshCw, title: isZh ? '重拾技能' : 'Refresher', desc: isZh ? '以前学过，现在忘得差不多了。' : 'Used it before, coming back to it.' }
                        ].map((opt) => (
                            <button 
                                key={opt.id}
                                onClick={() => { setOrigin(opt.id as any); }}
                                className={`p-5 rounded-2xl border-2 text-left transition-all group relative overflow-hidden ${origin === opt.id ? 'border-brand bg-brand/5 ring-1 ring-brand shadow-md' : 'border-gray-200 dark:border-gray-700 hover:border-brand/50 bg-white dark:bg-dark-card'}`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${origin === opt.id ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 group-hover:text-brand'}`}>
                                        <opt.icon size={20} />
                                    </div>
                                    {origin === opt.id && <Check size={20} className="text-brand"/>}
                                </div>
                                <h3 className="font-bold text-gray-800 dark:text-white text-base mb-1">{opt.title}</h3>
                                <p className="text-xs text-gray-500 leading-relaxed">{opt.desc}</p>
                            </button>
                        ))}
                    </div>

                    {origin === 'mapped' && (
                        <div className="mt-6 animate-fade-in-up bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-3 block tracking-wider flex items-center gap-2">
                                <Layers size={14}/>
                                {isZh ? "你最擅长的语言是？" : "Which language do you know best?"}
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {['Java', 'C++', 'JavaScript', 'Go', 'C#', 'Python', 'Rust', 'Swift'].filter(l => l !== targetLang).map(l => (
                                    <button 
                                        key={l}
                                        onClick={() => setSourceLang(l)}
                                        className={`px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${sourceLang === l ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-900 border-transparent shadow-md' : 'bg-white dark:bg-dark-card border-gray-200 dark:border-gray-600 hover:border-gray-400'}`}
                                    >
                                        {l}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-8 flex justify-end">
                        <button 
                            onClick={() => setStep('goal')} 
                            className="px-8 py-3.5 bg-brand text-white rounded-xl font-bold hover:bg-brand-light transition-all flex items-center gap-2 shadow-lg shadow-brand/20"
                        >
                            {isZh ? "下一步" : "Next Step"} <ArrowRight size={18}/>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- STEP 2: GOAL ---
    if (step === 'goal') {
        return (
            <div className="h-full flex flex-col p-6 md:p-10 overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto w-full">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600">
                            <Target size={20}/>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{isZh ? "学习目标" : "Learning Goal"}</h2>
                            <p className="text-sm text-gray-500 font-medium">{isZh ? "AI 将根据目标调整课程深度与侧重点。" : "AI adapts the curriculum depth based on this."}</p>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        {[
                            { id: 'algo', icon: Activity, title: isZh ? '算法面试 / 刷题' : 'Algorithms & LeetCode', desc: isZh ? '侧重标准库容器(Collections)与时间复杂度。' : 'Focus on Collections & Big O.' },
                            { id: 'backend', icon: Cpu, title: isZh ? '后端系统开发' : 'Backend Systems', desc: isZh ? '侧重并发、框架与工程实践。' : 'Concurrency, Frameworks, Engineering.' },
                            { id: 'data', icon: Eye, title: isZh ? '数据科学 / 脚本' : 'Data & Scripting', desc: isZh ? '侧重数据处理管线与快速原型。' : 'Pipelines & Quick Prototypes.' },
                            { id: 'internals', icon: Zap, title: isZh ? '底层原理 / 编译器' : 'Internals & Compiler', desc: isZh ? '侧重内存管理、GC与字节码。' : 'Memory, GC, Bytecode.' },
                            { id: 'custom', icon: Terminal, title: isZh ? '自定义目标' : 'Custom Goal', desc: isZh ? '输入你的特定需求。' : 'Enter specific requirements.' }
                        ].map((opt) => (
                            <button 
                                key={opt.id}
                                onClick={() => { setObjective(opt.id as any); }}
                                className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 group transition-all ${objective === opt.id ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10 ring-1 ring-purple-500' : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 bg-white dark:bg-dark-card'}`}
                            >
                                <div className={`p-2.5 rounded-lg shrink-0 ${objective === opt.id ? 'bg-purple-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:text-purple-500'}`}>
                                    <opt.icon size={20} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-800 dark:text-white text-sm">{opt.title}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</p>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${objective === opt.id ? 'border-purple-500 bg-purple-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                                    {objective === opt.id && <Check size={12} strokeWidth={3} />}
                                </div>
                            </button>
                        ))}
                    </div>

                    {objective === 'custom' && (
                        <div className="mt-4 animate-fade-in-up pl-1">
                            <input 
                                type="text" 
                                placeholder={isZh ? "例如：编写 Minecraft 模组..." : "e.g., Writing Minecraft mods..."}
                                className="w-full p-4 rounded-xl border-2 border-purple-300 focus:border-purple-500 outline-none bg-white dark:bg-dark-card font-bold text-sm"
                                value={customObjective}
                                onChange={(e) => setCustomObjective(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && customObjective && setStep('manifest')}
                                autoFocus
                            />
                        </div>
                    )}

                    <div className="mt-8 flex justify-end">
                        <button 
                            onClick={() => setStep('manifest')}
                            disabled={objective === 'custom' && !customObjective.trim()}
                            className="px-8 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isZh ? "生成学习路径" : "Generate Path"} <Sparkles size={18}/>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- STEP 3: MANIFEST (PREVIEW) ---
    if (step === 'manifest') {
        const { strategyName, attributes, modality } = derivedConfig;
        
        return (
            <div className="h-full flex flex-col p-6 md:p-10 bg-gray-50 dark:bg-black/20 overflow-y-auto custom-scrollbar">
                <div className="flex-1 max-w-3xl mx-auto w-full">
                    <div className="flex items-center gap-2 text-brand font-bold text-xs uppercase tracking-widest mb-6">
                        <Terminal size={14} />
                        {isZh ? "AI 生成配置清单" : "AI Config Manifest"}
                    </div>
                    
                    <div className="bg-white dark:bg-dark-card p-6 md:p-8 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl font-mono text-sm space-y-6 relative overflow-hidden mb-8">
                        {/* Decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full -mr-10 -mt-10 blur-xl"></div>

                        <div>
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1 block">{isZh ? "策略代号" : "STRATEGY_CODENAME"}</span>
                            <span className="text-2xl font-black text-gray-900 dark:text-white">{strategyName.toUpperCase()}</span>
                        </div>

                        <div className="flex justify-between border-b border-dashed border-gray-200 dark:border-gray-700 pb-4">
                            <div>
                                <span className="text-gray-400 text-xs block mb-1">{isZh ? "目标语言" : "TARGET"}</span>
                                <span className="font-bold text-brand">{targetLang}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-gray-400 text-xs block mb-1">{isZh ? "上下文" : "CONTEXT"}</span>
                                <span className="font-bold text-gray-700 dark:text-gray-300">{origin === 'mapped' ? `Expert (${sourceLang})` : origin.toUpperCase()}</span>
                            </div>
                        </div>

                        <div>
                            <span className="text-gray-400 text-xs block mb-2">{isZh ? "优化模块" : "OPTIMIZATION_MODULES"}</span>
                            <div className="flex flex-wrap gap-2">
                                {attributes.handwriting && <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs font-bold rounded flex items-center gap-1"><Keyboard size={10}/> {isZh ? "手写强化" : "HANDWRITING"}</span>}
                                {attributes.visual && <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 text-xs font-bold rounded flex items-center gap-1"><Eye size={10}/> {isZh ? "视觉辅助" : "VISUALS"}</span>}
                                {attributes.audit && <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 text-xs font-bold rounded flex items-center gap-1"><Search size={10}/> {isZh ? "代码审查" : "AUDIT"}</span>}
                                {attributes.internals && <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs font-bold rounded flex items-center gap-1"><Cpu size={10}/> {isZh ? "内核原理" : "INTERNALS"}</span>}
                                {attributes.repetition && <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 text-xs font-bold rounded flex items-center gap-1"><Activity size={10}/> {isZh ? "刻意练习" : "DRILL"}</span>}
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-xl text-xs text-gray-500 italic border border-gray-100 dark:border-gray-800">
                            {isZh 
                             ? `AI 已根据你的“${origin}”身份和“${objective}”目标自动推导了最佳训练手段。`
                             : `AI has auto-derived the optimal modality based on your '${origin}' origin and '${objective}' goal.`}
                        </div>
                    </div>

                    <button 
                        onClick={handleGenerate}
                        className="w-full py-4 bg-brand text-white rounded-2xl font-bold shadow-lg hover:bg-brand-light flex items-center justify-center gap-3 hover:scale-[1.02] transition-all group"
                    >
                        <Check size={20} className="group-hover:scale-125 transition-transform" />
                        {isZh ? "确认并生成矩阵" : "Confirm & Generate Matrix"}
                    </button>
                </div>
            </div>
        );
    }

    // --- GENERATING STATE ---
    return (
        <div className="flex flex-col items-center justify-center h-full animate-fade-in-up p-8 text-center">
            <div className="relative w-32 h-32 mb-8">
                <div className="absolute inset-0 bg-brand/20 rounded-full animate-ping duration-1000"></div>
                <div className="absolute inset-2 bg-brand/40 rounded-full animate-pulse duration-2000"></div>
                <div className="relative bg-white dark:bg-dark-card rounded-full w-full h-full p-8 shadow-2xl border-4 border-gray-100 dark:border-gray-700 flex items-center justify-center z-10">
                    <Cpu size={64} className="text-brand animate-spin-slow" />
                </div>
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
                {isZh ? "正在构建专属路径..." : "Compiling Neural Path..."}
            </h2>
            <div className="space-y-2 font-mono text-xs text-gray-400">
                <p className="animate-fade-in-up delay-100">> Analyzing origin vectors...</p>
                <p className="animate-fade-in-up delay-200">> optimizing for {derivedConfig.modality} modality...</p>
                <p className="animate-fade-in-up delay-300">> generating bespoke lesson units...</p>
            </div>
        </div>
    );
};
