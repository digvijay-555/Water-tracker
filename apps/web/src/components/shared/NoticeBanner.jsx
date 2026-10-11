import React, { useState } from 'react';

export function NoticeBanner({
  message = 'Demonstration Environment: Tanker locations and availability are simulated for Chhatrapati Sambhajinagar, Maharashtra. No production identity or payment gateway is active.',
  type = 'info',
  dismissible = true,
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const icon = {
    info: 'ℹ️',
    warning: '⚠️',
    caution: '🚨',
  }[type] || 'ℹ️';

  return (
    <aside className={`notice-banner notice-banner-${type}`} role="alert">
      <div className="notice-banner-body">
        <span className="notice-banner-icon">{icon}</span>
        <span className="notice-banner-msg">{message}</span>
      </div>
      {dismissible && (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="notice-banner-close"
          aria-label="Dismiss banner"
        >
          &times;
        </button>
      )}
    </aside>
  );
}

export default NoticeBanner;
