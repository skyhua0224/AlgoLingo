
import React, { useState } from 'react';
import { SyntaxProfile, SyntaxUnit, SyntaxLesson } from '../../../../types/engineering';
import { ArrowLeft, Lock, ChevronRight, BookOpen, Box, Code2, Bug, Brain, Zap, Crown, AlertTriangle, FastForward } from 'lucide-react';
import { LevelNode, MasteryPlate } from '../../../common/GamifiedMap';
import { Button } from '../../../Button';

interface StudioMainProps {
    profile: SyntaxProfile;
    language: 'Chinese' | 'English';
    onStartLesson: (unit: SyntaxUnit, lesson: SyntaxLesson, stageId: string, isSkip?: boolean) => void; 
}

// --- 6-PHASE CONFIGURATION ---
const PHASE_CONFIG = [
    { id: 0, title: { en: 'Concept', zh: '概念引入' }, subtitle: 'Level 1', icon: <BookOpen size={24}/> },
    { id: 1, title: { en: 'Syntax Basics', zh: '语法基础' }, subtitle: 'Level 2', icon: <Code2 size={24}/> },
    { id: 2, title: { en: 'Recall Drill', zh: '记忆回溯' }, subtitle: 'Level 3', icon: <Brain size={24}/> }, 
    { id: 3, title: { en: 'Logic Build', zh: '逻辑构建' }, subtitle: 'Level 4', icon: <Zap size={24}/> }, 
    { id: 4, title: { en: 'Debug & Fix', zh: '调试排错' }, subtitle: 'Level 5', icon: <Bug size={24}/> }, 
    { id: 5, title: { en: 'Mastery', zh: '精通认证' }, subtitle: 'BOSS', icon: <Crown size={28}/> } 
];

