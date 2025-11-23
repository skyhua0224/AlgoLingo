
import React, { useState } from 'react';
import { UserPreferences } from '../types';
import { Sidebar } from './layout/Sidebar';
import { MobileNav } from './layout/MobileNav';
import { SettingsModal } from './settings/SettingsModal';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'learn' | 'review' | 'profile';
  onTabChange: (tab: any) => void;
  preferences: UserPreferences;
  onUpdatePreferences: (p: Partial<UserPreferences>) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onResetData: () => void;
  hideMobileNav?: boolean; 
}

const TRANSLATIONS = {
    Chinese: {
        learn: '学习',
        review: '复习',
        profile: '档案',
        settings: '设置',
        targetLang: '目标编程语言',
        instructionLang: '教学语言',
        dataMgmt: '数据管理',
        export: '导出学习进度',
        import: '导入学习进度',
        reset: '重置所有数据',
        done: '完成',
        modelSettings: 'AI 模型配置',
        provider: 'API 提供商',
        theme: '外观模式',
        light: '浅色',
        dark: '深色',
        system: '跟随系统',
        cloudSync: 'GitHub 云同步',
        notifications: '消息通知',
        githubToken: 'GitHub Token',
        gistId: 'Gist ID (存档 ID)',
        syncNow: '立即同步',
        webhookUrl: 'Webhook URL',
        enableNotify: '启用 AI 学习提醒',
        testNotify: '测试发送',
        notifyHint: '支持 Telegram, Bark 等 URL',
        initSync: '初始化同步 (创建存档)',
        copy: '复制',
        copied: '已复制',
        syncStatusIdle: '未配置同步',
        syncStatusReady: '同步就绪',
        connectionType: '连接方式',
        builtin: 'AI Studio 内置 (推荐)',
        customKey: '自定义 Key',
        customProxy: '自定义 Proxy'
    },
    English: {
        learn: 'Learn',
        review: 'Review',
        profile: 'Profile',
        settings: 'Settings',
        targetLang: 'Target Language',
        instructionLang: 'Instruction Language',
        dataMgmt: 'Data Management',
        export: 'Export Progress',
        import: 'Import Progress',
        reset: 'Reset All Data',
        done: 'Done',
        modelSettings: 'AI Model Config',
        provider: 'API Provider',
        theme: 'Appearance',
        light: 'Light',
        dark: 'Dark',
        system: 'System',
        cloudSync: 'GitHub Cloud Sync',
        notifications: 'Notifications',
        githubToken: 'GitHub Token',
        gistId: 'Gist ID (Save ID)',
        syncNow: 'Sync Now',
        webhookUrl: 'Webhook URL',
        enableNotify: 'Enable AI Reminders',
        testNotify: 'Test Send',
        notifyHint: 'Supports Telegram, Bark, etc.',
        initSync: 'Initialize Sync (Create Gist)',
        copy: 'Copy',
        copied: 'Copied',
        syncStatusIdle: 'Sync Not Configured',
        syncStatusReady: 'Sync Ready',
        connectionType: 'Connection Type',
        builtin: 'Built-in (Recommended)',
        customKey: 'Custom Key',
        customProxy: 'Custom Proxy'
    }
};

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, preferences, onUpdatePreferences, onExportData, onImportData, onResetData, hideMobileNav }) => {
  const [showSettings, setShowSettings] = useState(false);
  const t = TRANSLATIONS[preferences.spokenLanguage];
  const isZh = preferences.spokenLanguage === 'Chinese';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex text-gray-900 dark:text-dark-text font-sans transition-colors">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={onTabChange} 
        onOpenSettings={() => setShowSettings(true)} 
        t={t}
        isZh={isZh}
      />

      {/* Main Content */}
      {/* Added pl-0 md:pl-20 to accommodate the collapsed sidebar initial state, 
          but ideally the main content margin would react to the sidebar width. 
          For now, we use a safe margin that looks good with the floating nature or the collapsed state. 
          The previous version hardcoded md:ml-72. Since the new sidebar handles its own width (w-20 or w-72),
          we can simply use flex-1 and let flexbox handle it, OR use a margin.
          Given the Sidebar is 'fixed', we need a margin.
          To keep it simple and decoupled, let's assume a default margin of ml-20 (collapsed width) 
          and let the user expand it over the content or push it. 
          Actually, let's use md:pl-20 as a base, which is the collapsed width. 
          If the sidebar expands, it might overlap content or push it if we used context. 
          For this visual refactor, let's stick to a left margin that accounts for the 'dock'.
      */}
      <main className={`flex-1 md:ml-20 flex flex-col min-h-screen transition-all duration-300 w-full`}>
        <div className="flex-1 w-full mx-auto p-0 md:p-0">
          {children}
        </div>
      </main>

      {!hideMobileNav && (
        <MobileNav 
          activeTab={activeTab} 
          onTabChange={onTabChange} 
          onOpenSettings={() => setShowSettings(true)} 
          t={t} 
        />
      )}

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        preferences={preferences}
        onUpdatePreferences={onUpdatePreferences}
        onExportData={onExportData}
        onImportData={onImportData}
        t={t}
        isZh={isZh}
      />
    </div>
  );
};
