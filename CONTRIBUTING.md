# Contributing to Projscope Music Player

Thank you for taking the time to contribute! This guide explains how to get your development environment set up, how we structure branches and commits, and what we expect from pull requests.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Report a Bug](#how-to-report-a-bug)
- [How to Request a Feature](#how-to-request-a-feature)
- [Development Setup](#development-setup)
- [Branch Naming](#branch-naming)
- [Making Changes](#making-changes)
- [Commit Messages](#commit-messages)
- [Opening a Pull Request](#opening-a-pull-request)
- [Code Style](#code-style)

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating you agree to abide by its terms. Please report unacceptable behaviour to the maintainers via a GitHub issue marked **[conduct]**.

---

## How to Report a Bug

1. Search [existing issues](https://github.com/jviaches/projscope-music-player/issues) to avoid duplicates.
2. Open a new issue using the **Bug Report** template.
3. Include your OS, Node.js version, and Electron version.
4. Attach screenshots or a screen recording if the bug is visual.

---

## How to Request a Feature

1. Search [existing issues](https://github.com/jviaches/projscope-music-player/issues) first.
2. Open a new issue using the **Feature Request** template.
3. Describe the problem you're solving, not just the solution you have in mind.

---

## Development Setup

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 14 |
| npm | ≥ 7 |

### Steps

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/<your-username>/projscope-music-player.git
cd projscope-music-player

# 2. Add the upstream remote
git remote add upstream https://github.com/jviaches/projscope-music-player.git

# 3. Install dependencies
npm install

# 4. Start the dev server (Angular + Electron with hot reload)
npm start
```

The Angular app runs on `http://localhost:4200`; Electron picks it up automatically.

### Useful Scripts

| Command | What it does |
|---|---|
| `npm start` | Angular dev server + Electron (hot reload) |
| `npm test` | Jasmine/Karma unit tests |
| `npm run e2e` | Playwright end-to-end tests |
| `npm run lint` | ESLint check |
| `npm run electron:local` | Production build + launch |
| `npm run build:prod` | Production build only |

---

## Branch Naming

Branch off `main`. Use one of these prefixes:

| Prefix | When to use |
|---|---|
| `feature/` | New functionality |
| `fix/` | Bug fix |
| `refactor/` | Code restructure with no behaviour change |
| `docs/` | Documentation only |
| `chore/` | Tooling, CI, dependency updates |

Examples: `feature/equalizer-panel`, `fix/playlist-persist-on-delete`, `docs/update-contributing`

---

## Making Changes

- Keep each branch focused on a single concern.
- Write or update unit tests for any logic you add or change.
- Run `npm test` and `npm run lint` before pushing — CI runs both on every PR.
- Do not commit build artefacts (`dist/`, `app/*.js`, `app/*.js.map`).

---

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

[optional body]
```

Common types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `style`

Examples:
```
feat(player): add gapless playback between tracks
fix(playlist): prevent crash when deleting the last song
refactor(ipc): replace webContents listener with ipcMain handlers
docs: add contributing guide
```

---

## Opening a Pull Request

1. Push your branch to your fork: `git push origin feature/my-feature`
2. Open a pull request against `main` in the upstream repo.
3. Fill in the PR template — describe what changed and why.
4. Link the issue your PR addresses using `Fixes #<number>` in the description.
5. Keep PRs small and focused; large all-in-one PRs are hard to review.
6. A maintainer will review within a few days. Please address review comments promptly.

---

## Code Style

- **TypeScript** — ESLint config is at `.eslintrc.json`; run `npm run lint` to check.
- **SCSS** — use CSS custom properties (`--theme-color`, `--text-color`, etc.) instead of hard-coded values.
- **Angular templates** — prefer `[attr]="expr"` binding over inline `style`/`class` strings.
- **Comments** — only when the *why* is non-obvious. No narrative or redundant comments.
- **No `console.log`** in production code paths.

---

Thank you for contributing!
