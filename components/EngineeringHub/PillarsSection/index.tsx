
import React from 'react';
import { Layers, Server, ArrowRight, Cpu } from 'lucide-react';
import { SOFTWARE_ARCH_DATA, CS_FUNDAMENTALS_DATA } from '../../../data/engineeringData';

interface PillarsSectionProps {
    language: 'Chinese' | 'English';
    onSelectPillar: (id: 'system' | 'cs') => void;
}

export const PillarsSection: React.FC<PillarsSectionProps> = ({ language, onSelectPillar }) => {
    const isZh = language === 'Chinese';
    const langKey = isZh ? 'zh' : 'en';
    
    return (
        <div className="w-full">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 pl-2 flex items-center gap-2">
                {isZh ? "双塔核心 (The Twin Pillars)" : "The Twin Pillars"}
                <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1 ml-2"></div>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 px-2 mb-6 -mt-4">
                {isZh 
                 ? "覆盖所有软件工程师所需的通用核心知识。无论你是前端、后端、移动端还是游戏开发，这些都是你的立身之本。" 
                 : "Universal core knowledge for ALL software engineers. Whether you are Frontend, Backend, Mobile, or Game Dev, this is your foundation."}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Tower: Software Architecture */}
                <button 
                    onClick={() => onSelectPillar('system')}
                    className="group relative h-[240px] rounded-3xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all duration-500 text-left shadow-sm hover:shadow-xl hover:-translate-y-1"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-dark-card transition-colors"></div>
                    
                    {/* Decorative Icon */}
                    <div className="absolute -bottom-8 -right-8 text-purple-100 dark:text-purple-900/20 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12">
                        <Layers size={180} />
                    </div>

                    <div className="relative z-10 p-8 flex flex-col h-full justify-between">
                        <div>
                            <div className="inline-flex p-3 rounded-xl bg-white dark:bg-dark-card shadow-sm text-purple-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                                <Layers size={28} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                {SOFTWARE_ARCH_DATA.title[langKey]}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-[90%]">
                                {SOFTWARE_ARCH_DATA.description[langKey]}
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors uppercase tracking-wider">
                            <span>{isZh ? "进入架构蓝图" : "Enter Blueprint"}</span>
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                        </div>
                    </div>
                </button>

                {/* Right Tower: CS Core */}
                <button 
                    onClick={() => onSelectPillar('cs')}
                    className="group relative h-[240px] rounded-3xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-500 text-left shadow-sm hover:shadow-xl hover:-translate-y-1"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-dark-card transition-colors"></div>
                    
                    {/* Decorative Icon */}
                    <div className="absolute -bottom-8 -right-8 text-emerald-100 dark:text-emerald-900/20 transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-12">
                        <Cpu size={180} />
                    </div>

                    <div className="relative z-10 p-8 flex flex-col h-full justify-between">
                        <div>
                            <div className="inline-flex p-3 rounded-xl bg-white dark:bg-dark-card shadow-sm text-emerald-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                                <Server size={28} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                {CS_FUNDAMENTALS_DATA.title[langKey]}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-[90%]">
                                {CS_FUNDAMENTALS_DATA.description[langKey]}
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors uppercase tracking-wider">
                            <span>{isZh ? "揭秘底层原理" : "Reveal Internals"}</span>
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );
};
