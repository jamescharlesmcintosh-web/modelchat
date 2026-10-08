import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, TextInput, Alert } from 'react-native';
import { useStore } from '../../store';
import { router } from 'expo-router';

export function ConversationSidebar() {
  const { conversations, activeConversationId, setActiveConversation, deleteConversation } = useStore();
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? conversations.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    : conversations;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Conversations</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.close}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search chats..."
          placeholderTextColor="#8E8E93"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.item, item.id === activeConversationId && styles.activeItem]}
            onPress={() => {
              setActiveConversation(item.id);
              router.back();
            }}
          >
            <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.itemMeta}>{item.messages.length} messages</Text>
<TouchableOpacity onPress={() => Alert.alert('Delete?', 'Delete this conversation?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteConversation(item.id) }])} style={styles.delete}>
                <Text style={styles.deleteText}>✕</Text>
              </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{search ? 'No matches' : 'No conversations yet'}</Text>
          </View>
        }
      />
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
  searchBar: { paddingHorizontal: 16, paddingVertical: 8 },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  activeItem: { backgroundColor: '#E8F0FE' },
  itemTitle: { flex: 1, fontSize: 16 },
  itemMeta: { fontSize: 12, color: '#8E8E93', marginLeft: 8 },
  delete: { padding: 4 },
  deleteText: { color: '#FF3B30', fontSize: 16 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#8E8E93' },
});