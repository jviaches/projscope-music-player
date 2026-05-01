<div align="center">

# Projscope Music Player

A cross-platform, offline desktop music player built with Angular and Electron — inspired by the classic Winamp experience.

[![Windows Build](https://github.com/jviaches/projscope-music-player/actions/workflows/windows.yml/badge.svg)](https://github.com/jviaches/projscope-music-player/actions/workflows/windows.yml)
[![Linux Build](https://github.com/jviaches/projscope-music-player/actions/workflows/ubuntu.yml/badge.svg)](https://github.com/jviaches/projscope-music-player/actions/workflows/ubuntu.yml)
[![Mac Build](https://github.com/jviaches/projscope-music-player/actions/workflows/macos.yml/badge.svg)](https://github.com/jviaches/projscope-music-player/actions/workflows/macos.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/jviaches/projscope-music-player/issues)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

![Player screenshot](https://github.com/user-attachments/assets/72ef3d39-5696-49a6-ad44-407243d32336)

</div>

---

## Features

- **Offline playback** — no internet connection required; all audio processed locally
- **Multi-format support** — MP3, WAV, OGG, FLAC, AAC, M4A, WMA, WebM
- **Add files or entire folders** — recursive folder scan picks up all supported files
- **Drag-to-reorder playlist** — grab the handle next to any track and drop it where you want
- **Shuffle & Repeat modes** — per-session toggle with visual indicator
- **Volume popover** — vertical slider with mute toggle, accessible from the transport bar
- **Persistent playlist** — queue is saved to the OS user-data directory and restored on next launch
- **Animated V3 Hybrid UI** — spinning vinyl disc, tilted cover art, animated EQ bars
- **Frameless transparent window** — custom minimize/close chrome; drag the header to move

---

## Technology Stack

| Layer | Technology |
|---|---|
| UI framework | Angular 13.2.4 |
| Desktop shell | Electron 17.1.0 |
| Renderer ↔ Main bridge | @electron/remote 2.0.8 |
| Language | TypeScript ~4.5.5 |
| Reactive streams | RxJS 7.5.0 |
| Styling | SCSS + CSS custom properties |
| Build & packaging | electron-builder 22 |
| Testing | Jasmine / Karma · Playwright |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 14
- npm ≥ 7

### Install

```bash
git clone https://github.com/jviaches/projscope-music-player.git
cd projscope-music-player
npm install
```

### Run in development (Angular + Electron with hot reload)

```bash
npm start
```

Starts the Angular dev server on port 4200 and launches Electron pointing at it. Changes to Angular source files reload automatically.

### Run production build locally

```bash
npm run electron:local
```

### Package for distribution

| Platform | Command |
|---|---|
| Windows | `npm run deploy:win` |
| macOS | `npm run deploy:mac` |
| Linux | `npm run deploy:linux` |

---

## Project Structure

```
projscope-music-player/
├── app/                        # Electron main process
│   └── main.ts
├── src/
│   └── app/
│       ├── core/
│       │   ├── directives/     # control-color hover directive
│       │   └── services/
│       │       └── electron/   # ElectronService — IPC, playlist persistence
│       ├── home/               # Main player component (UI + playback logic)
│       ├── models/             # Song interface
│       └── shared/             # Shared module, WebviewDirective
├── .github/
│   ├── ISSUE_TEMPLATE/         # Bug report & feature request templates
│   ├── workflows/              # CI pipelines (Windows, macOS, Linux)
│   └── pull_request_template.md
├── CONTRIBUTING.md
└── CODE_OF_CONDUCT.md
```

---

## Running Tests

```bash
# Unit tests
npm test

# End-to-end tests (requires a production build)
npm run e2e
```

---

## Contributing

Contributions of all kinds are welcome — bug fixes, new features, UI improvements, documentation, or test coverage.

**[Read the Contributing Guide →](CONTRIBUTING.md)**

Quick summary:

1. Fork the repo and create a branch from `main` using the naming convention in the guide
2. Make your changes and add tests where relevant
3. Ensure `npm test` and `npm run lint` both pass
4. Open a pull request — the template will guide you through what to include

Please follow the [Code of Conduct](CODE_OF_CONDUCT.md) in all project spaces.

---

## License

Distributed under the [MIT License](LICENSE).
