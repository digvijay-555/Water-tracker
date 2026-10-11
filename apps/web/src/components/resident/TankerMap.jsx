import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';

export function TankerMap({
  tankers = [],
  currentLocation,
  selectedTanker,
  onSelectTanker,
  onRequestTanker,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const residentMarkerRef = useRef(null);
  const radiusCircleRef = useRef(null);
  const markerMapRef = useRef(new Map());
  const [mapError, setMapError] = useState(false);
  const [isLocatingNearest, setIsLocatingNearest] = useState(false);

  // Compute nearest available tanker
  const nearestTanker = useMemo(() => {
    const available = tankers.filter((t) => t.status === 'AVAILABLE');
    if (available.length === 0) return null;
    return [...available].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))[0];
  }, [tankers]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [currentLocation.lat, currentLocation.lng],
          zoom: 14,
          scrollWheelZoom: false,
          zoomControl: false,
        });

        // Add zoom control in top-right
        L.control.zoom({ position: 'topright' }).addTo(map);

        // Standard OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        const markersLayer = L.layerGroup().addTo(map);
        const routeLayer = L.layerGroup().addTo(map);

        markersLayerRef.current = markersLayer;
        routeLayerRef.current = routeLayer;
        mapInstanceRef.current = map;
      }
    } catch (err) {
      console.error('Failed to initialize Leaflet map:', err);
      setMapError(true);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
        routeLayerRef.current = null;
        residentMarkerRef.current = null;
        radiusCircleRef.current = null;
        markerMapRef.current.clear();
      }
    };
  }, []);

  // Update Resident Location Marker & Coverage Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !currentLocation) return;

    const latLng = [currentLocation.lat, currentLocation.lng];

    if (residentMarkerRef.current) {
      residentMarkerRef.current.setLatLng(latLng);
    } else {
      const residentIcon = L.divIcon({
        className: 'custom-resident-marker',
        html: `
          <div class="resident-marker-pin">
            <span class="pulse-ring"></span>
            <span class="resident-pin-core">📍</span>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const resMarker = L.marker(latLng, {
        icon: residentIcon,
        title: 'Your Delivery Location',
        zIndexOffset: 1000,
      }).addTo(map);

      resMarker.bindPopup(`
        <div class="map-popup-card">
          <strong class="text-primary" style="display:block;margin-bottom:2px;">📍 Your Location</strong>
          <span style="font-size:12px;color:var(--color-text-muted);">Delivery destination coordinates</span>
        </div>
      `);

      residentMarkerRef.current = resMarker;
    }

    // Coverage Radius Circle (3km)
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setLatLng(latLng);
    } else {
      radiusCircleRef.current = L.circle(latLng, {
        radius: 3000,
        color: '#0284c7',
        fillColor: '#0284c7',
        fillOpacity: 0.06,
        weight: 1.5,
        dashArray: '4, 6',
      }).addTo(map);
    }
  }, [currentLocation]);

  // Render Tanker Markers & Nearest Highlight
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    markerMapRef.current.clear();

    tankers.forEach((tanker) => {
      if (
        typeof tanker.latitude !== 'number' ||
        typeof tanker.longitude !== 'number' ||
        Number.isNaN(tanker.latitude) ||
        Number.isNaN(tanker.longitude)
      ) {
        return;
      }

      const isSelected = selectedTanker && selectedTanker.tankerId === tanker.tankerId;
      const isNearest = nearestTanker && nearestTanker.tankerId === tanker.tankerId;

      let markerClass = 'marker-available';
      let iconEmoji = '💧';
      if (tanker.status === 'BUSY') {
        markerClass = 'marker-busy';
        iconEmoji = '⏳';
      } else if (tanker.status === 'EN_ROUTE') {
        markerClass = 'marker-enroute';
        iconEmoji = '🚚';
      }

      const icon = L.divIcon({
        className: `custom-tanker-pin ${markerClass} ${isNearest ? 'is-nearest-tanker' : ''} ${isSelected ? 'is-selected' : ''}`,
        html: `
          <div class="tanker-pin-wrapper">
            ${isNearest ? '<span class="nearest-floating-badge">NEAREST</span>' : ''}
            <div class="tanker-pin-bubble">
              <span>${iconEmoji}</span>
            </div>
            ${tanker.distanceKm ? `<span class="tanker-pin-dist">${tanker.distanceKm}km</span>` : ''}
          </div>
        `,
        iconSize: isNearest ? [48, 54] : [40, 46],
        iconAnchor: isNearest ? [24, 27] : [20, 23],
      });

      const marker = L.marker([tanker.latitude, tanker.longitude], {
        icon,
        title: `${tanker.displayName} (${tanker.distanceKm || ''} km)`,
        zIndexOffset: isNearest ? 800 : isSelected ? 700 : 200,
      });

      // Popup Content
      const popupDiv = document.createElement('div');
      popupDiv.className = 'map-tanker-popup';
      popupDiv.innerHTML = `
        <div style="min-width: 220px; font-family: inherit;">
          ${isNearest ? '<div style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 4px; display: inline-block; margin-bottom: 6px; letter-spacing: 0.05em;">⚡ NEAREST AVAILABLE TANKER</div>' : ''}
          <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 800; color: #0f172a;">${tanker.displayName}</h4>
          <div style="display: flex; gap: 4px; margin-bottom: 6px; flex-wrap: wrap;">
            <span style="background: ${tanker.status === 'AVAILABLE' ? '#ecfdf5' : '#fffbeb'}; color: ${tanker.status === 'AVAILABLE' ? '#065f46' : '#92400e'}; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 99px;">${tanker.status}</span>
            <span style="background: #e0f2fe; color: #0369a1; font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 99px;">${(tanker.waterType || '').replace('_', ' ')}</span>
            <span style="background: #f0fdf4; color: #166534; font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 99px;">${tanker.verificationStatus || 'VERIFIED'}</span>
          </div>
          <div style="font-size: 12px; color: #334155; line-height: 1.5; margin-bottom: 8px;">
            <div>💧 <strong>Capacity:</strong> ${tanker.availableLitres?.toLocaleString() || 0}L / ${tanker.capacityLitres?.toLocaleString() || 0}L</div>
            <div>💰 <strong>Rate:</strong> ₹${tanker.pricePer1000Litres} per 1,000L</div>
            ${tanker.distanceKm ? `<div>📍 <strong>Proximity:</strong> <strong>${tanker.distanceKm} km</strong> away (~${Math.round(tanker.distanceKm * 6 + 5)} mins ETA)</div>` : ''}
          </div>
        </div>
      `;

      const btnRow = document.createElement('div');
      btnRow.style.display = 'flex';
      btnRow.style.gap = '6px';

      const selectBtn = document.createElement('button');
      selectBtn.innerText = 'Select';
      selectBtn.style.flex = '1';
      selectBtn.style.padding = '6px 8px';
      selectBtn.style.background = '#f1f5f9';
      selectBtn.style.color = '#0f172a';
      selectBtn.style.border = '1px solid #cbd5e1';
      selectBtn.style.borderRadius = '6px';
      selectBtn.style.fontWeight = '600';
      selectBtn.style.fontSize = '12px';
      selectBtn.style.cursor = 'pointer';
      selectBtn.onclick = () => {
        onSelectTanker(tanker);
        marker.closePopup();
      };

      const bookBtn = document.createElement('button');
      bookBtn.innerText = 'Request Delivery';
      bookBtn.style.flex = '1.4';
      bookBtn.style.padding = '6px 8px';
      bookBtn.style.background = '#0284c7';
      bookBtn.style.color = '#ffffff';
      bookBtn.style.border = 'none';
      bookBtn.style.borderRadius = '6px';
      bookBtn.style.fontWeight = '700';
      bookBtn.style.fontSize = '12px';
      bookBtn.style.cursor = 'pointer';
      bookBtn.onclick = () => {
        onSelectTanker(tanker);
        if (onRequestTanker) onRequestTanker(tanker);
        marker.closePopup();
      };

      btnRow.appendChild(selectBtn);
      btnRow.appendChild(bookBtn);
      popupDiv.querySelector('div').appendChild(btnRow);

      marker.bindPopup(popupDiv);

      marker.on('click', () => {
        onSelectTanker(tanker);
      });

      markersLayer.addLayer(marker);
      markerMapRef.current.set(tanker.tankerId, marker);
    });
  }, [tankers, selectedTanker, nearestTanker, onSelectTanker, onRequestTanker]);

  // Center on selected tanker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && selectedTanker && typeof selectedTanker.latitude === 'number') {
      map.panTo([selectedTanker.latitude, selectedTanker.longitude], {
        animate: true,
        duration: 0.8,
      });
    }
  }, [selectedTanker]);

  // Locate and Highlight Nearest Tanker
  const handleFindNearestTanker = () => {
    if (!nearestTanker || !mapInstanceRef.current) return;
    setIsLocatingNearest(true);

    const map = mapInstanceRef.current;
    const routeLayer = routeLayerRef.current;

    // Clear old line
    if (routeLayer) routeLayer.clearLayers();

    // Fit bounds to show both resident and nearest tanker
    const bounds = L.latLngBounds([
      [currentLocation.lat, currentLocation.lng],
      [nearestTanker.latitude, nearestTanker.longitude],
    ]);

    map.fitBounds(bounds, { padding: [80, 80], maxZoom: 16 });

    // Draw proximity route line
    if (routeLayer) {
      const polyline = L.polyline(
        [
          [currentLocation.lat, currentLocation.lng],
          [nearestTanker.latitude, nearestTanker.longitude],
        ],
        {
          color: '#10b981',
          weight: 3.5,
          opacity: 0.85,
          dashArray: '8, 8',
        }
      ).addTo(routeLayer);

      polyline.bindTooltip(
        `Nearest Tanker Proximity: ${nearestTanker.distanceKm || '0.5'} km`,
        { permanent: false, direction: 'center' }
      );
    }

    // Select and open popup
    onSelectTanker(nearestTanker);
    const marker = markerMapRef.current.get(nearestTanker.tankerId);
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
        setIsLocatingNearest(false);
      }, 500);
    } else {
      setIsLocatingNearest(false);
    }
  };

  const handleCenterResident = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([currentLocation.lat, currentLocation.lng], 15, {
      animate: true,
    });
  };

  if (mapError) {
    return (
      <div className="map-card-wrapper">
        <div className="map-fallback-box">
          <h3>Interactive Map Unavailable</h3>
          <p>Leaflet map failed to initialize. You can still select available tankers directly from the directory below.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-card-wrapper" aria-label="Interactive Tanker Proximity Map">
      {/* Top Map Header & Nearest Actions */}
      <div className="map-card-header">
        <div className="map-title-group">
          <div className="map-card-title">
            <span>🗺️ Live Tanker Proximity Radar</span>
            <span className="badge badge-simulated">Live Telemetry</span>
          </div>
          <div className="map-subtitle">
            Find and track real-time water tankers near your neighborhood in Chhatrapati Sambhajinagar
          </div>
        </div>

        {/* Action Controls */}
        <div className="map-header-controls">
          <button
            type="button"
            className="map-action-btn btn-find-nearest"
            onClick={handleFindNearestTanker}
            disabled={!nearestTanker || isLocatingNearest}
            id="btn-find-nearest-tanker"
            title="Locate the closest available water tanker to your position"
          >
            <span>🎯</span>
            <span>{isLocatingNearest ? 'Locating...' : 'Find Nearest Tanker'}</span>
          </button>

          <button
            type="button"
            className="map-action-btn btn-center-me"
            onClick={handleCenterResident}
            title="Recenter map on your location"
          >
            <span>📍</span>
            <span>My Location</span>
          </button>
        </div>
      </div>

      {/* Nearest Tanker Spotlight Floating Bar */}
      {nearestTanker && (
        <div className="nearest-tanker-spotlight-bar">
          <div className="spotlight-badge">
            <span className="spotlight-dot"></span>
            <span>CLOSEST TANKER</span>
          </div>

          <div className="spotlight-details">
            <strong>{nearestTanker.displayName}</strong> is{' '}
            <span className="spotlight-distance">
              {nearestTanker.distanceKm ? `${nearestTanker.distanceKm} km away` : 'nearby'}
            </span>
            <span className="spotlight-eta">
              (~{Math.round((nearestTanker.distanceKm || 1) * 6 + 5)} mins ETA)
            </span>{' '}
            &bull; <span className="spotlight-rate">₹{nearestTanker.pricePer1000Litres}/1,000L</span>
          </div>

          <div className="spotlight-actions">
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={handleFindNearestTanker}
            >
              📍 View on Map
            </button>
            <button
              type="button"
              className="btn btn-sm btn-success"
              onClick={() => {
                onSelectTanker(nearestTanker);
                if (onRequestTanker) onRequestTanker(nearestTanker);
              }}
              id="btn-quick-book-nearest"
            >
              ⚡ Request This Tanker
            </button>
          </div>
        </div>
      )}

      {/* Leaflet Canvas Container */}
      <div
        id="resident-leaflet-map"
        ref={mapContainerRef}
        className="leaflet-map-container"
        tabIndex={0}
        role="region"
        aria-label="Map showing water tanker positions in locality"
      />

      {/* Map Legend */}
      <div className="map-footer-legend">
        <div className="legend-item">
          <span className="legend-dot nearest-dot"></span> Nearest Available
        </div>
        <div className="legend-item">
          <span className="legend-dot available"></span> Available
        </div>
        <div className="legend-item">
          <span className="legend-dot busy"></span> Busy / Refilling
        </div>
        <div className="legend-item">
          <span className="legend-dot enroute"></span> En Route
        </div>
        <div className="legend-item">
          <span className="legend-dot resident"></span> You (Delivery Point)
        </div>
      </div>
    </div>
  );
}

export default TankerMap;
