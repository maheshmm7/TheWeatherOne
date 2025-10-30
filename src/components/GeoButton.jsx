import React from 'react'

export default function GeoButton({ onLocate, onError }) {
  async function handleClick() {
    if (!navigator.geolocation) {
      onError && onError(new Error('Geolocation is not supported by this browser'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => onLocate && onLocate(pos.coords.latitude, pos.coords.longitude),
      (err) => onError && onError(err),
      { enableHighAccuracy: false, timeout: 10000 }
    )
  }

  return (
    <button onClick={handleClick} className="rounded-lg px-3 py-1 bg-white/70 hover:bg-white text-sm text-slate-700 border border-slate-200" aria-label="Use my location">
      📍 Use my location
    </button>
  )
}
