import { useEffect, useState } from 'react'
import { phrases } from './data/phrases'
import { markSyllables, score, syllableHints } from './lib/hangul'
import {
  MASTERED_SCORE,
  focusOrder,
  loadProgress,
  localDate,
  masteredCount,
  recordAttempt,
  saveProgress,
  streak,
  type Progress,
} from './lib/progress'
import { canRecognize, canSpeak, hasKoreanVoice, listen, speak, type Listening } from './lib/speech'

type Attempt = { heard: string; score: number }
type View = 'practice' | 'progress'
type Mode = 'all' | 'focus'

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Microphone access is blocked. Allow it in your browser settings and try again.',
  'no-speech': "I didn't hear anything. Tap the mic and speak a little louder.",
  'audio-capture': 'No microphone was found.',
  network: 'Speech recognition needs an internet connection.',
}

const ALL_IDS = phrases.map((p) => p.id)
const PHRASE_BY_ID = new Map(phrases.map((p) => [p.id, p]))

function feedbackFor(value: number): string {
  if (value >= MASTERED_SCORE) return 'Excellent! 훌륭해요!'
  if (value >= 70) return 'Close. Check the hints below and try again.'
  return 'Keep practicing. Listen once more, then repeat slowly.'
}

function App() {
  const [view, setView] = useState<View>('practice')
  const [mode, setMode] = useState<Mode>('all')
  const [deck, setDeck] = useState<string[]>(ALL_IDS)
  const [position, setPosition] = useState(0)
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [listening, setListening] = useState<Listening | null>(null)
  const [progress, setProgress] = useState<Progress>(loadProgress)
  const [voiceReady, setVoiceReady] = useState(hasKoreanVoice)

  const phrase = PHRASE_BY_ID.get(deck[position]) ?? phrases[0]
  const recognitionSupported = canRecognize()
  // Fixed at load; a session that spans midnight shows yesterday's streak until reload.
  const [today] = useState(() => localDate(new Date()))

  useEffect(() => {
    if (!canSpeak()) return
    const update = () => setVoiceReady(hasKoreanVoice())
    speechSynthesis.addEventListener('voiceschanged', update)
    return () => speechSynthesis.removeEventListener('voiceschanged', update)
  }, [])

  useEffect(() => () => listening?.stop(), [listening])

  function resetAttempt() {
    listening?.stop()
    setAttempt(null)
    setError(null)
  }

  function goTo(next: number) {
    resetAttempt()
    setPosition((next + deck.length) % deck.length)
  }

  function startDeck(nextMode: Mode, startId?: string) {
    resetAttempt()
    // An empty focus deck (everything mastered) falls back to all phrases.
    const order = nextMode === 'focus' ? focusOrder(ALL_IDS, progress) : ALL_IDS
    const nextDeck = order.length > 0 ? order : ALL_IDS
    setMode(order.length > 0 ? nextMode : 'all')
    setDeck(nextDeck)
    setPosition(startId ? Math.max(0, nextDeck.indexOf(startId)) : 0)
    setView('practice')
  }

  function startListening() {
    setError(null)
    setAttempt(null)
    const session = listen({
      onText: (heard) => {
        const value = score(phrase.korean, heard)
        setAttempt({ heard, score: value })
        setProgress((prev) => {
          const next = recordAttempt(prev, phrase.id, value, localDate(new Date()))
          saveProgress(next)
          return next
        })
      },
      onError: (code) => {
        if (code !== 'aborted') setError(ERROR_MESSAGES[code] ?? `Speech recognition error: ${code}`)
      },
      onEnd: () => setListening(null),
    })
    setListening(session ?? null)
  }

  const marks = attempt ? markSyllables(phrase.korean, attempt.heard) : null
  const hints = attempt ? syllableHints(phrase.korean, attempt.heard) : []
  const mastered = masteredCount(progress)
  const currentStreak = streak(progress.days, today)
  const stats = progress.phrases[phrase.id]

  return (
    <main>
      <header className="header">
        <h1>한국어 말하기</h1>
        <p className="muted">
          {mastered} of {phrases.length} mastered · 🔥 {currentStreak} day streak
        </p>
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={view === 'practice'} onClick={() => setView('practice')}>
            Practice
          </button>
          <button role="tab" aria-selected={view === 'progress'} onClick={() => setView('progress')}>
            Progress
          </button>
        </div>
      </header>

      {view === 'practice' ? (
        <>
          {!recognitionSupported && (
            <p className="notice">
              This browser can't recognize speech. Open the app in Chrome, Edge or Safari to practice
              speaking.
            </p>
          )}
          {canSpeak() && !voiceReady && (
            <p className="notice">No Korean voice found on this device, so playback may sound off.</p>
          )}

          <div className="mode">
            <span className="muted">
              {mode === 'focus' ? 'Focus: weakest first' : 'All phrases'} · {position + 1} of{' '}
              {deck.length}
            </span>
            <button className="link" onClick={() => startDeck(mode === 'focus' ? 'all' : 'focus')}>
              {mode === 'focus' ? 'Show all phrases' : 'Focus on weakest'}
            </button>
          </div>

          <section className="card">
            <p className="korean" lang="ko">
              {marks
                ? marks.map((m, i) => (
                    <span key={i} className={m.matched ? undefined : 'missed'}>
                      {m.char}
                    </span>
                  ))
                : phrase.korean}
            </p>
            <p className="romanization">{phrase.romanization}</p>
            <p className="muted">{phrase.english}</p>

            <div className="row">
              <button onClick={() => speak(phrase.korean)} disabled={!canSpeak()}>
                ▶ Listen
              </button>
              <button onClick={() => speak(phrase.korean, 0.6)} disabled={!canSpeak()}>
                🐢 Slow
              </button>
            </div>

            <button
              className="mic"
              onClick={() => (listening ? listening.stop() : startListening())}
              disabled={!recognitionSupported}
              aria-pressed={Boolean(listening)}
            >
              {listening ? '● Listening… tap to stop' : '🎤 Tap and speak'}
            </button>

            {error && <p className="error">{error}</p>}

            {attempt && (
              <div className="result" aria-live="polite">
                <p className="score">{attempt.score}</p>
                <p>{feedbackFor(attempt.score)}</p>
                <p className="muted">
                  I heard: <span lang="ko">{attempt.heard}</span>
                </p>
                {hints.length > 0 && (
                  <ul className="hints">
                    {hints.map((hint, i) => (
                      <li key={i}>
                        <span lang="ko">{hint.message}</span>
                        {hint.tip && <span className="tip">{hint.tip}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {stats && (
              <p className="muted small">
                Best {stats.best} · {stats.attempts} {stats.attempts === 1 ? 'try' : 'tries'}
              </p>
            )}
          </section>

          <nav className="row">
            <button onClick={() => goTo(position - 1)}>← Previous</button>
            <button onClick={() => goTo(position + 1)}>Next →</button>
          </nav>
        </>
      ) : (
        <section>
          <div className="stats">
            <div>
              <strong>{mastered}</strong>
              <span className="muted">mastered</span>
            </div>
            <div>
              <strong>{currentStreak}</strong>
              <span className="muted">day streak</span>
            </div>
            <div>
              <strong>{Object.values(progress.phrases).reduce((n, s) => n + s.attempts, 0)}</strong>
              <span className="muted">tries</span>
            </div>
          </div>

          <button className="mic" onClick={() => startDeck('focus')}>
            Practice weakest phrases
          </button>

          <ul className="progress-list">
            {phrases.map((p) => {
              const s = progress.phrases[p.id]
              return (
                <li key={p.id}>
                  <button className="progress-item" onClick={() => startDeck('all', p.id)}>
                    <span className="progress-text">
                      <span lang="ko">{p.korean}</span>
                      <span className="muted small-inline">{p.english}</span>
                    </span>
                    <span className="progress-score">
                      {s ? (s.best >= MASTERED_SCORE ? `✓ ${s.best}` : s.best) : '–'}
                    </span>
                    <span className="bar" aria-hidden="true">
                      <span
                        className={s && s.best >= MASTERED_SCORE ? 'bar-fill done' : 'bar-fill'}
                        style={{ width: `${s?.best ?? 0}%` }}
                      />
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <p className="muted small">
        Speech recognition is done by your browser and may send audio to its provider (Google for
        Chrome, Apple for Safari). Progress is saved only on this device.
      </p>
    </main>
  )
}

export default App