// Sub-view: Detail map for a specific Lesson (showing 6 fixed phases)
const LessonPhaseMap: React.FC<{
    unit: SyntaxUnit;
    lesson: SyntaxLesson;
    onBack: () => void;
    onStartPhase: (phaseIndex: number, isSkip?: boolean) => void;
    langKey: 'en' | 'zh';
    isZh: boolean;
}> = ({ unit, lesson, onBack, onStartPhase, langKey, isZh }) => {
    
    const currentPhase = lesson.currentPhaseIndex || 0;
    const isMastered = currentPhase >= 6; // 6 phases completed
    const [showSkipModal, setShowSkipModal] = useState(false);

    const handleNodeClick = (phaseId: number, isLocked: boolean) => {
        if (phaseId === 5) {
            if (isLocked) {
                setShowSkipModal(true);
                return;
            } else {
                onStartPhase(5, false);
            }
            return;
        }
        if (!isLocked) {
            onStartPhase(phaseId, false);
        }
    };

    const confirmSkip = () => {
        setShowSkipModal(false);
        onStartPhase(5, true); // isSkip = true
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-black/10 relative animate-fade-in-up overflow-hidden">
             {/* Skip Confirmation Modal */}
            {showSkipModal && (
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-up">
                    <div className="bg-white dark:bg-dark-card rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl border-2 border-orange-100 dark:border-orange-900/50">
                        <div className="mb-4 bg-orange-100 dark:bg-orange-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                <FastForward className="text-orange-500" size={32} />
                        </div>
                        <h3 className="text-xl font-extrabold text-gray-800 dark:text-white mb-2">{isZh ? "跳级挑战" : "Skip to Mastery"}</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm leading-relaxed">
                            {isZh ? "你即将跳过所有前置课程直接挑战最终 BOSS (精通阶段)。" : "You are about to skip all previous lessons to challenge the final BOSS."}
                        </p>
                        
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 p-3 rounded-xl mb-6 flex items-start gap-2 text-left">
                            <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5"/>
                            <p className="text-xs text-red-600 dark:text-red-400 font-bold">
                                {isZh ? "高难度预警。只有一次机会。" : "High difficulty warning. One shot."}
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button variant="primary" onClick={confirmSkip} className="w-full bg-orange-500 border-orange-700 hover:bg-orange-400 shadow-lg">
                                {isZh ? "确认跳级" : "Confirm Skip"}
                            </Button>
                            <button onClick={() => setShowSkipModal(false)} className="text-gray-400 text-sm font-bold hover:text-gray-600 py-2">
                                {isZh ? "取消" : "Cancel"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

             {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4 bg-white/90 dark:bg-dark-card/90 backdrop-blur-sm sticky top-0 z-20 shrink-0">
                <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white leading-tight">
                        {lesson.title[langKey]}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium uppercase tracking-wider">
                        {unit.title[langKey]}
                    </p>
                </div>
            </div>

            {/* Map */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto pb-12">
                    {PHASE_CONFIG.map((phase) => {
                        const isLocked = phase.id > currentPhase;
                        const isCompleted = phase.id < currentPhase;
                        const isCurrent = phase.id === currentPhase;
                        
                        // Boss/Mastery Logic (Node 5)
                        if (phase.id === 5 && isMastered) {
                             return (
                                <div key={phase.id} className="col-span-2 md:col-span-3 w-full">
                                    <MasteryPlate 
                                        title={isZh ? "精通挑战" : "Mastery Challenge"}
                                        onLeetCodeClick={() => onStartPhase(5)} // Replay boss
                                        onMasteryLoopClick={() => onStartPhase(5)}
                                        leetcodeLabel={isZh ? "编程挑战" : "Coding Challenge"}
                                        masteryLoopLabel={isZh ? "重考" : "Retake Exam"}
                                    />
                                </div>
                             )
                        }

                        return (
                            <LevelNode 
                                key={phase.id}
                                id={phase.id}
                                label={phase.title[langKey]}
                                subtitle={phase.subtitle}
                                icon={phase.icon}
                                status={isCompleted ? 'completed' : (isLocked ? 'locked' : 'active')}
                                isCurrent={isCurrent}
                                onClick={() => handleNodeClick(phase.id, isLocked)}
                                startLabel={isZh ? "开始" : "Start"}
                                completedLabel={isZh ? "完成" : "Done"}
                                // Skip logic for Boss node (id 5) if locked
                                showSkip={phase.id === 5 && isLocked}
                                skipLabel={isZh ? "跳过" : "Skip"}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// Sub-view: Lesson List for a specific Unit
const UnitDetail: React.FC<{ 
    unit: SyntaxUnit, 
    onBack: () => void, 
    onSelectLesson: (lesson: SyntaxLesson) => void,
    langKey: 'en' | 'zh'
}> = ({ unit, onBack, onSelectLesson, langKey }) => {
    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-black/10 relative animate-fade-in-up overflow-hidden">
            <div className="p-6 flex items-center gap-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card sticky top-0 z-10 shrink-0">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white">{unit.title[langKey]}</h2>
                    <p className="text-xs text-gray-500">{unit.description[langKey]}</p>
                </div>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                {unit.lessons.map((lesson, idx) => {
                    const isLocked = lesson.status === 'locked';
                    const isSandbox = lesson.type === 'sandbox';
                    
                    return (
                        <button
                            key={lesson.id}
                            disabled={isLocked}
                            onClick={() => onSelectLesson(lesson)}
                            className={`w-full p-5 rounded-2xl text-left border-2 transition-all flex items-center justify-between group ${
                                isLocked 
                                ? 'bg-gray-100 dark:bg-gray-800 border-transparent text-gray-400 cursor-not-allowed' 
                                : 'bg-white dark:bg-dark-card border-gray-200 dark:border-gray-700 hover:border-brand hover:shadow-md'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${
                                    isLocked ? 'bg-gray-200 dark:bg-gray-700' : (isSandbox ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' : 'bg-brand-bg dark:bg-brand/20 text-brand')
                                }`}>
                                    {isSandbox ? <Box size={20}/> : (idx + 1)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-base flex items-center gap-2">
                                        {lesson.title[langKey]}
                                        {isSandbox && <span className="text-[10px] bg-purple-500 text-white px-2 rounded-full uppercase tracking-wide">IDE MODE</span>}
                                    </h3>
                                    <p className="text-xs opacity-70 line-clamp-1">{lesson.description[langKey]}</p>
                                </div>
                            </div>
                            {isLocked ? <Lock size={18} /> : <ChevronRight size={20} className="text-gray-300 group-hover:text-brand" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export const StudioMain: React.FC<StudioMainProps> = ({ profile, language, onStartLesson }) => {
    const [activeUnit, setActiveUnit] = useState<SyntaxUnit | null>(null);
    const [activeLesson, setActiveLesson] = useState<SyntaxLesson | null>(null);
    
    const isZh = language === 'Chinese';
    const langKey = isZh ? 'zh' : 'en';

    const handleStartPhase = (phaseIndex: number, isSkip: boolean = false) => {
        if (activeUnit && activeLesson) {
            // Pass phaseIndex directly as stageId (0-5)
            const stageId = activeLesson.type === 'sandbox' ? 'sandbox' : phaseIndex.toString();
            onStartLesson(activeUnit, activeLesson, stageId, isSkip);
        }
    };

    // 3. Lesson Phase Map (Deepest View)
    if (activeLesson && activeUnit) {
        return (
            <LessonPhaseMap
                unit={activeUnit}
                lesson={activeLesson}
                onBack={() => setActiveLesson(null)}
                onStartPhase={handleStartPhase}
                langKey={langKey}
                isZh={isZh}
            />
        )
    }

    // 2. Unit Detail View
    if (activeUnit) {
        return (
            <UnitDetail 
                unit={activeUnit} 
                onBack={() => setActiveUnit(null)} 
                onSelectLesson={setActiveLesson}
                langKey={langKey}
            />
        );
    }

    // 1. Roadmap View (Default)
    return (
        <div className="h-full flex flex-col bg-white dark:bg-dark-card relative overflow-hidden">
            {/* Timeline of Units */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 relative bg-gray-50/50 dark:bg-black/20">
                <div className="absolute left-8 md:left-12 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800 z-0"></div>
                
                <div className="space-y-8 relative z-10 pb-10">
                    {profile.roadmap.map((unit, index) => {
                        const isLocked = unit.status === 'locked';
                        const isActive = unit.status === 'active';
                        
                        return (
                            <div key={unit.id} className="flex gap-6 md:gap-8 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                                <div className="flex flex-col items-center shrink-0 pt-2">
                                    <div className={`w-6 h-6 rounded-full border-4 z-10 bg-white dark:bg-dark-card ${isActive ? 'border-brand scale-125' : (isLocked ? 'border-gray-300 dark:border-gray-700' : 'border-brand')}`}>
                                        {isLocked && <div className="w-full h-full bg-gray-300 dark:bg-gray-700 rounded-full scale-50"></div>}
                                        {isActive && <div className="w-full h-full bg-brand rounded-full scale-50 animate-pulse"></div>}
                                    </div>
                                </div>
                                
                                <button 
                                    disabled={isLocked}
                                    onClick={() => setActiveUnit(unit)}
                                    className={`flex-1 text-left p-6 rounded-3xl border-2 transition-all group ${isLocked ? 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-dark-card/50 border-transparent' : 'bg-white dark:bg-dark-card border-transparent hover:border-brand/50 hover:shadow-xl cursor-pointer'}`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isLocked ? 'text-gray-400' : 'text-brand'}`}>MODULE {String(index + 1).padStart(2,'0')}</span>
                                        {isActive && <span className="text-[10px] bg-brand text-white px-2 py-0.5 rounded-full font-bold shadow-sm">IN PROGRESS</span>}
                                    </div>
                                    <h3 className={`text-xl font-extrabold mb-2 ${isLocked ? 'text-gray-500' : 'text-gray-900 dark:text-white'}`}>{unit.title[langKey]}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">{unit.description[langKey]}</p>
                                    
                                    <div className={`flex items-center gap-2 text-xs font-bold transition-colors ${isLocked ? 'text-gray-300' : 'text-gray-400 group-hover:text-brand'}`}>
                                        <BookOpen size={16}/>
                                        <span>{unit.lessons.length} Lessons</span>
                                        <div className={`ml-auto p-1.5 rounded-full transition-all ${isLocked ? 'bg-transparent' : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-brand group-hover:text-white'}`}>
                                            {isLocked ? <Lock size={16}/> : <ChevronRight size={16}/>}
                                        </div>
                                    </div>
                                </button>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};
