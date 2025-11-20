
import React, { useState } from 'react';
import { GameContent } from '../../types';
import { Button } from '../Button';
import { Lightbulb, Server, Terminal, CheckCircle2, XCircle } from 'lucide-react';

interface TheoryGameProps {
  content: GameContent;
  onComplete: () => void;
}

export const TheoryGame: React.FC<TheoryGameProps> = ({ content, onComplete }) => {
  const [step, setStep] = useState<'theory' | 'quiz' | 'result'>('theory');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleSubmitQuiz = () => {
    if (selectedOption === null || !content.quiz) return;
    
    const correct = selectedOption === content.quiz.correctIndex;
    setIsCorrect(correct);
    setStep('result');
    
    if (correct) {
        setTimeout(() => {
            onComplete();
        }, 2000);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Indicator */}
      <div className="flex justify-center mb-8">
        <div className={`h-2 w-12 rounded-full mx-1 ${step === 'theory' ? 'bg-brand' : 'bg-brand/30'}`} />
        <div className={`h-2 w-12 rounded-full mx-1 ${step !== 'theory' ? 'bg-brand' : 'bg-gray-200'}`} />
      </div>

      {step === 'theory' && content.theory && (
        <div className="animate-fade-in-up">
            <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">
                {content.levelTitle}
            </h2>
            
            {/* Analogy Card */}
            <div className="bg-white rounded-2xl shadow-xl border-b-4 border-gray-200 overflow-hidden mb-6">
                <div className="bg-blue-50 p-6 border-b border-blue-100">
                    <div className="flex items-center gap-3 mb-3">
                         <div className="p-2 bg-blue-500 rounded-lg text-white shadow-sm">
                            {content.levelType === 'syntax' ? <Terminal size={24} /> : <Server size={24} />}
                         </div>
                         <h3 className="font-bold text-blue-900 text-lg uppercase tracking-wide">
                            {content.theory.analogy}
                         </h3>
                    </div>
                    <p className="text-blue-800 font-medium leading-relaxed">
                        {content.theory.concept}
                    </p>
                </div>
                
                <div className="p-8">
                    <p className="text-gray-600 text-lg leading-8 whitespace-pre-wrap">
                        {content.theory.explanation}
                    </p>
                </div>
            </div>

            <Button variant="primary" className="w-full py-4 text-lg shadow-xl" onClick={() => setStep('quiz')}>
                进入测试
            </Button>
        </div>
      )}

      {(step === 'quiz' || step === 'result') && content.quiz && (
        <div className="animate-fade-in-up">
             <div className="bg-white rounded-2xl shadow-xl border-b-4 border-gray-200 p-8 mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6">
                    {content.quiz.question}
                </h3>
                
                <div className="space-y-3">
                    {content.quiz.options.map((option, idx) => {
                        let btnClass = "w-full text-left p-4 rounded-xl border-2 border-gray-100 hover:border-brand hover:bg-brand-bg transition-all";
                        
                        if (step === 'result') {
                            if (idx === content.quiz?.correctIndex) btnClass = "w-full text-left p-4 rounded-xl border-2 border-green-500 bg-green-50 text-green-700";
                            else if (idx === selectedOption && !isCorrect) btnClass = "w-full text-left p-4 rounded-xl border-2 border-red-500 bg-red-50 text-red-700";
                            else btnClass = "w-full text-left p-4 rounded-xl border-2 border-gray-100 opacity-50";
                        } else if (selectedOption === idx) {
                            btnClass = "w-full text-left p-4 rounded-xl border-2 border-brand bg-brand-bg text-brand-dark shadow-sm";
                        }

                        return (
                            <button 
                                key={idx}
                                onClick={() => step === 'quiz' && setSelectedOption(idx)}
                                className={btnClass}
                                disabled={step === 'result'}
                            >
                                <div className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold border ${
                                        selectedOption === idx || (step === 'result' && idx === content.quiz?.correctIndex) 
                                        ? 'border-transparent bg-brand text-white' 
                                        : 'border-gray-300 text-gray-400'
                                    }`}>
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    {option}
                                </div>
                            </button>
                        );
                    })}
                </div>
             </div>

             {step === 'quiz' && (
                <Button 
                    variant="primary" 
                    className="w-full py-4 text-lg" 
                    disabled={selectedOption === null}
                    onClick={handleSubmitQuiz}
                >
                    提交答案
                </Button>
             )}

             {step === 'result' && (
                 <div className={`text-center p-4 rounded-xl mb-4 animate-bounce-in ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {isCorrect ? (
                        <div className="flex flex-col items-center">
                            <CheckCircle2 size={48} className="mb-2" />
                            <span className="font-bold text-lg">正确! +10 XP</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <XCircle size={48} className="mb-2" />
                            <span className="font-bold text-lg">再试一次...</span>
                            <Button variant="secondary" size="sm" className="mt-2" onClick={() => { setStep('quiz'); setSelectedOption(null); }}>重试</Button>
                        </div>
                    )}
                 </div>
             )}
        </div>
      )}
    </div>
  );
};
