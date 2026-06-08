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

// Gentle two-note ping (~600Hz → ~800Hz). No-ops if context unavailable or suspended.
export function playChime(): void {
  const c = getCtx()
  if (!c || c.state !== 'running') return
  const now = c.currentTime
  const notes = [
    { freq: 600, start: 0,    dur: 0.18 },
    { freq: 800, start: 0.16, dur: 0.22 },
  ]
  for (const n of notes) {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = n.freq
    const t0 = now + n.start
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02)   // soft attack
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + n.dur) // smooth decay, no click
    osc.connect(gain).connect(c.destination)
    osc.start(t0)
    osc.stop(t0 + n.dur + 0.02)
  }
}
