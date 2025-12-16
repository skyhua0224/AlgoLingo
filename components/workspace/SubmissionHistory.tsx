
import React from 'react';
import { Clock, CheckCircle2, XCircle, AlertTriangle, ArrowRight, Eye } from 'lucide-react';

export interface SubmissionRecord {
    id: string;
    timestamp: number;
    status: string; // "Accepted", "Wrong Answer", etc.
    runtime?: string;
    memory?: string;
    error_message?: string;
    code: string; // Snapshot of the code submitted
    resultData: any; // Full result object to restore if needed
}

interface SubmissionHistoryProps {
    history: SubmissionRecord[];
    onSelect: (record: SubmissionRecord) => void;
    isZh: boolean;
}

export const SubmissionHistory: React.FC<SubmissionHistoryProps> = ({ history, onSelect, isZh }) => {
    if (!history || history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                <Clock size={48} className="mb-4 opacity-50"/>
                <p>{isZh ? "暂无提交记录" : "No submissions yet"}</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white dark:bg-[#0c0c0c] overflow-y-auto custom-scrollbar">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                    <Clock size={20} className="text-gray-400"/>
                    {isZh ? "提交记录" : "Submissions"}
                </h2>
            </div>
            
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {[...history].reverse().map((rec) => {
                    let statusColor = "text-gray-500";
                    let Icon = AlertTriangle;
                    
                    if (rec.status === 'Accepted') {
                        statusColor = "text-green-500";
                        Icon = CheckCircle2;
                    } else if (rec.status === 'Wrong Answer') {
                        statusColor = "text-red-500";
                        Icon = XCircle;
                    } else {
                        statusColor = "text-yellow-500"; // Compile Error / TLE
                        Icon = AlertTriangle;
                    }

                    return (
                        <button 
                            key={rec.id}
                            onClick={() => onSelect(rec)}
                            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#151515] transition-colors group text-left"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`mt-1 ${statusColor}`}>
                                    <Icon size={18} />
                                </div>
                                <div>
                                    <div className={`font-bold text-sm mb-1 ${statusColor}`}>
                                        {rec.status}
                                    </div>
                                    <div className="text-xs text-gray-400 font-mono">
                                        {new Date(rec.timestamp).toLocaleString()}
                                    </div>
                                    {rec.runtime && (
                                        <div className="flex gap-3 mt-2 text-[10px] font-mono text-gray-500">
                                            <span>{rec.runtime}</span>
                                            <span>{rec.memory}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-xs font-bold text-brand">{isZh ? "查看" : "View"}</span>
                                <Eye size={16} className="text-brand"/>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
