
import React from 'react';
import { Widget } from '../../../types';
import { BaseWidget } from '../BaseWidget';
import { Lightbulb, Zap } from 'lucide-react';
import { MarkdownText } from '../../common/MarkdownText';

export const CalloutWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
  if (!widget.callout) return null;
  const { title, text, variant } = widget.callout;
  
  const styles = {
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-200 border-green-200 dark:border-green-800',
    tip: 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800',
  };

  return (
    <BaseWidget>
        <div className={`flex gap-4`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm shrink-0 border-2 bg-white dark:bg-dark-card border-gray-200 dark:border-gray-700`}>
                {variant === 'tip' ? <Zap size={20} className="text-purple-500"/> : <Lightbulb size={20} className="text-yellow-500"/>}
            </div>
            <div className={`relative p-4 rounded-2xl rounded-tl-none max-w-[85%] text-sm shadow-sm border-2 ${styles[variant]}`}>
                <h4 className="font-extrabold text-xs uppercase mb-1 opacity-70 flex items-center gap-1">
                    {title}
                </h4>
                <div className="font-medium leading-relaxed">
                    <MarkdownText content={text} />
                </div>
            </div>
        </div>
    </BaseWidget>
  );
};
