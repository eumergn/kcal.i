import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import { useAuth } from '@/context/AuthContext';

const introMusic = require('@/assets/audio/intro-music.mp3');

export const VOLUME_START = 0.008;
export const VOLUME_DUCKED = 0.004;
const START_DELAY_MS = 8000;
const FADE_OUT_MS = 1800;
const SONG_TITLE = 'Whispers of Rain - djovan';

type IntroMusicContextValue = {
  duck: (from: number, to: number, durationMs: number) => void;
  showWidget: boolean;
  setShowWidget: (show: boolean) => void;
  songTitle: string;
  isMuted: boolean;
  toggleMute: () => void;
};

const IntroMusicContext = createContext<IntroMusicContextValue | undefined>(undefined);

/** One AudioPlayer for the whole (auth) flow, not per-screen - survives the
 * intro -> sign-in handoff and stops only once `session` goes signed-in. */
export function IntroMusicProvider({ children }: { children: ReactNode }) {
  const player = useAudioPlayer(introMusic);
  const status = useAudioPlayerStatus(player);
  const { session } = useAuth();
  const [showWidget, setShowWidget] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const rampInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const releasedRef = useRef(false);
  const startedRef = useRef(false);

  useEffect(() => {
    return () => {
      releasedRef.current = true;
      if (rampInterval.current) clearInterval(rampInterval.current);
    };
  }, []);

  const duck = (from: number, to: number, durationMs: number) => {
    if (rampInterval.current) clearInterval(rampInterval.current);
    const steps = 24;
    const stepMs = durationMs / steps;
    let i = 0;
    rampInterval.current = setInterval(() => {
      i++;
      if (releasedRef.current) {
        if (rampInterval.current) clearInterval(rampInterval.current);
        return;
      }
      try {
        player.volume = from + (to - from) * (i / steps);
      } catch {
        // native object already released - stop quietly
        if (rampInterval.current) clearInterval(rampInterval.current);
        rampInterval.current = null;
        return;
      }
      if (i >= steps && rampInterval.current) {
        clearInterval(rampInterval.current);
        rampInterval.current = null;
      }
    }, stepMs);
  };

  // Delayed start (matches the video's own pacing) + starts silent and fades in,
  // since setting volume right before play() isn't guaranteed to land before audio
  // actually starts.
  useEffect(() => {
    if (!status.isLoaded || startedRef.current) return;
    startedRef.current = true;
    const timer = setTimeout(() => {
      if (releasedRef.current) return;
      player.loop = true;
      player.volume = 0;
      player.play();
      duck(0, VOLUME_START, 350);
    }, START_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.isLoaded, player]);

  const toggleMute = () => {
    if (releasedRef.current) return;
    if (isMuted) {
      if (rampInterval.current) {
        clearInterval(rampInterval.current);
        rampInterval.current = null;
      }
      try {
        player.volume = VOLUME_DUCKED;
        player.play();
      } catch {
        return;
      }
      setIsMuted(false);
    } else {
      if (rampInterval.current) {
        clearInterval(rampInterval.current);
        rampInterval.current = null;
      }
      try {
        player.pause();
      } catch {
        // already released
      }
      setIsMuted(true);
    }
  };

  useEffect(() => {
    if (!session) return;
    duck(VOLUME_DUCKED, 0, FADE_OUT_MS);
    const stopTimer = setTimeout(() => {
      setShowWidget(false);
      if (releasedRef.current) return;
      try {
        player.pause();
      } catch {
        // already released
      }
    }, FADE_OUT_MS + 100);
    return () => clearTimeout(stopTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  return (
    <IntroMusicContext.Provider value={{ duck, showWidget, setShowWidget, songTitle: SONG_TITLE, isMuted, toggleMute }}>
      {children}
    </IntroMusicContext.Provider>
  );
}

export function useIntroMusic(): IntroMusicContextValue {
  const ctx = useContext(IntroMusicContext);
  if (!ctx) throw new Error('useIntroMusic must be used within IntroMusicProvider');
  return ctx;
}
