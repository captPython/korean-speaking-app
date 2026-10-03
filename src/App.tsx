import { useEffect, useState } from 'react'
import { phrases } from './data/phrases'
import { markSyllables, score } from './lib/hangul'
import { canRecognize, canSpeak, hasKoreanVoice, listen, speak, type Listening } from './lib/speech'

type Attempt = { heard: string; score: number }

const BEST_KEY = 'ksa.best'

function loadBest(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function saveBest(best: Record<string, number>): void {
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify(best))
  } catch {
    // Storage can be unavailable (private mode); progress just isn't kept.
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Microphone access is blocked. Allow it in your browser settings and try again.',
  'no-speech': "I didn't hear anything. Tap the mic and speak a little louder.",
  'audio-capture': 'No microphone was found.',
  network: 'Speech recognition needs an internet connection.',
}

function feedbackFor(value: number): string {
  if (value >= 90) return 'Excellent! 훌륭해요!'
  if (value >= 70) return 'Close. Check the highlighted syllables and try again.'
  return 'Keep practicing. Listen once more, then repeat slowly.'
}

function App() {
  const [index, setIndex] = useState(0)
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [listening, setListening] = useState<Listening | null>(null)
  const [best, setBest] = useState<Record<string, number>>(loadBest)
  const [voiceReady, setVoiceReady] = useState(hasKoreanVoice)

  const phrase = phrases[index]
  const recognitionSupported = canRecognize()

  useEffect(() => {
    if (!canSpeak()) return
    const update = () => setVoiceReady(hasKoreanVoice())
    speechSynthesis.addEventListener('voiceschanged', update)
    return () => speechSynthesis.removeEventListener('voiceschanged', update)
  }, [])

  useEffect(() => () => listening?.stop(), [listening])

  function goTo(next: number) {
    listening?.stop()
    setIndex((next + phrases.length) % phrases.length)
    setAttempt(null)
    setError(null)
  }

  function startListening() {
    setError(null)
    setAttempt(null)
    const session = listen({
      onText: (heard) => {
        const value = score(phrase.korean, heard)
        setAttempt({ heard, score: value })
        if (value > (best[phrase.id] ?? 0)) {
          const next = { ...best, [phrase.id]: value }
          setBest(next)
          saveBest(next)
        }
      },
      onError: (code) => {
        if (code !== 'aborted') setError(ERROR_MESSAGES[code] ?? `Speech recognition error: ${code}`)
      },
      onEnd: () => setListening(null),
    })
    setListening(session ?? null)
  }

  const marks = attempt ? markSyllables(phrase.korean, attempt.heard) : null
  const practiced = Object.keys(best).length

  return (
    <main>
      <header className="header">
        <h1>한국어 말하기</h1>
        <p className="muted">
          Phrase {index + 1} of {phrases.length} · {practiced} practiced
        </p>
      </header>

      {!recognitionSupported && (
        <p className="notice">
          This browser can't recognize speech. Open the app in Chrome, Edge or Safari to practice
          speaking.
        </p>
      )}
      {canSpeak() && !voiceReady && (
        <p className="notice">No Korean voice found on this device, so playback may sound off.</p>
      )}

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
          </div>
        )}
        {best[phrase.id] !== undefined && (
          <p className="muted small">Best so far: {best[phrase.id]}</p>
        )}
      </section>

      <nav className="row">
        <button onClick={() => goTo(index - 1)}>← Previous</button>
        <button onClick={() => goTo(index + 1)}>Next →</button>
      </nav>

      <p className="muted small">
        Speech recognition is done by your browser and may send audio to its provider (Google for
        Chrome, Apple for Safari).
      </p>
    </main>
  )
}

export default App
