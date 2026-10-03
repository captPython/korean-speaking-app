# Korean Speaking App: Prototype Scope and Stack

_Thread 1 deliverable · 2026-10-03_

## Audience and goal
English-speaking beginners practicing spoken Korean in a web browser (desktop + mobile).
Prototype goal: prove the core practice loop feels useful with ~20 starter phrases.

## Core practice loop
1. **Show** a phrase: Hangul, romanization, English meaning.
2. **Hear** it: play native-speed and slow audio (text-to-speech).
3. **Speak**: user taps the mic and says the phrase.
4. **Transcribe**: speech recognition returns Korean text (ko-KR).
5. **Compare**: normalize both strings (strip punctuation/spaces), decompose Hangul into jamo, compute similarity (edit distance).
6. **Feedback**: score (0-100), highlight mismatched syllables, offer "try again" or "next".

## In scope (prototype)
- Static phrase deck (JSON), ~20 greetings/survival phrases
- TTS playback, mic capture, transcription, jamo-level comparison, simple score
- Local progress (localStorage): attempts and best score per phrase

## Out of scope (for now)
- Accounts, backend, payments
- Phoneme-level pronunciation scoring (planned for thread 3)
- Native mobile app

## Stack options

| | Browser Web Speech API | Hosted speech API (e.g. Azure Speech) |
|---|---|---|
| Cost | Free | Pay per audio minute |
| Backend | None | Needed (to protect API key) |
| Korean recognition | `ko-KR` in Chrome/Edge and Safari; **not Firefox** | Strong, all browsers |
| Pronunciation scoring | No; text match only | Azure Pronunciation Assessment returns accuracy/fluency scores |
| Setup time | Hours | Days |

## Recommendation
**Phase 1 (prototype): Web Speech API**, `SpeechRecognition` (lang `ko-KR`) + `speechSynthesis`,
with jamo-level text comparison for feedback. Zero cost, no backend, fastest to a demo.

**Phase 2 (thread 3): add Azure Pronunciation Assessment** behind a small serverless function,
only if text-match feedback proves too coarse.

**App stack:** Vite + React + TypeScript, deployed as a static site (GitHub Pages or Vercel).

## Known risks
- Firefox lacks `SpeechRecognition`; show a "use Chrome/Safari" notice.
- Korean TTS voice quality varies by OS; fall back to pre-recorded clips if needed.
- Chrome's recognition sends audio to Google servers; disclose in the UI.
- Recognizer may "autocorrect" a wrong pronunciation into the right word, inflating scores (motivation for phase 2).
