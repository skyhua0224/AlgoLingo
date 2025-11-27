
import React from 'react';
import { Widget } from '../../../types';
import { BaseWidget } from '../BaseWidget';

export const ComparisonTableWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
    if (!widget.comparisonTable) return null;
    const { headers, rows } = widget.comparisonTable;

    return (
        <BaseWidget>
            <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3 border-r border-gray-200 dark:border-gray-700">Feature</th>
                            {headers.map((h, i) => (
                                <th key={i} className="px-4 py-3 text-brand-dark dark:text-brand-light border-l border-gray-200 dark:border-gray-700">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-100 dark:divide-gray-800">
                        {rows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3 font-bold text-gray-800 dark:text-white border-r border-gray-100 dark:border-gray-800">
                                    {row.label}
                                </td>
                                {/* Iterate headers to guarantee column alignment even if values are short */}
                                {headers.map((_, vIdx) => (
                                    <td key={vIdx} className="px-4 py-3 text-gray-600 dark:text-gray-400 border-l border-gray-100 dark:border-gray-800">
                                        {row.values[vIdx] || "-"}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </BaseWidget>
    );
};