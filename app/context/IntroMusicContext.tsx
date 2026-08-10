import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';

import { useAuth } from '@/context/AuthContext';

const introMusic = require('@/assets/audio/intro-music.mp3');

export const VOLUME_START = 0.5;
export const VOLUME_DUCKED = 0.25;
const FADE_OUT_MS = 1800; // "end it slowly" once the user actually signs in
const SONG_TITLE = 'Motivation - apalonbeats';

type IntroMusicContextValue = {
  /** Ramps volume linearly over durationMs. Safe to call even after the native
   * player has been released (e.g. a stray tick racing a navigation-triggered
   * teardown) - silently stops instead of throwing. */
  duck: (from: number, to: number, durationMs: number) => void;
  showWidget: boolean;
  setShowWidget: (show: boolean) => void;
  songTitle: string;
};

const IntroMusicContext = createContext<IntroMusicContextValue | undefined>(undefined);

/**
 * Owns a single AudioPlayer instance for the whole (auth) flow, not one per screen -
 * it needs to keep playing across the intro -> sign-in handoff and only stop once the
 * user actually authenticates, which intro.tsx alone has no way to know about (that's
 * an AuthContext concern). Started once here on mount; ducked by intro.tsx when its
 * own visual transition runs; faded out and stopped here automatically the moment
 * `session` goes from signed-out to signed-in.
 */
export function IntroMusicProvider({ children }: { children: ReactNode }) {
  const player = useAudioPlayer(introMusic);
  const { session } = useAuth();
  const [showWidget, setShowWidget] = useState(false);
  const rampInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const releasedRef = useRef(false);

  useEffect(() => {
    player.volume = VOLUME_START;
    player.play();
    return () => {
      releasedRef.current = true;
      if (rampInterval.current) clearInterval(rampInterval.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // Native shared object already gone (e.g. player torn down mid-ramp) -
        // nothing left to animate, just stop quietly instead of crashing.
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

  useEffect(() => {
    if (!session) return;
    duck(VOLUME_DUCKED, 0, FADE_OUT_MS);
    const stopTimer = setTimeout(() => {
      setShowWidget(false);
      if (releasedRef.current) return;
      try {
        player.pause();
      } catch {
        // already released - fine, nothing to pause.
      }
    }, FADE_OUT_MS + 100);
    return () => clearTimeout(stopTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  return (
    <IntroMusicContext.Provider value={{ duck, showWidget, setShowWidget, songTitle: SONG_TITLE }}>
      {children}
    </IntroMusicContext.Provider>
  );
}

export function useIntroMusic(): IntroMusicContextValue {
  const ctx = useContext(IntroMusicContext);
  if (!ctx) throw new Error('useIntroMusic must be used within IntroMusicProvider');
  return ctx;
}
