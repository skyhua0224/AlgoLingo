
import React from 'react';
import { Swords, Clock, Award, UserCheck, Lock } from 'lucide-react';

interface CareerLobbyProps {
    language: 'Chinese' | 'English';
}

export const CareerLobby: React.FC<CareerLobbyProps> = ({ language }) => {
    const isZh = language === 'Chinese';

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 pb-24 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-purple-900/20 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-blue-900/20 blur-[120px] rounded-full"></div>
            </div>

            <div className="relative z-10 w-full max-w-4xl">
                <div className="text-center mb-12">
                    <div className="inline-flex p-4 rounded-full bg-white/5 border border-white/10 mb-6 shadow-2xl backdrop-blur-md animate-pulse-soft">
                        <Swords size={48} className="text-white" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                        {isZh ? "职业试炼场" : "The Arena"}
                    </h1>
                    <p className="text-gray-400 font-medium text-lg max-w-xl mx-auto">
                        {isZh 
                         ? "证明你的实力。从极速挑战到真实模拟面试。" 
                         : "Prove your worth. From speed runs to realistic mock interviews."}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Mode 1: Speed Run */}
                    <div className="group relative bg-[#161616] border border-white/10 rounded-3xl p-8 hover:bg-[#202020] transition-all cursor-pointer overflow-hidden hover:border-orange-500/50">
                        <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="mb-6 p-3 bg-orange-500/10 w-fit rounded-xl text-orange-500">
                            <Clock size={32} />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">{isZh ? "极速高压" : "Speed Run"}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed mb-6">
                            {isZh 
                             ? "15分钟，5道选择 + 1道代码填空。测试你的直觉反应。" 
                             : "15 mins. 5 Quizzes + 1 Fill-in. Test your intuition under pressure."}
                        </p>
                        <button className="w-full py-3 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-500 transition-colors">
                            {isZh ? "开始挑战" : "Enter Gauntlet"}
                        </button>
                    </div>

                    {/* Mode 2: Interview (Mock) */}
                    <div className="group relative bg-[#161616] border border-white/10 rounded-3xl p-8 hover:bg-[#202020] transition-all cursor-pointer overflow-hidden hover:border-blue-500/50 transform md:-translate-y-6 shadow-2xl">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="mb-6 p-3 bg-blue-500/10 w-fit rounded-xl text-blue-500">
                            <UserCheck size={32} />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">{isZh ? "模拟面试" : "Interview Sim"}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed mb-6">
                            {isZh 
                             ? "AI 面试官。语音交互，白板编程，追问与反馈。" 
                             : "AI Interviewer. Voice chat, whiteboard coding, follow-up questions."}
                        </p>
                        <div className="flex gap-2 mb-6">
                            <span className="px-2 py-1 rounded bg-white/5 text-[10px] font-bold text-gray-400">Google</span>
                            <span className="px-2 py-1 rounded bg-white/5 text-[10px] font-bold text-gray-400">Meta</span>
                            <span className="px-2 py-1 rounded bg-white/5 text-[10px] font-bold text-gray-400">Startup</span>
                        </div>
                        <button className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20">
                            {isZh ? "预约面试" : "Schedule"}
                        </button>
                    </div>

                    {/* Mode 3: Ranked (Locked) */}
                    <div className="group relative bg-[#161616]/50 border border-white/5 rounded-3xl p-8 transition-all overflow-hidden opacity-60 hover:opacity-100">
                        <div className="absolute top-4 right-4">
                            <Lock size={20} className="text-gray-600" />
                        </div>
                        <div className="mb-6 p-3 bg-purple-500/10 w-fit rounded-xl text-purple-500 grayscale group-hover:grayscale-0 transition-all">
                            <Award size={32} />
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-gray-400 group-hover:text-white">{isZh ? "排位赛" : "Ranked"}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed mb-6">
                            {isZh 
                             ? "挑战 Ghost 影子。全球排名，赛季奖励。" 
                             : "Challenge the Ghost. Global leaderboards, seasonal rewards."}
                        </p>
                        <button disabled className="w-full py-3 rounded-xl border border-white/10 text-gray-500 font-bold cursor-not-allowed">
                            {isZh ? "即将推出" : "Coming Soon"}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};
