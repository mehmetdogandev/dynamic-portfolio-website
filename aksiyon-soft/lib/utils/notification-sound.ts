/**
 * Notification Sound Utility
 *
 * Generates and plays notification sounds using Web Audio API
 */

let audioContext: AudioContext | null = null

/**
 * Gets or creates an AudioContext instance
 * Handles browser autoplay policies by resuming context if suspended
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined' || !window.AudioContext) {
    return null
  }

  try {
    if (!audioContext) {
      audioContext = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      )()
    }

    // Resume context if suspended (required for autoplay policies)
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {
        // Silently fail if resume fails (user interaction required)
      })
    }

    return audioContext
  } catch (_err) {
    return null
  }
}

/**
 * Plays a notification sound using Web Audio API
 * @param volume - Volume level between 0 and 1 (default: 0.5)
 */
export function playNotificationSound(volume: number = 0.5): void {
  // Clamp volume between 0 and 1
  const clampedVolume = Math.max(0, Math.min(1, volume))

  const ctx = getAudioContext()
  if (!ctx) {
    return
  }

  try {
    // Create a pleasant notification sound (two-tone chime)
    const oscillator1 = ctx.createOscillator()
    const oscillator2 = ctx.createOscillator()
    const gainNode = ctx.createGain()

    // First tone: higher frequency
    oscillator1.type = 'sine'
    oscillator1.frequency.value = 800 // Hz

    // Second tone: lower frequency
    oscillator2.type = 'sine'
    oscillator2.frequency.value = 600 // Hz

    // Set volume with smooth fade
    const now = ctx.currentTime
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(clampedVolume, now + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3)

    // Connect oscillators to gain node
    oscillator1.connect(gainNode)
    oscillator2.connect(gainNode)

    // Connect gain node to destination (speakers)
    gainNode.connect(ctx.destination)

    // Start oscillators
    oscillator1.start(now)
    oscillator2.start(now)

    // Stop oscillators after the sound duration
    oscillator1.stop(now + 0.3)
    oscillator2.stop(now + 0.3)

    // Clean up after sound finishes
    oscillator1.onended = () => {
      oscillator1.disconnect()
      oscillator2.disconnect()
      gainNode.disconnect()
    }
  } catch (_error) {
    // Silently fail if audio playback fails
    // (e.g., user hasn't interacted with page yet, autoplay blocked)
  }
}
