import React, { useState, useEffect } from 'react';
import { UserPreferences, AppView, SyncStatus } from '../types';
import { Sidebar } from './layout/Sidebar';
import { MobileNav } from './layout/MobileNav';
import { SettingsModal } from './settings/SettingsModal';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: AppView;
  onTabChange: (tab: AppView) => void;
  preferences: UserPreferences;
  onUpdatePreferences: (p: Partial<UserPreferences>) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onDataLoaded: (data: any) => void;
  onResetData: () => void;
  syncStatus: SyncStatus;
  hideMobileNav?: boolean; 
  hideSidebar?: boolean; 
  collectFullState: () => any;
}

const TRANSLATIONS = {
    Chinese: {
        learn: '学习', review: '复习', profile: '档案', settings: '设置', targetLang: '目标编程语言', instructionLang: '教学语言', dataMgmt: '数据管理', export: '导出学习进度', import: '导入学习进度', reset: '重置所有数据', done: '完成', modelSettings: 'AI 模型配置', provider: 'API 提供商', theme: '外观模式', light: '浅色', dark: '深色', system: '跟随系统', cloudSync: 'GitHub 云同步', notifications: '消息通知', githubToken: 'GitHub Token', gistId: 'Gist ID (存档 ID)', syncNow: '立即同步', webhookUrl: 'Webhook URL', enableNotify: '启用 AI 学习提醒', testNotify: '测试发送', notifyHint: '支持 Telegram, Bark 等 URL', initSync: '初始化同步 (创建存档)', copy: '复制', copied: '已复制', syncStatusIdle: '未配置同步', syncStatusReady: '同步就绪', connectionType: '连接方式', builtin: 'AI Studio 内置 (推荐)', customKey: '自定义 Key', customProxy: '自定义 Proxy'
    },
    English: {
        learn: 'Learn', review: 'Review', profile: 'Profile', settings: 'Settings', targetLang: 'Target Language', instructionLang: 'Instruction Language', dataMgmt: 'Data Management', export: 'Export Progress', import: 'Import Progress', reset: 'Reset All Data', done: 'Done', modelSettings: 'AI Model Config', provider: 'API Provider', theme: 'Appearance', light: 'Light', dark: 'Dark', system: 'System', cloudSync: 'GitHub Cloud Sync', notifications: 'Notifications', githubToken: 'GitHub Token', gistId: 'Gist ID (Save ID)', syncNow: 'Sync Now', webhookUrl: 'Webhook URL', enableNotify: 'Enable AI Reminders', testNotify: 'Test Send', notifyHint: 'Supports Telegram, Bark, etc.', initSync: 'Initialize Sync (Create Gist)', copy: 'Copy', copied: 'Copied', syncStatusIdle: 'Sync Not Configured', syncStatusReady: 'Sync Ready', connectionType: 'Connection Type', builtin: 'Built-in (Recommended)', customKey: 'Custom Key', customProxy: 'Custom Proxy'
    }
};

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, preferences, onUpdatePreferences, onExportData, onImportData, onDataLoaded, onResetData, syncStatus, hideMobileNav, hideSidebar, collectFullState }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const t = TRANSLATIONS[preferences.spokenLanguage];
  const isZh = preferences.spokenLanguage === 'Chinese';
  const mainMarginClass = hideSidebar ? 'ml-0' : (isSidebarCollapsed ? 'md:ml-20' : 'md:ml-72');

  // --- Theme Management ---
  useEffect(() => {
    const applyTheme = () => {
      const theme = preferences.theme;
      const root = document.documentElement;
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      root.classList.toggle('dark', isDark);
    };

    applyTheme();

    // Listen for system changes if mode is 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
        if (preferences.theme === 'system') {
            applyTheme();
        }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [preferences.theme]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex text-gray-900 dark:text-dark-text font-sans transition-colors">
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} onOpenSettings={() => setShowSettings(true)} collapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} hidden={hideSidebar} t={t} isZh={isZh} syncStatus={syncStatus} />
      <main className={`flex-1 ${mainMarginClass} flex flex-col min-h-screen transition-all duration-500 w-full relative`}>
        <div className="flex-1 w-full mx-auto p-0 md:p-0">{children}</div>
      </main>
      {(!hideMobileNav && !hideSidebar) && <MobileNav activeTab={activeTab} onTabChange={onTabChange} onOpenSettings={() => setShowSettings(true)} t={t} />}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        preferences={preferences} 
        onUpdatePreferences={onUpdatePreferences} 
        onExportData={onExportData} 
        onImportData={onImportData} 
        onDataLoaded={onDataLoaded} 
        onResetData={onResetData}
        t={t} 
        isZh={isZh} 
        collectFullState={collectFullState}
      />
    </div>
  );
};