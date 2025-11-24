
import React from 'react';
import { PillarCard } from './PillarCard';
import { Layers, Server } from 'lucide-react';

interface PillarsSectionProps {
    language: 'Chinese' | 'English';
}

export const PillarsSection: React.FC<PillarsSectionProps> = ({ language }) => {
    const isZh = language === 'Chinese';

    return (
        <div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 pl-2 flex items-center gap-2">
                {isZh ? "双塔核心" : "The Twin Pillars"}
                <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1 ml-2"></div>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PillarCard 
                    title={isZh ? "系统设计" : "System Design"}
                    subtitle={isZh ? "分布式架构蓝图" : "Distributed Architecture"}
                    icon={<Layers size={24} />}
                    colorClass="bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30 text-purple-900 dark:text-purple-200"
                    accentColor="bg-purple-500"
                    progress={33}
                    tags={['Load Balancer', 'CAP Theorem', 'Feed System']}
                />
                
                <PillarCard 
                    title={isZh ? "计算机内功" : "CS Fundamentals"}
                    subtitle={isZh ? "操作系统与网络内核" : "OS & Network Kernel"}
                    icon={<Server size={24} />}
                    colorClass="bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30 text-emerald-900 dark:text-emerald-200"
                    accentColor="bg-emerald-500"
                    progress={15}
                    tags={['Process/Thread', 'TCP Handshake', 'B+ Trees']}
                />
            </div>
        </div>
    );
};
