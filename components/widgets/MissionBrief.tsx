
import React from 'react';
import { ArrowRight, AlertTriangle, PlayCircle } from 'lucide-react';
import { MissionBriefData } from '../../types/lesson';

interface MissionBriefProps {
    data: MissionBriefData;
    language: 'Chinese' | 'English';
}

export const MissionBrief: React.FC<MissionBriefProps> = ({ data, language }) => {
    const isZh = language === 'Chinese';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            
            {/* 1. Visual IO Card - Clean & Code-focused */}
            <div className="bg-white dark:bg-dark-card border-2 border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <PlayCircle size={14} />
                    {isZh ? "输入输出示例" : "I/O Example"}
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-700 rounded-xl p-3 font-mono text-sm text-gray-700 dark:text-gray-300 break-all">
                        {data.input}
                    </div>
                    
                    <div className="text-gray-300 dark:text-gray-600">
                        <ArrowRight size={20} />
                    </div>
                    
                    <div className="flex-1 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-xl p-3 font-mono text-sm text-green-700 dark:text-green-400 break-all font-bold">
                        {data.output}
                    </div>
                </div>
            </div>

            {/* 2. The Trap - Softer warning style, focus on 'Why' */}
            <div className="bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-100 dark:border-amber-900/30 rounded-2xl p-5 shadow-sm flex flex-col justify-center">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                        <AlertTriangle size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-amber-800 dark:text-amber-200 mb-1">
                            {data.trap.title}
                        </h4>
                        <p className="text-xs text-amber-700 dark:text-amber-300/80 leading-relaxed font-medium">
                            {data.trap.description}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
