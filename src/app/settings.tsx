import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useStore } from '../store';
import { router } from 'expo-router';

export default function Settings() {
  const { settings, updateSettings } = useStore();
  const [ollamaUrl, setOllamaUrl] = useState(settings.ollama.baseUrl);
  const [apiKey, setApiKey] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<'openrouter' | 'together' | 'groq'>('openrouter');

  const handleSaveOllama = () => {
    updateSettings({ ollama: { baseUrl: ollamaUrl } });
  };

  const handleAddApiKey = () => {
    if (!apiKey.trim()) return;
    const clouds = settings.clouds.filter((c) => c.provider !== selectedProvider);
    clouds.push({ provider: selectedProvider, apiKey: apiKey.trim() });
    updateSettings({ clouds });
    setApiKey('');
  };

  const handleRemoveApiKey = (provider: string) => {
    updateSettings({ clouds: settings.clouds.filter((c) => c.provider !== provider) });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ollama (Local)</Text>
          <TextInput
            style={styles.input}
            value={ollamaUrl}
            onChangeText={setOllamaUrl}
            placeholder="http://localhost:11434"
          />
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveOllama}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cloud API Keys</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.providerButton, selectedProvider === 'openrouter' && styles.providerActive]}
              onPress={() => setSelectedProvider('openrouter')}
            >
              <Text>OpenRouter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.providerButton, selectedProvider === 'together' && styles.providerActive]}
              onPress={() => setSelectedProvider('together')}
            >
              <Text>Together</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.providerButton, selectedProvider === 'groq' && styles.providerActive]}
              onPress={() => setSelectedProvider('groq')}
            >
              <Text>Groq</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="API Key"
            secureTextEntry
          />
          <TouchableOpacity style={styles.saveButton} onPress={handleAddApiKey}>
            <Text style={styles.saveButtonText}>Add Key</Text>
          </TouchableOpacity>

          {settings.clouds.map((cloud) => (
            <View key={cloud.provider} style={styles.keyRow}>
              <Text style={styles.keyProvider}>{cloud.provider}</Text>
              <TouchableOpacity onPress={() => handleRemoveApiKey(cloud.provider)}>
                <Text style={styles.remove}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.row}>
            {(['light', 'dark', 'system'] as const).map((theme) => (
              <TouchableOpacity
                key={theme}
                style={[styles.providerButton, settings.theme === theme && styles.providerActive]}
                onPress={() => updateSettings({ theme })}
              >
                <Text style={styles.capitalize}>{theme}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
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
  content: { flex: 1, padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: '600' },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  providerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E5E5EA',
  },
  providerActive: { backgroundColor: '#007AFF' },
  capitalize: { textTransform: 'capitalize' },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  keyProvider: { textTransform: 'capitalize', fontWeight: '600' },
  remove: { color: '#FF3B30' },
});
