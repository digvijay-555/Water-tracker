import React, { useState, useEffect } from 'react';

const PRESET_QUANTITIES = [500, 1000, 2000, 4000, 6000];

export function WaterRequestModal({
  isOpen,
  onClose,
  tanker,
  currentLocation,
  localityName,
  onSubmitRequest,
}) {
  const [quantityLitres, setQuantityLitres] = useState(2000);
  const [waterType, setWaterType] = useState('NON_DRINKING');
  const [address, setAddress] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Default delivery window: 2 hours from now formatted as local datetime-local
  useEffect(() => {
    if (isOpen) {
      const defaultDate = new Date(Date.now() + 1000 * 60 * 60 * 2);
      const year = defaultDate.getFullYear();
      const month = String(defaultDate.getMonth() + 1).padStart(2, '0');
      const day = String(defaultDate.getDate()).padStart(2, '0');
      const hours = String(defaultDate.getHours()).padStart(2, '0');
      const minutes = String(defaultDate.getMinutes()).padStart(2, '0');
      setDeliveryTime(`${year}-${month}-${day}T${hours}:${minutes}`);

      if (tanker) {
        setWaterType(tanker.waterType || 'NON_DRINKING');
      }
      setValidationError('');
    }
  }, [isOpen, tanker]);

  if (!isOpen) return null;

  const currentRate = tanker?.pricePer1000Litres || 500;
  const estimatedQuoteInr = Math.round((Number(quantityLitres || 0) / 1000) * currentRate);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    const qty = Number(quantityLitres);
    if (!qty || Number.isNaN(qty) || !Number.isInteger(qty)) {
      setValidationError('Please specify an integer quantity of litres.');
      return;
    }

    if (qty < 100) {
      setValidationError('Minimum delivery request quantity is 100 litres.');
      return;
    }

    if (qty > 25000) {
      setValidationError('Maximum single delivery capacity is 25,000 litres.');
      return;
    }

    if (tanker && tanker.availableLitres && qty > tanker.availableLitres) {
      setValidationError(
        `Requested quantity (${qty}L) exceeds this tanker's currently available capacity (${tanker.availableLitres}L).`
      );
      return;
    }

    if (!deliveryTime) {
      setValidationError('Please select a valid delivery window date and time.');
      return;
    }

    setIsSubmitting(true);
    try {
      const deliveryIso = new Date(deliveryTime).toISOString();
      await onSubmitRequest({
        quantityLitres: qty,
        waterType,
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        deliveryWindowStart: deliveryIso,
        locality: localityName,
        address: address.trim() || localityName,
        tankerId: tanker?.tankerId || null,
      });
      onClose();
    } catch (err) {
      setValidationError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-request-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="modal-request-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
            <span>💧 Request Water Delivery</span>
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

        <form onSubmit={handleSubmit} className="modal-body">
          {tanker && (
            <div
              style={{
                backgroundColor: 'var(--color-surface-muted)',
                border: '1px solid var(--color-border)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <strong style={{ fontSize: '0.95rem', color: 'var(--color-text-main)' }}>
                  {tanker.displayName}
                </strong>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  Rate: ₹{tanker.pricePer1000Litres} / 1000L &bull; Available: {tanker.availableLitres?.toLocaleString()} L
                </div>
              </div>
              <span className="badge badge-available">Selected</span>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="input-label" htmlFor="request-quantity-input">
              Quantity Required (Litres)
            </label>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
              Select standard capacity or enter custom amount:
            </div>

            <div className="quantity-pills" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {PRESET_QUANTITIES.map((qty) => (
                <button
                  type="button"
                  key={qty}
                  className={`btn btn-sm ${Number(quantityLitres) === qty ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setQuantityLitres(qty)}
                  style={{ borderRadius: 'var(--radius-pill)', padding: '4px 12px' }}
                >
                  {qty >= 1000 ? `${qty / 1000}k L` : `${qty} L`}
                </button>
              ))}
            </div>

            <input
              id="request-quantity-input"
              type="number"
              className="form-input"
              value={quantityLitres}
              onChange={(e) => setQuantityLitres(e.target.value)}
              min="100"
              max="25000"
              step="100"
              required
              placeholder="e.g. 2000"
            />
          </div>

          {/* Water Category */}
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="input-label" htmlFor="water-type-select">Water Category</label>
            <select
              id="water-type-select"
              className="form-select"
              value={waterType}
              onChange={(e) => setWaterType(e.target.value)}
              disabled={tanker && tanker.waterType}
            >
              <option value="NON_DRINKING">Utility / Non-Drinking Water (Cleaning, Construction, Sanitation)</option>
              <option value="DRINKING">Drinking / Potable Water (Supplied in food-grade tanker)</option>
            </select>
          </div>

          {/* Delivery Window */}
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="input-label" htmlFor="delivery-window-input">
              Preferred Delivery Window Start
            </label>
            <input
              id="delivery-window-input"
              type="datetime-local"
              className="form-input"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              required
            />
          </div>

          {/* Address */}
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="input-label" htmlFor="delivery-address-input">
              Delivery Locality &amp; Address Details
            </label>
            <input
              id="delivery-address-input"
              type="text"
              className="form-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Society name, building / plot number, landmark..."
              required
            />
            <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Coordinates: {currentLocation.lat.toFixed(4)}° N, {currentLocation.lng.toFixed(4)}° E ({localityName})
            </div>
          </div>

          {/* Transparent Price Quote */}
          <div
            className="quote-box"
            style={{
              backgroundColor: 'var(--color-surface-muted)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                  Transparent Price Quote
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                  Calculated at ₹{currentRate} per 1,000L for {Number(quantityLitres || 0).toLocaleString()} litres
                </div>
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                ₹{estimatedQuoteInr.toLocaleString()}
              </div>
            </div>
          </div>

          {validationError && (
            <div className="status-feedback feedback-error" style={{ marginBottom: '16px' }}>
              ⚠️ {validationError}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              id="btn-confirm-water-request"
            >
              {isSubmitting ? 'Submitting Request...' : 'Confirm Water Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default WaterRequestModal;
