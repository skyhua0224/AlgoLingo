
import React, { useState, useEffect } from 'react';
import { 
    Search, Zap, ShoppingBag, Layout, Smartphone, Video, Gamepad2, Globe, 
    Building2, Server, Code2, Database, Cloud, ArrowRight, MessageCircle, 
    FileText, Edit3, Plus, Loader2, ArrowLeft, Users, Briefcase, MapPin, Terminal,
    Layers, History, PlayCircle, UserCheck, Coffee, Shield
} from 'lucide-react';
import { CareerSession, CompanyProfile, CareerMode, RoleDefinition, CareerStage } from '../types/career';
import { generateNextTurn, generateJDSyllabus, generateAICompanies } from '../services/ai/career/generator';
import { UserPreferences, SavedLesson } from '../types';
import { ForgeRoadmap } from '../types/forge';
import * as Icons from 'lucide-react';

interface CareerLobbyProps {
    language: 'Chinese' | 'English';
    onStartSession: (session: CareerSession) => void;
    onStartLesson: (plan: any, isSkip?: boolean) => void;
    onStartExam: (company: string, role: string, jdContext: string) => void; 
    onViewRoadmap: (roadmap: ForgeRoadmap) => void;
    preferences: UserPreferences;
    savedLessons?: SavedLesson[];
    careerSessions?: CareerSession[];
}

