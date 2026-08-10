import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import { useAuth } from '@/context/AuthContext';

const introMusic = require('@/assets/audio/intro-music.mp3');

export const VOLUME_START = 0.25;
export const VOLUME_DUCKED = 0.12;
const FADE_OUT_MS = 1800; // "end it slowly" once the user actually signs in
const UNMUTE_FADE_IN_MS = 900;
const SONG_TITLE = 'Apalonbeats';

type IntroMusicContextValue = {
  /** Ramps volume linearly over durationMs. Safe to call even after the native
   * player has been released (e.g. a stray tick racing a navigation-triggered
   * teardown) - silently stops instead of throwing. */
  duck: (from: number, to: number, durationMs: number) => void;
  showWidget: boolean;
  setShowWidget: (show: boolean) => void;
  songTitle: string;
  isMuted: boolean;
  toggleMute: () => void;
};

const IntroMusicContext = createContext<IntroMusicContextValue | undefined>(undefined);

/**
 * Owns a single AudioPlayer instance for the whole (auth) flow, not one per screen -
 * it needs to keep playing across the intro -> sign-in handoff and only stop once the
 * user actually authenticates, which intro.tsx alone has no way to know about (that's
 * an AuthContext concern). Started once here on mount (looping - a single ~78s pass
 * would otherwise just run out and go silent, which is what "stopped after a couple
 * seconds" from a short trimmed clip without loop was); ducked by intro.tsx when its
 * own visual transition runs; faded out and stopped here automatically the moment
 * `session` goes from signed-out to signed-in; mutable on demand via the widget's
 * on/off button.
 */
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

  // Starts silent and fades in, rather than setting volume then immediately calling
  // play() - the player loads the asset asynchronously, and setting volume right
  // before play() isn't guaranteed to land on the native side before playback
  // actually starts producing sound, which is exactly why the start of playback
  // could still be heard at full volume regardless of what volume was assigned.
  // Starting at 0 and ramping up removes that race entirely: whatever the native
  // side's true starting volume is, it's inaudible before the ramp takes over.
  useEffect(() => {
    if (!status.isLoaded || startedRef.current) return;
    startedRef.current = true;
    player.loop = true;
    player.volume = 0;
    player.play();
    duck(0, VOLUME_START, 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.isLoaded, player]);

  const toggleMute = () => {
    if (releasedRef.current) return;
    if (isMuted) {
      // Fades in slowly, per request - not an instant jump back to the ducked level.
      try {
        player.volume = 0;
        player.play();
      } catch {
        return;
      }
      duck(0, VOLUME_DUCKED, UNMUTE_FADE_IN_MS);
      setIsMuted(false);
    } else {
      // Pausing (not stopping/resetting) so un-muting resumes from the same spot,
      // like any normal player pause button - "it stops" just means silent, not gone.
      if (rampInterval.current) {
        clearInterval(rampInterval.current);
        rampInterval.current = null;
      }
      try {
        player.pause();
      } catch {
        // already released, nothing to pause
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
        // already released - fine, nothing to pause.
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
