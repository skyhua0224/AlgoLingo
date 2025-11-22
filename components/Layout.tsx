
import React, { useState, useRef } from 'react';
import { Code2, BookOpen, RotateCcw, Settings, User, X, Globe, Terminal, Save, Download, Upload, Trash2, Cpu, Link, Key, RefreshCw, Moon, Sun, Monitor, ChevronLeft, ChevronRight, Cloud, Bell, Github, Send, HelpCircle, Copy, Check } from 'lucide-react';
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
    }
};

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, preferences, onUpdatePreferences, onExportData, onImportData, onResetData, hideMobileNav }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSyncHelp, setShowSyncHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[preferences.spokenLanguage];
  const isZh = preferences.spokenLanguage === 'Chinese';
  
  // Local state for settings
  const [tempApiConfig, setTempApiConfig] = useState<ApiConfig>(preferences.apiConfig);
  const [tempSyncConfig, setTempSyncConfig] = useState(preferences.syncConfig || { enabled: false, githubToken: '' });
  const [tempNotifyConfig, setTempNotifyConfig] = useState(preferences.notificationConfig || { enabled: false, webhookUrl: '', type: 'custom' as const });

  const [syncStatus, setSyncStatus] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [showGistIdModal, setShowGistIdModal] = useState<string | null>(null);

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

  const handleCopyGistId = (id?: string) => {
      const targetId = id || tempSyncConfig.gistId;
      if (targetId) {
          navigator.clipboard.writeText(targetId);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
      }
  };

  const handleSyncAction = async (mode: 'create' | 'sync') => {
      setSyncStatus('Syncing...');
      
      const currentData = {
          stats: JSON.parse(localStorage.getItem('algolingo_stats') || '{}'),
          progress: JSON.parse(localStorage.getItem('algolingo_progress_v2') || '{}'),
          mistakes: JSON.parse(localStorage.getItem('algolingo_mistakes') || '[]'),
          preferences: preferences
      };

      // Use temp config for token
      const token = tempSyncConfig.githubToken;
      const gistId = tempSyncConfig.gistId; // Undefined if creating

      if (!token) {
          setSyncStatus("Error: Token missing");
          return;
      }

      const res = await syncWithGist(token, gistId, currentData as any);
      
      if (res.success) {
          setSyncStatus(`Success: ${res.action}`);
          if (res.newGistId) {
              // Update both temp config and persist immediately so user doesn't lose it
              const newConfig = { ...tempSyncConfig, gistId: res.newGistId, enabled: true };
              setTempSyncConfig(newConfig);
              onUpdatePreferences({ syncConfig: newConfig });
              
              if (mode === 'create') {
                  setShowGistIdModal(res.newGistId);
              }
          }
          
          if (res.action === 'pulled' && res.data) {
              alert(isZh ? "从云端拉取了较新的数据，正在刷新..." : "Newer data pulled from cloud. Refreshing...");
              if(res.data.stats) localStorage.setItem('algolingo_stats', JSON.stringify(res.data.stats));
              if(res.data.progress) localStorage.setItem('algolingo_progress_v2', JSON.stringify(res.data.progress));
              window.location.reload();
          }
      } else {
          setSyncStatus(`Error: ${res.error}`);
      }
  };

  const isSyncConfigured = !!tempSyncConfig.githubToken && !!tempSyncConfig.gistId;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex text-gray-900 dark:text-dark-text font-sans transition-colors">
      {/* Gist ID Created Modal */}
      {showGistIdModal && (
          <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in-up">
              <div className="bg-white dark:bg-dark-card rounded-3xl p-8 w-full max-w-md text-center shadow-2xl border-2 border-green-100 dark:border-green-900/50">
                  <div className="mb-4 bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                        <Check className="text-green-500" size={32} />
                  </div>
                  <h3 className="text-2xl font-extrabold text-gray-800 dark:text-white mb-2">{isZh ? "云存档已创建！" : "Cloud Save Created!"}</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm leading-relaxed">
                      {isZh ? "请务必保存您的 Gist ID。在其他设备恢复进度时需要用到它。" : "Please save your Gist ID safely. You need it to restore progress on other devices."}
                  </p>
                  
                  <div className="bg-gray-100 dark:bg-black p-4 rounded-xl border border-gray-200 dark:border-gray-800 mb-6 font-mono text-sm break-all select-all text-gray-800 dark:text-gray-200">
                      {showGistIdModal}
                  </div>

                  <button 
                      onClick={() => handleCopyGistId(showGistIdModal)}
                      className="w-full py-3 bg-brand text-white rounded-xl font-bold shadow-lg hover:bg-brand-light mb-3 flex items-center justify-center gap-2"
                  >
                      {isCopied ? <Check size={18}/> : <Copy size={18}/>} {isZh ? "复制 ID" : "Copy ID"}
                  </button>
                  <button onClick={() => setShowGistIdModal(null)} className="text-gray-400 hover:text-gray-600 text-sm font-bold py-2">
                      {t.done}
                  </button>
              </div>
          </div>
      )}

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
                          <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2 text-gray-800 dark:text-white font-bold text-sm uppercase tracking-wider">
                                  <Github size={16} />
                                  {t.cloudSync}
                              </div>
                              <button
                                  onClick={() => setShowSyncHelp(!showSyncHelp)}
                                  className="text-brand hover:text-brand-dark dark:text-brand-light dark:hover:text-white text-xs font-bold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-brand/10 transition-colors"
                              >
                                  <HelpCircle size={14} />
                                  {isZh ? "如何配置？" : "Guide"}
                              </button>
                          </div>

                          {showSyncHelp && (
                              <div className="mb-4 p-4 bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 shadow-sm animate-fade-in-down">
                                   <p className="font-bold mb-2">{isZh ? "步骤指南：" : "Setup Guide:"}</p>
                                   <ol className="list-decimal list-inside space-y-1.5">
                                      <li>{isZh ? <span>访问 <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-brand underline">GitHub Tokens</a> 页面。</span> : <span>Visit <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-brand underline">GitHub Tokens</a> page.</span>}</li>
                                       <li>{isZh ? "生成新 Token (Classic)，在 Scopes 中勾选 `gist`。" : "Generate new Token (Classic), check `gist` in Scopes."}</li>
                                      <li>{isZh ? "复制 Token (以 ghp_ 开头) 填入下方。" : "Copy Token (starts with ghp_) and paste below."}</li>
                                       <li>{isZh ? "点击初始化同步。系统将自动创建一个 Gist ID。" : "Click Initialize Sync. System creates a Gist ID automatically."}</li>
                                   </ol>
                              </div>
                          )}

                          <div className="space-y-3">
                              <div>
                                  <label className="text-xs font-bold text-gray-500 block mb-2">{t.githubToken} (Gist Scope)</label>
                                  <div className="flex gap-2">
                                      <input 
                                          type="password"
                                          className="flex-1 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white font-mono text-sm focus:border-brand outline-none"
                                          value={tempSyncConfig.githubToken}
                                          onChange={(e) => setTempSyncConfig({...tempSyncConfig, githubToken: e.target.value})}
                                          placeholder="ghp_..."
                                      />
                                      {/* Scenario A: Not Configured Button Next to Input */}
                                      {!isSyncConfigured && (
                                          <button 
                                              onClick={() => handleSyncAction('create')}
                                              disabled={!tempSyncConfig.githubToken}
                                              className="px-4 bg-gray-800 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-xs hover:opacity-90 disabled:opacity-50 flex items-center justify-center whitespace-nowrap"
                                          >
                                              {t.syncNow}
                                          </button>
                                      )}
                                  </div>
                                  {!isSyncConfigured && (
                                      <p className="text-[10px] text-gray-400 mt-1 ml-1">
                                          {isZh ? "输入 Token 后点击右侧按钮进行首次同步" : "Enter Token and click button to start first sync"}
                                      </p>
                                  )}
                              </div>

                              {/* Scenario B: Configured (Has Gist ID) */}
                              {isSyncConfigured && (
                                  <div className="space-y-3 animate-fade-in-up pt-2 border-t border-gray-100 dark:border-gray-700">
                                      <div>
                                          <label className="text-xs font-bold text-gray-500 block mb-2">{t.gistId}</label>
                                          <div className="flex gap-2">
                                              <input 
                                                  className="flex-1 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 font-mono text-xs outline-none"
                                                  value={tempSyncConfig.gistId || ''}
                                                  readOnly
                                              />
                                              <button 
                                                  onClick={() => handleCopyGistId()}
                                                  className="p-3 bg-white dark:bg-dark-card border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500"
                                                  title={t.copy}
                                              >
                                                  {isCopied ? <Check size={16} className="text-green-500"/> : <Copy size={16}/>}
                                              </button>
                                          </div>
                                      </div>

                                      <button 
                                          onClick={() => handleSyncAction('sync')}
                                          className="w-full px-6 py-3 bg-brand text-white rounded-xl font-bold text-sm hover:bg-brand-light shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
                                      >
                                          <RefreshCw size={16} className={syncStatus === 'Syncing...' ? 'animate-spin' : ''} />
                                          {t.syncNow}
                                      </button>
                                  </div>
                              )}
                              
                              {syncStatus && <p className="text-xs font-mono text-brand text-center">{syncStatus}</p>}
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
