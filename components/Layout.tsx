
import React, { useState, useRef } from 'react';
import { Code2, BookOpen, RotateCcw, Settings, User, X, Globe, Terminal, Save, Download, Upload, Trash2, Cpu, Link, Key, RefreshCw, Moon, Sun, Monitor, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserPreferences, ApiConfig } from '../types';
import { GEMINI_MODELS } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'learn' | 'review' | 'profile';
  onTabChange: (tab: 'learn' | 'review' | 'profile') => void;
  preferences: UserPreferences;
  onUpdatePreferences: (p: Partial<UserPreferences>) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onResetData: () => void;
  hideMobileNav?: boolean; // New Prop
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
        geminiOfficial: 'Google Gemini (官方)',
        geminiCustom: 'Google Gemini (自有 Key/代理)',
        openai: 'OpenAI 兼容接口',
        model: '模型',
        apiKey: 'API Key',
        baseUrl: 'API Base URL',
        fetchModels: '获取模型列表',
        customModel: '自定义模型名称',
        theme: '外观模式',
        light: '浅色',
        dark: '深色',
        system: '跟随系统'
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
        geminiOfficial: 'Google Gemini (Official)',
        geminiCustom: 'Google Gemini (Own Key/Proxy)',
        openai: 'OpenAI Compatible',
        model: 'Model',
        apiKey: 'API Key',
        baseUrl: 'API Base URL',
        fetchModels: 'Fetch Models',
        customModel: 'Custom Model Name',
        theme: 'Appearance',
        light: 'Light',
        dark: 'Dark',
        system: 'System'
    }
};

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, preferences, onUpdatePreferences, onExportData, onImportData, onResetData, hideMobileNav }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[preferences.spokenLanguage];
  
  // Local state for editing API config before saving
  const [tempApiConfig, setTempApiConfig] = useState<ApiConfig>(preferences.apiConfig);
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          onImportData(e.target.files[0]);
      }
  };

  const saveSettings = () => {
      onUpdatePreferences({ apiConfig: tempApiConfig });
      setShowSettings(false);
  };

  const fetchOpenAIModels = async () => {
      if (!tempApiConfig.openai.baseUrl || !tempApiConfig.openai.apiKey) return;
      setIsFetching(true);
      try {
          const url = `${tempApiConfig.openai.baseUrl.replace(/\/+$/, '')}/models`;
          const res = await fetch(url, {
              headers: { 'Authorization': `Bearer ${tempApiConfig.openai.apiKey}` }
          });
          const data = await res.json();
          if (data.data && Array.isArray(data.data)) {
              setFetchedModels(data.data.map((m: any) => m.id));
          } else {
              alert('Invalid response format');
          }
      } catch (e) {
          alert('Failed to fetch models');
      } finally {
          setIsFetching(false);
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

        {/* Toggle Button */}
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
                onClick={() => { setTempApiConfig(preferences.apiConfig); setShowSettings(true); }}
                className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white font-bold py-3 w-full rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors`}
                title={t.settings}
            >
             <Settings size={20} />
             {!sidebarCollapsed && <span>{t.settings}</span>}
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-72'} flex flex-col min-h-screen transition-all duration-300`}>
        <div className="flex-1 w-full mx-auto p-0 md:p-0">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav - Hidden if hideMobileNav is true */}
      {!hideMobileNav && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-card border-t border-gray-200 dark:border-gray-800 flex justify-around py-3 pb-6 z-50 shadow-lg">
            <MobileNavItem 
              icon={<BookOpen size={24} />} 
              label={t.learn} 
              active={activeTab === 'learn'} 
              onClick={() => onTabChange('learn')}
            />
            <MobileNavItem 
              icon={<RotateCcw size={24} />} 
              label={t.review} 
              active={activeTab === 'review'} 
              onClick={() => onTabChange('review')}
            />
            <MobileNavItem 
              icon={<User size={24} />} 
              label={t.profile} 
              active={activeTab === 'profile'} 
              onClick={() => onTabChange('profile')}
            />
            <MobileNavItem 
              icon={<Settings size={24} />} 
              label={t.settings} 
              active={showSettings} 
              onClick={() => { setTempApiConfig(preferences.apiConfig); setShowSettings(true); }}
            />
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
                      
                      {/* Appearance Settings */}
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

                      {/* AI Model Config */}
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2 mb-4 text-brand font-bold text-xs uppercase tracking-wider">
                              <Cpu size={16} />
                              {t.modelSettings}
                          </div>

                          <div className="space-y-4">
                              {/* Provider Select */}
                              <div>
                                  <label className="text-xs font-bold text-gray-500 block mb-2">{t.provider}</label>
                                  <select 
                                    className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white font-bold text-sm focus:border-brand outline-none"
                                    value={tempApiConfig.provider}
                                    onChange={(e) => setTempApiConfig({...tempApiConfig, provider: e.target.value as any})}
                                  >
                                      <option value="gemini-official">{t.geminiOfficial}</option>
                                      <option value="gemini-custom">{t.geminiCustom}</option>
                                      <option value="openai">{t.openai}</option>
                                  </select>
                              </div>

                              {/* Gemini Official Config */}
                              {tempApiConfig.provider === 'gemini-official' && (
                                  <div>
                                      <label className="text-xs font-bold text-gray-500 block mb-2">{t.model}</label>
                                      <select 
                                        className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white font-mono text-sm focus:border-brand outline-none"
                                        value={tempApiConfig.gemini.model}
                                        onChange={(e) => setTempApiConfig({...tempApiConfig, gemini: {...tempApiConfig.gemini, model: e.target.value}})}
                                      >
                                          {GEMINI_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                                      </select>
                                  </div>
                              )}

                              {/* Gemini Custom Config */}
                              {tempApiConfig.provider === 'gemini-custom' && (
                                  <div className="space-y-3">
                                      <div>
                                          <label className="text-xs font-bold text-gray-500 block mb-2">{t.apiKey}</label>
                                          <div className="relative">
                                            <Key size={16} className="absolute top-3.5 left-3 text-gray-400"/>
                                            <input 
                                                type="password"
                                                className="w-full pl-10 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white font-mono text-sm focus:border-brand outline-none"
                                                value={tempApiConfig.gemini.apiKey || ''}
                                                onChange={(e) => setTempApiConfig({...tempApiConfig, gemini: {...tempApiConfig.gemini, apiKey: e.target.value}})}
                                                placeholder="sk-..."
                                            />
                                          </div>
                                      </div>
                                      <div>
                                          <label className="text-xs font-bold text-gray-500 block mb-2">{t.baseUrl} (Optional Proxy)</label>
                                          <div className="relative">
                                            <Link size={16} className="absolute top-3.5 left-3 text-gray-400"/>
                                            <input 
                                                type="text"
                                                className="w-full pl-10 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white font-mono text-sm focus:border-brand outline-none"
                                                value={tempApiConfig.gemini.baseUrl || ''}
                                                onChange={(e) => setTempApiConfig({...tempApiConfig, gemini: {...tempApiConfig.gemini, baseUrl: e.target.value}})}
                                                placeholder="https://generativelanguage.googleapis.com"
                                            />
                                          </div>
                                      </div>
                                      <div>
                                          <label className="text-xs font-bold text-gray-500 block mb-2">{t.model}</label>
                                          <select 
                                            className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white font-mono text-sm focus:border-brand outline-none"
                                            value={tempApiConfig.gemini.model}
                                            onChange={(e) => setTempApiConfig({...tempApiConfig, gemini: {...tempApiConfig.gemini, model: e.target.value}})}
                                          >
                                              {GEMINI_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                                          </select>
                                      </div>
                                  </div>
                              )}

                              {/* OpenAI Config */}
                              {tempApiConfig.provider === 'openai' && (
                                  <div className="space-y-3">
                                      <div>
                                          <label className="text-xs font-bold text-gray-500 block mb-2">{t.baseUrl}</label>
                                          <input 
                                            type="text"
                                            className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white font-mono text-sm focus:border-brand outline-none"
                                            value={tempApiConfig.openai.baseUrl}
                                            onChange={(e) => setTempApiConfig({...tempApiConfig, openai: {...tempApiConfig.openai, baseUrl: e.target.value}})}
                                            placeholder="https://api.openai.com/v1"
                                          />
                                      </div>
                                      <div>
                                          <label className="text-xs font-bold text-gray-500 block mb-2">{t.apiKey}</label>
                                          <input 
                                            type="password"
                                            className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white font-mono text-sm focus:border-brand outline-none"
                                            value={tempApiConfig.openai.apiKey}
                                            onChange={(e) => setTempApiConfig({...tempApiConfig, openai: {...tempApiConfig.openai, apiKey: e.target.value}})}
                                            placeholder="sk-..."
                                          />
                                      </div>
                                      <div>
                                          <label className="text-xs font-bold text-gray-500 block mb-2">{t.model}</label>
                                          <div className="flex gap-2">
                                              <input 
                                                type="text"
                                                className="flex-1 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-white font-mono text-sm focus:border-brand outline-none"
                                                value={tempApiConfig.openai.model}
                                                onChange={(e) => setTempApiConfig({...tempApiConfig, openai: {...tempApiConfig.openai, model: e.target.value}})}
                                                placeholder="gpt-4o"
                                                list="openai-models"
                                              />
                                              <datalist id="openai-models">
                                                  {fetchedModels.map(m => <option key={m} value={m} />)}
                                              </datalist>
                                              <button 
                                                onClick={fetchOpenAIModels}
                                                disabled={isFetching}
                                                className="p-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-xl transition-colors text-gray-700 dark:text-white disabled:opacity-50"
                                                title={t.fetchModels}
                                              >
                                                  <RefreshCw size={20} className={isFetching ? "animate-spin" : ""} />
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                              )}
                          </div>
                      </div>

                      {/* Language Settings */}
                      <div>
                          <div className="flex items-center gap-2 mb-4 text-gray-400 font-bold text-xs uppercase tracking-wider">
                              <Terminal size={16} />
                              {t.targetLang}
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                              {['Python', 'Java', 'C++', 'C', 'JavaScript'].map(lang => (
                                  <button
                                    key={lang}
                                    onClick={() => onUpdatePreferences({ targetLanguage: lang as any })}
                                    className={`py-3 rounded-xl border-b-4 border-2 font-bold text-sm transition-all active:border-b-2 active:translate-y-[2px] ${
                                        preferences.targetLanguage === lang 
                                        ? 'border-brand-dark bg-brand text-white border-b-brand-dark' 
                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-dark-card'
                                    }`}
                                  >
                                      {lang}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div>
                          <div className="flex items-center gap-2 mb-4 text-gray-400 font-bold text-xs uppercase tracking-wider">
                              <Globe size={16} />
                              {t.instructionLang}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                              {['Chinese', 'English'].map(lang => (
                                  <button
                                    key={lang}
                                    onClick={() => onUpdatePreferences({ spokenLanguage: lang as any })}
                                    className={`py-3 rounded-xl border-b-4 border-2 font-bold text-sm transition-all active:border-b-2 active:translate-y-[2px] ${
                                        preferences.spokenLanguage === lang 
                                        ? 'border-brand-dark bg-brand text-white border-b-brand-dark' 
                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-dark-card'
                                    }`}
                                  >
                                      {lang === 'Chinese' ? '中文' : 'English'}
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* Data Management */}
                      <div>
                          <div className="flex items-center gap-2 mb-4 text-gray-400 font-bold text-xs uppercase tracking-wider">
                              <Save size={16} />
                              {t.dataMgmt}
                          </div>
                          <div className="space-y-3">
                                <button 
                                    onClick={onExportData}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <Download size={18} /> {t.export}
                                </button>
                                
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange} 
                                    accept=".json" 
                                    className="hidden" 
                                />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <Upload size={18} /> {t.import}
                                </button>
                                
                                <button 
                                    onClick={onResetData}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-100 dark:border-red-900/50 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 transition-colors"
                                >
                                    <Trash2 size={18} /> {t.reset}
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
