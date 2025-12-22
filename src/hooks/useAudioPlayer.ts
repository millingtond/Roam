import { useState, useEffect, useCallback, useRef } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { AudioState } from '../types';

interface UseAudioPlayerResult {
  audioState: AudioState;
  loadAudio: (uri: string) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seekTo: (positionMs: number) => Promise<void>;
  skip: (seconds: number) => Promise<void>;
  setPlaybackSpeed: (speed: number) => Promise<void>;
  unload: () => Promise<void>;
}

const DEFAULT_AUDIO_STATE: AudioState = {
  isLoaded: false,
  isPlaying: false,
  position: 0,
  duration: 0,
  playbackSpeed: 1.0,
};

export function useAudioPlayer(onAudioComplete?: () => void): UseAudioPlayerResult {
  const [audioState, setAudioState] = useState<AudioState>(DEFAULT_AUDIO_STATE);
  const soundRef = useRef<Audio.Sound | null>(null);
  const playbackSpeedRef = useRef<number>(1.0);

  // Configure audio session on mount
  useEffect(() => {
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.error('Failed to configure audio:', error);
      }
    };

    configureAudio();

    // Cleanup on unmount
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Playback status update handler
  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      setAudioState(prev => ({
        ...prev,
        isLoaded: false,
        isPlaying: false,
      }));
      return;
    }

    setAudioState(prev => ({
      ...prev,
      isLoaded: true,
      isPlaying: status.isPlaying,
      position: status.positionMillis,
      duration: status.durationMillis || 0,
    }));

    // Handle audio completion
    if (status.didJustFinish && !status.isLooping) {
      onAudioComplete?.();
    }
  }, [onAudioComplete]);

  const loadAudio = useCallback(async (uri: string) => {
    try {
      // Unload previous audio if exists
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Reset state
      setAudioState(DEFAULT_AUDIO_STATE);

      // Load new audio
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        {
          shouldPlay: false,
          rate: playbackSpeedRef.current,
          shouldCorrectPitch: true,
          progressUpdateIntervalMillis: 250,
        },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
    } catch (error) {
      console.error('Failed to load audio:', error);
      throw error;
    }
  }, [onPlaybackStatusUpdate]);

  const play = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.playAsync();
    }
  }, []);

  const pause = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
    }
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (!soundRef.current) return;

    if (audioState.isPlaying) {
      await pause();
    } else {
      await play();
    }
  }, [audioState.isPlaying, play, pause]);

  const seekTo = useCallback(async (positionMs: number) => {
    if (soundRef.current) {
      const clampedPosition = Math.max(0, Math.min(positionMs, audioState.duration));
      await soundRef.current.setPositionAsync(clampedPosition);
    }
  }, [audioState.duration]);

  const skip = useCallback(async (seconds: number) => {
    const newPosition = audioState.position + (seconds * 1000);
    await seekTo(newPosition);
  }, [audioState.position, seekTo]);

  const setPlaybackSpeed = useCallback(async (speed: number) => {
    playbackSpeedRef.current = speed;
    setAudioState(prev => ({ ...prev, playbackSpeed: speed }));

    if (soundRef.current) {
      await soundRef.current.setRateAsync(speed, true);
    }
  }, []);

  const unload = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setAudioState(DEFAULT_AUDIO_STATE);
  }, []);

  return {
    audioState,
    loadAudio,
    play,
    pause,
    togglePlayPause,
    seekTo,
    skip,
    setPlaybackSpeed,
    unload,
  };
}

// Utility function: Format time for display (mm:ss or hh:mm:ss)
export function formatTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Utility function: Format remaining time with minus sign
export function formatRemainingTime(positionMs: number, durationMs: number): string {
  const remaining = durationMs - positionMs;
  return `-${formatTime(remaining)}`;
}
