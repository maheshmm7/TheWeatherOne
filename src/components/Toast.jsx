import React, { useEffect } from 'react'

export default function Toast({ id, type = 'default', message = '', onClose = () => {} }) {
  useEffect(() => {
    const t = setTimeout(() => onClose(id), 3500)
    return () => clearTimeout(t)
  }, [id, onClose])

  return (
    <div className={`toast ${type} fade-in`} role="status" aria-live="polite">
      {message}
    </div>
  )
}
