
import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Zap, Brain, ChevronDown, ChevronUp, Sparkles, AlertCircle, RotateCcw, Clock, Loader2 } from 'lucide-react';

interface LoadingScreenProps {
    problemName?: string;
    phase?: number;
    language: 'Chinese' | 'English';
    onRetry?: () => void;
}

const TIPS_ZH = [
    "你知道吗？Python 的 `dict` 使用随机哈希函数来防止碰撞攻击。",
    "专家提示：使用 `enumerate(nums)` 代替 `range(len(nums))` 代码更优雅。",
    "O(n) 思维：如果你看到嵌套循环，试着想想能不能用哈希表优化。",
    "空间换时间：递归虽然优雅但消耗栈内存，迭代通常更安全。",
    "双指针技巧可以将有序数组中的 O(n²) 问题降低到 O(n)。",
    "Gemini 正在深度思考，构建个性化的代码反例...",
    "滑动窗口其实就是间距可变的双指针。",
    "Python 的集合（Set）本质上就是只有键没有值的哈希表。",
];

const TIPS_EN = [
    "Did you know? Python's `dict` uses a randomized hash function to prevent collision attacks.",
    "Pro Tip: Use `enumerate(nums)` instead of `range(len(nums))` for cleaner code.",
    "Thinking in O(n): If you see nested loops, look for a Hash Map opportunity.",
    "Memory vs Speed: Recursion is elegant but consumes Stack memory. Iteration is often safer.",
    "The 'Two Pointers' technique can reduce O(n²) problems to O(n) in sorted arrays.",
    "Gemini is thinking deeply to generate custom code counter-examples...",
    "Sliding Window is just a Two Pointers approach with a fixed or variable gap.",
    "Python sets are implemented as Hash Maps with dummy values.",
];

const LOGS_TEMPLATE_ZH = [
    "[系统] 正在初始化安全握手...",
    "[上下文] 加载用户知识图谱...",
    "[GEMINI] 注入算法教学提示词 (Chain-of-Thought)...",
    "[分析器] 回顾近期错题记录...",
    "[规划器] 正在进行深度推理 (Thinking Budget applied)...",
    "[生成器] 构建对话组件...",
    "[生成器] 编写 Python 代码片段 (1/3)...",
    "[生成器] 编写 Python 代码片段 (2/3)...",
    "[生成器] 编写 Python 代码片段 (3/3)...",
    "[生成器] 创建 Parsons 逻辑拼图...",
    "[验证器] 检查 JSON 结构完整性...",
    "[优化器] 降低 Token 延迟...",
    "[渲染] 预计算布局几何...",
    "[系统] 最终确定课程资源...",
    "[就绪] 等待最终字节流...",
];

