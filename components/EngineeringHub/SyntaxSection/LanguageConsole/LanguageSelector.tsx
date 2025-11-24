
import React, { useState, useEffect, useMemo } from 'react';
import { 
    ChevronDown, Check, Plus, Search, 
    Terminal, Coffee, Box, Cpu, FileCode, Zap, Gem, Hash, 
    Server, Globe, Database, Layers, LayoutTemplate, Braces
} from 'lucide-react';

interface LanguageSelectorProps {
    currentLang: string;
    onSwitch: (lang: string) => void;
    language: 'Chinese' | 'English';
}

// --- CONFIGURATION ---

const LANG_META: Record<string, { icon: React.ElementType, color: string }> = {
    'Python': { icon: Terminal, color: 'text-blue-500' },
    'Java': { icon: Coffee, color: 'text-red-500' },
    'Go': { icon: Box, color: 'text-cyan-500' },
    'C++': { icon: Cpu, color: 'text-blue-700' },
    'C': { icon: Cpu, color: 'text-gray-500' },
    'JavaScript': { icon: FileCode, color: 'text-yellow-500' },
    'TypeScript': { icon: Braces, color: 'text-blue-400' },
    'Rust': { icon: Zap, color: 'text-orange-500' },
    'Ruby': { icon: Gem, color: 'text-red-600' },
    'C#': { icon: Hash, color: 'text-purple-500' },
    'Swift': { icon: LayoutTemplate, color: 'text-orange-400' },
    'Kotlin': { icon: LayoutTemplate, color: 'text-purple-400' },
    'PHP': { icon: Server, color: 'text-indigo-400' },
    'SQL': { icon: Database, color: 'text-green-600' },
    'R': { icon: Layers, color: 'text-blue-600' },
};

const CATEGORIES = [
    { 
        id: 'systems', 
        label: { zh: '系统与底层', en: 'Systems & Low Level' },
        items: ['C++', 'C', 'Rust', 'Go'] 
    },
    { 
        id: 'web', 
        label: { zh: 'Web 与应用', en: 'Web & Application' },
        items: ['JavaScript', 'TypeScript', 'Swift', 'Kotlin', 'PHP'] 
    },
    { 
        id: 'data', 
        label: { zh: '数据与脚本', en: 'Data & Scripting' },
        items: ['Python', 'R', 'SQL', 'Ruby'] 
    },
    { 
        id: 'enterprise', 
        label: { zh: '企业级开发', en: 'Enterprise' },
        items: ['Java', 'C#'] 
    }
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ currentLang, onSwitch, language }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [myStack, setMyStack] = useState<string[]>([]);
    
    const isZh = language === 'Chinese';

    // Detect configured languages from localStorage on mount/open
    useEffect(() => {
        if (isOpen) {
            const stack: string[] = [];
            // Helper to check active profiles. 
            // We scan known languages to see if a profile key exists.
            const allLangs = CATEGORIES.flatMap(c => c.items);
            allLangs.forEach(lang => {
                if (localStorage.getItem(`algolingo_syntax_v3_${lang}`)) {
                    stack.push(lang);
                }
            });
            // Ensure current lang is always in "My Stack" for UI consistency if initialized
            if (!stack.includes(currentLang)) stack.push(currentLang);
            setMyStack(stack);
        }
    }, [isOpen, currentLang]);

    const currentMeta = LANG_META[currentLang] || { icon: Terminal, color: 'text-gray-500' };
    const CurrentIcon = currentMeta.icon;

    // Filter Logic
    const filteredCategories = useMemo(() => {
        if (!search.trim()) return CATEGORIES;
        const lowerSearch = search.toLowerCase();
        
        return CATEGORIES.map(cat => ({
            ...cat,
            items: cat.items.filter(item => item.toLowerCase().includes(lowerSearch))
        })).filter(cat => cat.items.length > 0);
    }, [search]);

    const renderLangItem = (lang: string, isStackItem: boolean = false) => {
        const meta = LANG_META[lang] || { icon: Terminal, color: 'text-gray-400' };
        const Icon = meta.icon;
        const isActive = lang === currentLang;
        const isConfigured = myStack.includes(lang);

        return (
            <button
                key={lang}
                onClick={() => { onSwitch(lang); setIsOpen(false); setSearch(''); }}
                className={`w-full flex items-center justify-between p-2 rounded-xl transition-all group ${
                    isActive 
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' 
                    : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-white dark:bg-dark-card shadow-sm ' + meta.color : 'bg-transparent group-hover:bg-gray-100 dark:group-hover:bg-gray-700 text-current'}`}>
                        <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className={!isActive ? meta.color : ''} />
                    </div>
                    <span className={`text-sm ${isActive ? 'font-black' : 'font-medium'}`}>{lang}</span>
                </div>
                <div className="flex items-center gap-2">
                    {isConfigured && !isStackItem && (
                        <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-bold">Configured</span>
                    )}
                    {isActive && <Check size={14} className="text-brand"/>}
                </div>
            </button>
        );
    };

    return (
        <div className="relative z-50">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 pl-2 pr-4 py-2 bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-all border border-transparent hover:border-gray-300 dark:hover:border-gray-700 group min-w-[140px]"
            >
                <div className={`p-1.5 bg-white dark:bg-dark-card rounded-full shadow-sm ${currentMeta.color}`}>
                    <CurrentIcon size={16} strokeWidth={2.5} />
                </div>
                <span className="font-black text-gray-800 dark:text-white text-sm tracking-tight truncate flex-1 text-left">{currentLang}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute top-full left-0 mt-2 w-72 md:w-80 bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3 z-50 animate-scale-in origin-top-left max-h-[80vh] flex flex-col">
                        
                        {/* Search Bar */}
                        <div className="relative mb-3 shrink-0">
                            <Search size={14} className="absolute left-3 top-3 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder={isZh ? "搜索语言..." : "Search languages..."} 
                                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold focus:border-brand outline-none transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="overflow-y-auto custom-scrollbar flex-1 space-y-4 pr-1">
                            
                            {/* Active Stack Section (Only show if no search or search matches stack items) */}
                            {myStack.length > 0 && !search && (
                                <div>
                                    <div className="px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Layers size={10}/> {isZh ? "我的技术栈" : "My Stack"}
                                    </div>
                                    <div className="space-y-1">
                                        {myStack.map(lang => renderLangItem(lang, true))}
                                    </div>
                                    <div className="h-px bg-gray-100 dark:bg-gray-800 my-3 mx-2"></div>
                                </div>
                            )}

                            {/* Categorized List */}
                            {filteredCategories.map(cat => (
                                <div key={cat.id}>
                                    <div className="px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mt-1">
                                        {isZh ? cat.label.zh : cat.label.en}
                                    </div>
                                    <div className="space-y-1">
                                        {cat.items.map(lang => renderLangItem(lang))}
                                    </div>
                                </div>
                            ))}

                            {filteredCategories.length === 0 && (
                                <div className="text-center py-8 text-gray-400 text-xs">
                                    {isZh ? "未找到匹配语言" : "No languages found"}
                                </div>
                            )}
                        </div>
                        
                        {/* Footer Tip */}
                        {!search && (
                            <div className="pt-3 mt-2 border-t border-gray-100 dark:border-gray-800 text-center">
                                <p className="text-[10px] text-gray-400">
                                    {isZh ? "点击任意语言以添加至技术栈" : "Select any language to add to stack"}
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
