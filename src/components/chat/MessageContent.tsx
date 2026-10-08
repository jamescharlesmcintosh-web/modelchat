import React from 'react';
import { Text, StyleSheet } from 'react-native';
import type { Message } from '../../types';
import { CodeBlockComponent } from './CodeBlock';

interface MessageContentProps {
  message: Message;
  onRunCode?: (code: string, language: string) => Promise<string>;
}

function parseCodeBlocks(text: string): { type: 'text' | 'code'; content: string; language?: string }[] {
  const blocks: { type: 'text' | 'code'; content: string; language?: string }[] = [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    blocks.push({
      type: 'code',
      content: match[2].trim(),
      language: match[1] || 'text',
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    blocks.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return blocks;
}

export function MessageContent({ message, onRunCode }: MessageContentProps) {
  const blocks = parseCodeBlocks(message.content);

  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === 'code') {
          return (
            <CodeBlockComponent
              key={i}
              block={{ language: block.language || 'text', code: block.content }}
              onRun={onRunCode}
            />
          );
        }
        return (
          <Text key={i} style={styles.text}>
            {block.content}
          </Text>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 16, lineHeight: 22 },
});
