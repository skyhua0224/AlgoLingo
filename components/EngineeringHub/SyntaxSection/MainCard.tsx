
import React from 'react';
import { Terminal, Zap } from 'lucide-react';

interface MainCardProps {
    targetLanguage: string;
    language: 'Chinese' | 'English';
}

/**
 * MainCard
 * Displays the user's proficiency in the currently selected language using a Radar Chart.
 * Acts as the entry point to the "Syntax Dojo" (Honeycomb Map).
 */
export const MainCard: React.FC<MainCardProps> = ({ targetLanguage, language }) => {
    const isZh = language === 'Chinese';

    return (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-dark-card dark:to-black rounded-3xl p-8 relative overflow-hidden shadow-xl group min-h-[280px] flex flex-col justify-between h-full">
            
            {/* Decorative Background Effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-brand/20 transition-all duration-700"></div>

            {/* Header Info */}
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-brand-light border border-white/10 backdrop-blur-sm uppercase tracking-wider">
                        {isZh ? "当前主力" : "Primary Focus"}
                    </span>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {isZh ? "模式: 迁移者" : "Mode: Migrator"}
                    </span>
                </div>
                
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-5xl font-black text-white mb-2 tracking-tight">{targetLanguage}</h2>
                        <p className="text-gray-400 font-medium max-w-xs text-sm leading-relaxed">
                            {isZh 
                             ? "专精内存模型与高级特性。当前进度：装饰器与元编程。" 
                             : "Mastering memory models & advanced features. Current focus: Decorators."}
                        </p>
                    </div>
                    {/* TODO: Implement Recharts RadarChart here */}
                    <div className="hidden md:block w-24 h-24 bg-white/5 rounded-full border border-white/10 flex items-center justify-center text-xs text-gray-500">
                        [Radar Mock]
                    </div>
                </div>
            </div>

            {/* Action Footer */}
            <div className="relative z-10 mt-6 flex gap-4">
                <button className="flex-1 bg-brand hover:bg-brand-light text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 text-sm uppercase tracking-wider">
                    <Terminal size={18} />
                    {isZh ? "进入语法道场" : "Enter Syntax Dojo"}
                </button>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                    <Zap size={16} className="text-yellow-400 fill-current" />
                    <span className="text-white font-mono font-bold">Lv. 4</span>
                </div>
            </div>
        </div>
    );
};
