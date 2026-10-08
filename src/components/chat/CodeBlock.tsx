import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Clipboard } from 'react-native';
import type { CodeBlock as CodeBlockType } from '../../types';

interface CodeBlockProps {
  block: CodeBlockType;
  onRun?: (code: string, language: string) => Promise<string>;
}

const LANGUAGE_COLORS: Record<string, string> = {
  javascript: '#f7df1e',
  typescript: '#3178c6',
  python: '#3776ab',
  html: '#e34c26',
  css: '#264de4',
  json: '#888',
  bash: '#89e051',
  go: '#00add8',
  rust: '#dea584',
};

export function CodeBlockComponent({ block, onRun }: CodeBlockProps) {
  const [output, setOutput] = useState(block.output);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = async () => {
    if (!onRun || isRunning) return;
    setIsRunning(true);
    setOutput(undefined);
    try {
      const result = await onRun(block.code, block.language);
      setOutput(result);
    } catch (err: any) {
      setOutput(`Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const color = LANGUAGE_COLORS[block.language] || '#888';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.languageBadge, { backgroundColor: color + '20' }]}>
          <Text style={[styles.languageText, { color }]}>{block.language}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleRun} disabled={isRunning}>
            <Text style={styles.runButton}>{isRunning ? 'Running...' : 'Run'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Clipboard.setString(block.code)}>
            <Text style={styles.copyButton}>Copy</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.codeContainer}>
        <Text style={styles.codeText}>{block.code}</Text>
      </View>

      {output !== undefined && (
        <View style={[styles.outputContainer, output.startsWith('Error:') && styles.errorOutput]}>
          <Text style={styles.outputText}>{output}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1e1e1e',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#2d2d2d',
  },
  languageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  languageText: { fontSize: 12, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12 },
  runButton: { color: '#4CAF50', fontWeight: '600', fontSize: 13 },
  copyButton: { color: '#888', fontSize: 13 },
  codeContainer: { padding: 12 },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#d4d4d4',
    lineHeight: 20,
  },
  outputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    padding: 12,
    backgroundColor: '#1a1a1a',
  },
  errorOutput: { backgroundColor: '#2a1a1a' },
  outputText: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#ccc',
    lineHeight: 18,
  },
});
