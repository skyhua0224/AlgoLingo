import React, { useRef } from 'react';
import { Save, Download, Upload, Trash2 } from 'lucide-react';

interface DataTabProps {
    onExport: () => void;
    onImport: (file: File) => void;
    isZh: boolean;
}

export const DataTab: React.FC<DataTabProps> = ({ onExport, onImport, isZh }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onImport(e.target.files[0]);
        }
    };

    const handleReset = () => {
        const confirmMsg = isZh 
            ? "警告：这将清除所有本地进度、设置和 API Key。确定要重置吗？"
            : "WARNING: This will wipe all local progress, settings, and API keys. Are you sure?";
        
        if (window.confirm(confirmMsg)) {
            localStorage.clear();
            window.location.reload();
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
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
                        <div className="text-xs text-gray-400 mt-1">{isZh ? "下载 JSON 文件" : "Download JSON"}</div>
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
                        <div className="text-xs text-gray-400 mt-1">{isZh ? "恢复 .json 数据" : "Restore .json data"}</div>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                </button>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                 <button 
                    onClick={handleReset}
                    className="w-full p-4 rounded-xl border-2 border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                    <Trash2 size={16} />
                    {isZh ? "重置所有数据 (危险)" : "Reset All Data (Danger)"}
                </button>
            </div>
        </div>
    );
};