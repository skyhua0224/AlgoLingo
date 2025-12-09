
import React from 'react';

interface MarkdownTextProps {
  content: any;
  className?: string;
}

export const MarkdownText: React.FC<MarkdownTextProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Robustness: Ensure content is a string before splitting
  let textString = "";
  if (typeof content === 'string') {
      textString = content;
  } else if (typeof content === 'number') {
      textString = String(content);
  } else if (typeof content === 'object') {
      textString = content.text || content.en || content.content || JSON.stringify(content);
  } else {
      textString = String(content);
  }

  // Simple parser to handle newlines, bold, code, headers, and lists
  // This is a lightweight alternative to full markdown parsers to keep bundle small
  const renderLine = (line: string, key: number) => {
      // Header
      if (line.startsWith('### ')) return <h4 key={key} className="text-sm font-bold mt-3 mb-1 text-gray-900 dark:text-white">{line.replace('### ', '')}</h4>;
      if (line.startsWith('## ')) return <h3 key={key} className="text-base font-bold mt-4 mb-2 text-gray-900 dark:text-white">{line.replace('## ', '')}</h3>;
      
      // List item
      if (line.trim().startsWith('- ')) {
          return (
            <li key={key} className="ml-4 list-disc pl-1 text-gray-700 dark:text-gray-300">
                {parseInline(line.trim().substring(2))}
            </li>
          );
      }

      // Normal paragraph
      if (!line.trim()) return <div key={key} className="h-2" />; // Spacer
      
      return <div key={key} className="min-h-[20px]">{parseInline(line)}</div>;
  };

  const parseInline = (text: string) => {
      // Split by bold (**text**) and code (`text`) markers
      const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
      return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={index} className="font-bold text-gray-900 dark:text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={index}
              className="px-1.5 py-0.5 mx-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-brand-dark dark:text-brand-light font-mono text-[0.9em] border border-gray-200 dark:border-gray-700"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={index}>{part}</span>;
      });
  };

  return (
    <div className={`leading-relaxed space-y-1 ${className}`}>
      {textString.split('\n').map((line, i) => renderLine(line, i))}
    </div>
  );
};
