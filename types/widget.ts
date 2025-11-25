
export type WidgetType = 
    | 'dialogue' 
    | 'flipcard' 
    | 'quiz' 
    | 'code' 
    | 'interactive-code'
    | 'parsons'
    | 'fill-in'
    | 'leetcode' 
    | 'steps-list'
    | 'callout'
    | 'terminal'
    | 'code-walkthrough'
    | 'mini-editor'
    | 'arch-canvas'
    | 'mermaid'
    | 'visual-quiz'
    | 'comparison-table';

export interface Widget {
  id: string;
  type: WidgetType;
  
  dialogue?: {
    text: string;
    speaker: 'coach' | 'user';
    emotion?: 'neutral' | 'happy' | 'thinking' | 'excited';
  };
  
  flipcard?: {
    front: string;
    back: string;
    hint?: string;
    mode?: 'learn' | 'assessment'; 
    model3d?: string;
  };
  
  quiz?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  
  code?: {
    content: string;
    language: string;
    caption?: string;
  };

  interactiveCode?: {
      language: string;
      lines: {
          code: string;
          explanation: string;
      }[];
      caption?: string;
  };

  parsons?: {
      lines: string[]; 
      explanation?: string;
      indentation?: boolean;
  };

  stepsList?: {
      items: string[]; 
      mode: 'static' | 'interactive'; 
      correctOrder?: string[]; 
  };

  fillIn?: {
      code: string; 
      options?: string[]; 
      correctValues: string[]; 
      explanation?: string;
      inputMode?: 'select' | 'type'; 
  };

  leetcode?: {
      problemSlug: string;
      concept: { front: string; back: string };
      exampleCode: {
          language: string;
          lines: {
              code: string;
              explanation: string;
          }[];
          caption?: string;
      };
  };

  callout?: {
    title: string;
    text: string;
    variant: 'info' | 'warning' | 'success' | 'tip';
  };

  // --- NEW ENGINEERING WIDGETS ---

  terminal?: {
      initialOutput?: string; 
      command: string; 
      feedback: string; 
      hint?: string; 
      allowedCommands?: string[]; 
  };

  codeWalkthrough?: {
      code: string;
      language: string;
      steps: {
          lines: number[]; 
          content: string; 
      }[];
  };

  miniEditor?: {
      language: string;
      startingCode: string; 
      solutionSnippet: string; 
      validationRegex?: string; 
      taskDescription: string;
  };

  archCanvas?: {
      goal: string; 
      initialComponents?: string[]; 
      requiredComponents: string[]; 
      requiredConnections?: { from: string, to: string }[]; 
  };

  // --- FORGE WIDGETS ---
  
  mermaid?: {
      chart: string; // Raw mermaid syntax
      caption?: string;
  };

  visualQuiz?: {
      question: string;
      options: {
          id: string;
          label: string;
          imageUrl?: string; 
          icon?: string; 
      }[];
      correctId: string;
      explanation: string;
  };

  comparisonTable?: {
      headers: string[]; 
      rows: {
          label: string;
          values: string[];
      }[];
  };
}
