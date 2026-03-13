# CubeFSRS2

A **SolidJS** port of [CubeFSRS](https://github.com/sboagy/cubefsrsvue), a Rubik's Cube algorithm memorization trainer that uses the [Free Spaced Repetition Scheduler (FSRS)](https://github.com/open-spaced-repetition/fsrs4anki) algorithm to help you learn and retain OLL, PLL, and other algorithm sets.

> **Status:** Work in progress — core practice flow, smart cube integration, and algorithm library are functional.

---

## Features

- **FSRS scheduling** — algorithms are surfaced at the optimal time for long-term retention
- **Smart cube support** — connect a GAN Bluetooth cube to track physical moves against the algorithm
- **3D cube viewer** — powered by [cubing.js](https://github.com/cubing/cubing.js) TwistyPlayer; shows the start state of each case
- **Algorithm library** — browse, select, import/export, and manage OLL/PLL/other sets
- **Practice notes** — per-algorithm Recognition, Mnemonic, and Notes fields
- **Yellow-Up / White-Up** orientation support
- **Dark mode**, mirror stickers, and other UI toggles
- **Firebase auth** (optional) — sync practice data across devices

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | [SolidJS](https://solidjs.com) 1.9 |
| Language | TypeScript (strict) |
| Build | [Vite](https://vitejs.dev) 5 |
| Routing | [@solidjs/router](https://github.com/solidjs/solid-router) |
| Styling | [Tailwind CSS](https://tailwindcss.com) 3 |
| Linting/Formatting | [Biome](https://biomejs.dev) |
| Cube visualization | [cubing.js](https://github.com/cubing/cubing.js) |
| Bluetooth | [gan-web-bluetooth](https://github.com/afedotov/gan-web-bluetooth) |
| FSRS | [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) |
| Auth / DB | [Firebase](https://firebase.google.com) 10 |

## Getting Started

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:5174`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run typecheck` | TypeScript type-check (no emit) |
| `npm run lint` | Biome lint |
| `npm run format:write` | Biome format (in-place) |

## Firebase Setup (optional)

Copy the environment template and fill in your Firebase project values:

```bash
cp env.local .env.local   # edit with your Firebase credentials
```

Without Firebase credentials the app runs fully offline — auth and sync are disabled.

## Project Structure

```
src/
  components/       # UI building blocks (CubeViewer, ControlBar, Sidebar, …)
  composables/      # (unused in SolidJS port — logic lives in stores/services)
  data/             # defaultAlgs.json seed catalog
  lib/              # cubeState, orientationMap, legacyMoveHelpers
  router/           # Route definitions
  services/         # Firebase, GAN Bluetooth, FSRS scheduler, localStorage
  stores/           # SolidJS createStore modules (algs, fsrs, practice, tracking, …)
  styles/           # Tailwind CSS entry
  types/            # Shared TypeScript types (Algorithm, DeviceState, …)
  views/            # Page-level components (PracticeView, AlgLibraryView, …)
  App.tsx
  main.tsx
```

## Lineage

CubeFSRS2 is a SolidJS port of [cubefsrsvue](https://github.com/sboagy/cubefsrsvue) (Vue 3), which itself is a port of [CubeFSRS](https://cubedex.app) by [Pau Oliva Fora](https://twitter.com/pof), which was derived from [Cubedex](https://cubedex.app).

## License

MIT — see [LICENSE](LICENSE).

Copyright (c) 2024 Pau Oliva Fora  
Copyright (c) 2026 Scott Boag
