
import React from 'react';
import { BookOpen, RotateCcw, User, Settings, Layers } from 'lucide-react';

interface MobileNavProps {
  activeTab: 'learn' | 'review' | 'profile';
  onTabChange: (tab: any) => void;
  onOpenSettings: () => void;
  t: any;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onTabChange, onOpenSettings, t }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#0c0c0c]/90 backdrop-blur-lg border-t border-gray-200 dark:border-white/10 flex justify-around py-3 pb-6 z-50 shadow-2xl">
      <MobileNavItem 
        icon={<BookOpen size={22} />} 
        label={t.learn} 
        active={activeTab === 'learn'} 
        onClick={() => onTabChange('learn')} 
      />
      <MobileNavItem 
        icon={<RotateCcw size={22} />} 
        label={t.review} 
        active={activeTab === 'review'} 
        onClick={() => onTabChange('review')} 
      />
      {/* Simple indicator for advanced features on mobile */}
      <div className="relative opacity-50 grayscale">
         <MobileNavItem 
            icon={<Layers size={22} />} 
            label="Adv." 
            active={false} 
            onClick={() => {}} 
         />
      </div>
      <MobileNavItem 
        icon={<User size={22} />} 
        label={t.profile} 
        active={activeTab === 'profile'} 
        onClick={() => onTabChange('profile')} 
      />
      <MobileNavItem 
        icon={<Settings size={22} />} 
        label={t.settings} 
        active={false} 
        onClick={onOpenSettings} 
      />
    </nav>
  );
};

const MobileNavItem = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 min-w-[64px] p-1 rounded-xl transition-all duration-300
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
