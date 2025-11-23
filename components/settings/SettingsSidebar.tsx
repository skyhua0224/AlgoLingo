import React from 'react';
import { User, Cpu, RefreshCw, Bell, Palette, Save } from 'lucide-react';

interface SettingsSidebarProps {
    activeTab: string;
    onSelectTab: (tab: string) => void;
    isZh: boolean;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, onSelectTab, isZh }) => {
    const tabs = [
        { id: 'general', icon: <User size={18} />, label: isZh ? '通用设置' : 'General' },
        { id: 'ai', icon: <Cpu size={18} />, label: isZh ? 'AI 模型' : 'AI Model' },
        { id: 'sync', icon: <RefreshCw size={18} />, label: isZh ? '云端同步' : 'Cloud Sync' },
        { id: 'notifications', icon: <Bell size={18} />, label: isZh ? '消息通知' : 'Notifications' },
        { id: 'appearance', icon: <Palette size={18} />, label: isZh ? '外观界面' : 'Appearance' },
        { id: 'data', icon: <Save size={18} />, label: isZh ? '数据管理' : 'Data' },
    ];

    return (
        <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-800/30 md:border-r border-gray-100 dark:border-gray-700 p-4 md:h-full overflow-x-auto md:overflow-y-auto flex md:flex-col gap-2 shrink-0">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onSelectTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                        activeTab === tab.id
                        ? 'bg-brand text-white shadow-md'
                        : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-400'
                    }`}
                >
                    {tab.icon}
                    <span>{tab.label}</span>
                </button>
            ))}
        </div>
    );
};