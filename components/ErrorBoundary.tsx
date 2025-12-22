import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Trash2, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isZh: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isZh: true,
    };
  }

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
    } catch (e) {
      // ignore
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { isZh, error } = this.state;
      
      return (
        <div className="fixed inset-0 z-[9999] bg-white dark:bg-black flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 text-red-600 animate-bounce">
            <AlertTriangle size={48} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
            {isZh ? "程序发生严重错误" : "System Critical Error"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8 font-mono text-sm bg-gray-100 dark:bg-gray-800 p-4 rounded-xl break-all">
            {error?.message || "Unknown Error"}
          </p>
          
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <button 
              onClick={this.handleReload}
              className="w-full py-4 bg-brand text-white rounded-2xl font-bold shadow-lg hover:bg-brand-light flex items-center justify-center gap-2"
            >
              <RefreshCw size={20} />
              {isZh ? "刷新页面" : "Reload Page"}
            </button>
            
            <button 
              onClick={this.handleReset}
              className="w-full py-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-2xl font-bold hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center gap-2 border-2 border-transparent hover:border-red-200 dark:hover:border-red-800 transition-all"
            >
              <Trash2 size={20} />
              {isZh ? "重置应用数据 (修复崩溃)" : "Factory Reset (Fix Crash)"}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}