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
 * The video is pre-padded (via ffmpeg, see project notes) to a tall portrait canvas
 * with its own black-to-white background baked directly into the frames, timed to
 * the source's real transition. That's deliberate, not incidental: VideoView paints
 * an opaque background within its own bounds regardless of contentFit, so a
 * wrapping view's background color can never show through in the letterboxed
 * margins - baking the color into the video itself is the only way to actually
 * match it. With the padding already close to typical phone aspect ratios,
 * contentFit="cover" now needs little to no real cropping.
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