const LOGS_TEMPLATE_EN = [
    "[SYSTEM] Initializing secure handshake...",
    "[CONTEXT] Loading user knowledge graph...",
    "[GEMINI] Injecting pedagogical prompts (Chain-of-Thought)...",
    "[ANALYZER] Reviewing recent mistakes...",
    "[PLANNER] Applying Deep Thinking Budget...",
    "[GENERATOR] Constructing Dialogue Widget...",
    "[GENERATOR] Generating Python code snippets (1/3)...",
    "[GENERATOR] Generating Python code snippets (2/3)...",
    "[GENERATOR] Generating Python code snippets (3/3)...",
    "[GENERATOR] Creating 'Parsons' logic puzzle...",
    "[VALIDATOR] Checking JSON schema integrity...",
    "[OPTIMIZER] Reducing token latency...",
    "[RENDER] Pre-calculating layout geometry...",
    "[SYSTEM] Finalizing lesson assets...",
    "[READY] Awaiting final bytes...",
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ problemName, phase = 0, language, onRetry }) => {
  const [progress, setProgress] = useState(5);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentTip, setCurrentTip] = useState(0);
  const [showTerminal, setShowTerminal] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const isChinese = language === 'Chinese';
  const tips = isChinese ? TIPS_ZH : TIPS_EN;
  const baseLogs = isChinese ? LOGS_TEMPLATE_ZH : LOGS_TEMPLATE_EN;

  // --- 1. Slowed Progress Logic (~30s to 99%) ---
  useEffect(() => {
    const updateIntervalMs = 40;
    const targetDurationMs = 30000; // 30 Seconds
    const totalSteps = targetDurationMs / updateIntervalMs;
    const incrementPerStep = 99 / totalSteps; // ~0.132 per step

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 99) return 99; // Hard cap
        // Add slight random variance to look natural
        const variance = (Math.random() * 0.05) - 0.025;
        return Math.min(99, prev + incrementPerStep + variance); 
      });
    }, updateIntervalMs);

    return () => clearInterval(interval);
  }, []);

  // --- 2. Elapsed Time Tracker & Log Injection ---
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Add logs based on progress thresholds
  useEffect(() => {
      const logIndex = Math.floor((progress / 100) * baseLogs.length);
      if (logIndex > logs.length - 1 && baseLogs[logIndex]) {
          setLogs(prev => [...prev, baseLogs[logIndex]]);
      }
  }, [progress, baseLogs, logs.length]);

  // Rotate tips
  useEffect(() => {
    const interval = setInterval(() => {
        setCurrentTip(prev => (prev + 1) % tips.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [tips.length]);

  // Auto-scroll logs
  useEffect(() => {
      if (logsEndRef.current) {
          logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  }, [logs, showTerminal]);

  const handleRetry = () => {
      setIsRetrying(true);
      setProgress(5);
      setLogs([]);
      if (onRetry) onRetry();
      // Keep retrying state for a bit to show feedback
      setTimeout(() => setIsRetrying(false), 5000);
  };

  const showRetry = elapsedSeconds > 8; // Show after 8 seconds

  return (
    <div className="fixed inset-0 z-[100] w-full h-full bg-gray-50 dark:bg-dark-bg flex flex-col items-center justify-center p-6 transition-colors">
      
      <div className="max-w-md w-full relative z-10">
        <div className="bg-white dark:bg-dark-card rounded-3xl shadow-2xl border border-white/50 dark:border-white/5 p-8 text-center backdrop-blur-xl mb-6 transition-colors">
            
            {/* Icon Animation */}
            <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 bg-brand/20 rounded-full animate-ping opacity-75" style={{ animationDuration: '3s' }}></div>
                <div className="relative bg-white dark:bg-dark-bg p-4 rounded-full shadow-lg border-2 border-gray-100 dark:border-gray-700">
                    <Brain size={48} className="text-brand animate-pulse" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-brand-dark text-white p-1.5 rounded-full border-2 border-white dark:border-dark-card">
                    <Sparkles size={16} className="animate-spin-slow" />
                </div>
            </div>

            <h2 className="text-2xl font-extrabold text-gray-800 dark:text-dark-text mb-2">{isChinese ? "正在生成深度课程" : "Generating Deep Lesson"}</h2>
            <p className="text-gray-500 dark:text-dark-muted text-sm font-medium mb-4">
                {isChinese ? "正在为 " : "Crafting a personalized path for "}
                <span className="text-brand font-bold">{problemName || "Algorithm"}</span>
            </p>

            {/* Progress Bar */}
            <div className="relative h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600 mb-2">
                <div 
                    className="absolute top-0 left-0 h-full bg-brand transition-all duration-100 ease-linear relative overflow-hidden"
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[shimmer_1s_linear_infinite]"></div>
                </div>
            </div>
            
            <div className="flex justify-between items-center text-xs font-bold text-gray-400 dark:text-gray-500 mb-6">
                <span className="flex items-center gap-1">
                    <Clock size={12} /> {elapsedSeconds}s
                </span>
                <span>{Math.floor(progress)}%</span>
            </div>

            {/* Expectation Warning */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/50 rounded-xl p-3 mb-6 flex items-start gap-2 text-left">
                <AlertCircle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-700 dark:text-yellow-500 leading-relaxed font-medium">
                    {isChinese 
                        ? "AI 生成包含复杂的逻辑推理与代码构建，可能会消耗 1 分钟或更久，请耐心等待。" 
                        : "AI generation involves complex logical reasoning and code construction. This may take 1 minute or longer."}
                </p>
            </div>

            {/* Retry Button */}
            {showRetry && onRetry && (
                 <div className="mb-6 animate-fade-in-down">
                     <button 
                        onClick={handleRetry}
                        disabled={isRetrying}
                        className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border-2 transition-all active:scale-95 
                        ${isRetrying 
                            ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 cursor-wait' 
                            : 'bg-white dark:bg-dark-card border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300'
                        }`}
                     >
                         {isRetrying ? (
                             <><Loader2 size={16} className="animate-spin"/> {isChinese ? "正在重试..." : "Retrying..."}</>
                         ) : (
                             <><RotateCcw size={16} /> {isChinese ? "耗时过久？点击重试" : "Taking too long? Retry"}</>
                         )}
                     </button>
                 </div>
            )}

            {/* Tips Box */}
            <div className="bg-brand-bg/50 dark:bg-brand/10 rounded-xl p-4 border border-brand/20 min-h-[80px] flex items-center justify-center transition-all duration-500">
                <p className="text-sm text-brand-dark dark:text-brand-light font-medium leading-relaxed animate-fade-in-up">
                    <Zap size={14} className="inline mr-1 mb-0.5 fill-current"/> 
                    {tips[currentTip]}
                </p>
            </div>
        </div>

        {/* Terminal Toggle */}
        <div className="flex flex-col items-center">
            <button 
                onClick={() => setShowTerminal(!showTerminal)}
                className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-white/80 dark:bg-dark-card/80 px-4 py-2 rounded-full shadow-sm border border-gray-200 dark:border-gray-700"
            >
                <Terminal size={14} />
                {showTerminal 
                    ? (isChinese ? "隐藏思维链" : "Hide Chain-of-Thought") 
                    : (isChinese ? "查看 AI 思维链" : "View AI Chain-of-Thought")
                }
                {showTerminal ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showTerminal && (
                <div className="w-full mt-4 bg-gray-900 rounded-xl p-4 shadow-2xl border border-gray-800 font-mono text-xs text-green-400 h-48 overflow-hidden flex flex-col animate-scale-in">
                    <div className="flex items-center gap-2 border-b border-gray-800 pb-2 mb-2 text-gray-500">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"/>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"/>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"/>
                        </div>
                        <span className="ml-auto">gemini-thinking-process.log</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                        {logs.map((log, i) => (
                            <div key={i} className="opacity-80 hover:opacity-100">
                                <span className="text-gray-600 mr-2">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                                {log}
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                        <div className="animate-pulse flex items-center gap-1 mt-2">
                            <span className="text-brand">{'>'}</span>
                            <span className="w-2 h-4 bg-brand block"></span>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
