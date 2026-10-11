import React from 'react';

export function ActiveTripBanner({ activeBooking, tanker, onCompleteDelivery }) {
  if (!activeBooking && tanker?.status !== 'EN_ROUTE') return null;

  const volume = activeBooking?.totalQuantityLitres?.toLocaleString() || tanker?.capacityLitres?.toLocaleString() || '5,000';
  const stops = activeBooking?.requests?.length || 1;

  return (
    <div className="active-trip-banner" role="status">
      <div className="active-trip-content">
        <div className="pulse-indicator">
          <span className="pulse-dot" aria-hidden="true" />
          <span className="pulse-label">LIVE DISPATCH IN TRANSIT</span>
        </div>
        <div className="active-trip-details">
          <strong>Tanker: {tanker?.displayName || 'Active Tanker'}</strong> &bull;{' '}
          {activeBooking ? (
            <span>
              Booking #{activeBooking.bookingId} ({volume} L &bull; {stops} Drop{stops > 1 ? 's' : ''})
            </span>
          ) : (
            <span>Actively En Route to Destination</span>
          )}
        </div>
      </div>

      {activeBooking && (
        <button
          type="button"
          className="btn btn-sm btn-light"
          onClick={() => onCompleteDelivery(activeBooking.bookingId)}
        >
          ✓ Mark Delivered
        </button>
      )}
    </div>
  );
}

export default ActiveTripBanner;
