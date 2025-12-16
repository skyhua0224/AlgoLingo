import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Trash2, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isZh: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    isZh: true,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidMount() {
      // Determine language from local storage since we are outside React Context
      try {
          const prefs = localStorage.getItem('algolingo_preferences');
          if (prefs) {
              const parsed = JSON.parse(prefs);
              if (parsed.spokenLanguage === 'English') {
                  this.setState({ isZh: false });
              }
          }
      } catch(e) {
          // Fallback to default (true/Chinese)
      }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    const msg = this.state.isZh 
        ? "这将清除所有本地缓存数据以修复启动问题。确定吗？" 
        : "This will wipe local data to fix the crash. Are you sure?";
        
    if (window.confirm(msg)) {
        localStorage.clear();
        window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const { isZh } = this.state;
      
      const title = isZh ? "应用遇到严重错误" : "Critical Application Error";
      const subtitle = isZh 
        ? "通常是因为本地数据损坏或不兼容导致的。请尝试重置数据。" 
        : "Usually caused by corrupted local data or incompatibility. Please try resetting data.";
      const refreshBtn = isZh ? "刷新页面" : "Refresh Page";
      const resetBtn = isZh ? "重置数据并修复" : "Reset Data & Fix";

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0c0c0c] p-6 text-center">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6 text-red-500">
            <AlertTriangle size={40} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
            {title}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
            {subtitle}
          </p>
          
          <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30 mb-8 text-left w-full max-w-lg overflow-auto">
            <code className="text-xs text-red-600 dark:text-red-400 font-mono">
                {this.state.error?.toString()}
            </code>
          </div>

          <div className="flex gap-4">
            <button 
                onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
            >
                <RefreshCw size={18} /> {refreshBtn}
            </button>
            <button 
                onClick={this.handleReset}
                className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold flex items-center gap-2 shadow-lg"
            >
                <Trash2 size={18} /> {resetBtn}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}