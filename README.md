# 🌦️ The Weather One Application

A sleek, modern, and responsive Weather Web Application built using React, Vite, and Tailwind CSS.
It fetches real-time weather updates using the Open-Meteo API — providing accurate forecasts, temperature trends, and other essential metrics without requiring an API key.

This project focuses on clarity, speed, and design consistency, blending smooth UI animations with responsive layouts for a delightful user experience on both desktop and mobile.


# ✨ Overview

The Weather One App is designed to give users a fast and elegant way to check weather conditions around the world.
With an intuitive search interface and real-time updates, users can view:

- Current weather with temperature, conditions, and icons.

- Hourly forecasts visualized as sparklines and cards.

- 7-day forecasts with clickable cards that expand into detailed daily summaries.

- Every interaction feels instant — thanks to Vite’s blazing-fast dev environment and Tailwind’s utility-first styling.

## Table of contents
- [Demo / Preview](#demo--preview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Install & run (developer)](#install--run-developer)
- [Build & preview production bundle](#build--preview-production-bundle)
- [Deployment](#deployment)
- [Project structure & important files](#project-structure--important-files)
- [Data sources & API usage](#data-sources--api-usage)
- [Local persistence & keys](#local-persistence--keys)
- [Accessibility & behavior notes](#accessibility--behavior-notes)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License & attribution](#license--attribution)

---

## Demo / Preview
Run the dev server locally (instructions below) and open the URL Vite prints (commonly http://localhost:5173).

## Features
- Search for cities using the Open‑Meteo geocoding API (debounced suggestions built into the search component).
- Current weather card with large icon and temperature display.
- Hourly sparkline + hourly cards for the next 24 hours.
- 7‑day forecast with a modal for day details.
- Unit toggle (°C / °F).
- Dark / Light theme toggle (animated switch, persists choice).
- Geolocation (“Use my location”) with reverse geocoding fallback.
- Favorites and recent searches (persisted to localStorage).
- Non-blocking toast notifications for copy/share/save actions.

## Tech stack
- React 18 + Vite
- Tailwind CSS for utility-first styling
- Open‑Meteo (free) — geocoding + weather API
- No backend required; purely client-side SPA

## Prerequisites
- Node.js (LTS recommended, e.g. 16.x or later)
- npm (bundled with Node)

## Install & run (developer)
Open PowerShell in the project root and run:

```powershell
# Install dependencies
npm install

# Start dev server (Vite)
npm run dev
```

Vite will start a dev server and print the local URL (usually http://localhost:5173). Open it in your browser.

Notes for Windows users: use PowerShell or cmd; the commands above are cross-platform.

## Build & preview production bundle
To build a production-optimized bundle and preview it locally:

```powershell
# Build
npm run build

# Preview production build locally
npm run preview
```

The `build` command outputs static files into `dist/` which you can deploy to any static hosting provider.

## Deployment
Because the app is a static SPA produced by Vite, deploy the contents of the `dist/` folder to any static host:
- Netlify – drag and drop `dist/` or configure a build step `npm run build` + publish `dist/`.
- Vercel – connect the repo, set build command `npm run build`, and publish directory `dist/`.
- GitHub Pages – use a CI step to build and push `dist/` to the `gh-pages` branch.

There are many guides for deploying Vite apps to specific providers; the important part is publishing the `dist/` output.

## Project structure & important files
Top-level:

- `index.html` — Vite entry
- `package.json` — scripts & dependencies
- `vite.config.js` — vite config
- `tailwind.config.cjs` & `postcss.config.cjs` — Tailwind configuration

src/ (main app):
- `main.jsx` — React entry, mounts the app
- `App.jsx` — application coordinator, state, fetches, layout
- `components/`
  - `SearchBar.jsx` — search input, suggestions, recent searches
  - `WeatherCardClean.jsx` — main current weather card, save/share actions
  - `HourlyForecast.jsx` — hourly sparkline and hourly cards
  - `SevenDayForecast.jsx` — 7-day grid / horizontal scroller + modal details
  - `GeoButton.jsx` — geolocation button wrapper
  - `FavoritesBar.jsx` — saved locations bar
  - `Toast.jsx` and `Modal.jsx` — small UI primitives
- `styles/index.css` — Tailwind directives + custom CSS for animations, toggle, header, etc.

If you rework or move components, update `App.jsx` imports accordingly.

## Data sources & API usage
This app uses Open‑Meteo (no API key required):

- Geocoding: `https://geocoding-api.open-meteo.com/v1/search?name={city}&count=5`
- Reverse geocoding: `https://geocoding-api.open-meteo.com/v1/reverse?latitude={lat}&longitude={lon}&count=5`
- Forecast: `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true&hourly=temperature_2m,precipitation_probability,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max,sunrise,sunset&timezone=auto`

Notes:
- `timezone=auto` ensures the API returns times in the location's local time, which the UI uses for day/night decisions and formatting.
- Daily fields request sunrise/sunset so the UI can accurately pick day/night icons.

## Local persistence & keys
The app uses `localStorage` to persist small client preferences and lists:
- `recentSearches` — array of most recent city names
- `favorites` — saved favorite locations
- `theme` — `dark` or `light`

If you want to reset stored data while debugging, open devtools → Application → Local Storage and remove keys above.

## Accessibility & behavior notes
- Theme toggle is implemented as a `role="switch"` with `aria-checked` and a visible animated knob.
- Search suggestions use ARIA roles for listbox behavior and keyboard navigation.
- Modal supports closing by a close control; adding an explicit focus-trap would further improve a11y (recommended next step).

## UX decisions / implementation notes
- The 7‑day forecast is displayed with weekday labels (short form, localized). Code maps the returned 7-day slice into a Monday→Sunday ordering for consistent presentation.
- The hourly cards show precipitation probability — the UI displays `No precipitation` for `0%`, `'<1%'` for tiny non-zero probabilities, and rounded percentages otherwise.
- Emojis are used as weather icons for simplicity and platform consistency; you may swap these for SVG icons in `WeatherCardClean.jsx` and `SevenDayForecast.jsx`.

## Troubleshooting
- If the app shows blank data or network errors:
  - Check your dev console for fetch errors. The geocoding and forecast endpoints are public; ensure your network allows outbound HTTPS.
  - Confirm Vite is running and your browser is loading the correct local URL printed by Vite.
- If times/days appear off: make sure `timezone=auto` is present in the forecast fetch; otherwise API times may be UTC.

## Tests
This project currently doesn't include automated tests. Suggested quick additions:
- Small Jest/React Testing Library tests for `SearchBar` and `SevenDayForecast` rendering logic.
- Snapshot tests for `WeatherCardClean`.

## Contribution
Feel free to open issues or pull requests. A suggested workflow:

1. Fork the repository
2. Create a topic branch: `git checkout -b feat/my-change`
3. Run and test locally, add necessary tests
4. Open a PR describing the change and why

Keep changes small and focused.

## License & attribution
- The project code here is yours to license as you prefer. If you include an open-source license, add a `LICENSE` file.
- Data and geocoding are provided by Open‑Meteo (https://open-meteo.com/). If you later swap providers, update the README and attribution accordingly.

---

If you'd like, I can also:
- Add screenshots/gifs to this README for visual documentation.
- Expand the Contribution section into a full CONTRIBUTING.md.
- Add CI config (GitHub Actions) for linting, building, and optional preview deployment.

Happy to add any of those — tell me which you'd like next.
