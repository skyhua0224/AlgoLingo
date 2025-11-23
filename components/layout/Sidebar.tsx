
import React from 'react';
import { 
  Brain, 
  Cpu, 
  Sparkles, 
  Swords, 
  User, 
  Settings, 
  Code2, 
  ChevronLeft, 
  ChevronRight, 
} from 'lucide-react';
import { AppView } from '../../types';

interface SidebarProps {
  activeTab: AppView;
  onTabChange: (tab: AppView) => void;
  onOpenSettings: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  hidden?: boolean;
  t: any;
  isZh?: boolean;
}

const MENU_CONFIG = [
  {
    group: "CORE",
    items: [
      { id: 'algorithms', icon: Brain, label: { zh: '核心算法', en: 'Algorithms' }, color: 'text-brand' },
      { id: 'engineering', icon: Cpu, label: { zh: '工程中心', en: 'Engineering' }, color: 'text-blue-500' },
    ]
  },
  {
    group: "EXPLORE & FIGHT",
    items: [
      { id: 'forge', icon: Sparkles, label: { zh: '探索工坊', en: 'The Forge' }, color: 'text-purple-500' },
      { id: 'career', icon: Swords, label: { zh: '职业挑战', en: 'Career' }, color: 'text-orange-500' },
    ]
  },
  {
    group: "USER",
    items: [
      { id: 'profile', icon: User, label: { zh: '个人档案', en: 'Profile' }, color: 'text-gray-400' },
    ]
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onOpenSettings, collapsed, onToggleCollapse, hidden = false, t, isZh = true }) => {
  
  if (hidden) return null;

  return (
    <aside 
      className={`
        hidden md:flex flex-col 
        ${collapsed ? 'w-20' : 'w-72'} 
        h-full fixed left-0 top-0 z-40
        bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-2xl
        border-r border-gray-200 dark:border-white/5
        transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
        shadow-2xl shadow-black/5
      `}
    >
      {/* --- Brand Header --- */}
      <div className="h-24 flex items-center justify-center relative shrink-0 group">
        <div className={`flex items-center gap-3 transition-all duration-500 ${collapsed ? 'scale-90' : 'scale-100'}`}>
          <div className="relative w-10 h-10 flex items-center justify-center">
             <div className="absolute inset-0 bg-brand blur-lg opacity-20 rounded-full"></div>
             <div className="relative w-10 h-10 bg-gradient-to-br from-brand to-brand-dark rounded-xl flex items-center justify-center shadow-lg border border-white/10">
                <Code2 size={20} className="text-white" />
             </div>
          </div>
          
          {!collapsed && (
            <div className="flex flex-col overflow-hidden animate-fade-in-left">
              <span className="font-black text-xl tracking-tight text-gray-900 dark:text-white leading-none font-sans">
                AlgoLingo
              </span>
              <span className="text-[9px] font-bold text-brand-dark dark:text-brand-light uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1">
                <Cpu size={10} />
                Senior Coach
              </span>
            </div>
          )}
        </div>

        <button 
            onClick={onToggleCollapse}
            className="absolute -right-3 top-9 bg-brand text-white border-2 border-white dark:border-gray-900 shadow-xl rounded-full p-1.5 transition-all hover:scale-110 z-50 flex items-center justify-center hover:bg-brand-dark cursor-pointer"
            title={collapsed ? "Expand" : "Collapse"}
        >
            {collapsed ? <ChevronRight size={16} strokeWidth={3} /> : <ChevronLeft size={16} strokeWidth={3} />}
        </button>
      </div>

      {/* --- Navigation --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-4 px-3 space-y-8">
        {MENU_CONFIG.map((group, gIdx) => (
          <div key={gIdx}>
            {!collapsed && (
              <h3 className="px-4 text-[10px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-widest mb-2 animate-fade-in-up">
                {group.group}
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                const label = isZh ? item.label.zh : item.label.en;

                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id as AppView)}
                    title={collapsed ? label : undefined}
                    className={`
                      relative group w-full flex items-center 
                      ${collapsed ? 'justify-center p-3' : 'px-4 py-3.5'}
                      rounded-2xl transition-all duration-300
                      ${isActive 
                        ? 'bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5' 
                        : 'text-gray-500 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'
                      }
                    `}
                  >
                    {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand rounded-r-full shadow-[0_0_12px_rgba(132,204,22,0.6)]" />
                    )}

                    <Icon 
                      size={collapsed ? 22 : 20} 
                      className={`
                        shrink-0 transition-transform duration-300
                        ${isActive ? item.color : 'text-current'}
                        ${isActive ? 'scale-110' : 'group-hover:scale-105'}
                      `} 
                    />

                    {!collapsed && (
                      <span className={`ml-3 font-bold text-sm tracking-wide flex-1 text-left truncate ${isActive ? 'font-extrabold' : 'font-medium'}`}>
                        {label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* --- Footer Settings --- */}
      <div className="p-4 border-t border-gray-200 dark:border-white/5 shrink-0">
        <button 
            onClick={onOpenSettings}
            className={`
              w-full flex items-center 
              ${collapsed ? 'justify-center' : 'gap-3 px-3'} 
              py-3 rounded-2xl 
              text-gray-500 dark:text-gray-400 
              hover:bg-gray-100 dark:hover:bg-white/10 
              transition-all group
            `}
        >
          <div className={`
             relative w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 
             border border-gray-200 dark:border-white/5
             flex items-center justify-center shrink-0 overflow-hidden
             group-hover:border-brand/50 transition-colors
          `}>
             <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500 text-gray-600 dark:text-gray-300" />
          </div>

          {!collapsed && (
            <div className="flex flex-col text-left overflow-hidden animate-fade-in-left">
               <span className="text-xs font-bold text-gray-800 dark:text-white truncate">{isZh ? "设置" : "Settings"}</span>
               <span className="text-[10px] text-gray-400 font-medium truncate">Preferences</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
