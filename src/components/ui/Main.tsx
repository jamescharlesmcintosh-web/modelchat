import React, { useState } from 'react';
import { Alert, View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useStore } from '../../store';
import { Button } from './Button';
import { MessageBubble } from '../chat/MessageBubble';
import { ModelPicker } from '../models/ModelPicker';
import { ComparisonView } from '../chat/ComparisonView';
import { ConversationSidebar } from './ConversationSidebar';
import { generateId } from '../../utils/id';
import { streamMultiModelChat } from '../../services/multiModel';
import { ImageGenPanel } from '../models/ImageGenPanel';
import { ImagePanel } from '../chat/ImagePanel';
import { VoiceChat } from './VoiceChat';
import { runCode } from '../../services/runner';
import type { ConversationMode } from '../../types';

export function Main() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
const [showImageGen, setShowImageGen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const {
    conversations,
    activeConversationId,
    addConversation,
    addMessage,
    updateMessage,
    models,
    settings,
    setMode,
    comparisonMode,
    comparingModelIds,
    setComparisonMode,
    showImagePanel: storeShowImagePanel,
    setShowImagePanel,
  } = useStore();

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const currentMode = activeConversation?.mode || settings.defaultMode;
  const activeModelIds = activeConversation?.modelIds ?? models.map((m) => m.id);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: generateId(),
      role: 'user' as const,
      content: input.trim(),
      timestamp: Date.now(),
    };

    let convId = activeConversationId;
    if (!convId) {
      const newConv = {
        id: generateId(),
        title: input.trim().slice(0, 30),
        messages: [],
        modelIds: activeModelIds,
        mode: settings.defaultMode,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      addConversation(newConv);
      convId = newConv.id;
    }

    addMessage(convId, userMessage);
    setInput('');
    setIsLoading(true);

    const activeModels = models.filter((m) => activeModelIds.includes(m.id));

    if (comparisonMode && activeModels.length > 1) {
      // Multi-model comparison mode
      const messageId = generateId();
      addMessage(convId, {
        id: messageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
      });

      try {
        let comparisonContents: Record<string, string> = {};
        await streamMultiModelChat(
          activeModels,
          activeConversation?.messages ?? [],
          settings,
          (modelId, text) => {
            comparisonContents[modelId] = text;
            const combined = Object.values(comparisonContents).join('\n\n---\n\n');
            updateMessage(convId!, messageId, { content: combined });
          }
        );
        updateMessage(convId!, messageId, { isStreaming: false });
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Something went wrong');
        updateMessage(convId!, messageId, {
          content: 'Failed to generate response',
          isStreaming: false,
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      // Single model mode
      const model = activeModels[0];
      if (!model) {
        setIsLoading(false);
        return;
      }

      const messageId = generateId();
      addMessage(convId, {
        id: messageId,
        role: 'assistant',
        content: '',
        modelId: model.id,
        timestamp: Date.now(),
        isStreaming: true,
      });

      try {
        let fullContent = '';
        const onChunk = (text: string) => {
          fullContent += text;
          updateMessage(convId!, messageId, { content: fullContent });
        };

        if (model.source === 'ollama') {
          const { streamOllamaChat } = await import('../../services/ollama');
          await streamOllamaChat(settings.ollama.baseUrl, model.name, activeConversation?.messages ?? [], onChunk);
        } else {
          const cloud = settings.clouds.find((c) => c.provider === model.source);
          if (!cloud) throw new Error('No API key');
          const { streamCloudChat } = await import('../../services/cloud');
          await streamCloudChat(model.source, cloud.apiKey, model.name, activeConversation?.messages ?? [], onChunk);
        }

        updateMessage(convId!, messageId, { isStreaming: false });
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Something went wrong');
        updateMessage(convId!, messageId, {
          content: 'Failed to generate response',
          isStreaming: false,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRunCode = async (code: string, language: string): Promise<string> => {
    return runCode(code, language);
  };

  const toggleMode = () => {
    if (!activeConversationId) return;
    const newMode: ConversationMode = currentMode === 'chat' ? 'coding' : 'chat';
    setMode(activeConversationId, newMode);
  };

  const toggleComparison = () => {
    if (comparisonMode) {
      setComparisonMode(false);
    } else {
      setComparisonMode(true, activeModelIds);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => setShowSidebar(true)}>
            <Text style={styles.menuButton}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ModelChat</Text>
          <TouchableOpacity style={[styles.modeToggle, currentMode === 'coding' && styles.modeActive]} onPress={toggleMode}>
            <Text style={[styles.modeText, currentMode === 'coding' && styles.modeTextActive]}>
              {currentMode === 'chat' ? 'Chat' : 'Coding'}
            </Text>
          </TouchableOpacity>
          {activeModelIds.length > 1 && (
            <TouchableOpacity style={[styles.modeToggle, comparisonMode && styles.comparisonActive]} onPress={toggleComparison}>
              <Text style={[styles.modeText, comparisonMode && styles.modeTextActive]}>
                Compare
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.modeToggle, showImageGen && styles.imageGenActive]} onPress={() => setShowImageGen(!showImageGen)}>
            <Text style={[styles.modeText, showImageGen && styles.modeTextActive]}>
              Image
            </Text>
          </TouchableOpacity>
        </View>
        <ModelPicker />
      </View>

      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {showImageGen ? (
          <ImageGenPanel models={models} onImageGenerated={(data, prompt) => {
            if (!activeConversationId) {
              const newConv = {
                id: generateId(),
                title: `Image: ${prompt.slice(0, 30)}`,
                messages: [],
                modelIds: activeModelIds,
                mode: 'chat' as const,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              };
              addConversation(newConv);
            }
          }} />
        ) : comparisonMode && activeModelIds.length > 1 ? (
          <ComparisonView
            conversationId={activeConversationId!}
            messages={activeConversation?.messages ?? []}
            modelIds={activeModelIds}
            allModels={models}
          />
        ) : (
          <FlatList
            data={activeConversation?.messages ?? []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MessageBubble message={item} onRunCode={handleRunCode} />}
            contentContainerStyle={styles.messages}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Start a conversation</Text>
              </View>
            }
          />
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={comparisonMode ? 'Ask all models...' : currentMode === 'coding' ? 'Ask for code...' : 'Message...'}
            multiline
            onSubmitEditing={handleSend}
          />
          <VoiceChat
            models={models}
            settings={settings}
            onMessage={(text) => { setInput(text); handleSend(); }}
          />
          <Button title="Send" onPress={handleSend} loading={isLoading} />
          <TouchableOpacity style={styles.imagePanelButton} onPress={() => setShowImagePanel(true)}>
            <Text style={styles.imagePanelButtonText}>🖼</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {activeConversationId && (
        <ImagePanel
          conversationId={activeConversationId}
          visible={storeShowImagePanel}
          onClose={() => setShowImagePanel(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  menuButton: { padding: 4 },
  modeToggle: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
  },
  comparisonActive: { backgroundColor: '#34C759' },
  imageGenActive: { backgroundColor: '#FF9500' },
  modeActive: { backgroundColor: '#007AFF' },
  modeText: { fontSize: 13, fontWeight: '600', color: '#007AFF' },
  modeTextActive: { color: '#fff' },
  content: { flex: 1 },
  messages: { padding: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { color: '#8E8E93', fontSize: 16 },
  inputBar: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  imagePanelButton: {
    padding: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
  },
  imagePanelButtonText: { fontSize: 18 },
});