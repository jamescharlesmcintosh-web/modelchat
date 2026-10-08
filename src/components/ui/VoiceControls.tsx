import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import type { Message } from '../../types';

interface VoiceControlsProps {
  onTranscribe: (text: string) => void;
  onSpeak?: (text: string) => void;
}

export function VoiceControls({ onTranscribe, onSpeak }: VoiceControlsProps) {
  const [recording, setRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(true);

      setTimeout(() => {
        if (recording) stopRecording(recording);
      }, 30000);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const stopRecording = async (recordingInstance: any) => {
    try {
      setRecording(false);
      await recordingInstance.stopAndUnloadAsync();
      const uri = recordingInstance.getURI();

      const text = await transcribeAudio(uri);
      if (text) onTranscribe(text);
    } catch (err) {
      console.error('Failed to stop recording:', err);
    }
  };

  const transcribeAudio = async (uri: string): Promise<string> => {
    try {
      const { streamOllamaChat } = await import('../../services/ollama');
      let transcribed = '';
      const msg: Message = {
        id: 'voice-temp',
        role: 'user',
        content: `Transcribe this audio: ${uri}`,
        timestamp: Date.now(),
      };
      await streamOllamaChat(
        'http://localhost:11434',
        'whisper:large',
        [msg],
        (text) => { transcribed += text; }
      );
      return transcribed;
    } catch {
      return '';
    }
  };

  const toggleSpeaking = (text: string) => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      Speech.speak(text, {
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
      });
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, recording && styles.recordingActive]}
        onPress={recording ? undefined : startRecording}
      >
        <Text style={styles.buttonText}>{recording ? '⏹' : '🎤'}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => toggleSpeaking('')}
      >
        <Text style={styles.buttonText}>{isSpeaking ? '🔇' : '🔊'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 8 },
  button: {
    padding: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    minWidth: 44,
    alignItems: 'center',
  },
  recordingActive: { backgroundColor: '#FF3B30' },
  buttonText: { fontSize: 18 },
});