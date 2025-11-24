
import React from 'react';
import { SyntaxUnit, SyntaxLesson, StageConfig } from '../../../../types/engineering';
import { ArrowLeft, Lock, CheckCircle, Play, Star } from 'lucide-react';
import * as Icons from 'lucide-react';

interface SyntaxUnitMapProps {
    unit: SyntaxUnit;
    lesson: SyntaxLesson;
    stageStructure: StageConfig[]; // Dynamic structure from profile
    onStartStage: (stageId: string) => void;
    onBack: () => void;
    language: 'Chinese' | 'English';
}

export const SyntaxUnitMap: React.FC<SyntaxUnitMapProps> = ({ unit, lesson, stageStructure, onStartStage, onBack, language }) => {
    const isZh = language === 'Chinese';
    const langKey = isZh ? 'zh' : 'en';
    const currentStageIndex = lesson.currentPhaseIndex;

    // Helper to dynamic render icon
    const renderIcon = (iconName: string, size: number) => {
        const IconComp = (Icons as any)[iconName] || Icons.Star;
        return <IconComp size={size} />;
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-dark-card relative">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4 bg-white/90 dark:bg-dark-card/90 backdrop-blur-sm sticky top-0 z-20">
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

            {/* Dynamic Map Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto pb-12">
                    {stageStructure.map((stage, index) => {
                        const isLocked = index > currentStageIndex;
                        const isCompleted = index < currentStageIndex;
                        const isCurrent = index === currentStageIndex;

                        let borderClass = isLocked ? 'border-gray-100 dark:border-gray-800' : (isCurrent ? 'border-brand' : 'border-gray-200 dark:border-gray-700');
                        let bgClass = isLocked ? 'bg-gray-50 dark:bg-gray-900 opacity-60 cursor-not-allowed' : 'bg-white dark:bg-dark-card hover:-translate-y-1 shadow-sm hover:shadow-md cursor-pointer';
                        
                        if (isCurrent) bgClass += ' ring-2 ring-brand/20';

                        return (
                            <button
                                key={stage.id}
                                disabled={isLocked}
                                onClick={() => onStartStage(stage.id)}
                                className={`relative p-6 rounded-2xl border-2 border-b-4 text-left flex flex-col justify-between min-h-[140px] transition-all group ${borderClass} ${bgClass}`}
                            >
                                <div className="flex justify-between items-start w-full mb-4">
                                    <div className={`p-3 rounded-xl transition-colors ${isCompleted ? 'bg-green-100 text-green-600' : (isCurrent ? 'bg-brand-bg text-brand' : 'bg-gray-100 text-gray-400')}`}>
                                        {isLocked ? <Lock size={20}/> : (isCompleted ? <CheckCircle size={20}/> : renderIcon(stage.icon, 20))}
                                    </div>
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                        STEP {index + 1}
                                    </span>
                                </div>

                                <div>
                                    <h3 className={`text-lg font-extrabold mb-1 ${isLocked ? 'text-gray-400' : 'text-gray-800 dark:text-white'}`}>
                                        {stage.label[langKey]}
                                    </h3>
                                    
                                    {isCurrent && (
                                        <span className="inline-block bg-brand text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide animate-pulse mt-2">
                                            {isZh ? "开始" : "Start"}
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
