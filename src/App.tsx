// Starter screen: reports whether this browser supports the speech features
// the practice loop needs (see docs/scope.md). The loop itself lands next.

type Check = { label: string; supported: boolean; note: string }

function getChecks(): Check[] {
  const hasRecognition =
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  const hasSynthesis = 'speechSynthesis' in window
  const hasMic = Boolean(navigator.mediaDevices?.getUserMedia)

  return [
    {
      label: 'Speech recognition (ko-KR)',
      supported: hasRecognition,
      note: hasRecognition ? 'Available' : 'Use Chrome, Edge or Safari',
    },
    {
      label: 'Text-to-speech',
      supported: hasSynthesis,
      note: hasSynthesis ? 'Available' : 'Not supported',
    },
    {
      label: 'Microphone access',
      supported: hasMic,
      note: hasMic ? 'Available' : 'Not supported',
    },
  ]
}

function App() {
  const checks = getChecks()

  return (
    <main>
      <h1>한국어 말하기 · Korean Speaking Practice</h1>
      <p className="muted">
        Hear a phrase, say it, and get feedback. Prototype in progress.
      </p>
      <ul className="checks">
        {checks.map((check) => (
          <li key={check.label}>
            <span>{check.label}</span>
            <span className={check.supported ? 'ok' : 'warn'}>{check.note}</span>
          </li>
        ))}
      </ul>
    </main>
  )
}

export default App
