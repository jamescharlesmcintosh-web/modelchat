import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useStore } from '../store';
import { router } from 'expo-router';
import { fetchOllamaModels } from '../services/ollama';
import { fetchCloudModels } from '../services/cloud';
import { PRESET_MODELS } from '../services/presets';
import type { Model } from '../types';

export default function Models() {
  const { models, setModels, settings } = useStore();
  const [loading, setLoading] = useState(false);

  const handleFetchOllama = async () => {
    setLoading(true);
    const ollamaModels = await fetchOllamaModels(settings.ollama.baseUrl);
    const existingIds = new Set(models.map((m) => m.id));
    const newModels = ollamaModels.filter((m) => !existingIds.has(m.id));
    setModels([...models, ...newModels]);
    setLoading(false);
  };

  const handleFetchCloud = async () => {
    setLoading(true);
    const allNewModels: Model[] = [];
    const existingIds = new Set(models.map((m) => m.id));
    for (const cloud of settings.clouds) {
      const cloudModels = await fetchCloudModels(cloud.provider, cloud.apiKey);
      allNewModels.push(...cloudModels.filter((m) => !existingIds.has(m.id)));
    }
    setModels([...models, ...allNewModels]);
    setLoading(false);
  };

  const handleAddPreset = (preset: typeof PRESET_MODELS[0]) => {
    const model: Model = {
      id: `${preset.source}:${preset.modelId}`,
      name: preset.name,
      source: preset.source,
      capabilities: [preset.category],
      contextWindow: preset.contextWindow,
      isFree: preset.isFree,
      description: preset.description,
    };
    if (!models.find((m) => m.id === model.id)) {
      setModels([...models, model]);
    }
  };

  const handleRemoveModel = (id: string) => {
    setModels(models.filter((m) => m.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Models</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleFetchOllama} disabled={loading}>
          <Text style={styles.actionText}>Fetch Ollama</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleFetchCloud} disabled={loading}>
          <Text style={styles.actionText}>Fetch Cloud</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator style={{ margin: 16 }} />}

      <FlatList
        data={models}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.modelRow}>
            <View style={styles.modelInfo}>
              <Text style={styles.modelName}>{item.name}</Text>
              <Text style={styles.modelMeta}>
                {item.source} · {item.contextWindow.toLocaleString()} ctx
                {item.isFree ? ' · Free' : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleRemoveModel(item.id)}>
              <Text style={styles.remove}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No models added yet</Text>
          </View>
        }
      />

      <Text style={styles.sectionTitle}>Quick Add</Text>
      <FlatList
        data={PRESET_MODELS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.presetRow}
            onPress={() => handleAddPreset(item)}
          >
            <View>
              <Text style={styles.modelName}>{item.name}</Text>
              <Text style={styles.modelMeta}>{item.description}</Text>
            </View>
            <Text style={styles.add}>+</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  back: { color: '#007AFF', fontSize: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  actions: { flexDirection: 'row', padding: 16, gap: 8 },
  actionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionText: { color: '#fff', fontWeight: '600' },
  modelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modelInfo: { flex: 1 },
  modelName: { fontSize: 16, fontWeight: '600' },
  modelMeta: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  remove: { color: '#FF3B30' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#8E8E93' },
  sectionTitle: { fontSize: 16, fontWeight: '600', padding: 16, paddingBottom: 8 },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  add: { fontSize: 24, color: '#007AFF' },
});
