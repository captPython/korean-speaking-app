# Korean Speaking App

A web app where English-speaking beginners practice spoken Korean: hear a phrase,
say it into the mic, and get feedback on how close it was.

Scope, practice loop and stack decision: [docs/scope.md](docs/scope.md).

## Stack

- Vite + React + TypeScript
- Browser Web Speech API: `SpeechRecognition` (`ko-KR`) and `speechSynthesis`
- Works in Chrome, Edge and Safari (Firefox has no speech recognition)

## Develop

```sh
npm install
npm run dev     # local dev server
npm run build   # typecheck + production build
npm run lint
npm test        # unit tests (Hangul scoring)
```
