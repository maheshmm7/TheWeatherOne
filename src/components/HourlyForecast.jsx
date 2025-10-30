import React from 'react'

function Sparkline({ points = [], width = 400, height = 60 }) {
  if (!points || points.length === 0) return null
  const max = Math.max(...points)
  const min = Math.min(...points)
  const len = points.length
  const step = width / Math.max(len - 1, 1)
  const pts = points.map((v, i) => {
    const x = i * step
    const y = height - ((v - min) / Math.max(max - min, 1)) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="60" preserveAspectRatio="none" className="rounded-md">
      <polyline fill="none" stroke="#0284c7" strokeWidth="2" points={pts} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function HourlyForecast({ hourly, daily = null, unit = 'C', currentTime }) {
  // hourly: { time: [], temperature_2m: [], precipitation_probability: [], weathercode: [] }
  if (!hourly) return null

  const times = hourly.time || []
  const temps = hourly.temperature_2m || []
  const probs = hourly.precipitation_probability || []
  const codes = hourly.weathercode || []

  // find index of current time
  const idx = times.findIndex((t) => t === currentTime)
  const start = Math.max(0, idx >= 0 ? idx : 0)
  const sliceEnd = Math.min(times.length, start + 24)

  const hours = times.slice(start, sliceEnd).map((t, i) => ({
    time: t,
    temp: temps[start + i],
    prob: probs[start + i],
    code: codes[start + i]
  }))

  const tempsForSpark = hours.map((h) => h.temp)

  return (
    <div className="mt-6 bg-white/60 backdrop-blur rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-slate-700">Next 24 hours</div>
        <div className="text-xs text-slate-500">Hourly forecast</div>
      </div>

      <div className="mb-2">
        <Sparkline points={tempsForSpark} />
      </div>

      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {hours.map((h) => {
          // Prefer sunrise/sunset from daily for accurate day/night per day. Fallback to hour threshold.
          let isNight = false
          try {
            if (daily && Array.isArray(daily.time) && daily.sunrise && daily.sunset && h.time) {
              const date = String(h.time).split('T')[0]
              const idx = daily.time.indexOf(date)
              if (idx >= 0 && daily.sunrise[idx] && daily.sunset[idx]) {
                const sunrise = daily.sunrise[idx]
                const sunset = daily.sunset[idx]
                isNight = !(h.time >= sunrise && h.time < sunset)
              }
            }
            if (typeof isNight !== 'boolean') isNight = false
          } catch (e) {
            isNight = false
          }
          if (!daily) {
            const hourNum = (() => {
              try {
                if (h.time && typeof h.time === 'string') {
                  const parts = h.time.split('T')
                  const hh = parts[1] ? parseInt(parts[1].slice(0, 2), 10) : NaN
                  return Number.isFinite(hh) ? hh : 12
                }
                return 12
              } catch (e) { return 12 }
            })()
            isNight = hourNum < 6 || hourNum >= 18
          }
          const probVal = (h.prob == null) ? 0 : Number(h.prob)
          let probDisplay = ''
          if (probVal === 0) probDisplay = 'No precipitation'
          else if (probVal > 0 && probVal < 1) probDisplay = '<1%'
          else probDisplay = `${Math.round(probVal)}%`

          return (
            <div key={h.time} className="flex-shrink-0 w-20 bg-white rounded-md p-2 text-center border border-slate-100">
              <div className="text-xs text-slate-500">{new Date(h.time).toLocaleTimeString([], { hour: '2-digit', hour12: true })}</div>
              <div className="text-xl">{getHourlyEmoji(h.code, isNight)}</div>
              <div className="text-sm font-semibold">{unit === 'F' ? Math.round((h.temp * 9) / 5 + 32) : Math.round(h.temp)}{unit === 'F' ? '°F' : '°C'}</div>
              <div className="text-xs text-slate-500" title={probVal === 0 ? 'Chance of precipitation: 0%' : `Chance of precipitation: ${probDisplay}`}>{probDisplay}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function getHourlyEmoji(code, isNight) {
  if (code === 0) return isNight ? '🌙' : '☀️'
  if (code >= 1 && code <= 3) return isNight ? '☁️' : '🌤️'
  if (code >= 45 && code <= 48) return '🌫️'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return '🌧️'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return '❄️'
  if (code >= 95 && code <= 99) return '⛈️'
  return isNight ? '☁️' : '☁️'
}
