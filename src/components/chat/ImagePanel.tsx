import React from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { useStore } from '../../store';
import { router } from 'expo-router';

interface ImagePanelProps {
  conversationId: string;
  visible: boolean;
  onClose: () => void;
}

export function ImagePanel({ conversationId, visible, onClose }: ImagePanelProps) {
  const { conversations } = useStore();
  const conversation = conversations.find((c) => c.id === conversationId);

  const images = conversation?.messages.filter((m) => m.imageUrl) ?? [];

  if (!visible) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Images & Files</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.close}>✕</Text>
        </TouchableOpacity>
      </View>

      {images.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No images in this conversation</Text>
        </View>
      ) : (
        <FlatList
          data={images}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.imageRow}>
              <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
              <Text style={styles.imageName} numberOfLines={1}>{item.content.slice(0, 40)}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: { fontSize: 20, fontWeight: '700' },
  close: { fontSize: 18, color: '#8E8E93' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#8E8E93' },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    gap: 12,
  },
  thumbnail: { width: 48, height: 48, borderRadius: 4 },
  imageName: { flex: 1, fontSize: 14 },
});