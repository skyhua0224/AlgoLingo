
import React from 'react';
import { BaseWidget } from '../BaseWidget';
import { Zap, GitCommit, CornerDownRight, PlayCircle, CheckCircle, ArrowDown } from 'lucide-react';
import { MarkdownText } from '../../common/MarkdownText';

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
                ring: 'ring-blue-100 dark:ring-blue-900/30', 
                bg: 'bg-blue-500 text-white', 
                cardBg: 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30',
                title: 'text-blue-700 dark:text-blue-300',
                icon: PlayCircle 
            };
            case 'loop': return { 
                ring: 'ring-orange-100 dark:ring-orange-900/30', 
                bg: 'bg-orange-500 text-white', 
                cardBg: 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30',
                title: 'text-orange-700 dark:text-orange-300',
                icon: RefreshIcon 
            };
            case 'condition': return { 
                ring: 'ring-purple-100 dark:ring-purple-900/30', 
                bg: 'bg-purple-500 text-white', 
                cardBg: 'bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30',
                title: 'text-purple-700 dark:text-purple-300',
                icon: GitCommit 
            };
            case 'result': return { 
                ring: 'ring-green-100 dark:ring-green-900/30', 
                bg: 'bg-green-500 text-white', 
                cardBg: 'bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30',
                title: 'text-green-700 dark:text-green-300',
                icon: CheckCircle 
            };
            default: return { 
                ring: 'ring-gray-100 dark:ring-gray-800', 
                bg: 'bg-gray-400 text-white', 
                cardBg: 'bg-white dark:bg-dark-card border-gray-200 dark:border-gray-800',
                title: 'text-gray-700 dark:text-gray-300',
                icon: CornerDownRight 
            };
        }
    };

    const RefreshIcon = () => <Zap size={14} fill="currentColor" />; 

    return (
        <BaseWidget>
            <div className="flex flex-col relative pl-4">
                {steps.map((step, idx) => {
                    const styles = getTypeStyles(step.type, idx);
                    const Icon = styles.icon;
                    const isLast = idx === steps.length - 1;

                    return (
                        <div key={idx} className="flex gap-6 relative group pb-8 last:pb-0">
                            {/* Connector Line (Absolute to span full height including gap) */}
                            {!isLast && (
                                <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800 -z-10 group-hover:bg-brand/30 transition-colors"></div>
                            )}

                            {/* Left Timeline Visual */}
                            <div className="shrink-0 relative mt-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ring-4 ${styles.ring} ${styles.bg} transition-transform group-hover:scale-110 duration-300`}>
                                    <span className="font-black text-[10px]">{idx + 1}</span>
                                </div>
                            </div>

                            {/* Card Content */}
                            <div className={`flex-1 p-5 rounded-2xl border transition-all ${styles.cardBg} hover:shadow-md hover:-translate-y-0.5`}>
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className={`font-black text-sm uppercase tracking-wide flex items-center gap-2 ${styles.title}`}>
                                        <Icon size={16} className="shrink-0 opacity-80"/>
                                        {step.title}
                                    </h4>
                                    {step.type && (
                                        <span className={`text-[9px] font-black uppercase opacity-50 bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded`}>
                                            {step.type}
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                                    <MarkdownText content={step.detail} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </BaseWidget>
    );
};
