import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import type { Message } from '../../types';
import { MessageContent } from './MessageContent';

interface MessageBubbleProps {
  message: Message;
  onRunCode?: (code: string, language: string) => Promise<string>;
}

export function MessageBubble({ message, onRunCode }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {message.imageUrl && (
          <Image source={{ uri: message.imageUrl }} style={styles.image} />
        )}
        <MessageContent message={message} onRunCode={onRunCode} />
        {message.isStreaming && <Text style={styles.cursor}>|</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 4 },
  userContainer: { alignItems: 'flex-end' },
  assistantContainer: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: { backgroundColor: '#007AFF', borderBottomRightRadius: 4 },
  assistantBubble: { backgroundColor: '#E5E5EA', borderBottomLeftRadius: 4 },
  image: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  text: { fontSize: 16, lineHeight: 22 },
  userText: { color: '#fff' },
  assistantText: { color: '#000' },
  cursor: { color: '#8E8E93', fontWeight: 'bold' },
});