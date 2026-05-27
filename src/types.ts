export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export type Theme = 'light' | 'dark';
export type PageMode = 'fenghechat' | 'flagship';

export interface Session {
  id: string;
  title: string;
  updatedAt: number;
  messages: Message[];
}
