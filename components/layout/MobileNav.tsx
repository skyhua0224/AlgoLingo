import React from 'react';
import { BookOpen, RotateCcw, User, Settings } from 'lucide-react';

interface MobileNavProps {
  activeTab: 'learn' | 'review' | 'profile';
  onTabChange: (tab: 'learn' | 'review' | 'profile') => void;
  onOpenSettings: () => void;
  t: any;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onTabChange, onOpenSettings, t }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-card border-t border-gray-200 dark:border-gray-800 flex justify-around py-3 pb-6 z-50 shadow-lg">
      <MobileNavItem icon={<BookOpen size={24} />} label={t.learn} active={activeTab === 'learn'} onClick={() => onTabChange('learn')} />
      <MobileNavItem icon={<RotateCcw size={24} />} label={t.review} active={activeTab === 'review'} onClick={() => onTabChange('review')} />
      <MobileNavItem icon={<User size={24} />} label={t.profile} active={activeTab === 'profile'} onClick={() => onTabChange('profile')} />
      <MobileNavItem icon={<Settings size={24} />} label={t.settings} active={false} onClick={onOpenSettings} />
    </nav>
  );
};

const MobileNavItem = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 w-20 p-1 rounded-xl transition-colors
      ${active ? 'bg-brand-bg/50 dark:bg-brand/20 text-brand' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
  >
    {icon}
    <span className="text-[10px] font-bold uppercase">{label}</span>
  </button>
);