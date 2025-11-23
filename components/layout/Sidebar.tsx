
import React, { useState } from 'react';
import { 
  BookOpen, 
  RotateCcw, 
  User, 
  Settings, 
  Code2, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Swords, 
  Lock,
  Zap
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  onOpenSettings: () => void;
  t: any;
  isZh?: boolean; // Add language prop for internal labels
}

// --- Menu Configuration ---
// This keeps the sidebar independent. Layout doesn't need to know about these items.
const MENU_GROUPS = [
  {
    label: "Core Training",
    items: [
      { id: 'learn', icon: BookOpen, label: { zh: '算法闯关', en: 'Learn Map' } },
      { id: 'review', icon: RotateCcw, label: { zh: '复习中心', en: 'Review Hub' } },
    ]
  },
  {
    label: "Advanced Engineering",
    items: [
      { 
        id: 'system-design', 
        icon: Layers, 
        label: { zh: '系统设计', en: 'System Design' }, 
        tag: 'BETA',
        disabled: true 
      },
      { 
        id: 'interview', 
        icon: Swords, 
        label: { zh: '模拟面试', en: 'Mock Interview' }, 
        tag: 'SOON',
        disabled: true 
      },
    ]
  },
  {
    label: "Account",
    items: [
      { id: 'profile', icon: User, label: { zh: '个人档案', en: 'Profile' } },
    ]
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onOpenSettings, t, isZh = true }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={`
        hidden md:flex flex-col 
        ${collapsed ? 'w-20' : 'w-72'} 
        h-full fixed left-0 top-0 z-40
        bg-white/80 dark:bg-[#0c0c0c]/90 backdrop-blur-xl
        border-r border-gray-200 dark:border-white/10
        transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
        shadow-2xl
      `}
    >
      {/* --- Header Area --- */}
      <div className="h-20 flex items-center justify-center relative shrink-0">
        <div className={`flex items-center gap-3 transition-all duration-300 ${collapsed ? 'scale-75' : 'scale-100'}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-brand to-brand-dark rounded-xl flex items-center justify-center shadow-lg shadow-brand/20">
            <Code2 size={24} className="text-white" />
          </div>
          
          {!collapsed && (
            <div className="flex flex-col animate-fade-in-left">
              <span className="font-extrabold text-xl tracking-tight text-gray-900 dark:text-white leading-none">
                AlgoLingo
              </span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                Senior Coach
              </span>
            </div>
          )}
        </div>

        {/* Collapse Toggle (Absolute Positioned) */}
        <button 
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-full p-1 text-gray-400 hover:text-brand transition-colors z-50"
        >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* --- Navigation Area --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-6 space-y-8">
        {MENU_GROUPS.map((group, groupIdx) => (
          <div key={groupIdx} className="px-4">
            {!collapsed && (
              <h3 className="text-[10px] font-extrabold text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-3 pl-3 animate-fade-in-up">
                {group.label}
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
                    onClick={() => !item.disabled && onTabChange(item.id)}
                    disabled={item.disabled}
                    className={`
                      relative group w-full flex items-center 
                      ${collapsed ? 'justify-center p-3' : 'px-4 py-3'}
                      rounded-xl transition-all duration-200
                      ${isActive 
                        ? 'bg-brand/10 dark:bg-brand/20 text-brand-dark dark:text-brand-light' 
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'
                      }
                      ${item.disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                    `}
                  >
                    {/* Active Indicator Bar */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand rounded-r-full" />
                    )}

                    <Icon 
                      size={20} 
                      className={`
                        shrink-0 transition-transform duration-300
                        ${isActive ? 'scale-110' : 'group-hover:scale-105'}
                      `} 
                    />

                    {!collapsed && (
                      <span className="ml-3 font-bold text-sm tracking-wide flex-1 text-left truncate">
                        {label}
                      </span>
                    )}

                    {/* Tags (Beta/Lock) */}
                    {!collapsed && item.tag && (
                      <span className="ml-2 px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-500 text-[9px] font-extrabold border border-purple-500/20">
                        {item.tag}
                      </span>
                    )}
                    {!collapsed && item.disabled && !item.tag && (
                      <Lock size={12} className="ml-2 opacity-30" />
                    )}

                    {/* Tooltip for Collapsed State */}
                    {collapsed && (
                      <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
                        {label}
                        {item.tag && <span className="ml-2 opacity-50">({item.tag})</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* --- Footer Area --- */}
      <div className="p-4 border-t border-gray-100 dark:border-white/5 shrink-0 bg-gray-50/50 dark:bg-white/5 backdrop-blur-sm">
        <button 
            onClick={onOpenSettings}
            className={`
              w-full flex items-center 
              ${collapsed ? 'justify-center' : 'gap-3 px-3'} 
              py-3 rounded-xl 
              text-gray-500 dark:text-gray-400 
              hover:bg-white dark:hover:bg-white/10 hover:text-brand 
              transition-all group border border-transparent hover:border-gray-200 dark:hover:border-white/10
            `}
        >
          <div className={`
             relative w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 
             flex items-center justify-center shrink-0 overflow-hidden
             group-hover:ring-2 ring-brand ring-offset-2 dark:ring-offset-black transition-all
          `}>
             <Settings size={16} className="group-hover:rotate-90 transition-transform duration-500" />
          </div>

          {!collapsed && (
            <div className="flex flex-col text-left overflow-hidden">
               <span className="text-xs font-extrabold text-gray-800 dark:text-white truncate">Settings</span>
               <span className="text-[10px] text-gray-400 font-medium truncate">Preferences & Data</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
