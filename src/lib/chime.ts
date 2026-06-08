let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  return ctx
}

// Call on a user gesture to satisfy browser autoplay policy.
export function unlockAudio(): void {
  const c = getCtx()
  if (c && c.state === 'suspended') c.resume().catch(() => {})
}

export function playChime(): void {
  const c = getCtx()
  if (!c || c.state !== 'running') return

  // Tunable knobs:
  const PEAK = 0.45                          // loudness 0..1 (higher = louder)
  const WAVE: OscillatorType = 'triangle'    // cuts through noise better than sine
  const CYCLES = 3                            // how many rises (more = more insistent)

  const lo = 880      // A5
  const hi = 1175     // ~D6
  const noteDur = 0.13
  const noteGap = 0.04   // gap between the two notes of one rise
  const cycleGap = 0.16  // gap between rises

  let t = c.currentTime + 0.01
  for (let i = 0; i < CYCLES; i++) {
    for (const freq of [lo, hi]) {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = WAVE
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(PEAK, t + 0.015)     // fast attack
      gain.gain.exponentialRampToValueAtTime(0.0001, t + noteDur) // decay, no click
      osc.connect(gain).connect(c.destination)
      osc.start(t)
      osc.stop(t + noteDur + 0.02)
      t += noteDur + noteGap
    }
    t += cycleGap
  }
}
