
export type WidgetType = 
    | 'dialogue' 
    | 'flipcard' 
    | 'quiz' 
    | 'code' 
    | 'interactive-code'
    | 'comparison-code' // NEW
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

  // NEW: Comparison Code Widget
  comparisonCode?: {
      left: {
          title: string;
          language: string;
          lines: { code: string; explanation: string }[];
      };
      right: {
          title: string;
          language: string;
          lines: { code: string; explanation: string }[];
      };
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

  terminal?: {
      initialOutput?: string; 
      command: string; // Regex or exact string to match
      feedback: string; // Output on success
      hint?: string; 
      allowedCommands?: string[]; 
  };

  codeWalkthrough?: {
      code: string;
      language: string;
      steps: {
          lines: number[]; // 1-based line numbers to highlight
          content: string; // Markdown explanation
      }[];
  };

  miniEditor?: {
      language: string;
      startingCode: string; 
      solutionSnippet: string; // For AI validation reference
      validationRegex?: string; // Simple regex check
      taskDescription: string;
  };

  archCanvas?: {
      goal: string; 
      initialComponents?: string[]; 
      requiredComponents: string[]; 
      requiredConnections?: { from: string, to: string }[]; 
  };
  
  mermaid?: {
      chart: string; // Raw mermaid syntax
      graphData?: any; // Structured data
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
