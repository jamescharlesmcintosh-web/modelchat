import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import type { Message } from '../../types';
import { MessageContent } from './MessageContent';

interface ComparisonViewProps {
  conversationId: string;
  messages: Message[];
  modelIds: string[];
  allModels: { id: string; name: string; source: string }[];
}

export function ComparisonView({ conversationId, messages, modelIds, allModels }: ComparisonViewProps) {
  const assistantMessages = messages.filter((m) => m.role === 'assistant');
  const lastAssistantMessages = assistantMessages.slice(-1);

  if (lastAssistantMessages.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Send a message to compare models</Text>
      </View>
    );
  }

  const lastMessage = lastAssistantMessages[0];
  const responses = lastMessage.content.split('\n\n---\n\n');

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {modelIds.map((modelId, index) => {
        const model = allModels.find((m) => m.id === modelId);
        const response = responses[index] || '';

        return (
          <View key={modelId} style={styles.column}>
            <View style={styles.modelHeader}>
              <Text style={styles.modelName}>{model?.name ?? modelId}</Text>
              <Text style={styles.modelSource}>{model?.source ?? ''}</Text>
            </View>
            <ScrollView style={styles.columnContent}>
              {response ? (
                <Text style={styles.responseText}>{response}</Text>
              ) : (
                <View style={styles.loading}>
                  <Text style={styles.loadingText}>Waiting...</Text>
                </View>
              )}
            </ScrollView>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row' },
  column: {
    width: 300,
    marginHorizontal: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  modelHeader: {
    padding: 12,
    backgroundColor: '#e0e0e0',
    borderBottomWidth: 1,
    borderBottomColor: '#d0d0d0',
  },
  modelName: { fontSize: 14, fontWeight: '700' },
  modelSource: { fontSize: 12, color: '#666', textTransform: 'capitalize' },
  columnContent: { flex: 1, padding: 8 },
  loading: { padding: 16, alignItems: 'center' },
  loadingText: { color: '#888' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { color: '#8E8E93', fontSize: 16 },
  responseText: { fontSize: 14, lineHeight: 20, color: '#333' },
});