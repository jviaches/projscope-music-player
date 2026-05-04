<div align="center">

# Projscope Music Player

**A cross-platform desktop music player built with Angular and Electron.**  
Offline playback, internet radio streams, podcast feeds, and a handcrafted UI inspired by the golden era of desktop apps.

[![Windows Build](https://github.com/jviaches/projscope-music-player/actions/workflows/windows.yml/badge.svg)](https://github.com/jviaches/projscope-music-player/actions/workflows/windows.yml)
[![Linux Build](https://github.com/jviaches/projscope-music-player/actions/workflows/ubuntu.yml/badge.svg)](https://github.com/jviaches/projscope-music-player/actions/workflows/ubuntu.yml)
[![Mac Build](https://github.com/jviaches/projscope-music-player/actions/workflows/macos.yml/badge.svg)](https://github.com/jviaches/projscope-music-player/actions/workflows/macos.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)
[![Good First Issues](https://img.shields.io/github/issues/jviaches/projscope-music-player/good%20first%20issue?color=7057ff&label=good%20first%20issues)](https://github.com/jviaches/projscope-music-player/issues?q=is%3Aopen+label%3A%22good+first+issue%22)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

![Player screenshot](https://github.com/user-attachments/assets/72ef3d39-5696-49a6-ad44-407243d32336)

</div>

---

## What is this?

Projscope Music Player is a lightweight, open-source desktop app that puts your music and podcasts in a compact, always-on-top player. It is intentionally small in scope — a focused app that does one thing well — which makes it an ideal project to learn Angular + Electron, ship a real feature end-to-end, and grow as an open source contributor.

**The stack is approachable.** If you know TypeScript and have written any Angular or web frontend code, you can be productive here within an hour. The codebase is clean, well-structured, and has no legacy debt.

**The scope is contained.** Every feature is a self-contained slice of the UI. You are not navigating a million-line monorepo — the entire player lives in one component.

---

## Features

### Playback
- **Multi-format local files** — MP3, WAV, OGG, FLAC, AAC, M4A, WMA, WebM
- **Add files or entire folders** — recursive folder scan picks up all supported files automatically
- **Internet radio streams** — paste any HTTP/HTTPS stream URL and it plays instantly
- **Podcast / RSS feeds** — enter a feed URL, browse episodes in a built-in chooser, add one or all
- **Live stream detection** — LIVE badge replaces the scrubber when duration is infinite

### Playlist
- **Drag-to-reorder** — grab the handle on any track and drop it where you want
- **Persistent queue** — playlist survives restarts, saved to the OS user-data directory
- **Stream & podcast entries persist** — URLs and episodes reload alongside local files on next launch

### Controls
- **Shuffle mode** — random playback that never repeats the current track
- **Repeat mode** — loops the entire playlist end-to-end
- **Volume popover** — vertical slider with a mute toggle, accessible from the transport bar
- **Keyboard-friendly** — Escape closes overlays; media key support planned

### UI
- **V3 Hybrid UI** — spinning vinyl disc, tilted cover art, animated EQ bars
- **Frameless transparent window** — custom minimize/close chrome; drag the header to move
- **Per-song color theming** — cover art gradient is derived from the track title
- **Dark/light theming** — driven by CSS custom properties, ready for theme customization

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

### Run in development

```bash
npm start
```

Starts the Angular dev server on `localhost:4200` and launches Electron pointing at it. Angular source changes reload automatically; Electron main process changes require a restart.

### Run a production build locally

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
├── app/
│   └── main.ts                 # Electron main process — IPC, file dialogs, RSS fetcher
├── src/
│   └── app/
│       ├── core/
│       │   ├── directives/     # ControlColor hover directive
│       │   └── services/
│       │       └── electron/   # ElectronService — IPC bridge, playlist persistence
│       ├── home/               # Main player component (UI + all playback logic)
│       ├── models/             # Song interface
│       └── shared/             # Shared module
├── .github/
│   ├── ISSUE_TEMPLATE/         # Bug report & feature request templates
│   ├── workflows/              # CI — Windows, macOS, Linux
│   └── pull_request_template.md
├── CONTRIBUTING.md
└── CODE_OF_CONDUCT.md
```

---

## Running Tests

```bash
# Unit tests (Jasmine / Karma)
npm test

# End-to-end tests (Playwright, requires production build)
npm run e2e

# Lint
npm run lint
```

---

## Roadmap

These are the directions the project is heading. Every item is an open invitation to contribute.

| Area | What we are building |
|---|---|
| **Audio** | Gapless playback between tracks |
| **Audio** | Equalizer / audio effects panel |
| **Podcast** | Episode playback position memory (resume where you left off) |
| **Podcast** | Feed subscription manager with refresh |
| **UI** | Mini player mode (always-on-top compact view) |
| **UI** | Keyboard shortcuts and media key support |
| **UI** | Waveform visualizer |
| **Playlist** | Smart playlists (most played, recently added) |
| **Accessibility** | Screen reader support and ARIA attributes |
| **Tests** | Expand unit and E2E coverage |

Want to take something from this list? Open an issue first so we can discuss scope and avoid duplicate work.

---

## Contributing

**This project thrives on community contributions.** Whether you are a seasoned Electron developer or just starting out with Angular, there is a place for you here.

### Why contribute here?

- **Contained codebase** — the entire UI is one Angular component. You can hold the whole thing in your head.
- **Real users** — this is a working app that people actually run. Your changes ship.
- **Modern stack** — TypeScript, Angular, RxJS, Electron. All skills that transfer directly to professional work.
- **Responsive maintainers** — PRs receive feedback within a few days, not weeks.
- **No bureaucracy** — no CLAs, no long approval chains. Good code gets merged.

### Ways to get involved

**Just getting started?** These are great entry points:

- Fix a [good first issue](https://github.com/jviaches/projscope-music-player/issues?q=is%3Aopen+label%3A%22good+first+issue%22) — small, well-defined, with context in the issue thread
- Improve test coverage — any new unit test for existing logic is welcome
- Improve accessibility — add `aria-label` attributes, keyboard navigation, or focus management
- Tighten up the SCSS — spot an inconsistency or a magic number? Fix it
- Translate the app — the project uses `ngx-translate`; a new locale file is a self-contained contribution

**Ready for something bigger?**

- Pick an item from the [Roadmap](#roadmap) above and open an issue to claim it
- Propose a feature you have been missing — if it fits the project's focused scope, we will build it together
- Help review open pull requests — code review is a valuable and often overlooked contribution

### How to contribute

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/<your-username>/projscope-music-player.git
cd projscope-music-player

# 2. Add the upstream remote
git remote add upstream https://github.com/jviaches/projscope-music-player.git

# 3. Install dependencies
npm install

# 4. Create a branch
git checkout -b feature/your-feature-name

# 5. Make your changes, run the tests
npm test && npm run lint

# 6. Push and open a pull request
git push origin feature/your-feature-name
```

Full details — branch naming, commit message conventions, PR checklist — are in **[CONTRIBUTING.md](CONTRIBUTING.md)**.

> All contributors are expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md). We are committed to keeping this a welcoming and respectful space.

---

## License

Distributed under the [MIT License](LICENSE). Use it, fork it, ship it.
