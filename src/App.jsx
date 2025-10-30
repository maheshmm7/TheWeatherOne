import React, { useState, useEffect, useCallback } from 'react'
import SearchBar from './components/SearchBar'
import WeatherCard from './components/WeatherCardClean'
import HourlyForecast from './components/HourlyForecast'
import SevenDayForecast from './components/SevenDayForecast'
import FavoritesBar from './components/FavoritesBar'
import GeoButton from './components/GeoButton'
import Toast from './components/Toast'

export default function App() {
  // UI mode state
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('theme') === 'dark' } catch (e) { return false }
  })
  // compact mode removed — previously persisted in localStorage

  // Simple toast system
  const [toasts, setToasts] = useState([])
  function addToast(message, type = 'default') {
    const id = Date.now() + Math.random().toString(36).slice(2, 6)
    setToasts((t) => [...t, { id, message, type }])
    return id
  }
  function removeToast(id) { setToasts((t) => t.filter((x) => x.id !== id)) }
  const [weather, setWeather] = useState(null)
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [unit, setUnit] = useState('C') // 'C' or 'F'
  const [recent, setRecent] = useState([])
  const [hourly, setHourly] = useState(null)
  const [daily, setDaily] = useState(null)
  const [favorites, setFavorites] = useState([])

  // aria live text removed — user requested no live text messages

  useEffect(() => {
    try {
      const raw = localStorage.getItem('recentSearches')
      if (raw) setRecent(JSON.parse(raw))
    } catch (e) {
      // ignore
    }
    try {
      const fav = localStorage.getItem('favorites')
      if (fav) setFavorites(JSON.parse(fav))
    } catch (e) {
      // ignore
    }
    // compact mode removed — no body class toggle
  }, [])

  // Keep document theme attribute and localStorage in sync with `dark` state
  useEffect(() => {
    try { localStorage.setItem('theme', dark ? 'dark' : 'light') } catch (e) {}
    try { document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light') } catch (e) {}
  }, [dark])

  // parse query params for share links: ?q=city&u=F
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search)
      const q = p.get('q')
      const u = p.get('u')
      if (u === 'F' || u === 'C') setUnit(u)
      if (q) {
        // slight delay to allow mount
        setTimeout(() => handleSearch(q), 200)
      }
    } catch (e) {
      // ignore
    }
  }, [])

  async function handleSearch(city) {
  setLoading(true)
  setError(null)
  setWeather(null)
  setLocation(null)
  setHourly(null)

    try {
      // Geocoding via Open-Meteo's free geocoding API
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          city
        )}&count=5`
      )
      const geo = await geoRes.json()

      if (!geo || !geo.results || geo.results.length === 0) {
        setError('Location not found. Try another city.')
        setLoading(false)
        return
      }

      const place = geo.results[0]
      setLocation(place)

      const lat = place.latitude
      const lon = place.longitude

      // request current + hourly + daily data (7-day) including sunrise/sunset for accurate day/night
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,precipitation_probability,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max,sunrise,sunset&timezone=auto`
      )
      const data = await weatherRes.json()

      if (!data || !data.current_weather) {
        setError('Weather data unavailable for this location.')
      } else {
  setWeather(data.current_weather)
  setHourly(data.hourly || null)
  setDaily(data.daily || null)
  // user requested no live-text messages here

        // store recent search (unique, most-recent-first, max 6)
        try {
          setRecent((prev) => {
            const name = place.name
            const next = [name, ...prev.filter((p) => p !== name)].slice(0, 6)
            localStorage.setItem('recentSearches', JSON.stringify(next))
            return next
          })
        } catch (e) {
          // ignore storage errors
        }
      }
    } catch (err) {
      console.error(err)
      setError('An error occurred while fetching data.')
    } finally {
      setLoading(false)
    }
  }

  function handleSelectRecent(city) {
    // helper used by SearchBar when user clicks a recent item
    if (!city) return
    // Perform the search, then remove the selected item from the recent list
    handleSearch(city)
    try {
      setRecent((prev) => {
        const next = prev.filter((p) => p !== city)
        localStorage.setItem('recentSearches', JSON.stringify(next))
        return next
      })
    } catch (e) {
      // ignore storage errors
    }
  }

  const handleUseLocation = useCallback(async (lat, lon) => {
    // Try reverse geocoding first, but always fall back to fetching weather directly.
  setLoading(true)
  setError(null)
  setWeather(null)
  setLocation(null)
  setHourly(null)
    try {
      let place = null
      try {
        // Request multiple nearby places so we can pick a nearby city/town if the exact match
        // isn't available. This helps when the device-provided coords are not inside a known
        // named place but close to a town/city.
        const rev = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=5`)
        const js = await rev.json()
        if (js && Array.isArray(js.results) && js.results.length > 0) {
          // Prefer a result that includes admin1 or country (likely a populated place),
          // else fall back to the first result.
          place = js.results.find((r) => r.admin1 || r.country) || js.results[0]
        }
      } catch (e) {
        // Reverse geocode failed — we'll fallback to direct weather fetch.
        console.warn('Reverse geocode failed', e)
      }

      if (place) {
        // Inform the user we're using a nearby place if coordinates weren't an exact match.
  // not showing live text per user preference
        await handleSearch(place.name)
        return
      }

      // Fallback: fetch weather directly for coordinates
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,precipitation_probability,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max,sunrise,sunset&timezone=auto`
      )
      const data = await weatherRes.json()
      if (data && data.current_weather) {
        setWeather(data.current_weather)
        setHourly(data.hourly || null)
        setDaily(data.daily || null)
        setLocation({ name: `Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}`, latitude: lat, longitude: lon })
  // not showing live text per user preference
      } else {
        setError('Weather data unavailable for your location.')
      }
    } catch (e) {
      console.error(e)
      setError('Unable to use your location.')
    } finally {
      setLoading(false)
    }
  }, [handleSearch])

  function mapWeatherToBg(code, darkMode = false) {
    // Return different Tailwind gradient classes for light and dark modes
    if (!darkMode) {
      if (code === 0) return 'from-rose-50 via-sky-100 to-yellow-50'
      if (code >= 1 && code <= 3) return 'from-sky-50 via-white to-slate-50'
      if ((code >= 51 && code <= 82) || (code >= 95 && code <= 99)) return 'from-slate-100 via-slate-200 to-slate-300'
      if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'from-blue-50 via-slate-100 to-white'
      if (code >= 45 && code <= 48) return 'from-slate-50 via-gray-100 to-slate-200'
      return 'from-sky-50 via-white to-slate-50'
    }
    // Dark mode gradients (muted/darker)
    if (code === 0) return 'from-rose-800 via-sky-800 to-yellow-800'
    if (code >= 1 && code <= 3) return 'from-sky-900 via-slate-800 to-slate-700'
    if ((code >= 51 && code <= 82) || (code >= 95 && code <= 99)) return 'from-slate-800 via-slate-700 to-slate-600'
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'from-blue-900 via-slate-800 to-slate-700'
    if (code >= 45 && code <= 48) return 'from-slate-800 via-gray-700 to-slate-700'
    return 'from-sky-900 via-slate-800 to-slate-700'
  }

  const bg = weather ? mapWeatherToBg(weather.weathercode, dark) : (dark ? 'from-sky-900 via-slate-800 to-slate-700' : 'from-sky-50 via-white to-slate-50')

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bg} flex flex-col items-center p-4 md:p-6 transition-all duration-700`}> 
      <div className="max-w-3xl w-full h-full flex flex-col">
  <header className="mb-3 text-center sticky top-0 z-30 header backdrop-blur-md py-3">
          <div className="max-w-3xl mx-auto w-full px-3">
            <div className="header-inner flex flex-col md:flex-row items-center md:justify-between gap-3 px-4 py-3 rounded-2xl">
              <h1 className="text-3xl md:text-4xl font-extrabold">Weather Now</h1>

              <div className="mt-2 md:mt-0 flex items-center justify-center gap-3">
                <div className="control-group inline-flex rounded-xl px-2 py-1 shadow-sm">
                  <button
                    onClick={() => setUnit('C')}
                    className={`themed-btn px-3 py-1 rounded-lg ${unit === 'C' ? 'bg-sky-600 text-white' : ''}`}
                    aria-pressed={unit === 'C'}
                  >°C</button>
                  <button
                    onClick={() => setUnit('F')}
                    className={`themed-btn ml-1 px-3 py-1 rounded-lg ${unit === 'F' ? 'bg-sky-600 text-white' : ''}`}
                    aria-pressed={unit === 'F'}
                  >°F</button>
                </div>
                <div className="ml-3 flex items-center gap-2">
                  <GeoButton onLocate={(lat, lon) => {
                    handleUseLocation(lat, lon)
                  }} onError={(err) => setError(err?.message || 'Unable to use your location.')} />

                  <button
                    className={`theme-toggle ${dark ? 'dark' : 'light'} themed-btn`}
                    onClick={() => setDark((d) => !d)}
                    role="switch"
                    aria-checked={dark}
                    aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                    title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    <span className="icons" aria-hidden="true">
                      <span className="icon sun">☀️</span>
                      <span className="icon moon">🌙</span>
                    </span>
                    <span className="knob" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <FavoritesBar favorites={favorites} onSelect={handleSelectRecent} onRemove={(name) => {
          const next = favorites.filter((f) => f !== name)
          setFavorites(next)
          localStorage.setItem('favorites', JSON.stringify(next))
        }} />

        <SearchBar onSearch={handleSearch} disabled={loading} recentSearches={recent} onSelectRecent={handleSelectRecent} />

        {/* Main content area: constrained to viewport so header/search remain stable */}
        <main className="w-full flex-grow">
          <div className="w-full h-full">
            {loading && (
              <div className="text-center text-sky-600 flex items-center justify-center gap-2">
                <span className="spinner inline-block w-6 h-6 border-4 border-sky-300 border-t-transparent rounded-full" />
                <span>Loading…</span>
              </div>
            )}

            {error && (
              <div className="mt-4 text-center text-red-600">{error}</div>
            )}

            {weather && location && (
              <div className="w-full">
                <div className="w-full">
                  <WeatherCard weather={weather} location={location} unit={unit} favorites={favorites} setFavorites={setFavorites} addToast={addToast} daily={daily} />
                </div>

                <div className="mt-4">
                  {hourly && <HourlyForecast hourly={hourly} daily={daily} unit={unit} currentTime={weather.time} />}
                </div>

                <div className="mt-4 overflow-x-auto">
                  {/* Make the 7-day forecast horizontally scrollable to avoid vertical expansion */}
                  {daily && <div className="inline-block min-w-full"><SevenDayForecast daily={daily} unit={unit} /></div>}
                </div>
              </div>
            )}

            {!weather && !loading && (
              <div className="mt-8 text-center text-slate-500">Search for a city to see current weather.</div>
            )}

          </div>
  </main>

  {/* Toast container */}
        <div className="toast-container" aria-live="polite">
          {toasts.map((t) => (
            <Toast key={t.id} id={t.id} type={t.type === 'info' ? 'info' : ''} message={t.message} onClose={removeToast} />
          ))}
        </div>

        {/* Footer removed per user request */}
      </div>
    </div>
  )
}
