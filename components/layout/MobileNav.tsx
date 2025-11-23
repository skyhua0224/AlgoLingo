
import React from 'react';
import { Brain, Cpu, Sparkles, Swords, User, Settings } from 'lucide-react';
import { AppView } from '../../types';

interface MobileNavProps {
  activeTab: AppView;
  onTabChange: (tab: AppView) => void;
  onOpenSettings: () => void;
  t: any;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onTabChange, onOpenSettings, t }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#0c0c0c]/90 backdrop-blur-lg border-t border-gray-200 dark:border-white/10 flex justify-around py-3 pb-6 z-50 shadow-2xl">
      <MobileNavItem 
        icon={<Brain size={22} />} 
        label="Algo" 
        active={activeTab === 'algorithms'} 
        onClick={() => onTabChange('algorithms')} 
      />
      <MobileNavItem 
        icon={<Cpu size={22} />} 
        label="Eng." 
        active={activeTab === 'engineering'} 
        onClick={() => onTabChange('engineering')} 
      />
      <MobileNavItem 
        icon={<Sparkles size={22} />} 
        label="Forge" 
        active={activeTab === 'forge'} 
        onClick={() => onTabChange('forge')} 
      />
      <MobileNavItem 
        icon={<Swords size={22} />} 
        label="Career" 
        active={activeTab === 'career'} 
        onClick={() => onTabChange('career')} 
      />
      <MobileNavItem 
        icon={<User size={22} />} 
        label="Me" 
        active={activeTab === 'profile'} 
        onClick={() => onTabChange('profile')} 
      />
    </nav>
  );
};

const MobileNavItem = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 min-w-[50px] p-1 rounded-xl transition-all duration-300
      ${active 
        ? 'text-brand scale-110' 
        : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
  >
    <div className={`p-1.5 rounded-full ${active ? 'bg-brand/10 dark:bg-brand/20' : 'bg-transparent'}`}>
        {icon}
    </div>
    <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
  </button>
);
