import React, { useState, useEffect, useCallback } from 'react';
import { residentApi } from '../services/residentApi.js';
import { LocationBar, DEMO_LOCALITIES } from '../components/resident/LocationBar.jsx';
import { TankerMap } from '../components/resident/TankerMap.jsx';
import { TankerList } from '../components/resident/TankerList.jsx';
import { WaterRequestModal } from '../components/resident/WaterRequestModal.jsx';
import { PoolingModal } from '../components/resident/PoolingModal.jsx';
import { BookingTimeline } from '../components/resident/BookingTimeline.jsx';

export function ResidentPage() {
  // Location state (defaults to Cidco Sector N-5 in Aurangabad)
  const [currentLocation, setCurrentLocation] = useState({
    lat: DEMO_LOCALITIES[0].lat,
    lng: DEMO_LOCALITIES[0].lng,
  });
  const [localityName, setLocalityName] = useState(DEMO_LOCALITIES[0].name);

  // Data states
  const [tankers, setTankers] = useState([]);
  const [selectedTanker, setSelectedTanker] = useState(null);
  const [isLoadingTankers, setIsLoadingTankers] = useState(true);
  const [errorNotice, setErrorNotice] = useState(null);

  // Active orders and bookings
  const [activeRequest, setActiveRequest] = useState(null);
  const [bookings, setBookings] = useState([]);

  // Modals state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [modalTargetTanker, setModalTargetTanker] = useState(null);
  const [isPoolingModalOpen, setIsPoolingModalOpen] = useState(false);
  const [poolingOffer, setPoolingOffer] = useState(null);

  // Active view tab: 'DISCOVERY' or 'TRACKER'
  const [activeTab, setActiveTab] = useState('DISCOVERY');

  // Load tankers for current location
  const loadTankers = useCallback(async () => {
    setIsLoadingTankers(true);
    setErrorNotice(null);
    try {
      const list = await residentApi.getNearbyTankers(
        currentLocation.lat,
        currentLocation.lng
      );
      setTankers(list);
    } catch (err) {
      console.error('Failed to load tankers:', err);
      setErrorNotice('Could not load nearby tankers. Please verify network connection or server status.');
    } finally {
      setIsLoadingTankers(false);
    }
  }, [currentLocation]);

  // Load existing bookings
  const loadBookings = useCallback(async () => {
    try {
      const allBookings = await residentApi.getResidentBookings();
      setBookings(allBookings);
    } catch (err) {
      console.warn('Could not fetch bookings:', err);
    }
  }, []);

  useEffect(() => {
    loadTankers();
    loadBookings();
  }, [loadTankers, loadBookings]);

  // Handle location update from LocationBar
  const handleLocationChange = ({ lat, lng, name }) => {
    setCurrentLocation({ lat, lng });
    setLocalityName(name);
    setSelectedTanker(null);
  };

  // Open water request form
  const handleOpenRequest = (tanker = null) => {
    setModalTargetTanker(tanker || selectedTanker || tankers[0] || null);
    setIsRequestModalOpen(true);
  };

  // Submit water request & immediately check pooling eligibility
  const handleSubmitRequest = async (requestPayload) => {
    const created = await residentApi.submitWaterRequest({
      ...requestPayload,
      locality: localityName,
    });
    setActiveRequest(created);

    // Refresh tankers list to reflect state changes
    loadTankers();

    // Evaluate community demand pooling
    try {
      const poolResult = await residentApi.joinOrCheckPool(created.requestId);
      if (poolResult && poolResult.eligible) {
        setPoolingOffer({
          ...poolResult,
          individualLitres: created.quantityLitres,
          standardPrice: created.quotedPrice,
        });
        setIsPoolingModalOpen(true);
      } else {
        // No pool found; proceed to tracking
        setActiveTab('TRACKER');
        await loadBookings();
      }
    } catch (poolErr) {
      console.warn('Pooling check notice:', poolErr);
      setActiveTab('TRACKER');
      await loadBookings();
    }
  };

  // Accept community pool offer
  const handleAcceptPool = async () => {
    setIsPoolingModalOpen(false);
    setActiveTab('TRACKER');
    await loadBookings();
    await loadTankers();
  };

  // Decline pool offer and keep solo request
  const handleDeclinePool = async () => {
    setIsPoolingModalOpen(false);
    if (activeRequest?.requestId) {
      try {
        await residentApi.revertToSoloBooking(activeRequest.requestId);
      } catch (err) {
        console.warn('Revert to solo booking error:', err);
      }
    }
    setActiveTab('TRACKER');
    await loadBookings();
  };

  // Stats calculation
  const availableCount = tankers.filter((t) => t.status === 'AVAILABLE').length;
  const verifiedCount = tankers.filter((t) => t.verificationStatus === 'VERIFIED').length;
  const minRate = tankers.length > 0 ? Math.min(...tankers.map((t) => t.pricePer1000Litres)) : 500;

  return (
    <main className="resident-page-wrapper">
      {/* Demonstration Banner */}
      <div className="demo-banner">
        <div className="container demo-banner-content">
          <span className="demo-banner-badge">DEMO ENVIRONMENT</span>
          <span>
            Operating in <strong>Chhatrapati Sambhajinagar (Aurangabad)</strong> &bull; Water Tracker Live Telemetry Network.
          </span>
        </div>
      </div>

      {/* Location Selector Bar */}
      <LocationBar
        currentLocation={currentLocation}
        localityName={localityName}
        onLocationChange={handleLocationChange}
      />

      <div className="resident-layout">
        {/* Shortage Community Alert Notice */}
        <div className="resident-alert-banner">
          <div className="resident-alert-content">
            <span className="alert-badge-icon">📢</span>
            <div className="resident-alert-text">
              <strong>Locality Alert ({localityName}):</strong> Municipal pipeline pressure restricted. 
              {' '}{availableCount} water tankers actively dispatching in your sector.
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => handleOpenRequest(null)}
            id="btn-quick-request-alert"
          >
            + Quick Request
          </button>
        </div>

        {/* High-Level Stats Bar */}
        <div className="resident-hero-stats">
          <div className="stat-card">
            <div className="stat-icon green">💧</div>
            <div className="stat-info">
              <div className="stat-value">{availableCount}</div>
              <div className="stat-label">Tankers Ready Now</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon blue">🛡️</div>
            <div className="stat-info">
              <div className="stat-value">{verifiedCount}</div>
              <div className="stat-label">Verified Suppliers</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon teal">₹</div>
            <div className="stat-info">
              <div className="stat-value">₹{minRate}</div>
              <div className="stat-label">Starting Rate / 1,000L</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon amber">🤝</div>
            <div className="stat-info">
              <div className="stat-value">Active</div>
              <div className="stat-label">Neighborhood Pooling</div>
            </div>
          </div>
        </div>

        {/* View Navigation Tabs: Discovery vs Active Tracking */}
        <div className="resident-nav-row">
          <div className="tab-pill-group">
            <button
              type="button"
              className={`tab-pill-btn ${activeTab === 'DISCOVERY' ? 'active' : ''}`}
              onClick={() => setActiveTab('DISCOVERY')}
              id="tab-btn-discovery"
            >
              🗺️ Discover &amp; Order
            </button>
            <button
              type="button"
              className={`tab-pill-btn ${activeTab === 'TRACKER' ? 'active' : ''}`}
              onClick={() => setActiveTab('TRACKER')}
              id="tab-btn-tracker"
            >
              🚚 Track Delivery
              {(bookings.length > 0 || activeRequest) && (
                <span className="tab-count-badge">
                  {bookings.length || 1}
                </span>
              )}
            </button>
          </div>

          <div className="radius-hint">
            📍 Showing verified tankers within 10 km radius
          </div>
        </div>

        {errorNotice && (
          <div className="status-feedback feedback-error">
            ⚠️ {errorNotice}
          </div>
        )}

        {/* Main Content Area Based on Tab */}
        {activeTab === 'DISCOVERY' ? (
          <div className="view-grid">
            {/* Left: Leaflet Interactive Map */}
            <TankerMap
              tankers={tankers}
              currentLocation={currentLocation}
              selectedTanker={selectedTanker}
              onSelectTanker={(t) => setSelectedTanker(t)}
              onRequestTanker={handleOpenRequest}
            />

            {/* Right: Tanker Directory & Cards */}
            <TankerList
              tankers={tankers}
              selectedTanker={selectedTanker}
              onSelectTanker={(t) => setSelectedTanker(t)}
              onRequestTanker={handleOpenRequest}
              isLoading={isLoadingTankers}
            />
          </div>
        ) : (
          /* Live Booking Tracker View */
          <div>
            <BookingTimeline
              bookings={bookings}
              activeRequest={activeRequest}
              tankers={tankers}
              onRefresh={async () => {
                await loadBookings();
                await loadTankers();
              }}
            />

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveTab('DISCOVERY')}
              >
                ← Back to Tanker Discovery & Map
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Water Request Modal */}
      <WaterRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        tanker={modalTargetTanker}
        currentLocation={currentLocation}
        localityName={localityName}
        onSubmitRequest={handleSubmitRequest}
      />

      {/* Demand Pooling Offer Modal */}
      <PoolingModal
        isOpen={isPoolingModalOpen}
        onClose={() => setIsPoolingModalOpen(false)}
        poolOffer={poolingOffer}
        onAcceptPool={handleAcceptPool}
        onDeclinePool={handleDeclinePool}
      />
    </main>
  );
}

export default ResidentPage;
