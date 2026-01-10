import { useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// Simple notification sound using Web Audio API
function createNotificationSound(): AudioContext | null {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    return audioContext;
  } catch {
    return null;
  }
}

function playNotificationBeep(audioContext: AudioContext) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 800;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
}

export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const { toast } = useToast();

  const playSound = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = createNotificationSound();
    }

    if (audioContextRef.current) {
      // Resume audio context if suspended (browser autoplay policy)
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      playNotificationBeep(audioContextRef.current);
    }
  }, []);

  const showBrowserNotification = useCallback((title: string, body: string) => {
    // Check if browser notifications are supported and permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'message-notification',
      });
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  const notify = useCallback((title: string, body: string) => {
    playSound();
    
    // Show browser notification if page is not focused
    if (document.hidden) {
      showBrowserNotification(title, body);
    }
    
    // Always show toast notification
    toast({
      title,
      description: body,
    });
  }, [playSound, showBrowserNotification, toast]);

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    playSound,
    notify,
    requestNotificationPermission,
    showBrowserNotification,
  };
}