// --- REAL WORLD DATA PRESETS ---
const REAL_WORLD_COMPANIES: CompanyProfile[] = [
    { 
        id: 'bytedance', name: '字节跳动 (ByteDance)', description: 'App Factory & Recommendation Engine', region: 'cn', domain: 'social', category: 'backend', 
        color: 'from-blue-500 to-cyan-600', icon: 'Zap',
        roles: [
            { id: 'bd_back', title: '后端研发工程师 (高并发)', requirements: ['Golang', 'Microservices', 'Redis'], languages: ['Go', 'Python', 'C++'] },
            { id: 'bd_rec', title: '推荐算法工程师', requirements: ['Machine Learning', 'Python', 'C++'], languages: ['Python', 'C++'] },
            { id: 'bd_full', title: '全栈开发工程师 (效率工具)', requirements: ['React', 'Node.js', 'Internal Tools'], languages: ['JavaScript', 'TypeScript', 'Go'] }
        ], 
        tags: ['Golang', 'Python', 'Microservices'] 
    },
    { 
        id: 'tencent', name: '腾讯 (Tencent)', description: 'Connect Everything', region: 'cn', domain: 'game', category: 'game', 
        color: 'from-blue-600 to-blue-800', icon: 'MessageCircle',
        roles: [
            { id: 'tx_game_svr', title: '游戏服务器开发 (C++)', requirements: ['C++', 'Linux Network', 'Protobuf'], languages: ['C++', 'Lua'] },
            { id: 'tx_wechat', title: '微信后台架构师', requirements: ['High Availability', 'Storage', 'Dist. Systems'], languages: ['C++'] }
        ], 
        tags: ['C++', 'High Availability', 'Network'] 
    },
    { 
        id: 'alibaba', name: '阿里巴巴 (Alibaba)', description: 'Global E-commerce Infrastructure', region: 'cn', domain: 'ecom', category: 'backend', 
        color: 'from-orange-500 to-orange-700', icon: 'ShoppingBag',
        roles: [
            { id: 'ali_java', title: 'Java 后端专家 (P7)', requirements: ['Java', 'Spring Cloud', 'Dubbo'], languages: ['Java'] },
            { id: 'ali_storage', title: '云存储研发专家', requirements: ['Storage Engine', 'C++', 'Distributed FS'], languages: ['C++', 'Go'] }
        ], 
        tags: ['Java', 'Spring', 'Distributed Systems'] 
    },
    { 
        id: 'google', name: 'Google', description: 'Organize world\'s information', region: 'us', domain: 'ai', category: 'backend', 
        color: 'from-red-500 to-yellow-500', icon: 'Search',
        roles: [
            { id: 'goog_swe', title: 'Software Engineer (Backend)', requirements: ['Algorithms', 'System Design', 'Scale'], languages: ['C++', 'Java', 'Python', 'Go'] },
            { id: 'goog_sre', title: 'Site Reliability Engineer', requirements: ['Linux', 'Automation', 'Networking'], languages: ['Python', 'Go', 'Shell'] },
            { id: 'goog_full', title: 'Fullstack Engineer (Internal)', requirements: ['Angular/React', 'Java/C++', 'Internal APIs'], languages: ['TypeScript', 'Java'] }
        ], 
        tags: ['C++', 'Go', 'Scale', 'System Design'] 
    },
    { 
        id: 'microsoft', name: 'Microsoft', description: 'Empower every person', region: 'us', domain: 'infra', category: 'fullstack', 
        color: 'from-blue-500 to-blue-400', icon: 'Layout',
        roles: [
            { id: 'ms_azure', title: 'Software Engineer II (Azure)', requirements: ['C#', '.NET', 'Cloud Patterns'], languages: ['C#', 'C++', 'Go'] },
            { id: 'ms_teams', title: 'Fullstack Engineer (Teams)', requirements: ['React', 'TypeScript', 'GraphQL'], languages: ['TypeScript', 'JavaScript'] }
        ], 
        tags: ['C#', '.NET', 'Cloud', 'Distributed'] 
    },
    { 
        id: 'airbnb', name: 'Airbnb', description: 'Belong anywhere', region: 'us', domain: 'ecom', category: 'fullstack', 
        color: 'from-rose-500 to-pink-600', icon: 'Home',
        roles: [
            { id: 'ab_full', title: 'Senior Fullstack Engineer', requirements: ['React', 'Java/Ruby', 'GraphQL'], languages: ['JavaScript', 'Java', 'Ruby'] },
            { id: 'ab_fe', title: 'Frontend Infrastructure', requirements: ['React Performance', 'Design Systems'], languages: ['JavaScript', 'TypeScript'] }
        ],
        tags: ['React', 'Design-Driven', 'Ruby']
    },
    { 
        id: 'amazon', name: 'Amazon', description: 'Earth\'s most customer-centric', region: 'us', domain: 'ecom', category: 'backend', 
        color: 'from-yellow-500 to-orange-500', icon: 'ShoppingBag',
        roles: [
            { id: 'amz_sde', title: 'SDE II (AWS)', requirements: ['Java', 'DynamoDB', 'Lambda'], languages: ['Java', 'C++'] },
            { id: 'amz_sol', title: 'Solutions Architect', requirements: ['System Design', 'Communication', 'AWS'], languages: ['Java', 'Python'] }
        ], 
        tags: ['Java', 'Leadership Principles', 'High Scale'] 
    },
    { 
        id: 'mihoyo', name: '米哈游 (miHoYo)', description: 'Tech Otakus Save The World', region: 'cn', domain: 'game', category: 'game', 
        color: 'from-purple-500 to-pink-500', icon: 'Gamepad2',
        roles: [
            { id: 'mhy_client', title: '游戏客户端开发', requirements: ['Unity/UE4', 'C#', 'C++'], languages: ['C#', 'C++'] },
            { id: 'mhy_render', title: '图形渲染工程师', requirements: ['Graphics API', 'Shader', 'Math'], languages: ['C++', 'HLSL/GLSL'] }
        ], 
        tags: ['Rendering', 'Graphics', 'C#', 'C++'] 
    }
];

