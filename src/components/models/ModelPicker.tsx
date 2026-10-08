import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { useStore } from '../../store';
import { PRESET_MODELS } from '../../services/presets';

export function ModelPicker() {
  const [visible, setVisible] = useState(false);
  const { models, setModels } = useStore();

  const handleAddPreset = (preset: typeof PRESET_MODELS[0]) => {
    if (models.find((m) => m.id === `${preset.source}:${preset.modelId}`)) return;
    const model = {
      id: `${preset.source}:${preset.modelId}`,
      name: preset.name,
      source: preset.source,
      capabilities: [preset.category],
      contextWindow: preset.contextWindow,
      isFree: preset.isFree,
      description: preset.description,
    };
    setModels([...models, model]);
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} style={styles.button}>
        <Text style={styles.buttonText}>
          {models.length} model{models.length !== 1 ? 's' : ''}
        </Text>
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Model</Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Text style={styles.close}>Close</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={PRESET_MODELS}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => handleAddPreset(item)}
              >
                <View>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDesc}>{item.description}</Text>
                </View>
                <Text style={styles.itemSource}>{item.source}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 16,
  },
  buttonText: { fontSize: 14, fontWeight: '600' },
  modal: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: { fontSize: 20, fontWeight: '700' },
  close: { color: '#007AFF', fontSize: 16 },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  itemName: { fontSize: 16, fontWeight: '600' },
  itemDesc: { fontSize: 14, color: '#8E8E93', marginTop: 2 },
  itemSource: { fontSize: 12, color: '#007AFF', textTransform: 'capitalize' },
});
