
import React from 'react';
import { BaseWidget } from '../BaseWidget';
import { ArrowDown, Zap, GitCommit, CornerDownRight, PlayCircle, CheckCircle } from 'lucide-react';

interface LogicStep {
    title: string;
    detail: string;
    type?: 'init' | 'loop' | 'condition' | 'action' | 'result';
}

interface LogicFlowProps {
    steps: LogicStep[];
}

export const LogicFlowWidget: React.FC<LogicFlowProps> = ({ steps }) => {
    if (!steps || steps.length === 0) return null;

    // Mapping colors to step types
    const getTypeStyles = (type?: string, idx?: number) => {
        switch (type) {
            case 'init': return { 
                border: 'border-blue-200 dark:border-blue-900', 
                bg: 'bg-blue-50 dark:bg-blue-900/10', 
                text: 'text-blue-800 dark:text-blue-200', 
                icon: PlayCircle 
            };
            case 'loop': return { 
                border: 'border-orange-200 dark:border-orange-900', 
                bg: 'bg-orange-50 dark:bg-orange-900/10', 
                text: 'text-orange-800 dark:text-orange-200', 
                icon: RefreshIcon 
            };
            case 'condition': return { 
                border: 'border-purple-200 dark:border-purple-900', 
                bg: 'bg-purple-50 dark:bg-purple-900/10', 
                text: 'text-purple-800 dark:text-purple-200', 
                icon: GitCommit 
            };
            case 'result': return { 
                border: 'border-green-200 dark:border-green-900', 
                bg: 'bg-green-50 dark:bg-green-900/10', 
                text: 'text-green-800 dark:text-green-200', 
                icon: CheckCircle 
            };
            default: return { 
                border: 'border-gray-200 dark:border-gray-700', 
                bg: 'bg-white dark:bg-dark-card', 
                text: 'text-gray-800 dark:text-gray-200', 
                icon: CornerDownRight 
            };
        }
    };

    const RefreshIcon = () => <Zap size={16} />; // Placeholder alias

    return (
        <BaseWidget>
            <div className="flex flex-col gap-0 relative pl-4 md:pl-8 py-4">
                {steps.map((step, idx) => {
                    const styles = getTypeStyles(step.type, idx);
                    const Icon = styles.icon;
                    const isLast = idx === steps.length - 1;

                    return (
                        <div key={idx} className="flex gap-4 md:gap-6 relative group">
                            {/* Left Timeline Visual */}
                            <div className="flex flex-col items-center">
                                <div className={`z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 ${styles.border} ${styles.bg} ${styles.text} shadow-sm shrink-0`}>
                                    <span className="font-mono font-bold text-xs">{idx + 1}</span>
                                </div>
                                {!isLast && (
                                    <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 my-1 group-hover:bg-brand/50 transition-colors"></div>
                                )}
                            </div>

                            {/* Card Content */}
                            <div className={`flex-1 mb-6 p-4 rounded-xl border-2 transition-all ${styles.border} ${styles.bg} hover:shadow-md hover:-translate-y-0.5`}>
                                <div className="flex items-start justify-between mb-1">
                                    <h4 className={`font-bold text-sm ${styles.text} uppercase tracking-wide flex items-center gap-2`}>
                                        {step.title}
                                    </h4>
                                    {step.type && (
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase opacity-70 border ${styles.border}`}>
                                            {step.type}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                                    {step.detail}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </BaseWidget>
    );
};
