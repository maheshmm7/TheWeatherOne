import React from 'react'

export default function FavoritesBar({ favorites = [], onSelect, onRemove }) {
  if (!favorites || favorites.length === 0) return null
  return (
    <div className="mt-4 flex gap-2 flex-wrap">
      {favorites.map((f) => (
        <div key={f} className="inline-flex items-center gap-2 bg-white/60 px-3 py-1 rounded-full border border-slate-100">
          <button onClick={() => onSelect && onSelect(f)} className="text-sm text-slate-700">{f}</button>
          <button onClick={() => onRemove && onRemove(f)} className="text-xs text-slate-500">✕</button>
        </div>
      ))}
    </div>
  )
}
