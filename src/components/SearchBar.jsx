import React, { useState, useRef, useEffect } from 'react'

export default function SearchBar({ onSearch, disabled, recentSearches = [], onSelectRecent }) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)
  const [highlight, setHighlight] = useState(-1)
  const [suggestions, setSuggestions] = useState([])
  const [loadingSuggest, setLoadingSuggest] = useState(false)
  const suggestTimer = useRef(null)

  function submit(e) {
    if (e) e.preventDefault()
    if (!query.trim()) return
    onSearch(query.trim())
    // clear input and hide recent/suggestions after search
    setQuery('')
    setSuggestions([])
    inputRef.current?.blur()
  }

  function handleRecentClick(name) {
    // when selecting a recent suggestion, trigger search and hide the dropdown
    if (onSelectRecent) onSelectRecent(name)
    setQuery('')
    setFocused(false)
    setSuggestions([])
  }

  function handleSuggestionClick(item) {
    // item contains {name, admin1, country}
    const label = item.name
    // trigger search using the place name (App will geocode)
    onSearch(label)
    setQuery('')
    setSuggestions([])
    inputRef.current?.blur()
  }

  function clear() {
    setQuery('')
    setSuggestions([])
    inputRef.current?.focus()
  }

  // filtered recent as before
  const filteredRecent = query
    ? recentSearches.filter((r) => r.toLowerCase().includes(query.toLowerCase()))
    : recentSearches

  function onKeyDown(e) {
    const list = (suggestions && suggestions.length > 0) ? suggestions : filteredRecent
    if (!list || list.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, list.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      if (highlight >= 0) {
        const sel = list[highlight]
        if (suggestions && suggestions.length > 0) {
          handleSuggestionClick(sel)
        } else {
          setQuery(sel)
          if (onSelectRecent) onSelectRecent(sel)
        }
      }
    }
  }

  // debounce suggestions fetch
  useEffect(() => {
    if (suggestTimer.current) clearTimeout(suggestTimer.current)
    if (!query || query.trim().length < 2) {
      setSuggestions([])
      setLoadingSuggest(false)
      return undefined
    }
    setLoadingSuggest(true)
    suggestTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en`)
        const js = await res.json()
        if (js && js.results) {
          setSuggestions(js.results.map(r => ({ name: r.name, admin1: r.admin1 || r.country || '', country: r.country || '', latitude: r.latitude, longitude: r.longitude })))
        } else setSuggestions([])
      } catch (e) {
        setSuggestions([])
      } finally {
        setLoadingSuggest(false)
      }
    }, 320)

    return () => {
      if (suggestTimer.current) clearTimeout(suggestTimer.current)
    }
  }, [query])

  return (
    <div className="relative">
      <form onSubmit={submit} className="flex gap-3">
        <input
          aria-label="City"
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setHighlight(-1) }}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Search city (e.g., London, New York)"
          className="flex-1 rounded-xl border border-slate-200 shadow-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-300"
          disabled={disabled}
        />
        <button
          type="submit"
          className="rounded-xl bg-sky-600 text-white px-5 py-3 font-medium hover:bg-sky-700 disabled:opacity-60"
          disabled={disabled}
        >
          Search
        </button>
        {query && (
          <button type="button" onClick={clear} className="ml-2 text-slate-500" aria-label="Clear">✕</button>
        )}
      </form>

      {focused && suggestions && suggestions.length > 0 && (
        <div role="listbox" aria-label="Location suggestions" className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-10">
          {suggestions.map((s, i) => (
            <button
              key={`${s.name}-${i}`}
              role="option"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSuggestionClick(s)}
              onMouseEnter={() => setHighlight(i)}
              className={`w-full text-left px-4 py-3 ${highlight === i ? 'bg-sky-50' : 'hover:bg-sky-50'}`}
            >
              <div className="text-sm font-medium">{s.name}</div>
              <div className="text-xs text-slate-500">{s.admin1}{s.admin1 && s.country ? ', ' : ''}{s.country}</div>
            </button>
          ))}
        </div>
      )}

      {focused && (!suggestions || suggestions.length === 0) && filteredRecent && filteredRecent.length > 0 && (
        <div role="listbox" aria-label="Recent searches" className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-10">
          {filteredRecent.map((r, i) => (
            <button
              key={r}
              role="option"
              aria-selected={highlight === i}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleRecentClick(r)}
              onMouseEnter={() => setHighlight(i)}
              className={`w-full text-left px-4 py-3 ${highlight === i ? 'bg-sky-50' : 'hover:bg-sky-50'}`}
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
