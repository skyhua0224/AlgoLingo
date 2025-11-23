
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
    | 'callout';

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
}
    