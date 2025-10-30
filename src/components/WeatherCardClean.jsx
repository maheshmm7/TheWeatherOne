import React, { useState, useEffect } from 'react'

// Emoji-based static icons mapping. Accepts code and isNight flag to show moon variants at night.
const weatherIconSVG = (code, isNight) => {
  // Night variants: use moon or darker symbols
  if (code === 0) return <span aria-hidden style={{fontSize: '56px'}}>{isNight ? '🌙' : '☀️'}</span>
  if (code >= 1 && code <= 3) return <span aria-hidden style={{fontSize: '56px'}}>{isNight ? '☁️' : '🌤️'}</span>
  if (code >= 45 && code <= 48) return <span aria-hidden style={{fontSize: '56px'}}>🌫️</span>
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return <span aria-hidden style={{fontSize: '56px'}}>🌧️</span>
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return <span aria-hidden style={{fontSize: '56px'}}>❄️</span>
  if (code >= 95 && code <= 99) return <span aria-hidden style={{fontSize: '56px'}}>⛈️</span>
  return <span aria-hidden style={{fontSize: '56px'}}>{isNight ? '☁️' : '☁️'}</span>
}

const weatherCodeToLabel = (code) => {
  if (code === 0) return 'Clear'
  if (code === 1) return 'Mainly clear'
  if (code === 2) return 'Partly cloudy'
  if (code === 3) return 'Overcast'
  if (code >= 45 && code <= 48) return 'Fog'
  if (code >= 51 && code <= 67) return 'Rain'
  if (code >= 71 && code <= 77) return 'Snow'
  if (code >= 80 && code <= 82) return 'Rain showers'
  if (code >= 95 && code <= 99) return 'Thunderstorm'
  return 'Cloudy'
}

export default function WeatherCardClean({ weather = {}, location = {}, unit = 'C', favorites = [], setFavorites = () => {}, addToast = () => {}, daily = null }) {
  if (!weather || !location) return null

  const [liked, setLiked] = useState(false)

  useEffect(() => {
    try {
      setLiked(Boolean(favorites.find((f) => f === location.name)))
    } catch (e) {
      setLiked(false)
    }
  }, [favorites, location])

  // Determine if it's night using precise sunrise/sunset if available, otherwise fallback to hour threshold
  let isNight = false
  try {
    if (daily && daily.time && Array.isArray(daily.time) && daily.sunrise && daily.sunset && weather && weather.time) {
      // Extract date portion from weather.time (e.g. '2025-10-29T21:00')
      const date = String(weather.time).split('T')[0]
      const idx = daily.time.indexOf(date)
      if (idx >= 0 && daily.sunrise[idx] && daily.sunset[idx]) {
        const sunrise = daily.sunrise[idx]
        const sunset = daily.sunset[idx]
        // Compare ISO-like strings directly (both are in location local time when timezone=auto)
        isNight = !(weather.time >= sunrise && weather.time < sunset)
      }
    }
    if (!isNight && !(daily && daily.time && daily.sunrise && daily.sunset)) {
      // Fallback: parse hour from the API-provided local time string
      if (weather && weather.time && typeof weather.time === 'string') {
        const parts = weather.time.split('T')
        const hh = parts[1] ? parseInt(parts[1].slice(0, 2), 10) : NaN
        const hour = Number.isFinite(hh) ? hh : new Date(weather.time).getHours()
        isNight = hour < 6 || hour >= 18
      }
    }
  } catch (e) {
    isNight = false
  }

  const icon = weatherIconSVG(weather.weathercode, isNight)
  const label = weatherCodeToLabel(weather.weathercode)

  const tempC = typeof weather.temperature === 'number' ? weather.temperature : 0
  const temp = unit === 'F' ? Math.round((tempC * 9) / 5 + 32) : Math.round(tempC)
  const tempUnit = unit === 'F' ? '°F' : '°C'

  const windKmh = weather.windspeed || 0
  const wind = unit === 'F' ? `${Math.round(windKmh / 1.609)} mph` : `${windKmh} km/h`

  function toggleFavorite() {
    try {
      setFavorites((prev = []) => {
        const exists = prev.includes(location.name)
        const next = exists ? prev.filter((p) => p !== location.name) : [location.name, ...prev].slice(0, 8)
        localStorage.setItem('favorites', JSON.stringify(next))
        return next
      })
    } catch (e) {
      // ignore
    }
  }

  function shareSnapshot() {
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('q', location.name)
      url.searchParams.set('u', unit)
      navigator.clipboard?.writeText(url.toString())
      addToast('Share URL copied to clipboard', 'info')
    } catch (e) {
      // ignore
    }
  }

  return (
  <div className={`mt-6 bg-white/60 backdrop-blur rounded-2xl p-6 shadow-lg border border-slate-100 transform transition duration-300 hover:scale-[1.01] animate-card`}>
      <div className="flex items-center gap-4">
        <div className="text-6xl">{icon}</div>
        <div>
          <div className="text-xl font-semibold text-sky-800">{location.name}{location.country ? `, ${location.country}` : ''}</div>
          <div className="text-sm text-slate-500">Lat {Number(location.latitude || 0).toFixed(2)}, Lon {Number(location.longitude || 0).toFixed(2)}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-5xl font-extrabold text-slate-800 transition-transform duration-300 ease-in-out transform hover:scale-105 temp-breath">{temp}{tempUnit}</div>
          <div className="text-sm text-slate-500">{label} • Wind {wind}</div>
        </div>
      </div>

      <div className="mt-4 text-slate-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div><strong>Time:</strong> {weather.time ? new Date(weather.time).toLocaleString() : '-'}</div>
        <div className="flex items-center gap-3">
          <button onClick={toggleFavorite} aria-pressed={liked} className={`themed-btn px-3 py-1 rounded-md ${liked ? 'bg-yellow-300 text-black' : ''} border border-slate-200`}>
            {liked ? '★ Favorited' : '☆ Save'}
          </button>
          <button onClick={shareSnapshot} className="themed-btn px-3 py-1 rounded-md border border-slate-200">Share</button>
        </div>
      </div>
    </div>
  )
}
