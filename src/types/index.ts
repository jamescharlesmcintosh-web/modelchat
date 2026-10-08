export type ModelSource = 'ollama' | 'openrouter' | 'together' | 'groq';

export type ModelCapability = 'chat' | 'coding' | 'image' | 'reasoning';

export interface Model {
  id: string;
  name: string;
  source: ModelSource;
  capabilities: ModelCapability[];
  contextWindow: number;
  isFree: boolean;
  description?: string;
}

export interface CodeBlock {
  language: string;
  code: string;
  output?: string;
  isError?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  modelId?: string;
  timestamp: number;
  codeBlocks?: CodeBlock[];
  imageUrl?: string;
  isStreaming?: boolean;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  type: 'image' | 'file';
  url: string;
  name: string;
}

export type ConversationMode = 'chat' | 'coding';

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  modelIds: string[];
  mode: ConversationMode;
  folderId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

export interface OllamaConfig {
  baseUrl: string;
}

export interface CloudConfig {
  provider: 'openrouter' | 'together' | 'groq';
  apiKey: string;
}

export interface AppSettings {
  ollama: OllamaConfig;
  clouds: CloudConfig[];
  theme: 'light' | 'dark' | 'system';
  defaultMode: ConversationMode;
}

export interface PresetModel {
  id: string;
  name: string;
  category: 'chat' | 'coding' | 'image' | 'reasoning';
  source: ModelSource;
  modelId: string;
  isFree: boolean;
  contextWindow: number;
  description: string;
}
