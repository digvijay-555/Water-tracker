import React from 'react';

export function PoolingModal({
  isOpen,
  onClose,
  poolOffer,
  onAcceptPool,
  onDeclinePool,
}) {
  if (!isOpen || !poolOffer) return null;

  const {
    candidateTankerName,
    combinedQuantityLitres = 3000,
    individualLitres = 1000,
    quotedPrice = 475,
    standardPrice = 500,
    savingsInr = 25,
    message,
    matchedRequestsCount = 2,
  } = poolOffer;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-pooling-title"
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="modal-pooling-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
            <span>🤝 Community Water Demand Pool</span>
          </h3>
          <button
            type="button"
            className="btn-close-modal"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div
            className="pooling-hero-box"
            style={{
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.12), rgba(16, 185, 129, 0.12))',
              border: '1px solid rgba(2, 132, 199, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.25rem',
              marginBottom: '1rem',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                background: '#10b981',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                marginBottom: '6px',
                letterSpacing: '0.04em',
              }}
            >
              COMPATIBLE DEMAND FOUND
            </span>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--color-text-main)' }}>
              Coordinated Neighborhood Delivery
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.4 }}>
              {message ||
                `A nearby household in your locality requested water within the same delivery window.`}
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'var(--color-surface-muted)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              fontSize: '0.84rem',
              color: 'var(--color-text-main)',
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div>
              <strong style={{ color: 'var(--color-text-muted)' }}>Assigned Tanker:</strong> {candidateTankerName || 'Nearby Tanker'}
            </div>
            <div>
              <strong style={{ color: 'var(--color-text-muted)' }}>Combined Load:</strong> {combinedQuantityLitres.toLocaleString()} Litres ({matchedRequestsCount} households)
            </div>
            <div>
              <strong style={{ color: 'var(--color-text-muted)' }}>Your Allocation:</strong> {individualLitres.toLocaleString()} Litres
            </div>
          </div>

          <div
            className="pooling-comparison-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Solo Trip
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text-main)', margin: '4px 0' }}>
                ₹{standardPrice.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                Standard single delivery
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '2px solid #10b981',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
                Shared Pool
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669', margin: '4px 0' }}>
                ₹{quotedPrice.toLocaleString()}
              </div>
              {savingsInr > 0 ? (
                <span
                  style={{
                    display: 'inline-block',
                    background: '#ecfdf5',
                    color: '#065f46',
                    border: '1px solid #a7f3d0',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                  }}
                >
                  Save ₹{savingsInr}
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-block',
                    background: '#e0f2fe',
                    color: '#0369a1',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                  }}
                >
                  Coordinated
                </span>
              )}
            </div>
          </div>

          <div
            style={{
              fontSize: '0.76rem',
              color: 'var(--color-text-muted)',
              lineHeight: 1.45,
              marginBottom: '20px',
              padding: '10px 14px',
              backgroundColor: 'var(--color-surface-muted)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            ℹ️ <strong>Coordination Notice:</strong> Pooling combines compatible nearby requests so that one tanker fulfills multiple households on a coordinated route. Each household maintains its own delivery tracking and individual quantity.
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onDeclinePool}
              id="btn-decline-pool"
            >
              Keep Solo Order (₹{standardPrice})
            </button>
            <button
              type="button"
              className="btn btn-success"
              onClick={onAcceptPool}
              id="btn-accept-pool"
            >
              Join Shared Pool (₹{quotedPrice})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PoolingModal;