const CATEGORIES = [
    { id: 'all', label: { en: 'All', zh: '全部' }, icon: Globe },
    { id: 'backend', label: { en: 'Backend', zh: '后端' }, icon: Server },
    { id: 'fullstack', label: { en: 'Fullstack', zh: '全栈' }, icon: Layers },
    { id: 'frontend', label: { en: 'Frontend', zh: '前端' }, icon: Code2 },
    { id: 'game', label: { en: 'Game Dev', zh: '游戏' }, icon: Gamepad2 },
    { id: 'ai', label: { en: 'AI / ML', zh: 'AI 工程' }, icon: Zap },
    { id: 'mobile', label: { en: 'Mobile', zh: '移动端' }, icon: Smartphone },
];

function renderIcon(name: string, props: any = {}) {
    const Icon = (Icons as any)[name] || Building2;
    return <Icon {...props} />;
}

export const CareerLobby: React.FC<CareerLobbyProps> = ({ language, onStartSession, onStartLesson, onStartExam, onViewRoadmap, preferences, savedLessons, careerSessions }) => {
    const isZh = language === 'Chinese';
    
    // --- STATE ---
    const [viewState, setViewState] = useState<'lobby' | 'custom_jd' | 'company_detail' | 'mode_select'>('lobby');
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [historyTab, setHistoryTab] = useState<'jd' | 'interview' | 'exam'>('jd');
    
    const [companies, setCompanies] = useState<CompanyProfile[]>(REAL_WORLD_COMPANIES);
    const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | null>(null);
    const [selectedRole, setSelectedRole] = useState<RoleDefinition | null>(null);
    const [customJD, setCustomJD] = useState('');
    const [jdHistory, setJdHistory] = useState<ForgeRoadmap[]>([]);
    
    const [selectedRound, setSelectedRound] = useState<CareerStage | null>(null); // New: Round selector

    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('');

    // Load JD History
    useEffect(() => {
        const saved = localStorage.getItem('algolingo_forge_history_v2');
        if (saved) {
            try {
                const allItems = JSON.parse(saved) as ForgeRoadmap[];
                const jdItems = allItems.filter(item => item.id.startsWith('forge_jd_'));
                setJdHistory(jdItems);
            } catch (e) { console.error(e); }
        }
    }, [viewState]); 

    // Filter Exams from Saved Lessons
    const examHistory = (savedLessons || []).filter(l => l.plan.context?.type === 'career_exam');
    
    // Filter Interviews from Sessions
    const interviewHistory = (careerSessions || []).filter(s => s.mode === 'simulation');

    // --- ACTIONS ---

    const handleGenerateMore = async () => {
        setLoading(true);
        setLoadingMsg(isZh ? "AI 正在挖掘更多公司..." : "AI Scouting for more companies...");
        try {
            const existingNames = companies.map(c => c.name);
            const newCompanies = await generateAICompanies(activeCategory === 'all' ? 'tech' : activeCategory, existingNames, preferences);
            setCompanies(prev => [...prev, ...newCompanies]);
        } catch (e) {
            alert("AI Scout failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleCustomJDSubmit = () => {
        if (!customJD.trim()) return;
        
        const customCompany: CompanyProfile = {
            id: 'custom_jd_company',
            name: isZh ? '目标职位 (自定义)' : 'Target Role (Custom)',
            description: isZh ? '根据 JD 自动生成的面试环境' : 'Interview environment generated from JD',
            region: 'global',
            domain: 'custom',
            category: 'backend',
            color: 'from-gray-700 to-black',
            roles: [{
                id: 'custom_role',
                title: isZh ? '自定义岗位' : 'Custom Role',
                requirements: ['Analyzed from JD'],
                languages: [preferences.targetLanguage]
            }],
            tags: ['Custom'],
            icon: 'FileText'
        };

        setSelectedCompany(customCompany);
        setSelectedRole(customCompany.roles[0]);
        setViewState('mode_select');
    };

    const handleStartSession = async (mode: CareerMode, stage?: CareerStage) => {
        if (!selectedCompany || !selectedRole) return;

        let jdContext = customJD;
        if (!jdContext && selectedCompany.id !== 'custom_jd_company') {
            // Construct context from role details
            jdContext = `Role: ${selectedRole.title} at ${selectedCompany.name}. Requirements: ${selectedRole.requirements.join(', ')}. Domain: ${selectedCompany.domain}. Category: ${selectedCompany.category}.`;
        }

        // MODE: RAPID EXAM
        if (mode === 'rapid_exam') {
            onStartExam(selectedCompany.name, selectedRole.title, jdContext);
            return; 
        }
        
        setLoading(true);
        setLoadingMsg(isZh ? "正在初始化面试环境..." : "Initializing environment...");

        try {
            let syllabusId;
            
            // MODE: JD PREP
            if (mode === 'jd_prep') {
                setLoadingMsg(isZh ? "正在生成岗位特训方案..." : "Generating Training Plan...");
                const roadmap = await generateJDSyllabus(jdContext, preferences);
                
                const history = JSON.parse(localStorage.getItem('algolingo_forge_history_v2') || '[]');
                const newHistory = [roadmap, ...history.filter((h: any) => h.id !== roadmap.id)].slice(0, 20);
                localStorage.setItem('algolingo_forge_history_v2', JSON.stringify(newHistory));
                
                syllabusId = roadmap.id;
            }

            // MODE: SIMULATION
            const session: CareerSession = {
                id: `sess_${Date.now()}`,
                mode: mode,
                stage: stage || 'technical_1', // Default to round 1 if not set
                companyId: selectedCompany.id,
                companyName: selectedCompany.name,
                role: selectedRole.title, 
                status: 'active',
                turns: [], 
                syllabusId: syllabusId,
                jdText: jdContext,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                culture: 'engineering'
            };

            if (mode === 'simulation') {
                const firstTurn = await generateNextTurn(session, preferences);
                session.turns.push(firstTurn);
            }

            onStartSession(session);

        } catch (e) {
            console.error(e);
            alert("Failed to start session");
        } finally {
            setLoading(false);
        }
    };

    // --- FILTERS ---
    const filteredCompanies = companies.filter(c => {
        const matchCat = activeCategory === 'all' || c.category === activeCategory || (activeCategory === 'game' && c.domain === 'game');
        const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchSearch;
    });

    if (loading) {
        return (
            <div className="fixed inset-0 z-[200] bg-white/90 dark:bg-black/90 flex flex-col items-center justify-center text-gray-800 dark:text-white backdrop-blur-sm animate-fade-in-up">
                <Loader2 size={48} className="animate-spin text-brand mb-6"/>
                <h2 className="text-2xl font-black animate-pulse">{loadingMsg}</h2>
            </div>
        );
    }

    if (viewState === 'custom_jd') {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#050505] p-6 flex flex-col items-center justify-center animate-fade-in-up">
                <div className="w-full max-w-3xl bg-white dark:bg-[#111] rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 p-8">
                    <button onClick={() => setViewState('lobby')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors">
                        <ArrowLeft size={20} /> {isZh ? "返回" : "Back"}
                    </button>
                    
                    <div className="mb-6">
                        <div className="w-14 h-14 bg-brand/10 rounded-2xl flex items-center justify-center text-brand mb-4">
                            <FileText size={32} />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">{isZh ? "自定义岗位 (JD)" : "Custom Job Description"}</h1>
                        <p className="text-gray-500 dark:text-gray-400">{isZh ? "粘贴招聘要求，AI 将为你量身定制面试或学习计划。" : "Paste the JD here. AI will tailor the interview or study plan for you."}</p>
                    </div>

                    <textarea 
                        className="w-full h-64 p-4 bg-gray-50 dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl focus:border-brand outline-none resize-none mb-6 text-sm font-mono leading-relaxed"
                        placeholder={isZh ? "在此处粘贴 JD 内容...\n例如：\n- 熟练掌握 Golang/Python\n- 熟悉 K8s 和微服务架构\n- 3年以上高并发经验..." : "Paste JD content here..."}
                        value={customJD}
                        onChange={(e) => setCustomJD(e.target.value)}
                    />

                    <button 
                        onClick={handleCustomJDSubmit}
                        disabled={!customJD.trim()}
                        className="w-full py-4 bg-brand text-white rounded-xl font-bold text-lg shadow-lg hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isZh ? "分析并继续" : "Analyze & Continue"}
                    </button>
                </div>
            </div>
        );
    }

    if (viewState === 'mode_select' && selectedCompany && selectedRole) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#050505] p-6 flex flex-col items-center justify-center animate-fade-in-up">
                <div className="w-full max-w-5xl">
                    <button onClick={() => setViewState(selectedCompany.id === 'custom_jd_company' ? 'custom_jd' : 'company_detail')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white mb-8 transition-colors">
                        <ArrowLeft size={20} /> {isZh ? "返回" : "Back"}
                    </button>

                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-sm mb-4">
                            <Briefcase size={16} /> {selectedRole.title}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
                            {isZh ? "选择挑战模式" : "Select Challenge Mode"}
                        </h1>
                        <p className="text-gray-500 text-lg">
                            {isZh ? "你想如何攻克这个岗位？" : "How do you want to tackle this role?"}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* INTERVIEW SIMULATION - EXPANDED OPTIONS */}
                        <div className="group bg-white dark:bg-[#111] border-2 border-gray-200 dark:border-gray-800 p-8 rounded-3xl flex flex-col h-full relative overflow-hidden transition-all hover:shadow-2xl">
                            <div className="p-4 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-2xl inline-flex mb-6 w-fit">
                                <MessageCircle size={32} />
                            </div>
                            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">{isZh ? "全真模拟面试" : "Interview Sim"}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6 flex-1">
                                {isZh ? "沉浸式 AI 面试官。选择特定轮次进行针对性模拟。" : "Immersive AI Interviewer. Select specific rounds to practice."}
                            </p>
                            
                            <div className="space-y-2">
                                {[
                                    { id: 'technical_1', label: isZh ? '一面：基础与算法' : 'Round 1: Basics & Algo', icon: Terminal },
                                    { id: 'technical_2', label: isZh ? '二面：项目与架构' : 'Round 2: Deep Dive & System Design', icon: Layers },
                                    { id: 'manager', label: isZh ? '三面：主管面 (软技能)' : 'Round 3: Manager / Behavioral', icon: Users },
                                    { id: 'hr', label: isZh ? 'HR 面：文化与薪资' : 'HR Round: Culture & Salary', icon: UserCheck }
                                ].map((stage) => (
                                    <button
                                        key={stage.id}
                                        onClick={() => handleStartSession('simulation', stage.id as CareerStage)}
                                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 flex items-center gap-3 text-sm font-bold transition-all group/btn"
                                    >
                                        <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg group-hover/btn:text-blue-500"><stage.icon size={16}/></div>
                                        <span className="text-gray-700 dark:text-gray-200">{stage.label}</span>
                                        <ArrowRight size={14} className="ml-auto text-gray-400 group-hover/btn:text-blue-500"/>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* JD PREP */}
                        <button onClick={() => handleStartSession('jd_prep')} className="group bg-white dark:bg-[#111] border-2 border-gray-200 dark:border-gray-800 hover:border-purple-500 dark:hover:border-purple-500 p-8 rounded-3xl text-left transition-all hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden flex flex-col h-full">
                            <div className="p-4 bg-purple-100 dark:bg-purple-900/20 text-purple-600 rounded-2xl inline-flex mb-6 w-fit">
                                <FileText size={32} />
                            </div>
                            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">{isZh ? "岗位专项特训" : "JD Syllabus"}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6 flex-1">
                                {isZh ? "AI 分析 JD 关键词，生成一份 6 阶段的结构化复习大纲。针对性补齐短板。" : "AI analyzes JD keywords to generate a 6-stage structured study roadmap. Close your skill gaps."}
                            </p>
                            <div className="flex items-center gap-2 text-purple-600 font-bold text-xs uppercase tracking-wider">
                                {isZh ? "生成大纲" : "Generate Plan"} <ArrowRight size={16} />
                            </div>
                        </button>

                        {/* SPEED EXAM */}
                        <button onClick={() => handleStartSession('rapid_exam')} className="group bg-white dark:bg-[#111] border-2 border-gray-200 dark:border-gray-800 hover:border-orange-500 dark:hover:border-orange-500 p-8 rounded-3xl text-left transition-all hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden flex flex-col h-full">
                            <div className="p-4 bg-orange-100 dark:bg-orange-900/20 text-orange-600 rounded-2xl inline-flex mb-6 w-fit">
                                <Edit3 size={32} />
                            </div>
                            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">{isZh ? "高强度笔试" : "Speed Exam"}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6 flex-1">
                                {isZh ? "无废话，纯做题。连续 10-15 道选择与填空，限时作答。适合考前极速刷题。" : "No chat, purely problems. 10-15 rapid-fire questions with strict time limits."}
                            </p>
                            <div className="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-wider">
                                {isZh ? "开始笔试" : "Start Exam"} <ArrowRight size={16} />
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (viewState === 'company_detail' && selectedCompany) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#050505] p-6 md:p-12 animate-fade-in-up">
                <button onClick={() => setViewState('lobby')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white mb-8 transition-colors">
                    <ArrowLeft size={20} /> {isZh ? "返回大厅" : "Back to Lobby"}
                </button>

                <div className="max-w-6xl mx-auto">
                    <div className="bg-white dark:bg-[#111] rounded-3xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm mb-10 flex flex-col md:flex-row items-start md:items-center gap-8">
                        <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${selectedCompany.color} flex items-center justify-center text-white shadow-xl shrink-0`}>
                            {renderIcon(selectedCompany.icon || 'Building2', { size: 40 })}
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2">{selectedCompany.name}</h1>
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                                <span className="flex items-center gap-1"><MapPin size={14}/> {selectedCompany.region === 'cn' ? 'China' : 'Global'}</span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                <span>{selectedCompany.description}</span>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {selectedCompany.tags.map(tag => (
                                    <span key={tag} className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-6">
                        <Users size={20} className="text-brand"/>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white uppercase tracking-widest">{isZh ? "开放职位 (Open Roles)" : "Open Roles"}</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                        {selectedCompany.roles.map((role, idx) => (
                            <button 
                                key={idx}
                                onClick={() => { setSelectedRole(role); setViewState('mode_select'); }}
                                className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-2xl hover:border-brand dark:hover:border-brand transition-all group hover:shadow-lg hover:-translate-y-1 text-left gap-4"
                            >
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:bg-brand group-hover:text-white transition-colors shrink-0">
                                        <Briefcase size={20} />
                                    </div>
                                    <div>
                                        <span className="font-bold text-base md:text-lg text-gray-800 dark:text-gray-200 block mb-2">{role.title}</span>
                                        <div className="flex flex-wrap gap-2">
                                            {role.requirements.map((req, rIdx) => (
                                                <span key={rIdx} className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">{req}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 shrink-0 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800 pt-4 md:pt-0 md:pl-4 w-full md:w-auto justify-between md:justify-end">
                                    <div className="flex flex-col gap-1 items-start md:items-end">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">{isZh ? "面试语言" : "Interview Lang"}</span>
                                        <div className="flex gap-1">
                                            {role.languages.map((lang, lIdx) => (
                                                <span key={lIdx} className="text-[10px] font-bold text-brand-dark dark:text-brand-light bg-brand/10 px-2 py-0.5 rounded flex items-center gap-1">
                                                    <Terminal size={10} /> {lang}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <ArrowRight size={20} className="text-gray-300 group-hover:text-brand transition-colors"/>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // LOBBY VIEW
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-white p-4 md:p-8 pb-24">
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
                        {isZh ? "职业试炼场" : "Career Arena"}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                        {isZh ? "挑战名企真实岗位，或上传 JD 进行定制特训" : "Challenge real tech giants or upload your own JD"}
                    </p>
                </div>
                <div className="relative w-full md:w-auto">
                    <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input 
                        type="text" 
                        className="pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 text-sm font-bold w-full md:w-64 focus:border-brand outline-none shadow-sm"
                        placeholder={isZh ? "搜索公司..." : "Search companies..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex overflow-x-auto custom-scrollbar gap-2 mb-8 pb-2">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeCategory === cat.id ? 'bg-gray-900 dark:bg-white text-white dark:text-black shadow-lg' : 'bg-white dark:bg-[#111] text-gray-500 border border-gray-200 dark:border-gray-800 hover:border-gray-400'}`}
                    >
                        <cat.icon size={14} />
                        {isZh ? cat.label.zh : cat.label.en}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                <button 
                    onClick={() => setViewState('custom_jd')}
                    className="group h-[260px] rounded-3xl border-2 border-dashed border-brand/40 bg-brand/5 hover:bg-brand/10 hover:border-brand transition-all flex flex-col items-center justify-center gap-4 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-dark-card shadow-sm flex items-center justify-center text-brand group-hover:scale-110 transition-transform">
                        <Plus size={32} strokeWidth={3} />
                    </div>
                    <div className="text-center px-4">
                        <div className="font-black text-brand text-lg mb-1">{isZh ? "自定义 / 猎头模式" : "Custom / Headhunter"}</div>
                        <div className="text-xs text-brand/60 font-bold uppercase tracking-wide">{isZh ? "上传 JD 生成面试" : "Upload JD to Generate"}</div>
                    </div>
                </button>

                {filteredCompanies.map(company => (
                    <button 
                        key={company.id}
                        onClick={() => { setSelectedCompany(company); setViewState('company_detail'); }}
                        className="group relative bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 hover:border-brand dark:hover:border-brand p-6 rounded-3xl text-left transition-all hover:shadow-2xl hover:-translate-y-1 overflow-hidden flex flex-col h-[260px]"
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${company.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                        
                        <div className="flex justify-between items-start mb-auto">
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${company.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                {renderIcon(company.icon || 'Building2', { size: 24 })}
                            </div>
                            <div className="text-[10px] font-bold uppercase bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-lg text-gray-400 border border-gray-100 dark:border-gray-700">
                                {company.roles.length} Roles
                            </div>
                        </div>

                        <div className="relative z-10 mt-4">
                            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-1 leading-tight">{company.name}</h3>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-4 font-medium">{company.description}</p>
                            
                            <div className="flex flex-wrap gap-1.5">
                                {company.tags.slice(0, 3).map((tag, i) => (
                                    <span key={i} className="text-[9px] text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                        
                        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1 text-xs font-bold text-gray-300 group-hover:text-brand transition-colors">
                            <span>{isZh ? "查看职位" : "View Roles"}</span>
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
                        </div>
                    </button>
                ))}

                <button 
                    onClick={handleGenerateMore}
                    className="group h-[260px] rounded-3xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0a0a0a] hover:bg-gray-100 dark:hover:bg-[#151515] flex flex-col items-center justify-center gap-3 transition-all opacity-70 hover:opacity-100"
                >
                    <div className="p-3 bg-gray-200 dark:bg-gray-800 rounded-full text-gray-500">
                        <Loader2 size={24} className="group-hover:animate-spin" />
                    </div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {isZh ? "AI 发现更多..." : "AI Discover More..."}
                    </div>
                </button>
            </div>

            {/* --- HISTORY SECTION --- */}
            <div className="animate-fade-in-up">
                <div className="flex items-center justify-between mb-6 border-b border-gray-200 dark:border-gray-800 pb-2">
                    <div className="flex items-center gap-2 text-xl font-black uppercase tracking-tight text-gray-800 dark:text-gray-200">
                        <History size={20} className="text-gray-400"/>
                        {isZh ? "职业档案 (Career Profile)" : "Career Profile"}
                    </div>
                    
                    {/* History Tabs */}
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                        {[
                            { id: 'jd', label: isZh ? 'JD 特训' : 'Study Plans' },
                            { id: 'interview', label: isZh ? '面试记录' : 'Interviews' },
                            { id: 'exam', label: isZh ? '笔试成绩' : 'Exams' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setHistoryTab(tab.id as any)}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${historyTab === tab.id ? 'bg-white dark:bg-dark-card text-brand shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="min-h-[200px]">
                    {historyTab === 'jd' && jdHistory.length > 0 && (
                        <div className="flex overflow-x-auto custom-scrollbar gap-4 pb-6">
                            {jdHistory.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => onViewRoadmap(item)}
                                    className="w-[300px] shrink-0 bg-white dark:bg-[#111] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-purple-500 dark:hover:border-purple-500 transition-all text-left group hover:shadow-lg"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg">
                                            <FileText size={20} />
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">{item.topic}</h4>
                                    <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
                                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center text-xs font-bold text-purple-600 group-hover:gap-2 transition-all">
                                        {isZh ? "继续学习" : "Continue"} <ArrowRight size={14}/>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {historyTab === 'interview' && interviewHistory.length > 0 && (
                        <div className="flex overflow-x-auto custom-scrollbar gap-4 pb-6">
                            {interviewHistory.map(session => (
                                <button
                                    key={session.id}
                                    onClick={() => onStartSession(session)}
                                    className="w-[300px] shrink-0 bg-white dark:bg-[#111] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all text-left group hover:shadow-lg"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                                            <MessageCircle size={20} />
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400">
                                            {new Date(session.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">{session.companyName}</h4>
                                    <div className="flex gap-2 items-center mb-2">
                                        <span className="text-xs text-gray-500 line-clamp-1 font-mono">{session.role}</span>
                                        {session.stage && <span className="text-[9px] text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1.5 rounded">{session.stage}</span>}
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <span className="text-[9px] bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-500 font-bold border border-gray-200 dark:border-gray-700">
                                            {session.turns.length} Turns
                                        </span>
                                        {session.status === 'active' && <span className="text-[9px] bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded text-green-600 font-bold">Active</span>}
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center text-xs font-bold text-blue-600 group-hover:gap-2 transition-all">
                                        {isZh ? "继续面试" : "Resume Interview"} <ArrowRight size={14}/>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {historyTab === 'exam' && examHistory.length > 0 && (
                        <div className="flex overflow-x-auto custom-scrollbar gap-4 pb-6">
                            {examHistory.map(saved => (
                                <button
                                    key={saved.id}
                                    onClick={() => onStartLesson(saved.plan, true)} // Pass isSkip=true to trigger Exam Mode logic via context
                                    className="w-[300px] shrink-0 bg-white dark:bg-[#111] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-orange-500 dark:hover:border-orange-500 transition-all text-left group hover:shadow-lg"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg">
                                            <Edit3 size={20} />
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400">
                                            {new Date(saved.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">
                                        {saved.plan.context?.companyName || saved.plan.title}
                                    </h4>
                                    <p className="text-xs text-gray-500 line-clamp-1 font-mono">{saved.plan.context?.roleName || "Speed Exam"}</p>
                                    
                                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center text-xs font-bold text-orange-600 group-hover:gap-2 transition-all">
                                        {isZh ? "查看考卷" : "Review Exam"} <PlayCircle size={14}/>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Empty States */}
                    {((historyTab === 'jd' && jdHistory.length === 0) || 
                      (historyTab === 'interview' && interviewHistory.length === 0) || 
                      (historyTab === 'exam' && examHistory.length === 0)) && (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl opacity-50">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <History size={24} className="text-gray-400"/>
                            </div>
                            <p className="text-sm font-bold text-gray-400">{isZh ? "暂无相关记录" : "No history yet"}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
