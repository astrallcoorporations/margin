import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, FileWarning, Maximize, Minimize, Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX } from 'lucide-react'
import { fileUrl } from '@/lib/files'
import { cn } from '@/lib/utils'
import { buttonClass } from './ui'

const SPEEDS = [1, 1.25, 1.5, 1.75, 2]

const fmt = (t: number) => {
  if (!Number.isFinite(t)) return '0:00'
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Study video player: big play button, yellow scrubber with buffered range, mono timecode,
 * playback speed, ±10s skips, keyboard controls (Space/K, ←/→, M, F, < >), auto-hiding chrome.
 */
export function VideoPlayer({ path }: { path: string }) {
  const wrap = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [muted, setMuted] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [full, setFull] = useState(false)
  const [chrome, setChrome] = useState(true)
  const [hover, setHover] = useState<number | null>(null)
  const hideTimer = useRef(0)

  const poke = useCallback(() => {
    setChrome(true)
    window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => {
      if (!video.current?.paused) setChrome(false)
    }, 2200)
  }, [])

  const toggle = useCallback(() => {
    const v = video.current
    if (!v) return
    if (v.paused) v.play().catch(() => {})
    else v.pause()
    poke()
  }, [poke])

  const seekBy = useCallback(
    (d: number) => {
      const v = video.current
      if (!v) return
      v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + d))
      poke()
    },
    [poke],
  )

  const setRate = (r: number) => {
    setSpeed(r)
    if (video.current) video.current.playbackRate = r
  }

  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen()
    else wrap.current?.requestFullscreen?.()
  }

  useEffect(() => {
    const onFs = () => setFull(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  useEffect(() => () => window.clearTimeout(hideTimer.current), [])

  // Cached videos can finish loading metadata before listeners run — read it directly too.
  useEffect(() => {
    const v = video.current
    if (v && v.readyState >= 1 && Number.isFinite(v.duration)) {
      setDuration(v.duration)
      setTime(v.currentTime)
      setStatus('ready')
    }
  }, [path])

  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key.toLowerCase()
    if (k === ' ' || k === 'k') {
      e.preventDefault()
      toggle()
    } else if (k === 'arrowright' || k === 'l') {
      e.preventDefault()
      seekBy(k === 'l' ? 10 : 5)
    } else if (k === 'arrowleft' || k === 'j') {
      e.preventDefault()
      seekBy(k === 'j' ? -10 : -5)
    } else if (k === 'm') {
      const v = video.current
      if (v) {
        v.muted = !v.muted
        setMuted(v.muted)
      }
    } else if (k === 'f') toggleFull()
    else if (e.key === '>' || e.key === '.') setRate(SPEEDS[Math.min(SPEEDS.length - 1, SPEEDS.indexOf(speed) + 1)])
    else if (e.key === '<' || e.key === ',') setRate(SPEEDS[Math.max(0, SPEEDS.indexOf(speed) - 1)])
  }

  const fraction = (clientX: number) => {
    const r = bar.current!.getBoundingClientRect()
    return Math.max(0, Math.min(1, (clientX - r.left) / r.width))
  }

  const scrub = (e: React.PointerEvent) => {
    const v = video.current
    if (!v || !duration) return
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    v.currentTime = fraction(e.clientX) * duration
    setTime(v.currentTime)
  }

  if (status === 'error')
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-3 border border-line bg-ink-1 p-6 text-center">
        <FileWarning size={18} className="text-warn" />
        <p className="text-[13px] text-fg-2">This video couldn’t play in the browser.</p>
        <a className={buttonClass('secondary', 'sm')} href={fileUrl(path, true)}>
          <Download size={13} /> Download it instead
        </a>
      </div>
    )

  const pct = duration ? (time / duration) * 100 : 0
  const show = chrome || !playing

  return (
    <div
      ref={wrap}
      tabIndex={0}
      onKeyDown={onKey}
      onMouseMove={poke}
      onMouseLeave={() => playing && setChrome(false)}
      className={cn('group/video relative overflow-hidden border border-line bg-black focus-visible:outline-accent', full && 'flex items-center', !show && 'cursor-none')}
      aria-label="Video player. Space to play or pause, arrow keys to skip, F for full screen."
    >
      <video
        ref={video}
        src={fileUrl(path)}
        preload="metadata"
        playsInline
        onClick={toggle}
        onDoubleClick={toggleFull}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration)
          setStatus('ready')
        }}
        onDurationChange={(e) => Number.isFinite(e.currentTarget.duration) && setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onProgress={(e) => {
          const v = e.currentTarget
          if (v.buffered.length && v.duration) setBuffered(v.buffered.end(v.buffered.length - 1) / v.duration)
        }}
        onPlay={() => {
          setPlaying(true)
          poke()
        }}
        onPause={() => {
          setPlaying(false)
          setChrome(true)
        }}
        onError={() => setStatus('error')}
        className="block aspect-video w-full bg-black"
      />

      {status === 'loading' && <div className="skeleton absolute inset-0 !rounded-none" aria-hidden="true" />}

      {/* Centre play button */}
      <button
        onClick={toggle}
        aria-label={playing ? 'Pause' : 'Play'}
        className={cn(
          'absolute top-1/2 left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center bg-accent text-black transition-[opacity,transform] duration-200',
          playing ? 'pointer-events-none scale-90 opacity-0' : 'scale-100 opacity-100 hover:scale-105',
        )}
      >
        <Play size={24} fill="currentColor" className="ml-0.5" />
      </button>

      {/* Control bar */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.85),rgba(0,0,0,0.55)_60%,transparent)] px-3 pt-10 pb-2.5 transition-[opacity,transform] duration-200 sm:px-4',
          show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
        )}
      >
        {/* Scrubber */}
        <div
          ref={bar}
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(time)}
          aria-valuetext={`${fmt(time)} of ${fmt(duration)}`}
          onPointerDown={scrub}
          onPointerMove={(e) => {
            setHover(fraction(e.clientX))
            if (e.buttons === 1) scrub(e)
          }}
          onPointerLeave={() => setHover(null)}
          className="group/bar relative mb-2 h-4 cursor-pointer touch-none"
        >
          <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-white/15 transition-[height] group-hover/bar:h-[6px]">
            <div className="absolute inset-y-0 left-0 bg-white/25" style={{ width: `${buffered * 100}%` }} />
            <div className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${pct}%` }} />
          </div>
          <div
            className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 bg-accent opacity-0 transition-opacity group-hover/bar:opacity-100"
            style={{ left: `${pct}%` }}
            aria-hidden="true"
          />
          {hover !== null && duration > 0 && (
            <div
              className="pointer-events-none absolute -top-7 -translate-x-1/2 bg-fg px-1.5 py-0.5 font-mono text-[10.5px] font-bold text-black"
              style={{ left: `${hover * 100}%` }}
            >
              {fmt(hover * duration)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-white">
          <CtrlButton label={playing ? 'Pause (K)' : 'Play (K)'} onClick={toggle}>
            {playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
          </CtrlButton>
          <CtrlButton label="Back 10 seconds (J)" onClick={() => seekBy(-10)}>
            <RotateCcw size={16} />
          </CtrlButton>
          <CtrlButton label="Forward 10 seconds (L)" onClick={() => seekBy(10)}>
            <RotateCw size={16} />
          </CtrlButton>
          <CtrlButton
            label={muted ? 'Unmute (M)' : 'Mute (M)'}
            onClick={() => {
              const v = video.current
              if (!v) return
              v.muted = !v.muted
              setMuted(v.muted)
            }}
          >
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </CtrlButton>
          <span className="ml-2 font-mono text-[12px] font-bold tabular-nums text-white/90">
            {fmt(time)} <span className="text-white/40">/ {fmt(duration)}</span>
          </span>
          <div className="ml-auto flex items-center gap-1">
            <div className="flex overflow-hidden border border-white/15" role="radiogroup" aria-label="Playback speed">
              {SPEEDS.map((r) => (
                <button
                  key={r}
                  role="radio"
                  aria-checked={speed === r}
                  onClick={() => setRate(r)}
                  className={cn(
                    'px-1.5 py-1 font-mono text-[10.5px] font-bold transition-colors max-sm:[&:nth-child(2)]:hidden max-sm:[&:nth-child(4)]:hidden',
                    speed === r ? 'bg-accent text-black' : 'text-white/70 hover:bg-white/10 hover:text-white',
                  )}
                >
                  {r}×
                </button>
              ))}
            </div>
            <CtrlButton label={full ? 'Exit full screen (F)' : 'Full screen (F)'} onClick={toggleFull}>
              {full ? <Minimize size={16} /> : <Maximize size={16} />}
            </CtrlButton>
          </div>
        </div>
      </div>
    </div>
  )
}

function CtrlButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-8 place-items-center text-white/85 transition-[background,color,transform] hover:bg-white/10 hover:text-white active:scale-90"
    >
      {children}
    </button>
  )
}
