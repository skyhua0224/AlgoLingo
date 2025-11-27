
import React, { useState, useMemo } from 'react';
import { ForgeRoadmap, ForgeStage } from '../../types/forge';
import { ArrowLeft, Lightbulb, Layers, ArrowRight, Play, Sparkles, BookOpen, CheckCircle, Lock, Loader2, RotateCcw, AlertTriangle } from 'lucide-react';
import { generateForgeStage } from '../../services/geminiService';
import { UserPreferences } from '../../types';
import { Button } from '../Button';

interface ForgeDetailViewProps {
    roadmap: ForgeRoadmap;
    onBack: () => void;
    onStartStage: (plan: any) => void;
    preferences: UserPreferences;
    language: 'Chinese' | 'English';
}

const ICON_MAP: Record<string, any> = {
    Lightbulb, Layers, ArrowRight, Play, Sparkles, BookOpen
};

export const ForgeDetailView: React.FC<ForgeDetailViewProps> = ({ roadmap, onBack, onStartStage, preferences, language }) => {
    const [loadingStageId, setLoadingStageId] = useState<number | null>(null);
    const [selectedStage, setSelectedStage] = useState<ForgeStage | null>(null);
    const isZh = language === 'Chinese';

    const generateStage = async (stage: ForgeStage) => {
        setLoadingStageId(stage.id);
        try {
            const plan = await generateForgeStage(roadmap, stage.id, preferences);
            
            // Cache the plan in the roadmap object
            stage.lessonPlan = plan; 
            
            // Trigger Lesson Runner
            onStartStage(plan);
        } catch (e) {
            alert("Failed to generate stage content. Please try again.");
        } finally {
            setLoadingStageId(null);
        }
    };

    const handleStageClick = (stage: ForgeStage) => {
        if (stage.lessonPlan) {
            setSelectedStage(stage); // Show modal choice
        } else {
            generateStage(stage); // Direct generate
        }
    };

    const handleStartCached = () => {
        if (selectedStage?.lessonPlan) {
            onStartStage(selectedStage.lessonPlan);
            setSelectedStage(null);
        }
    };

    const handleRegenerate = () => {
        if (selectedStage) {
            const stage = selectedStage;
            setSelectedStage(null);
            // Clear cache implicitly by generating new one (will overwrite on success)
            generateStage(stage);
        }
    };

    // Theme Configuration (Purple for Forge)
    const theme = {
        bg: "bg-slate-50 dark:bg-[#0f172a]",
        text: "text-slate-900 dark:text-white",
        subText: "text-slate-500 dark:text-slate-400",
        headerBg: "bg-white/80 dark:bg-[#0f172a]/80",
        accent: "text-purple-600 dark:text-purple-400",
        border: "border-purple-200 dark:border-purple-900/50",
        nodeActive: "bg-purple-500 dark:bg-purple-600 border-purple-100 dark:border-white text-white",
        nodeLocked: "bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500",
        nodeCompleted: "bg-purple-100 dark:bg-purple-900/20 border-purple-500 text-purple-600 dark:text-purple-400",
        line: "bg-purple-200 dark:bg-purple-900/30",
        card: "bg-white dark:bg-white/5 border-purple-100 dark:border-white/10 hover:shadow-lg hover:border-purple-300 dark:hover:border-white/20"
    };

    // DYNAMIC GROUPING LOGIC REWRITTEN
    const groups = useMemo(() => {
        const totalStages = roadmap.stages.length;
        
        // Define Chapter Titles (Extended)
        const titlesZh = [
            "第一章：核心概念", "第二章：深度机制", "第三章：实战精通", 
            "第四章：高级优化", "第五章：架构模式", "第六章：底层原理",
            "第七章：综合案例", "第八章：前沿探索", "第九章：极限挑战", "第十章：大师之路"
        ];
        const titlesEn = [
            "Chapter 1: Core Concepts", "Chapter 2: Deep Mechanics", "Chapter 3: Practical Mastery",
            "Chapter 4: Optimization", "Chapter 5: Architecture", "Chapter 6: Internals",
            "Chapter 7: Case Studies", "Chapter 8: Frontiers", "Chapter 9: Challenge", "Chapter 10: Master Class"
        ];
        
        const descsZh = [
            "建立认知基石", "理解流程与细节", "应用与洞察", 
            "性能与效率", "设计模式与结构", "源码与内核",
            "真实场景模拟", "新技术趋势", "高难度试炼", "最终认证"
        ];
        const descsEn = [
            "Foundations", "Process & Nuance", "Application", 
            "Performance", "Design Patterns", "Under the Hood",
            "Real World", "New Trends", "Hardcore Mode", "Certification"
        ];

        // If very small roadmap (<= 4 stages), keep as single chapter
        if (totalStages <= 4) {
            return [{
                title: isZh ? "全课程概览" : "Course Overview",
                desc: isZh ? "基础与核心" : "Fundamentals",
                stages: roadmap.stages
            }];
        }

        // Determine chunk size to keep chapters balanced (aim for 3-4 stages per chapter)
        let chunkSize = 3;
        if (totalStages >= 16) chunkSize = 4; 
        
        const chapters = [];
        
        for (let i = 0; i < totalStages; i += chunkSize) {
            const chapterIndex = Math.floor(i / chunkSize);
            const currentTitles = isZh ? titlesZh : titlesEn;
            const currentDescs = isZh ? descsZh : descsEn;

            // Safe title fallback
            const title = currentTitles[chapterIndex] || `${isZh ? '第' : 'Chapter'} ${chapterIndex + 1} ${isZh ? '章' : ''}`;
            const desc = currentDescs[chapterIndex] || (isZh ? "进阶内容" : "Advanced Topics");

            chapters.push({
                title,
                desc,
                stages: roadmap.stages.slice(i, i + chunkSize)
            });
        }
        
        return chapters;
    }, [roadmap.stages, isZh]);

    const renderIcon = (iconName: string) => {
        const Icon = ICON_MAP[iconName] || BookOpen;
        return <Icon size={20} />;
    };

    return (
        <div className={`flex flex-col h-full min-h-screen relative ${theme.bg} ${theme.text} transition-colors duration-500`}>
            
            {/* Action Modal */}
            {selectedStage && (
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in-up">
                    <div className="bg-white dark:bg-dark-card rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700 relative">
                        <button onClick={() => setSelectedStage(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <Lock size={20} className="opacity-0"/> {/* Spacer */}
                        </button>
                        
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 shadow-sm">
                                {renderIcon(selectedStage.icon)}
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{selectedStage.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{selectedStage.description}</p>
                        </div>

                        <div className="space-y-3">
                            <button 
                                onClick={handleStartCached}
                                className="w-full py-4 bg-brand text-white rounded-xl font-bold shadow-lg hover:bg-brand-light transition-all flex items-center justify-center gap-2 group"
                            >
                                <Play size={20} fill="currentColor"/>
                                {isZh ? "继续学习" : "Continue Learning"}
                            </button>
                            
                            <button 
                                onClick={handleRegenerate}
                                className="w-full py-4 bg-white dark:bg-dark-card border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:border-purple-400 hover:text-purple-500 transition-all flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={18}/>
                                {isZh ? "重新生成 (覆盖旧数据)" : "Regenerate (Overwrite)"}
                            </button>
                            
                            <button 
                                onClick={() => setSelectedStage(null)}
                                className="w-full py-2 text-gray-400 font-bold text-xs hover:text-gray-600"
                            >
                                {isZh ? "取消" : "Cancel"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className={`p-6 border-b ${theme.border} flex items-center gap-4 ${theme.headerBg} backdrop-blur-sm sticky top-0 z-20 shrink-0`}>
                <button onClick={onBack} className={`p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 ${theme.subText} hover:${theme.text} transition-colors`}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="text-xl font-black leading-tight tracking-tight">
                        {roadmap.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                            {isZh ? "知识工坊" : "Knowledge Forge"}
                        </span>
                        <p className={`text-xs ${theme.subText} font-medium truncate max-w-[200px]`}>
                            {roadmap.description}
                        </p>
                        <span className="text-[10px] font-mono text-gray-400 border-l pl-2 ml-1 border-gray-300 dark:border-gray-600">
                            {roadmap.stages.length} Steps
                        </span>
                    </div>
                </div>
            </div>

            {/* Campaign Path */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 relative z-10">
                <div className="max-w-xl mx-auto relative pb-24">
                    {/* Vertical Line */}
                    <div className={`absolute left-8 top-4 bottom-4 w-1 ${theme.line} rounded-full z-0`}></div>

                    {groups.map((group, gIdx) => (
                        <div key={gIdx} className="mb-12 relative">
                            {/* Group Header */}
                            <div className="flex items-center gap-4 mb-6 ml-16">
                                <div>
                                    <h3 className={`text-sm font-black ${theme.subText} uppercase tracking-widest`}>{group.title}</h3>
                                    <p className="text-[10px] text-gray-400 font-medium">{group.desc}</p>
                                </div>
                            </div>

                            {group.stages.map((stage, idx) => {
                                const status = stage.status; // 'locked' | 'unlocked' | 'completed'
                                const isLocked = status === 'locked';
                                const isActive = status === 'unlocked'; // Map 'unlocked' to active visual
                                const isCompleted = status === 'completed';
                                const isLoading = loadingStageId === stage.id;
                                
                                // Calculate global index for display
                                let prevCount = 0;
                                for(let k=0; k<gIdx; k++) prevCount += groups[k].stages.length;
                                const globalIdx = prevCount + idx;

                                let nodeStyle = theme.nodeLocked;
                                if (isActive) nodeStyle = theme.nodeActive;
                                if (isCompleted) nodeStyle = theme.nodeCompleted;

                                return (
                                    <div key={stage.id} className="relative z-10 mb-8 group">
                                        <div className="flex items-start gap-6">
                                            {/* Node Circle */}
                                            <button 
                                                disabled={isLocked || isLoading}
                                                onClick={() => handleStageClick(stage)}
                                                className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all duration-300 shrink-0 shadow-lg ${nodeStyle} ${isActive ? 'scale-110 animate-pulse-soft ring-4 ring-opacity-20 ring-current' : ''}`}
                                            >
                                                {isLoading ? <Loader2 size={24} className="animate-spin"/> : (isLocked ? <Lock size={24}/> : (isCompleted ? <CheckCircle size={28}/> : renderIcon(stage.icon)))}
                                            </button>

                                            {/* Content Card */}
                                            <button 
                                                disabled={isLocked || isLoading}
                                                onClick={() => handleStageClick(stage)}
                                                className={`flex-1 text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden
                                                    ${isLocked 
                                                        ? 'bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/5 opacity-50 cursor-not-allowed' 
                                                        : `${theme.card} cursor-pointer ${isActive ? 'ring-1 ring-current' : ''}`
                                                    }
                                                `}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isLocked ? 'text-gray-400 dark:text-gray-500' : theme.accent}`}>
                                                        STAGE {String(globalIdx + 1).padStart(2, '0')}
                                                    </span>
                                                    {isActive && <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>}
                                                    {stage.lessonPlan && isCompleted && (
                                                        <span className="text-[9px] px-2 py-0.5 bg-gray-100 dark:bg-white/10 rounded text-gray-500 font-bold">CACHED</span>
                                                    )}
                                                </div>
                                                <h3 className={`text-lg font-bold mb-1 ${isLocked ? 'text-gray-500' : theme.text}`}>
                                                    {stage.title}
                                                </h3>
                                                <p className={`text-xs ${theme.subText} leading-relaxed font-medium`}>
                                                    {stage.description}
                                                </p>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
