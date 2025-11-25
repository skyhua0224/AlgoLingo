
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
      // Try to salvage common patterns if AI returns object (e.g. localized strings or wrapped text)
      textString = content.text || content.en || content.content || JSON.stringify(content);
  } else {
      textString = String(content);
  }

  // Split by bold (**text**) and code (`text`) markers
  // Regex captures delimiters to include them in the split array
  const parts = textString.split(/(\*\*.*?\*\*|`.*?`)/g);

  return (
    <span className={`leading-relaxed ${className}`}>
      {parts.map((part, index) => {
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
      })}
    </span>
  );
};
