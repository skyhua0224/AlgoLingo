
import React, { useState } from 'react';
import { X, Sparkles, Terminal, Loader2 } from 'lucide-react';
import { useAppManager } from '../../../hooks/useAppManager';
import { generateCustomTrack } from '../../../services/geminiService';
import { SkillTrack } from '../../../types/engineering';

interface CreateTrackModalProps {
    onClose: () => void;
    onCreated: (track: SkillTrack) => void;
    language: 'Chinese' | 'English';
}

export const CreateTrackModal: React.FC<CreateTrackModalProps> = ({ onClose, onCreated, language }) => {
    const isZh = language === 'Chinese';
    const { state } = useAppManager();
    
    const [name, setName] = useState('');
    const [context, setContext] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!name.trim()) return;
        
        setLoading(true);
        try {
            const newTrack = await generateCustomTrack(name, context, state.preferences);
            onCreated(newTrack);
            onClose();
        } catch (e) {
            alert(isZh ? "生成失败，请重试" : "Generation failed, please try again");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in-up">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="bg-white dark:bg-dark-card w-full max-w-lg rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 relative z-10">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400">
                    <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-brand/10 rounded-xl text-brand">
                        <Sparkles size={24} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                        {isZh ? "创建自定义路径" : "Create Custom Track"}
                    </h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                            {isZh ? "专精名称" : "Track Name"}
                        </label>
                        <input 
                            type="text"
                            className="w-full p-4 rounded-xl bg-gray-50 dark:bg-black/20 border-2 border-gray-200 dark:border-gray-700 focus:border-brand outline-none font-bold text-gray-800 dark:text-white"
                            placeholder={isZh ? "例如：Unreal Engine 5 开发" : "e.g. Unreal Engine 5 Development"}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                            {isZh ? "侧重点 / 上下文" : "Focus / Context"}
                        </label>
                        <textarea 
                            className="w-full p-4 rounded-xl bg-gray-50 dark:bg-black/20 border-2 border-gray-200 dark:border-gray-700 focus:border-brand outline-none text-sm text-gray-700 dark:text-gray-300 min-h-[100px]"
                            placeholder={isZh ? "例如：侧重 C++ 性能优化与蓝图交互..." : "e.g. Focus on C++ optimization and Blueprints interaction..."}
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                        />
                    </div>

                    <div className="pt-4">
                        <button 
                            onClick={handleGenerate}
                            disabled={loading || !name}
                            className="w-full py-4 bg-brand text-white rounded-xl font-bold text-lg shadow-xl hover:bg-brand-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <Terminal size={20} />}
                            {loading ? (isZh ? "AI 正在规划..." : "AI Architecting...") : (isZh ? "生成大纲" : "Generate Syllabus")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
