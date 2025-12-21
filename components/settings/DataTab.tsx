
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Save, Download, Upload, Trash2, AlertTriangle, X } from 'lucide-react';
import { Button } from '../Button';

interface DataTabProps {
    onExport: () => void;
    onImport: (file: File) => void;
    onReset: () => void;
    isZh: boolean;
}

export const DataTab: React.FC<DataTabProps> = ({ onExport, onImport, onReset, isZh }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showResetOverlay, setShowResetOverlay] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onImport(e.target.files[0]);
        }
    };

    const startResetFlow = () => {
        setShowResetOverlay(true);
        setCountdown(5);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const cancelReset = () => {
        setShowResetOverlay(false);
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const confirmReset = () => {
        cancelReset(); // Close overlay
        onReset(); // Trigger soft reset in AppManager
    };

    useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    return (
        <div className="space-y-6 animate-fade-in-up relative">
            {showResetOverlay && createPortal(
                <div className="fixed inset-0 z-[9999] bg-red-600/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-8 animate-pulse">
                        <AlertTriangle size={48} className="text-white" />
                    </div>
                    <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">
                        {isZh ? "终极核打击预警" : "SYSTEM WIPE INBOUND"}
                    </h2>
                    <p className="text-white/80 max-w-md mb-12 text-lg font-medium leading-relaxed">
                        {isZh 
                         ? "这将永久删除所有本地缓存、学习进度、GitHub 令牌和题目策略。此操作无法撤销。" 
                         : "This will permanently erase all local caches, study progress, GitHub tokens, and strategies. This cannot be undone."}
                    </p>

                    <div className="text-8xl font-black text-white mb-12 tabular-nums">
                        {countdown}
                    </div>

                    <div className="flex flex-col gap-4 w-full max-w-sm">
                        <button 
                            disabled={countdown > 0}
                            onClick={confirmReset}
                            className={`w-full py-5 rounded-2xl font-black text-lg shadow-2xl transition-all flex items-center justify-center gap-2 ${
                                countdown > 0 
                                ? 'bg-white/10 text-white/40 cursor-not-allowed border-2 border-white/20' 
                                : 'bg-white text-red-600 hover:scale-105 active:scale-95'
                            }`}
                        >
                            <Trash2 size={24} />
                            {isZh ? "确认销毁所有数据" : "CONFIRM DATA DESTRUCTION"}
                        </button>
                        
                        <button 
                            onClick={cancelReset}
                            className="w-full py-4 text-white font-black hover:bg-white/10 rounded-2xl transition-all flex items-center justify-center gap-2"
                        >
                            <X size={20} />
                            {isZh ? "手滑了，快取消！" : "ABORT MISSION (CANCEL)"}
                        </button>
                    </div>
                </div>,
                document.body
            )}

            <div className="flex items-center gap-2 mb-4 text-brand font-bold text-sm uppercase tracking-wider">
                <Save size={16} />
                {isZh ? '数据管理' : 'Data Management'}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                    onClick={onExport} 
                    className="p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-brand hover:bg-brand-bg/10 transition-all flex flex-col items-center justify-center gap-3 group bg-white dark:bg-dark-card"
                >
                    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300 group-hover:bg-brand group-hover:text-white transition-colors">
                        <Download size={24} />
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-gray-800 dark:text-white">{isZh ? "导出备份" : "Export Backup"}</div>
                        <div className="text-xs text-gray-400 mt-1">{isZh ? "下载全量 JSON 文件" : "Download Full JSON"}</div>
                    </div>
                </button>

                <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-brand hover:bg-brand-bg/10 transition-all flex flex-col items-center justify-center gap-3 group bg-white dark:bg-dark-card"
                >
                     <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300 group-hover:bg-brand group-hover:text-white transition-colors">
                        <Upload size={24} />
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-gray-800 dark:text-white">{isZh ? "导入备份" : "Import Backup"}</div>
                        <div className="text-xs text-gray-400 mt-1">{isZh ? "恢复 Time Machine 存档" : "Restore Time Machine data"}</div>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                </button>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                 <button 
                    onClick={startResetFlow}
                    className="w-full p-4 rounded-xl border-2 border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                    <Trash2 size={16} />
                    {isZh ? "重置所有数据 (危险)" : "Reset All Data (Danger)"}
                </button>
            </div>
        </div>
    );
};
