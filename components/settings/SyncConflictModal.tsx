
import React from 'react';
import { Cloud, Laptop, ArrowRight, AlertTriangle, Check, RefreshCw, Save, Clock } from 'lucide-react';
import { UserStats } from '../../types';

interface SyncDataPreview {
    updatedAt: number;
    stats: UserStats;
    userName?: string;
}

interface SyncConflictModalProps {
    localData: SyncDataPreview;
    cloudData: SyncDataPreview;
    onResolve: (action: 'push' | 'pull') => void;
    onCancel: () => void;
    isZh: boolean;
    isNewUserFlow?: boolean; // Changes text for Onboarding context
}

export const SyncConflictModal: React.FC<SyncConflictModalProps> = ({ localData, cloudData, onResolve, onCancel, isZh, isNewUserFlow }) => {
    
    const formatDate = (ts: number) => new Date(ts).toLocaleString();
    const isCloudNewer = cloudData.updatedAt > localData.updatedAt;
    const isLocalNewer = localData.updatedAt > cloudData.updatedAt;

    const Card = ({ title, icon, data, highlight, tag }: { title: string, icon: any, data: SyncDataPreview, highlight?: boolean, tag?: string }) => (
        <div className={`flex-1 p-6 rounded-2xl border-2 transition-all relative overflow-hidden ${highlight ? 'border-brand bg-brand/5 ring-1 ring-brand/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card opacity-90'}`}>
            {tag && (
                <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase rounded-bl-xl ${highlight ? 'bg-brand text-white' : 'bg-gray-200 text-gray-500 dark:bg-gray-700'}`}>
                    {tag}
                </div>
            )}
            
            <div className="flex items-center gap-3 mb-4 mt-2">
                <div className={`p-3 rounded-full ${highlight ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                    {icon}
                </div>
                <div>
                    <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">{title}</h3>
                    <div className="font-black text-lg text-gray-800 dark:text-white">{data.userName || 'User'}</div>
                </div>
            </div>
            
            <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                    <span className="text-gray-500 flex items-center gap-1"><Clock size={12}/> {isZh ? "更新时间" : "Updated"}</span>
                    <span className={`font-mono font-bold ${highlight ? 'text-brand' : 'text-gray-700 dark:text-gray-300'}`}>{formatDate(data.updatedAt)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">{isZh ? "经验值 (XP)" : "Total XP"}</span>
                    <span className="font-mono font-bold text-yellow-600">{data.stats?.xp || 0}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">{isZh ? "连胜" : "Streak"}</span>
                    <span className="font-mono font-bold text-orange-600">{data.stats?.streak || 0}</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-up">
            <div className="bg-white dark:bg-dark-card w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                <div className="p-6 md:p-8 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 text-center">
                    <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-600">
                        <AlertTriangle size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                        {isNewUserFlow 
                            ? (isZh ? "发现云端存档" : "Existing Cloud Save Found")
                            : (isZh ? "数据版本冲突" : "Data Conflict Detected")
                        }
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
                        {isNewUserFlow
                            ? (isZh ? "您输入的 Token 包含一个现有的学习进度。您希望恢复它，还是覆盖它重新开始？" : "Your token contains an existing save file. Do you want to restore it or overwrite it to start fresh?")
                            : (isZh ? "本地数据与云端数据不一致。请仔细对比并选择保留哪一个版本。" : "Local data differs from cloud data. Please carefully choose which version to keep.")
                        }
                    </p>
                </div>

                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
                    <Card 
                        title={isZh ? "本地设备" : "Local Device"} 
                        icon={<Laptop size={24}/>} 
                        data={localData} 
                        highlight={isLocalNewer}
                        tag={isLocalNewer ? (isZh ? "最新" : "Newer") : (isZh ? "较旧" : "Older")}
                    />
                    
                    <div className="hidden md:flex items-center justify-center text-gray-300">
                        <ArrowRight size={32} />
                    </div>

                    <Card 
                        title={isZh ? "云端存档" : "Cloud Save"} 
                        icon={<Cloud size={24}/>} 
                        data={cloudData} 
                        highlight={isCloudNewer || isNewUserFlow}
                        tag={isCloudNewer ? (isZh ? "最新" : "Newer") : (isZh ? "较旧" : "Older")}
                    />
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex flex-col sm:flex-row gap-4 justify-end">
                    <button 
                        onClick={onCancel}
                        className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        {isZh ? "取消" : "Cancel"}
                    </button>
                    
                    <button 
                        onClick={() => onResolve('push')}
                        className={`px-6 py-3 rounded-xl font-bold border-2 flex items-center justify-center gap-2 transition-all ${
                            isNewUserFlow 
                            ? 'border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' // Warning color for overwrite in new user flow
                            : 'border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800'
                        }`}
                    >
                        <Save size={18}/>
                        {isNewUserFlow 
                            ? (isZh ? "覆盖云端 (重新开始)" : "Overwrite (Start Fresh)")
                            : (isZh ? "保留本地 (上传)" : "Keep Local (Upload)")
                        }
                    </button>

                    <button 
                        onClick={() => onResolve('pull')}
                        className="px-6 py-3 rounded-xl font-bold bg-brand text-white hover:bg-brand-light shadow-lg flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={18}/>
                        {isNewUserFlow 
                            ? (isZh ? "恢复云端进度" : "Restore Cloud Save")
                            : (isZh ? "保留云端 (下载)" : "Keep Cloud (Download)")
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};
