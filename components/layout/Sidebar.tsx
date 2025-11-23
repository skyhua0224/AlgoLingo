import React, { useState } from 'react';
import { BookOpen, RotateCcw, User, Settings, Code2, ChevronRight, ChevronLeft } from 'lucide-react';

interface SidebarProps {
  activeTab: 'learn' | 'review' | 'profile';
  onTabChange: (tab: 'learn' | 'review' | 'profile') => void;
  onOpenSettings: () => void;
  t: any;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onOpenSettings, t }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`hidden md:flex flex-col ${collapsed ? 'w-20' : 'w-72'} bg-white dark:bg-dark-card border-r border-gray-200 dark:border-gray-800 fixed h-full z-20 p-4 shadow-sm transition-all duration-300`}>
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-2'} mb-8 mt-2 text-brand-dark dark:text-brand-light cursor-pointer hover:opacity-80 transition-all relative`}>
        <Code2 size={32} className="fill-current shrink-0" />
        {!collapsed && <span className="text-2xl font-extrabold tracking-tight overflow-hidden whitespace-nowrap">AlgoLingo</span>}
      </div>

      <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-12 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 shadow-md rounded-full p-1 text-gray-500 hover:text-brand transition-colors z-30"
      >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <nav className="flex-1 space-y-2">
        <SidebarItem 
          icon={<BookOpen size={20} />} 
          label={t.learn} 
          active={activeTab === 'learn'} 
          onClick={() => onTabChange('learn')}
          collapsed={collapsed}
        />
        <SidebarItem 
          icon={<RotateCcw size={20} />} 
          label={t.review} 
          active={activeTab === 'review'} 
          onClick={() => onTabChange('review')}
          collapsed={collapsed}
        />
        <SidebarItem 
          icon={<User size={20} />} 
          label={t.profile} 
          active={activeTab === 'profile'} 
          onClick={() => onTabChange('profile')}
          collapsed={collapsed}
        />
      </nav>

      <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
         <button 
              onClick={onOpenSettings}
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-4'} text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white font-bold py-3 w-full rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors`}
              title={t.settings}
          >
           <Settings size={20} />
           {!collapsed && <span>{t.settings}</span>}
         </button>
      </div>
    </aside>
  );
};

const SidebarItem = ({ icon, label, active, onClick, collapsed }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-4 px-6'} py-4 rounded-2xl font-bold transition-all uppercase tracking-wide text-sm mb-2 w-full
      ${active 
        ? 'bg-brand-bg dark:bg-brand/20 text-brand border-2 border-brand' 
        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border-2 border-transparent'
      }`}
    title={collapsed ? label : undefined}
  >
    {icon}
    {!collapsed && <span>{label}</span>}
  </button>
);