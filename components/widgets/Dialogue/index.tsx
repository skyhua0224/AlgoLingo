
import React from 'react';
import { Widget } from '../../../types';
import { BaseWidget } from '../BaseWidget';
import { Bot, User } from 'lucide-react';
import { MarkdownText } from '../../common/MarkdownText';

export const DialogueWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
  if (!widget.dialogue) return null;
  const { text, speaker } = widget.dialogue;
  const isCoach = speaker === 'coach';

  return (
    <BaseWidget>
        <div className={`flex gap-4 ${isCoach ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm shrink-0 border-2 
            ${isCoach ? 'bg-brand text-white border-brand-dark' : 'bg-blue-500 text-white border-blue-700'}`}>
            {isCoach ? <Bot size={20} /> : <User size={20} />}
        </div>
        <div className={`relative p-4 rounded-2xl max-w-[85%] text-sm md:text-base leading-relaxed shadow-sm border-2
            ${isCoach 
            ? 'bg-white dark:bg-dark-card border-gray-200 dark:border-gray-700 text-gray-800 dark:text-dark-text rounded-tl-none' 
            : 'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800 text-blue-900 dark:text-blue-100 rounded-tr-none'
            }`}>
            <MarkdownText content={text} />
        </div>
        </div>
    </BaseWidget>
  );
};
