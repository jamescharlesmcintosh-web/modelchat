import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { generateId } from '../../utils/id';
import type { Message } from '../../types';

interface VoiceChatProps {
  models: any[];
  settings: any;
  onMessage: (text: string) => void;
  onSpeakResponse?: (text: string) => void;
}

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export function VoiceChat({ models, settings, onMessage, onSpeakResponse }: VoiceChatProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isConnected, setIsConnected] = useState(false);
  const recordingRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const conversationRef = useRef<Message[]>([]);

  const SILENCE_THRESHOLD = 2000;

  const speakText = useCallback((text: string) => {
    setVoiceState('speaking');
    Speech.speak(text, {
      language: 'en-US',
      rate: 0.9,
      onDone: () => {
        setVoiceState('idle');
        setTimeout(() => startListening(), 500);
      },
      onStopped: () => {
        setVoiceState('idle');
        setTimeout(() => startListening(), 500);
      },
      onError: () => {
        setVoiceState('idle');
        setTimeout(() => startListening(), 500);
      },
    });
  }, []);

  const startListening = useCallback(async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission', 'Microphone permission is required');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
      });

      recordingRef.current = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setVoiceState('listening');
      setIsConnected(true);

      silenceTimerRef.current = setInterval(async () => {
        if (!recordingRef.current) return;
        try {
          const status = await recordingRef.current.getStatus();
          if (status.durationMillis && status.durationMillis > 30000) {
            stopAndTranscribe();
          }
        } catch {
          // ignore
        }
      }, 1000);
    } catch (err) {
      console.error('Failed to start listening:', err);
      Alert.alert('Error', 'Failed to start microphone');
    }
  }, []);

  const stopAndTranscribe = useCallback(async () => {
    try {
      if (!recordingRef.current) return;

      clearInterval(silenceTimerRef.current);
      setVoiceState('thinking');

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      const text = await transcribeAudio(uri);
      if (text.trim()) {
        const userMsg: Message = {
          id: generateId(),
          role: 'user',
          content: text.trim(),
          timestamp: Date.now(),
        };
        conversationRef.current.push(userMsg);
        onMessage(text.trim());

        // Speak the response if callback provided
        if (onSpeakResponse) {
          onSpeakResponse(text.trim());
        }
      } else {
        setVoiceState('idle');
        setTimeout(() => startListening(), 500);
      }
    } catch (err) {
      console.error('Failed to transcribe:', err);
      setVoiceState('idle');
      setTimeout(() => startListening(), 500);
    }
  }, [onMessage, onSpeakResponse, startListening]);

  const transcribeAudio = async (uri: string): Promise<string> => {
    try {
      const { streamOllamaChat } = await import('../../services/ollama');
      let transcribed = '';
      const msg: Message = {
        id: generateId(),
        role: 'user',
        content: `Transcribe this audio: ${uri}`,
        timestamp: Date.now(),
      };
      await streamOllamaChat(
        settings.ollama.baseUrl || 'http://localhost:11434',
        'whisper:large',
        [msg],
        (text) => { transcribed += text; }
      );
      return transcribed;
    } catch {
      return '';
    }
  };

  const stopSpeaking = useCallback(() => {
    Speech.stop();
    setVoiceState('idle');
    setTimeout(() => startListening(), 500);
  }, [startListening]);

  const handleInterrupt = useCallback(() => {
    if (voiceState === 'speaking') {
      stopSpeaking();
    } else if (voiceState === 'listening') {
      stopAndTranscribe();
    } else if (voiceState === 'idle') {
      startListening();
    }
  }, [voiceState, stopSpeaking, stopAndTranscribe, startListening]);

  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
      clearInterval(silenceTimerRef.current);
      Speech.stop();
    };
  }, []);

  const stateColors: Record<VoiceState, string> = {
    idle: '#E5E5EA',
    listening: '#34C759',
    thinking: '#FF9500',
    speaking: '#007AFF',
  };

  const stateLabels: Record<VoiceState, string> = {
    idle: 'Tap to talk',
    listening: 'Listening...',
    thinking: 'Thinking...',
    speaking: 'Speaking...',
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: stateColors[voiceState] }]}
        onPress={handleInterrupt}
        disabled={voiceState === 'thinking'}
      >
        <Text style={styles.buttonText}>
          {voiceState === 'listening' ? '🎤' :
           voiceState === 'thinking' ? '⏳' :
           voiceState === 'speaking' ? '🔊' : '🎙'}
        </Text>
      </TouchableOpacity>
      <Text style={[styles.stateText, { color: stateColors[voiceState] }]}>
        {stateLabels[voiceState]}
      </Text>
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: isConnected ? '#34C759' : '#FF3B30' }]} />
        <Text style={styles.statusText}>{isConnected ? 'Connected' : 'Disconnected'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 16 },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  buttonText: { fontSize: 32 },
  stateText: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, color: '#8E8E93' },
});