
import React from 'react';
import { Search, Sparkles, Clock, TrendingUp, Zap } from 'lucide-react';

interface ForgeProps {
    language: 'Chinese' | 'English';
}

export const Forge: React.FC<ForgeProps> = ({ language }) => {
    const isZh = language === 'Chinese';

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen flex flex-col">
            {/* Hero Search */}
            <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in-down">
                    <Sparkles size={14} />
                    {isZh ? "知识工坊 AI 引擎" : "Knowledge Forge AI Engine"}
                </div>
                
                <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-8 tracking-tight leading-tight">
                    {isZh ? "今天你想学什么？" : "What do you want to know today?"}
                </h1>

                <div className="w-full max-w-2xl relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative flex items-center bg-white dark:bg-dark-card rounded-xl shadow-2xl overflow-hidden p-2">
                        <Search className="text-gray-400 ml-4" size={24} />
                        <input 
                            type="text"
                            className="w-full p-4 text-lg font-medium bg-transparent outline-none text-gray-800 dark:text-white placeholder-gray-300 dark:placeholder-gray-600"
                            placeholder={isZh ? "输入关键词... (例如: React Hooks 原理)" : "Type a topic... (e.g. React Hooks internals)"}
                        />
                        <button className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-bold hover:opacity-90 transition-opacity">
                            Go
                        </button>
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {['Docker Networking', 'Rust Ownership', 'Kafka Consumer', 'CSS Grid'].map(tag => (
                        <button key={tag} className="px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-500 hover:border-purple-500 hover:text-purple-500 transition-colors bg-white dark:bg-dark-card">
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Grid */}
            <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={16} />
                        {isZh ? "最近生成" : "Recently Generated"}
                    </h3>
                </div>

                <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                    {/* Card 1 */}
                    <div className="break-inside-avoid bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all group cursor-pointer">
                        <div className="h-32 bg-gradient-to-br from-blue-500 to-cyan-400 p-6 flex items-end">
                            <h4 className="text-2xl font-black text-white leading-none">React<br/>Fiber</h4>
                        </div>
                        <div className="p-5">
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">
                                A deep dive into the reconciliation algorithm that enables React's asynchronous rendering capabilities.
                            </p>
                            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-gray-400">
                                <div className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-300">Frontend</div>
                                <span>• 5 min read</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 2 */}
                    <div className="break-inside-avoid bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all group cursor-pointer">
                        <div className="h-48 bg-gradient-to-br from-orange-500 to-red-500 p-6 flex items-end">
                            <h4 className="text-2xl font-black text-white leading-none">System<br/>Design:<br/>TinyURL</h4>
                        </div>
                        <div className="p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp size={16} className="text-orange-500"/>
                                <span className="text-xs font-bold text-orange-500 uppercase">Trending</span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                Classic interview question. Hash functions, collisions, and database scaling strategies.
                            </p>
                        </div>
                    </div>

                    {/* Card 3 */}
                    <div className="break-inside-avoid bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all group cursor-pointer">
                        <div className="p-6 pb-2">
                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-600 dark:text-gray-300">
                                <Zap size={20}/>
                            </div>
                            <h4 className="text-xl font-extrabold text-gray-800 dark:text-white mb-2">Git Rebase vs Merge</h4>
                        </div>
                        <div className="p-6 pt-0">
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                Visualizing the difference in commit history linearity.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
