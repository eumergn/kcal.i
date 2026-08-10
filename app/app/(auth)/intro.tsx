import { Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEventListener } from 'expo';

const introVideo = require('@/assets/videos/intro.mp4');

/**
 * Plays once, full-screen, before the sign-in/sign-up welcome screen - the first
 * thing a signed-out user sees on every cold entry into the auth flow. Advances to
 * sign-in automatically when it finishes, or immediately on tap so nobody's stuck
 * waiting on it.
 *
 * The video is pre-padded (via ffmpeg + a frame-by-frame OpenCV pass, see project
 * notes) to a tall portrait canvas with the source's own black-to-white circle-reveal
 * transition extended directly into the new frames - the real reveal is a growing
 * circle centered on the logo, not a flat fade, so the padding continues that same
 * circle (same center, frame-accurate radius for every frame that exists in the
 * original, then a smooth continuation to cover the taller canvas) rather than a
 * separately-timed color swap. That's necessary, not just nicer: VideoView paints an
 * opaque background within its own bounds regardless of contentFit, so a wrapping
 * view's background color can never show through in the letterboxed margins - baking
 * the real transition into the video itself is the only way to actually match it.
 */
export default function IntroScreen() {
  const player = useVideoPlayer(introVideo, (p) => {
    p.loop = false;
    p.play();
  });

  const goToSignIn = () => router.replace('/sign-in');

  useEventListener(player, 'playToEnd', goToSignIn);

  return (
    <Pressable style={styles.container} onPress={goToSignIn}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
});
