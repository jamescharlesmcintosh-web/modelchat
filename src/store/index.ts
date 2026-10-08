import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import type { Conversation, Message, Model, AppSettings, ConversationMode, Folder } from '../types';

const storage = createMMKV();

interface AppState {
  conversations: Conversation[];
  activeConversationId: string | null;
  models: Model[];
  settings: AppSettings;
  isSidebarOpen: boolean;
  comparisonMode: boolean;
  comparingModelIds: string[];
  folders: Folder[];
  activeFolderId: string | null;
  showImagePanel: boolean;

  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string | null) => void;

  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;

  setModels: (models: Model[]) => void;
  addModel: (model: Model) => void;
  removeModel: (id: string) => void;

  updateSettings: (settings: Partial<AppSettings>) => void;
  toggleSidebar: () => void;
  setMode: (conversationId: string, mode: ConversationMode) => void;

  setComparisonMode: (enabled: boolean, modelIds?: string[]) => void;
  toggleComparingModel: (modelId: string) => void;

  setFolders: (folders: Folder[]) => void;
  addFolder: (folder: Folder) => void;
  deleteFolder: (id: string) => void;
  setActiveFolder: (id: string | null) => void;

  setShowImagePanel: (visible: boolean) => void;
}

const defaultSettings: AppSettings = {
  ollama: { baseUrl: 'http://localhost:11434' },
  clouds: [],
  theme: 'system',
  defaultMode: 'chat',
};

const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  const value = storage.getString(key);
  if (value) {
    try {
      return JSON.parse(value);
    } catch {
      return defaultValue;
    }
  }
  return defaultValue;
};

const saveToStorage = (key: string, value: unknown) => {
  storage.set(key, JSON.stringify(value));
};

export const useStore = create<AppState>((set, get) => ({
  conversations: loadFromStorage<Conversation[]>('conversations', []),
  activeConversationId: loadFromStorage<string | null>('activeConversationId', null),
  models: loadFromStorage<Model[]>('models', []),
  settings: loadFromStorage<AppSettings>('settings', defaultSettings),
  isSidebarOpen: false,
  comparisonMode: false,
  comparingModelIds: [],
  folders: loadFromStorage<Folder[]>('folders', []),
  activeFolderId: loadFromStorage<string | null>('activeFolderId', null),
  showImagePanel: false,

  setConversations: (conversations) => {
    saveToStorage('conversations', conversations);
    set({ conversations });
  },

  addConversation: (conversation) => {
    const conversations = [...get().conversations, conversation];
    saveToStorage('conversations', conversations);
    set({ conversations, activeConversationId: conversation.id });
  },

  updateConversation: (id, updates) => {
    const conversations = get().conversations.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );
    saveToStorage('conversations', conversations);
    set({ conversations });
  },

  deleteConversation: (id) => {
    const conversations = get().conversations.filter((c) => c.id !== id);
    saveToStorage('conversations', conversations);
    set({
      conversations,
      activeConversationId:
        get().activeConversationId === id ? null : get().activeConversationId,
    });
  },

  setActiveConversation: (id) => {
    saveToStorage('activeConversationId', id);
    set({ activeConversationId: id });
  },

  addMessage: (conversationId, message) => {
    const conversations = get().conversations.map((c) =>
      c.id === conversationId
        ? { ...c, messages: [...c.messages, message], updatedAt: Date.now() }
        : c
    );
    saveToStorage('conversations', conversations);
    set({ conversations });
  },

  updateMessage: (conversationId, messageId, updates) => {
    const conversations = get().conversations.map((c) =>
      c.id === conversationId
        ? {
            ...c,
            messages: c.messages.map((m) =>
              m.id === messageId ? { ...m, ...updates } : m
            ),
          }
        : c
    );
    saveToStorage('conversations', conversations);
    set({ conversations });
  },

  deleteMessage: (conversationId, messageId) => {
    const conversations = get().conversations.map((c) =>
      c.id === conversationId
        ? { ...c, messages: c.messages.filter((m) => m.id !== messageId) }
        : c
    );
    saveToStorage('conversations', conversations);
    set({ conversations });
  },

  setModels: (models) => {
    saveToStorage('models', models);
    set({ models });
  },

  addModel: (model) => {
    const models = [...get().models, model];
    saveToStorage('models', models);
    set({ models });
  },

  removeModel: (id) => {
    const models = get().models.filter((m) => m.id !== id);
    saveToStorage('models', models);
    set({ models });
  },

  updateSettings: (settings) => {
    const newSettings = { ...get().settings, ...settings };
    saveToStorage('settings', newSettings);
    set({ settings: newSettings });
  },

  toggleSidebar: () => set({ isSidebarOpen: !get().isSidebarOpen }),

  setMode: (conversationId, mode) => {
    get().updateConversation(conversationId, { mode });
  },

  setComparisonMode: (enabled, modelIds) => {
    set({
      comparisonMode: enabled,
      comparingModelIds: modelIds ?? [],
    });
  },

  toggleComparingModel: (modelId) => {
    const { comparingModelIds } = get();
    if (comparingModelIds.includes(modelId)) {
      set({ comparingModelIds: comparingModelIds.filter((id) => id !== modelId) });
    } else {
      set({ comparingModelIds: [...comparingModelIds, modelId] });
    }
  },

  setFolders: (folders) => {
    saveToStorage('folders', folders);
    set({ folders });
  },

  addFolder: (folder) => {
    const folders = [...get().folders, folder];
    saveToStorage('folders', folders);
    set({ folders });
  },

  deleteFolder: (id) => {
    const folders = get().folders.filter((f) => f.id !== id);
    saveToStorage('folders', folders);
    set({ folders });
  },

  setActiveFolder: (id) => {
    saveToStorage('activeFolderId', id);
    set({ activeFolderId: id });
  },

  setShowImagePanel: (visible) => set({ showImagePanel: visible }),
}));
