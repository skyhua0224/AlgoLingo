
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
    | 'arch-canvas';

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
      initialOutput?: string; // Welcome message or context
      command: string; // The expected user command (regex supported)
      feedback: string; // Output to show on success
      hint?: string; // Placeholder or suggestion
      allowedCommands?: string[]; // For auto-complete simulation
  };

  codeWalkthrough?: {
      code: string;
      language: string;
      steps: {
          lines: number[]; // [start, end] or [line]
          content: string; // Explanation bubble text
      }[];
  };

  miniEditor?: {
      language: string;
      startingCode: string; // Scaffold
      solutionSnippet: string; // For static validation check
      validationRegex?: string; // To check specific keywords
      taskDescription: string;
  };

  archCanvas?: {
      goal: string; // "Design a Twitter Feed"
      initialComponents?: string[]; // Pre-placed components
      requiredComponents: string[]; // e.g. ["LB", "Redis", "DB"]
      requiredConnections?: { from: string, to: string }[]; // Basic topology check
  };
}
