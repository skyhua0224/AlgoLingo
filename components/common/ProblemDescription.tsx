
import React from 'react';
import { LeetCodeContext } from '../../types';
import { MarkdownText } from './MarkdownText';
import { BookOpen } from 'lucide-react';

interface ProblemDescriptionProps {
    context: LeetCodeContext;
}

export const ProblemDescription: React.FC<ProblemDescriptionProps> = ({ context }) => {
    const { meta, problem } = context;

    const difficultyColor = {
        'Easy': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        'Medium': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        'Hard': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    };

    return (
        <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">{meta.title}</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${difficultyColor[meta.difficulty]}`}>
                        {meta.difficulty}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
                {/* Description */}
                <div className="prose dark:prose-invert prose-sm max-w-none text-gray-700 dark:text-gray-300 leading-relaxed">
                    <MarkdownText content={problem.description} />
                </div>

                {/* Examples */}
                {problem.examples.length > 0 && (
                    <div className="space-y-4">
                        {problem.examples.map((ex, idx) => (
                            <div key={idx} className="bg-gray-50 dark:bg-black/30 rounded-xl p-4 border border-gray-200 dark:border-gray-800 font-mono text-sm">
                                <div className="mb-2">
                                    <span className="font-bold text-gray-900 dark:text-white">Input:</span> <span className="text-gray-600 dark:text-gray-400">{ex.input}</span>
                                </div>
                                <div className="mb-2">
                                    <span className="font-bold text-gray-900 dark:text-white">Output:</span> <span className="text-gray-600 dark:text-gray-400">{ex.output}</span>
                                </div>
                                {ex.explanation && (
                                    <div>
                                        <span className="font-bold text-gray-900 dark:text-white">Explanation:</span> <span className="text-gray-500 dark:text-gray-500">{ex.explanation}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Constraints */}
                {problem.constraints.length > 0 && (
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Constraints</h4>
                        <ul className="list-disc pl-5 space-y-1">
                            {problem.constraints.map((c, i) => (
                                <li key={i} className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded w-fit mb-1">
                                    {c}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};
