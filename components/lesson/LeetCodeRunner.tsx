
import React, { useState, useEffect } from 'react';
import { LessonPlan, LeetCodeContext, UserPreferences } from '../../types';
import { VirtualWorkspace } from '../VirtualWorkspace';
import { generateLeetCodeContext } from '../../services/geminiService';
import { Loader2, Lightbulb, Code } from 'lucide-react';
import { FlipCardWidget } from '../widgets/FlipCard';
import { InteractiveCodeWidget } from '../widgets/InteractiveCode';
import { GlobalAiAssistant } from '../GlobalAiAssistant';

// Collapsible Helper
const CollapsibleSection: React.FC<{ title: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-dark-card mb-4">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
                <div className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 flex items-center gap-2">
                    {title}
                </div>
                <div className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</div>
            </button>
            {isOpen && <div className="p-3 border-t border-gray-200 dark:border-gray-700">{children}</div>}
        </div>
    );
};

interface LeetCodeRunnerProps {
    plan: LessonPlan;
    preferences: UserPreferences;
    language: 'Chinese' | 'English';
    onSuccess: () => void;
}

export const LeetCodeRunner: React.FC<LeetCodeRunnerProps> = ({ plan, preferences, language, onSuccess }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<LeetCodeContext | null>(null);

    useEffect(() => {
        if (!data && !loading) {
            setLoading(true);
            generateLeetCodeContext(plan.title, preferences)
                .then(res => {
                    setData(res);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Simulator load failed", err);
                    setLoading(false);
                });
        }
    }, [plan.title]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50 dark:bg-dark-bg">
                <Loader2 size={48} className="animate-spin text-brand mb-4"/>
                <p className="font-bold text-sm uppercase tracking-wider">
                    {language === 'Chinese' ? "AI 正在构建 LeetCode 仿真环境..." : "AI is building LeetCode simulation..."}
                </p>
            </div>
        );
    }

    if (!data) return <div className="p-8 text-center text-red-500">Failed to load simulation.</div>;

    return (
        <div className="flex h-full relative bg-gray-50 dark:bg-dark-bg overflow-hidden">
            <GlobalAiAssistant problemName={plan.title} preferences={preferences} language={language} />

            {/* Main Workspace */}
            <div className={`h-full ${sidebarOpen ? 'w-full md:w-3/4' : 'w-full'} flex flex-col transition-all duration-300 ease-in-out`}>
                <VirtualWorkspace 
                    context={data} 
                    preferences={preferences} 
                    onSuccess={onSuccess}
                    isSidebarOpen={sidebarOpen}
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                />
            </div>

            {/* Right Sidebar */}
            <div className={`${sidebarOpen ? 'w-full md:w-1/4 border-l' : 'w-0 overflow-hidden'} h-full flex-col border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-bg overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out absolute md:relative right-0 z-30 md:z-0 shadow-2xl md:shadow-none`}>
                <div className="p-4 space-y-4 min-w-[300px]">
                     <div className="mb-2">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider text-center">
                            {language === 'Chinese' ? "仿真环境已就绪" : "Simulation Ready"}
                        </p>
                    </div>
                    
                    <CollapsibleSection title={<><Lightbulb size={14}/> Concept Card</>} defaultOpen={true}>
                        <FlipCardWidget widget={{
                            id: 'lc-concept',
                            type: 'flipcard',
                            flipcard: {
                                front: data.sidebar.concept.front,
                                back: data.sidebar.concept.back,
                                mode: 'learn'
                            }
                        }} language={language} />
                    </CollapsibleSection>

                    <CollapsibleSection title={<><Code size={14}/> Solution Code</>} defaultOpen={false}>
                        <InteractiveCodeWidget widget={{
                            id: 'lc-code',
                            type: 'interactive-code',
                            interactiveCode: data.sidebar.codeSolution
                        }} language={language} />
                    </CollapsibleSection>
                </div>
            </div>
        </div>
    );
};
