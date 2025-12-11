
import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface MarkdownTextProps {
  content: any;
  className?: string;
}

// Custom Tooltip Component for "Sliding Bookmark" feature
const SmartTooltip: React.FC<{ term: string, explanation: string }> = ({ term, explanation }) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLSpanElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node) && 
                triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <span className="relative inline-block">
            <span 
                ref={triggerRef}
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className="cursor-help border-b-2 border-dashed border-brand/50 hover:border-brand hover:bg-brand/10 transition-colors px-0.5 rounded font-bold text-inherit"
                title="Click for AI Explanation"
            >
                {term}
            </span>
            {isOpen && (
                <div 
                    ref={tooltipRef}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-2xl border border-brand/20 z-50 animate-scale-in origin-bottom text-left"
                >
                    <div className="flex items-center gap-2 mb-2 text-[10px] font-black text-brand uppercase tracking-wider">
                        <HelpCircle size={12}/> Concept
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-sans font-medium">
                        {explanation}
                    </p>
                    <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-gray-800 border-r border-b border-brand/20 transform rotate-45"></div>
                </div>
            )}
        </span>
    );
};

export const MarkdownText: React.FC<MarkdownTextProps> = ({ content, className = '' }) => {
  if (!content) return null;

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

  // Helper to replace common latex symbols with unicode
  const cleanLatex = (str: string) => {
      return str
        .replace(/\\cdot/g, '·')
        .replace(/\\times/g, '×')
        .replace(/\\le/g, '≤')
        .replace(/\\ge/g, '≥')
        .replace(/\\neq/g, '≠')
        .replace(/\\approx/g, '≈')
        .replace(/\\infty/g, '∞')
        .replace(/\\rightarrow/g, '→')
        .replace(/\\leftarrow/g, '←')
        .replace(/\\pm/g, '±')
        // Math Functions & Greeks
        .replace(/\\log/g, 'log')
        .replace(/\\ln/g, 'ln')
        .replace(/\\pi/g, 'π')
        .replace(/\\theta/g, 'θ')
        .replace(/\\alpha/g, 'α')
        .replace(/\\beta/g, 'β')
        .replace(/\\lambda/g, 'λ')
        .replace(/\\sigma/g, 'σ')
        .replace(/\\mu/g, 'μ')
        .replace(/\\Delta/g, 'Δ')
        .replace(/\\O/g, 'O')
        .replace(/\\Theta/g, 'Θ')
        .replace(/\\Omega/g, 'Ω');
  };

  // Helper to render complex math content (subscripts, superscripts)
  const renderMathContent = (mathText: string) => {
      // Remove any remaining backslashes that weren't cleaned or used for spacing
      const clean = mathText.replace(/\\/g, '');
      
      // Split by subscripts and superscripts
      // Captures: _{...}, _c, ^{...}, ^c
      const parts = clean.split(/(_\{[^}]+\}|_[a-zA-Z0-9]|\^\{[^}]+\}|\^[a-zA-Z0-9])/g);

      return (
          <>
            {parts.map((part, i) => {
                if (part.startsWith('_')) {
                    const inner = part.startsWith('_{') ? part.slice(2, -1) : part.slice(1);
                    return <sub key={i} className="text-[0.7em] leading-none ml-[1px]" style={{ verticalAlign: 'sub' }}>{inner}</sub>;
                }
                if (part.startsWith('^')) {
                    const inner = part.startsWith('^{') ? part.slice(2, -1) : part.slice(1);
                    return <sup key={i} className="text-[0.7em] leading-none ml-[1px]" style={{ verticalAlign: 'super' }}>{inner}</sup>;
                }
                return <span key={i}>{part}</span>;
            })}
          </>
      );
  };

  // Parse Inline Formatting: Bold, Code, Math, Tooltips
  const parseInline = (text: string) => {
      // Pre-clean LaTeX symbols
      const cleanedText = cleanLatex(text);

      // We use a regex to split the string into tokens.
      // Patterns:
      // 1. Tooltip: ^^term^^{explanation}
      // 2. Bold: **text**
      // 3. Code: `text`
      // 4. Math: $text$
      
      const regex = /(\^\^.+?\^\^\{.+?\}|\*\*.*?\*\*|`.*?`|\$.*?\$)/g;
      const parts = cleanedText.split(regex);

      return parts.map((part, index) => {
        // Tooltip: ^^term^^{explanation}
        if (part.startsWith('^^') && part.includes('^{')) {
            const match = part.match(/\^\^(.+?)\^\^\{(.+?)\}/);
            if (match) {
                return <SmartTooltip key={index} term={match[1]} explanation={match[2]} />;
            }
        }

        // Bold
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={index} className="font-black text-inherit">
              {part.slice(2, -2)}
            </strong>
          );
        }

        // Code
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

        // Math ($O(n)$)
        if (part.startsWith('$') && part.endsWith('$')) {
            return (
                <span key={index} className="font-serif italic text-purple-700 dark:text-purple-400 px-1 font-bold inline-flex items-baseline">
                    {renderMathContent(part.slice(1, -1))}
                </span>
            );
        }

        return <span key={index}>{part}</span>;
      });
  };

  const renderLine = (line: string, key: number) => {
      // Header
      if (line.startsWith('### ')) return <h4 key={key} className="text-sm font-bold mt-3 mb-1 text-inherit">{line.replace('### ', '')}</h4>;
      if (line.startsWith('## ')) return <h3 key={key} className="text-base font-bold mt-4 mb-2 text-inherit">{line.replace('## ', '')}</h3>;
      
      // List item
      if (line.trim().startsWith('- ')) {
          return (
            <li key={key} className="ml-4 list-disc pl-1 text-inherit marker:text-gray-400">
                {parseInline(line.trim().substring(2))}
            </li>
          );
      }

      // Normal paragraph
      if (!line.trim()) return <div key={key} className="h-2" />; // Spacer
      
      return <div key={key} className="min-h-[20px] text-inherit">{parseInline(line)}</div>;
  };

  // Default color only if no className overrides
  const defaultColors = className.includes('text-') ? '' : 'text-gray-700 dark:text-gray-300';

  return (
    <div className={`leading-relaxed space-y-1 ${defaultColors} ${className}`}>
      {textString.split('\n').map((line, i) => renderLine(line, i))}
    </div>
  );
};
