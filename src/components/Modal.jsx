import React from 'react'

export default function Modal({ open, onClose, children, ariaLabel = 'Dialog' }) {
  if (!open) return null
  return (
    <div className="modal-overlay" role="dialog" aria-label={ariaLabel} onMouseDown={onClose}>
      <div className="modal-content" onMouseDown={(e) => e.stopPropagation()}>
        <button className="modal-close" aria-label="Close" onClick={onClose}>✕</button>
        {children}
      </div>
    </div>
  )
}
