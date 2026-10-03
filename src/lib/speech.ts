// Thin wrappers over the browser Web Speech API for Korean (ko-KR).

const LANG = 'ko-KR'

type RecognitionResultList = ArrayLike<ArrayLike<{ transcript: string }>>

interface Recognition {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: { results: RecognitionResultList }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  abort(): void
}

type RecognitionCtor = new () => Recognition

function getRecognitionCtor(): RecognitionCtor | undefined {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor
    webkitSpeechRecognition?: RecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export const canRecognize = (): boolean => getRecognitionCtor() !== undefined
export const canSpeak = (): boolean => 'speechSynthesis' in window

function koreanVoice(): SpeechSynthesisVoice | undefined {
  return speechSynthesis.getVoices().find((v) => v.lang.replace('_', '-').startsWith('ko'))
}

export const hasKoreanVoice = (): boolean => canSpeak() && koreanVoice() !== undefined

/** Reads the text aloud in Korean. rate < 1 is slower. */
export function speak(text: string, rate = 1): void {
  if (!canSpeak()) return
  speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = LANG
  utterance.rate = rate
  const voice = koreanVoice()
  if (voice) utterance.voice = voice
  speechSynthesis.speak(utterance)
}

export type Listening = { stop: () => void }

/**
 * Listens for one Korean utterance. Calls onText with the best transcript,
 * onError with the browser's error code, and onEnd once listening stops.
 */
export function listen(handlers: {
  onText: (text: string) => void
  onError: (error: string) => void
  onEnd: () => void
}): Listening | undefined {
  const Ctor = getRecognitionCtor()
  if (!Ctor) return undefined

  const recognition = new Ctor()
  recognition.lang = LANG
  recognition.interimResults = false
  recognition.maxAlternatives = 1
  recognition.onresult = (event) => handlers.onText(event.results[0][0].transcript)
  recognition.onerror = (event) => handlers.onError(event.error)
  recognition.onend = handlers.onEnd
  recognition.start()
  return { stop: () => recognition.abort() }
}
