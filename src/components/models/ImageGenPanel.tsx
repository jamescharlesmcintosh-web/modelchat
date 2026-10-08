import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import type { Model } from '../../types';
import { generateImage } from '../../services/imageGen';

interface ImageGenPanelProps {
  models: Model[];
  onImageGenerated?: (imageData: string, prompt: string) => void;
}

export function ImageGenPanel({ models, onImageGenerated }: ImageGenPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<'idle' | 'generating' | 'complete' | 'error'>('idle');
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  const imageModels = models.filter((m) => m.capabilities.includes('image'));

  const handleGenerate = async () => {
    if (!prompt.trim() || status === 'generating') return;

    const model = selectedModel ?? imageModels[0];
    if (!model) {
      setStatus('error');
      return;
    }

    setStatus('generating');
    try {
      const result = await generateImage(model, prompt, (s) => setStatus(s as any));
      onImageGenerated?.(result, prompt);
      setStatus('complete');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      setStatus('error');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Image Generation</Text>

      <TextInput
        style={styles.input}
        value={prompt}
        onChangeText={setPrompt}
        placeholder="Describe the image you want..."
        multiline
      />

      {imageModels.length > 1 && (
        <View style={styles.modelPicker}>
          {imageModels.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[
                styles.modelChip,
                selectedModel?.id === m.id && styles.modelChipActive,
              ]}
              onPress={() => setSelectedModel(m)}
            >
              <Text style={styles.modelChipText}>{m.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.generateButton, status === 'generating' && styles.generateDisabled]}
        onPress={handleGenerate}
        disabled={status === 'generating'}
      >
        {status === 'generating' ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.generateButtonText}>Generate</Text>
        )}
      </TouchableOpacity>

      {status === 'error' && (
        <Text style={styles.errorText}>Failed to generate image</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f9f9f9', borderRadius: 8, margin: 16 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  modelPicker: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  modelChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
  },
  modelChipActive: { backgroundColor: '#007AFF' },
  modelChipText: { fontSize: 12, fontWeight: '600' },
  generateButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  generateDisabled: { opacity: 0.5 },
  generateButtonText: { color: '#fff', fontWeight: '600' },
  errorText: { color: '#FF3B30', marginTop: 8, textAlign: 'center' },
});
