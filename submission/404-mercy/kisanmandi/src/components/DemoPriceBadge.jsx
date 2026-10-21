import React, { useState, useRef, useEffect } from 'react';

export default function DemoPriceBadge({ label = 'Demo Prices', className = '', style = {} }) {
  const [open, setOpen] = useState(false);
  const badgeRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (badgeRef.current && !badgeRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [open]);

  return (
    <div
      ref={badgeRef}
      className={`demo-badge-wrap ${className}`}
      style={style}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="demo-badge-btn"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        aria-label={`${label}: Demonstration prices for preview purposes. Actual mandi rates are not connected yet.`}
      >
        <span className="demo-badge-dot" />
        <span className="demo-badge-text">{label}</span>
        <span className="demo-badge-icon" aria-hidden="true">ⓘ</span>
      </button>

      {open && (
        <div className="demo-badge-tooltip" role="tooltip">
          <p className="demo-badge-tooltip-title">Preview Rate</p>
          <p className="demo-badge-tooltip-desc">
            Demonstration prices for preview purposes. Actual mandi rates are not connected yet.
          </p>
        </div>
      )}
    </div>
  );
}
