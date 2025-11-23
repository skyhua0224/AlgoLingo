import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface GistModalProps {
    gistId: string;
    onClose: () => void;
    t: any;
    isZh: boolean;
}

export const GistModal: React.FC<GistModalProps> = ({ gistId, onClose, t, isZh }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopyGistId = () => {
        navigator.clipboard.writeText(gistId);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
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
                    {gistId}
                </div>

                <button 
                    onClick={handleCopyGistId}
                    className="w-full py-3 bg-brand text-white rounded-xl font-bold shadow-lg hover:bg-brand-light mb-3 flex items-center justify-center gap-2"
                >
                    {isCopied ? <Check size={18}/> : <Copy size={18}/>} {isZh ? "复制 ID" : "Copy ID"}
                </button>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm font-bold py-2">
                    {t.done}
                </button>
            </div>
        </div>
    );
};