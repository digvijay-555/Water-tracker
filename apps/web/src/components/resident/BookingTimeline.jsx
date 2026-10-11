import React, { useState, useEffect } from 'react';

const STATUS_STEPS = [
  { key: 'OPEN', label: 'Requested' },
  { key: 'MATCHED', label: 'Matched' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'EN_ROUTE', label: 'En Route' },
  { key: 'DELIVERED', label: 'Delivered' },
];

export function BookingTimeline({
  bookings = [],
  activeRequest,
  onRefresh,
  tankers = [],
}) {
  const [autoPoll, setAutoPoll] = useState(true);

  // Auto-poll every 6 seconds if active booking is not delivered
  useEffect(() => {
    if (!autoPoll) return;
    const interval = setInterval(() => {
      onRefresh();
    }, 6000);
    return () => clearInterval(interval);
  }, [autoPoll, onRefresh]);

  if (bookings.length === 0 && !activeRequest) {
    return (
      <div className="card text-center" style={{ padding: '3rem 1.5rem', marginTop: '1rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📋</div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.35rem' }}>
          No Active Water Bookings
        </h3>
        <p className="text-muted" style={{ fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto' }}>
          Select a nearby tanker on the map or submit a delivery request to track live telemetry dispatch.
        </p>
      </div>
    );
  }

  // Find primary active booking or request
  const currentBooking = bookings[0] || null;
  const currentStatus = currentBooking?.status || activeRequest?.status || 'OPEN';

  // Determine tanker details
  const linkedTankerId = currentBooking?.tankerId || activeRequest?.tankerId;
  const linkedTanker = tankers.find((t) => t.tankerId === linkedTankerId) || null;

  // Step indices
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === currentStatus);
  const resolvedIndex = currentStepIndex >= 0 ? currentStepIndex : 0;

  let freshnessText = 'Recently';
  if (linkedTanker?.lastLocationUpdate) {
    const diffMins = Math.round(
      (Date.now() - new Date(linkedTanker.lastLocationUpdate).getTime()) / (1000 * 60)
    );
    if (diffMins <= 1) freshnessText = 'Just now';
    else if (diffMins < 60) freshnessText = `${diffMins} mins ago`;
    else freshnessText = `${Math.round(diffMins / 60)} hrs ago`;
  }

  return (
    <div className="tracker-section" aria-label="Active Booking Tracker">
      <div className="tracker-card">
        <div className="tracker-header">
          <div>
            <span className="tracker-id">
              {currentBooking ? `Booking ID: #${currentBooking.bookingId}` : `Request ID: #${activeRequest?.requestId}`}
            </span>
            <h3 className="tracker-title">
              Live Delivery Status:{' '}
              <span className={`badge badge-${currentStatus.toLowerCase()}`}>
                {currentStatus}
              </span>
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onRefresh}
              title="Fetch latest dispatch and GPS updates"
            >
              🔄 Refresh
            </button>
            <label
              style={{
                fontSize: '0.78rem',
                color: 'var(--color-text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={autoPoll}
                onChange={(e) => setAutoPoll(e.target.checked)}
              />
              Live Sync
            </label>
          </div>
        </div>

        {/* 5-Step Timeline */}
        <div className="step-timeline" aria-label="Progress timeline">
          {STATUS_STEPS.map((step, idx) => {
            const isCompleted = idx < resolvedIndex;
            const isCurrent = idx === resolvedIndex;
            return (
              <div
                key={step.key}
                className={`timeline-step ${isCompleted ? 'completed' : ''} ${
                  isCurrent ? 'current' : ''
                }`}
              >
                <div className="step-circle">{isCompleted ? '✓' : idx + 1}</div>
                <div className="step-name">{step.label}</div>
              </div>
            );
          })}
        </div>

        {/* Linked Details Card */}
        <div className="tracker-details-card">
          <div className="tracker-detail-col">
            <span className="tracker-detail-label">Your Requested Water</span>
            <div className="tracker-detail-val">
              {activeRequest?.quantityLitres?.toLocaleString() || currentBooking?.totalQuantityLitres?.toLocaleString() || '2,000'} Litres
            </div>
            <div className="tracker-detail-sub">
              {activeRequest?.waterType === 'DRINKING' ? '💧 Drinking Utility' : '🪣 Non-Drinking Utility'}
            </div>
          </div>

          <div className="tracker-detail-col">
            <span className="tracker-detail-label">Confirmed Price Quote</span>
            <div className="tracker-detail-val highlight-price">
              ₹{(currentBooking?.quotedPrice || activeRequest?.quotedPrice || 1000).toLocaleString()}
            </div>
            <div className="tracker-detail-sub">
              {currentBooking?.requestIds?.length > 1 || currentBooking?.isPooled ? '🤝 Pooled Delivery Rate' : 'Direct Single Rate'}
            </div>
          </div>

          <div className="tracker-detail-col">
            <span className="tracker-detail-label">Assigned Tanker</span>
            <div className="tracker-detail-val">
              {linkedTanker?.displayName || 'Awaiting assignment'}
            </div>
            {linkedTanker?.contactNumber && (
              <div className="tracker-detail-sub text-primary">
                📞 {linkedTanker.contactNumber}
              </div>
            )}
          </div>

          <div className="tracker-detail-col">
            <span className="tracker-detail-label">Telemetry Freshness</span>
            <div className="tracker-detail-val" style={{ fontSize: '0.92rem' }}>
              Updated {freshnessText}
            </div>
            <div className="tracker-detail-sub font-mono">
              {linkedTanker?.latitude ? `${linkedTanker.latitude.toFixed(4)}° N, ${linkedTanker.longitude.toFixed(4)}° E` : 'En route'} ({linkedTanker?.locationSource || 'SIMULATED'})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingTimeline;
