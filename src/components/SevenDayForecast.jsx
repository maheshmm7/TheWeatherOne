import React, { useState, useRef, useEffect } from 'react'
import Modal from './Modal'

const ICON = 32

function smallIcon(code) {
  if (code === 0) return <span aria-hidden style={{fontSize: '20px'}}>☀️</span>
  if (code >= 1 && code <= 3) return <span aria-hidden style={{fontSize: '20px'}}>🌤️</span>
  if (code >= 45 && code <= 48) return <span aria-hidden style={{fontSize: '20px'}}>🌫️</span>
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return <span aria-hidden style={{fontSize: '20px'}}>🌧️</span>
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return <span aria-hidden style={{fontSize: '20px'}}>❄️</span>
  if (code >= 95 && code <= 99) return <span aria-hidden style={{fontSize: '20px'}}>⛈️</span>
  return <span aria-hidden style={{fontSize: '20px'}}>☁️</span>
}

export default function SevenDayForecast({ daily = {}, unit = 'C' }) {
  if (!daily || !daily.time || !daily.time.length) return null

  const dates = daily.time.slice(0, 7)
  const max = daily.temperature_2m_max || []
  const min = daily.temperature_2m_min || []
  const codes = daily.weathercode || []
  const prec = daily.precipitation_probability_max || []

  // Create an ordered list of the seven days starting Monday -> Sunday
  const orderedWeekdays = [1, 2, 3, 4, 5, 6, 0] // Mon..Sun (0 = Sunday)
  const ordered = orderedWeekdays.map((wd) => {
    const idx = dates.findIndex((d) => new Date(d).getDay() === wd)
    if (idx === -1) return null
    const d = dates[idx]
    return {
      date: d,
      i: idx,
      label: new Date(d).toLocaleDateString(undefined, { weekday: 'short' }),
      tmax: max[idx] ?? null,
      tmin: min[idx] ?? null,
      code: codes[idx] ?? null,
      p: (prec && prec[idx] != null) ? prec[idx] : null,
    }
  }).filter(Boolean)

  const [selected, setSelected] = useState(null)
  const scrollerRef = useRef(null)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(false)

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    function update() {
      setShowLeft(el.scrollLeft > 8)
      setShowRight(el.scrollWidth > el.clientWidth + el.scrollLeft + 8)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [dates.length])

  function weatherLabel(code) {
    if (code === 0) return 'Clear'
    if (code >= 1 && code <= 3) return 'Partly cloudy'
    if (code >= 45 && code <= 48) return 'Fog'
    if (code >= 51 && code <= 67) return 'Rain'
    if (code >= 71 && code <= 77) return 'Snow'
    if (code >= 80 && code <= 82) return 'Rain showers'
    if (code >= 95 && code <= 99) return 'Thunderstorm'
    return 'Cloudy'
  }

  return (
    <>
      {/* Title for the 7-day forecast */}
      <h2 className="mt-6 text-lg font-semibold">7-Day Forecast</h2>

      {/* Desktop / large: grid layout (won't compress vertically) */}
      <div className="mt-3 hidden md:grid md:grid-cols-7 gap-3">
        {ordered.map((it) => {
          const { date: d, i, label, tmax, tmin, code } = it
          const tmaxDisplay = tmax != null ? (unit === 'F' ? Math.round((tmax * 9) / 5 + 32) : Math.round(tmax)) : '-'
          const tminDisplay = tmin != null ? (unit === 'F' ? Math.round((tmin * 9) / 5 + 32) : Math.round(tmin)) : '-'

          return (
            <div key={d} className={`bg-white/60 rounded-lg p-2 text-center shadow-sm border border-slate-100`}>
              <button onClick={() => setSelected(i)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(i) } }} aria-expanded={selected === i} className="w-full">
                <div className="text-xs text-slate-500">{label}</div>
                <div className="text-2xl mt-1 mx-auto">{smallIcon(code)}</div>
                <div className="text-sm text-slate-700">{tmaxDisplay}° / {tminDisplay}°</div>
              </button>
            </div>
          )
        })}
      </div>

      {/* Mobile / small screens: horizontal scroller with fixed-height cards to avoid vertical compression */}
      <div className="mt-6 md:hidden">
        <div className="scroller-wrap">
          {showLeft && <div className="scroller-shadow-left" aria-hidden />}
          {showRight && <div className="scroller-shadow-right" aria-hidden />}
          {showLeft && <button aria-hidden className="scroller-arrow left" onClick={() => { scrollerRef.current?.scrollBy({ left: -120, behavior: 'smooth' }) }}>&larr;</button>}
          {showRight && <button aria-hidden className="scroller-arrow right" onClick={() => { scrollerRef.current?.scrollBy({ left: 120, behavior: 'smooth' }) }}>&rarr;</button>}
          <div ref={scrollerRef} className="flex gap-3 overflow-x-auto pb-2" style={{ paddingBottom: 6 }}>
          {ordered.map((it) => {
            const { date: d, i, label, tmax, tmin, code } = it
            const tmaxDisplay = tmax != null ? (unit === 'F' ? Math.round((tmax * 9) / 5 + 32) : Math.round(tmax)) : '-'
            const tminDisplay = tmin != null ? (unit === 'F' ? Math.round((tmin * 9) / 5 + 32) : Math.round(tmin)) : '-'

            return (
              <div key={d} className="flex-shrink-0 w-36 h-32 bg-white/60 rounded-lg p-2 text-center shadow-sm border border-slate-100">
                <button onClick={() => setSelected(i)} className="w-full h-full flex flex-col justify-center items-center gap-1">
                  <div className="text-xs text-slate-500">{label}</div>
                  <div className="text-2xl">{smallIcon(code)}</div>
                  <div className="text-sm text-slate-700">{tmaxDisplay}° / {tminDisplay}°</div>
                </button>
              </div>
            )
          })}
          </div>
        </div>
      </div>

      {/* Modal for selected day details — does not affect layout or page height */}
      <Modal open={selected != null} onClose={() => setSelected(null)} ariaLabel="Day details">
        {selected != null && (() => {
          const i = selected
          const d = dates[i]
          const code = codes[i]
          const label = weatherLabel(code)
          const tmax = max[i] ?? '-'
          const tmin = min[i] ?? '-'
          const p = (prec && prec[i] != null) ? prec[i] : null
          let pDisplay = null
          if (p == null) pDisplay = null
          else if (p === 0) pDisplay = 'No precipitation expected'
          else if (p > 0 && p < 1) pDisplay = '<1%'
          else pDisplay = `${Math.round(p)}%`

          return (
            <div>
              <h3 className="text-lg font-semibold mb-2">{new Date(d).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
              <div className="flex items-center gap-4 mb-3">
                <div className="text-3xl">{smallIcon(code)}</div>
                <div>
                  <div className="font-bold">{label}</div>
                  <div className="text-sm text-slate-500">High / Low: {unit === 'F' ? Math.round((tmax * 9) / 5 + 32) : tmax}° / {unit === 'F' ? Math.round((tmin * 9) / 5 + 32) : tmin}°</div>
                </div>
              </div>
              {p != null && <div className="text-sm" title={`Chance of precipitation: ${p}%`}>Precipitation: {pDisplay}</div>}
            </div>
          )
        })()}
      </Modal>
    </>
  )
}
