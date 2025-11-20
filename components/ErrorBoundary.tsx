import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Copy } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in LessonRunner:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleRetry = () => {
      this.setState({ hasError: false, error: null, errorInfo: null });
      if (this.props.onRetry) {
          this.props.onRetry();
      } else {
          window.location.reload();
      }
  }

  private handleCopy = () => {
      const text = `${this.state.error?.toString()}\n\n${this.state.errorInfo?.componentStack}`;
      navigator.clipboard.writeText(text);
      alert("Error log copied to clipboard");
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[100] bg-gray-50 dark:bg-dark-bg flex flex-col items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white dark:bg-dark-card rounded-3xl shadow-2xl border-2 border-red-100 dark:border-red-900/50 p-8 text-center">
             <div className="w-20 h-20 mx-auto mb-6 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                 <AlertTriangle size={40} className="text-red-500" />
             </div>
             <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white mb-2">Rendering Error</h2>
             <p className="text-gray-500 dark:text-gray-400 mb-6">
                 Something went wrong while displaying the lesson. 
             </p>

             <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl text-left mb-6 max-h-48 overflow-y-auto custom-scrollbar border border-red-100 dark:border-red-900/30">
                 <p className="font-mono text-xs text-red-600 dark:text-red-400 font-bold break-words">
                     {this.state.error && this.state.error.toString()}
                 </p>
                 {this.state.errorInfo && (
                     <pre className="font-mono text-[10px] text-red-500/70 mt-2 whitespace-pre-wrap">
                         {this.state.errorInfo.componentStack}
                     </pre>
                 )}
             </div>

             <div className="flex gap-3">
                 <Button variant="secondary" onClick={this.handleCopy} className="flex-1 flex items-center justify-center gap-2">
                     <Copy size={16}/> Copy Log
                 </Button>
                 <Button variant="primary" onClick={this.handleRetry} className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 border-red-700 text-white">
                     <RotateCcw size={16}/> Retry
                 </Button>
             </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}