
import React, { useState, useRef } from 'react';
import { Code2, BookOpen, RotateCcw, Settings, User, X, Globe, Terminal, Save, Download, Upload, Trash2, Cpu, Link, Key, RefreshCw, Moon, Sun, Monitor, ChevronLeft, ChevronRight, Cloud, Bell, Github, Send } from 'lucide-react';
import { UserPreferences, ApiConfig } from '../types';
import { GEMINI_MODELS } from '../constants';
import { syncWithGist } from '../services/githubService';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'learn' | 'review' | 'profile';
  onTabChange: (tab: 'learn' | 'review' | 'profile') => void;
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
        gistId: 'Gist ID (可选)',
        syncNow: '立即同步',
        webhookUrl: 'Webhook URL',
        enableNotify: '启用 AI 学习提醒',
        testNotify: '测试发送',
        notifyHint: '支持 Telegram, Bark 等 URL'
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
        gistId: 'Gist ID (Optional)',
        syncNow: 'Sync Now',
        webhookUrl: 'Webhook URL',
        enableNotify: 'Enable AI Reminders',
        testNotify: 'Test Send',
        notifyHint: 'Supports Telegram, Bark, etc.'
    }
};

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, preferences, onUpdatePreferences, onExportData, onImportData, onResetData, hideMobileNav }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[preferences.spokenLanguage];
  
  // Local state for settings
  const [tempApiConfig, setTempApiConfig] = useState<ApiConfig>(preferences.apiConfig);
  const [tempSyncConfig, setTempSyncConfig] = useState(preferences.syncConfig || { enabled: false, githubToken: '' });
  const [tempNotifyConfig, setTempNotifyConfig] = useState(preferences.notificationConfig || { enabled: false, webhookUrl: '', type: 'custom' as const });

  const [syncStatus, setSyncStatus] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          onImportData(e.target.files[0]);
      }
  };

  const saveSettings = () => {
      onUpdatePreferences({ 
          apiConfig: tempApiConfig,
          syncConfig: tempSyncConfig,
          notificationConfig: tempNotifyConfig
      });
      setShowSettings(false);
  };

  const handleSyncNow = async () => {
      setSyncStatus('Syncing...');
      const currentData = {
          stats: JSON.parse(localStorage.getItem('algolingo_stats') || '{}'),
          progress: JSON.parse(localStorage.getItem('algolingo_progress_v2') || '{}'),
          mistakes: JSON.parse(localStorage.getItem('algolingo_mistakes') || '[]'),
          preferences: preferences
      };

      const res = await syncWithGist(tempSyncConfig.githubToken, tempSyncConfig.gistId, currentData as any);
      if (res.success) {
          setSyncStatus(`Success: ${res.action}`);
          if (res.newGistId) {
              setTempSyncConfig(prev => ({...prev, gistId: res.newGistId}));
              onUpdatePreferences({ syncConfig: { ...tempSyncConfig, gistId: res.newGistId }});
          }
          if (res.action === 'pulled' && res.data) {
              // Simple reload to apply pulled data for now, or call a prop
              alert("Data pulled from cloud. Refreshing...");
              // Inject into local storage
              if(res.data.stats) localStorage.setItem('algolingo_stats', JSON.stringify(res.data.stats));
              if(res.data.progress) localStorage.setItem('algolingo_progress_v2', JSON.stringify(res.data.progress));
              window.location.reload();
          }
      } else {
          setSyncStatus(`Error: ${res.error}`);
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex text-gray-900 dark:text-dark-text font-sans transition-colors">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col ${sidebarCollapsed ? 'w-20' : 'w-72'} bg-white dark:bg-dark-card border-r border-gray-200 dark:border-gray-800 fixed h-full z-20 p-4 shadow-sm transition-all duration-300`}>
        
        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3 px-2'} mb-8 mt-2 text-brand-dark dark:text-brand-light cursor-pointer hover:opacity-80 transition-all relative`}>
          <Code2 size={32} className="fill-current shrink-0" />
          {!sidebarCollapsed && <span className="text-2xl font-extrabold tracking-tight overflow-hidden whitespace-nowrap">AlgoLingo</span>}
        </div>

        <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-3 top-12 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 shadow-md rounded-full p-1 text-gray-500 hover:text-brand transition-colors z-30"
        >
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <nav className="flex-1 space-y-2">
          <SidebarItem 
            icon={<BookOpen size={20} />} 
            label={t.learn} 
            active={activeTab === 'learn'} 
            onClick={() => onTabChange('learn')}
            collapsed={sidebarCollapsed}
          />
          <SidebarItem 
            icon={<RotateCcw size={20} />} 
            label={t.review} 
            active={activeTab === 'review'} 
            onClick={() => onTabChange('review')}
            collapsed={sidebarCollapsed}
          />
          <SidebarItem 
            icon={<User size={20} />} 
            label={t.profile} 
            active={activeTab === 'profile'} 
            onClick={() => onTabChange('profile')}
            collapsed={sidebarCollapsed}
          />
        </nav>

        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
           <button 
                onClick={() => { 
                    setTempApiConfig(preferences.apiConfig); 
                    setTempSyncConfig(preferences.syncConfig || { enabled: false, githubToken: '' });
                    setTempNotifyConfig(preferences.notificationConfig || { enabled: false, webhookUrl: '', type: 'custom' });
                    setShowSettings(true); 
                }}
                className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white font-bold py-3 w-full rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors`}
                title={t.settings}
            >
             <Settings size={20} />
             {!sidebarCollapsed && <span>{t.settings}</span>}
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-72'} flex flex-col min-h-screen transition-all duration-300`}>
        <div className="flex-1 w-full mx-auto p-0 md:p-0">
          {children}
        </div>
      </main>

      {!hideMobileNav && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-card border-t border-gray-200 dark:border-gray-800 flex justify-around py-3 pb-6 z-50 shadow-lg">
            <MobileNavItem icon={<BookOpen size={24} />} label={t.learn} active={activeTab === 'learn'} onClick={() => onTabChange('learn')} />
            <MobileNavItem icon={<RotateCcw size={24} />} label={t.review} active={activeTab === 'review'} onClick={() => onTabChange('review')} />
            <MobileNavItem icon={<User size={24} />} label={t.profile} active={activeTab === 'profile'} onClick={() => onTabChange('profile')} />
            <MobileNavItem icon={<Settings size={24} />} label={t.settings} active={showSettings} onClick={() => setShowSettings(true)} />
          </nav>
      )}

      {/* Settings Modal */}
      {showSettings && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-up">
              <div className="bg-white dark:bg-dark-card w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                  <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 shrink-0">
                      <h3 className="font-extrabold text-xl text-gray-800 dark:text-white">{t.settings}</h3>
                      <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500 transition-colors"><X size={20}/></button>
                  </div>
                  
                  <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">

                      {/* 0. Language Settings (NEW) */}
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 mb-4 text-gray-800 dark:text-white font-bold text-sm uppercase tracking-wider">
                                <Globe size={16} />
                                {t.instructionLang} & {t.targetLang}
                            </div>
                            <div className="space-y-6">
                                {/* Spoken Language */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 block mb-2">{t.instructionLang}</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['Chinese', 'English'].map((lang) => (
                                            <button
                                                key={lang}
                                                onClick={() => onUpdatePreferences({ spokenLanguage: lang as any })}
                                                className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                                                    preferences.spokenLanguage === lang 
                                                    ? 'border-brand bg-brand text-white shadow-sm' 
                                                    : 'border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-dark-card text-gray-600 dark:text-gray-300 bg-transparent'
                                                }`}
                                            >
                                                {lang === 'Chinese' ? '中文' : 'English'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Target Language */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 block mb-2">{t.targetLang}</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Python', 'Java', 'C++', 'C', 'JavaScript'].map(lang => (
                                            <button
                                                key={lang}
                                                onClick={() => onUpdatePreferences({ targetLanguage: lang as any })}
                                                className={`py-2 rounded-xl border-2 font-bold text-xs transition-all ${
                                                    preferences.targetLanguage === lang 
                                                    ? 'border-brand bg-brand text-white shadow-sm' 
                                                    : 'border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-dark-card text-gray-600 dark:text-gray-300 bg-transparent'
                                                }`}
                                            >
                                                {lang}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                      </div>
                      
                      {/* 1. GitHub Sync */}
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2 mb-4 text-gray-800 dark:text-white font-bold text-sm uppercase tracking-wider">
                              <Github size={16} />
                              {t.cloudSync}
                          </div>
                          <div className="space-y-3">
                              <div>
                                  <label className="text-xs font-bold text-gray-500 block mb-2">{t.githubToken} (Gist Scope)</label>
                                  <input 
                                      type="password"
                                      className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white font-mono text-sm focus:border-brand outline-none"
                                      value={tempSyncConfig.githubToken}
                                      onChange={(e) => setTempSyncConfig({...tempSyncConfig, githubToken: e.target.value, enabled: !!e.target.value})}
                                      placeholder="ghp_..."
                                  />
                              </div>
                              <div className="flex gap-2">
                                  <input 
                                      className="flex-1 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white font-mono text-sm outline-none"
                                      value={tempSyncConfig.gistId || ''}
                                      onChange={(e) => setTempSyncConfig({...tempSyncConfig, gistId: e.target.value})}
                                      placeholder={t.gistId}
                                  />
                                  <button 
                                      onClick={handleSyncNow}
                                      disabled={!tempSyncConfig.githubToken}
                                      className="px-6 py-3 bg-gray-800 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                                  >
                                      <RefreshCw size={16} className={syncStatus === 'Syncing...' ? 'animate-spin' : ''} />
                                      {t.syncNow}
                                  </button>
                              </div>
                              {syncStatus && <p className="text-xs font-mono text-brand">{syncStatus}</p>}
                          </div>
                      </div>

                      {/* 2. Notifications */}
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2 mb-4 text-brand font-bold text-sm uppercase tracking-wider">
                              <Bell size={16} />
                              {t.notifications}
                          </div>
                          <div className="space-y-3">
                              <div className="flex items-center gap-2 mb-2">
                                  <input 
                                    type="checkbox" 
                                    checked={tempNotifyConfig.enabled}
                                    onChange={(e) => setTempNotifyConfig({...tempNotifyConfig, enabled: e.target.checked})}
                                    className="w-5 h-5 rounded text-brand focus:ring-brand"
                                  />
                                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{t.enableNotify}</label>
                              </div>
                              {tempNotifyConfig.enabled && (
                                  <div className="animate-fade-in-down">
                                      <label className="text-xs font-bold text-gray-500 block mb-2">{t.webhookUrl}</label>
                                      <div className="flex gap-2">
                                          <input 
                                              className="flex-1 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white font-mono text-sm focus:border-brand outline-none"
                                              value={tempNotifyConfig.webhookUrl}
                                              onChange={(e) => setTempNotifyConfig({...tempNotifyConfig, webhookUrl: e.target.value, type: e.target.value.includes('bark') ? 'bark' : 'telegram'})}
                                              placeholder="https://api.day.app/..."
                                          />
                                          <button className="p-3 bg-brand text-white rounded-xl hover:bg-brand-dark"><Send size={16}/></button>
                                      </div>
                                      <p className="text-[10px] text-gray-400 mt-1">{t.notifyHint}</p>
                                  </div>
                              )}
                          </div>
                      </div>

                      {/* 3. Appearance */}
                      <div>
                          <div className="flex items-center gap-2 mb-4 text-gray-400 font-bold text-xs uppercase tracking-wider">
                              <Moon size={16} />
                              {t.theme}
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                              {[
                                  { id: 'light', label: t.light, icon: <Sun size={18}/> },
                                  { id: 'dark', label: t.dark, icon: <Moon size={18}/> },
                                  { id: 'system', label: t.system, icon: <Monitor size={18}/> }
                              ].map(theme => (
                                  <button
                                    key={theme.id}
                                    onClick={() => onUpdatePreferences({ theme: theme.id as any })}
                                    className={`py-3 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95 ${
                                        preferences.theme === theme.id 
                                        ? 'border-brand bg-brand text-white' 
                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-dark-card'
                                    }`}
                                  >
                                      {theme.icon} {theme.label}
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* 4. Data Management (Import/Export) */}
                      <div>
                          <div className="flex items-center gap-2 mb-4 text-gray-400 font-bold text-xs uppercase tracking-wider">
                              <Save size={16} />
                              {t.dataMgmt}
                          </div>
                          <div className="flex gap-3">
                                <button onClick={onExportData} className="flex-1 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                                    <Download size={18} /> {t.export}
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                                    <Upload size={18} /> {t.import}
                                </button>
                          </div>
                      </div>

                  </div>
                  <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 shrink-0">
                      <button onClick={saveSettings} className="w-full py-4 bg-brand text-white font-extrabold rounded-xl shadow-lg hover:bg-brand-light transition-colors text-lg border-b-4 border-brand-dark active:border-b-0 active:translate-y-[4px]">
                          {t.done}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
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
