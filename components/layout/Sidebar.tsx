
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
  RotateCcw,
  Cloud,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { AppView, SyncStatus } from '../../types';

interface SidebarProps {
  activeTab: AppView;
  onTabChange: (tab: AppView) => void;
  onOpenSettings: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  hidden?: boolean;
  t: any;
  isZh?: boolean;
  syncStatus?: SyncStatus;
}

const MENU_CONFIG = [
  {
    group: "CORE",
    items: [
      { id: 'algorithms', icon: Brain, label: { zh: '核心算法', en: 'Algorithms' }, color: 'text-brand' },
      { id: 'review', icon: RotateCcw, label: { zh: '复习中心', en: 'Review Hub' }, color: 'text-pink-500' },
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

export const Sidebar: React.FC<SidebarProps> = ({ 
    activeTab, onTabChange, onOpenSettings, collapsed, onToggleCollapse, hidden = false, t, isZh = true, syncStatus = 'idle' 
}) => {
  if (hidden) return null;

  return (
    <aside className={`hidden md:flex flex-col ${collapsed ? 'w-20' : 'w-72'} h-full fixed left-0 top-0 z-40 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-2xl border-r border-gray-200 dark:border-white/5 transition-all duration-500 shadow-2xl`}>
      <div className="h-24 flex items-center justify-center relative shrink-0 group">
        <div className={`flex items-center gap-3 transition-all duration-500 ${collapsed ? 'scale-90' : 'scale-100'}`}>
          <div className="relative w-10 h-10 bg-gradient-to-br from-brand to-brand-dark rounded-xl flex items-center justify-center shadow-lg">
            <Code2 size={20} className="text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden animate-fade-in-left">
              <span className="font-black text-xl tracking-tight text-gray-900 dark:text-white leading-none">AlgoLingo</span>
              <span className="text-[9px] font-bold text-brand-dark dark:text-brand-light uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1"><Cpu size={10} />Senior Coach</span>
            </div>
          )}
        </div>
        <button onClick={onToggleCollapse} className="absolute -right-3 top-9 bg-brand text-white border-2 border-white dark:border-gray-900 shadow-xl rounded-full p-1.5 transition-all hover:scale-110 z-50 flex items-center justify-center cursor-pointer">
            {collapsed ? <ChevronRight size={16} strokeWidth={3} /> : <ChevronLeft size={16} strokeWidth={3} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar py-4 px-3 space-y-8">
        {MENU_CONFIG.map((group, gIdx) => (
          <div key={gIdx}>
            {!collapsed && <h3 className="px-4 text-[10px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-widest mb-2">{group.group}</h3>}
            <div className="space-y-1">
              {group.items.map((item) => (
                <button key={item.id} onClick={() => onTabChange(item.id as AppView)} className={`relative group w-full flex items-center ${collapsed ? 'justify-center p-3' : 'px-4 py-3.5'} rounded-2xl transition-all duration-300 ${activeTab === item.id ? 'bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                  {activeTab === item.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand rounded-r-full shadow-lg" />}
                  <item.icon size={collapsed ? 22 : 20} className={`shrink-0 transition-transform ${activeTab === item.id ? item.color + ' scale-110' : 'text-current'}`} />
                  {!collapsed && <span className={`ml-3 font-bold text-sm tracking-wide flex-1 text-left truncate ${activeTab === item.id ? 'font-extrabold' : 'font-medium'}`}>{isZh ? item.label.zh : item.label.en}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-white/5 shrink-0 flex flex-col gap-2">
        {/* Sync Status Badge */}
        {!collapsed && syncStatus !== 'idle' && (
             <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border transition-colors ${
                 syncStatus === 'synced' ? 'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/10 dark:border-green-800' :
                 syncStatus === 'syncing' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/10 dark:border-blue-800' :
                 syncStatus === 'conflict' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/10 dark:border-red-800 animate-pulse' :
                 'bg-gray-50 text-gray-400 border-gray-100 dark:bg-white/5 dark:border-white/5'
             }`}>
                 {syncStatus === 'syncing' ? <RefreshCw size={12} className="animate-spin" /> : (syncStatus === 'conflict' ? <AlertCircle size={12}/> : <Cloud size={12} />)}
                 <span>{syncStatus === 'conflict' ? (isZh ? '发现冲突' : 'Conflict') : (isZh ? '云端同步中' : 'Cloud Sync')}</span>
             </div>
        )}

        <button onClick={onOpenSettings} className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-3'} py-3 rounded-2xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-all group`}>
          <div className="relative w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-white/5 flex items-center justify-center shrink-0 overflow-hidden group-hover:border-brand/50">
             <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500 text-gray-600 dark:text-gray-300" />
          </div>
          {!collapsed && (
            <div className="flex flex-col text-left overflow-hidden">
               <span className="text-xs font-bold text-gray-800 dark:text-white truncate">{isZh ? "设置" : "Settings"}</span>
               <span className="text-[10px] text-gray-400 font-medium truncate">Preferences</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
