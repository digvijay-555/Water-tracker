/**
 * WaterSaathi - Client-Side Mock API Service
 * 
 * Implements identical signatures and response shapes to the backend HTTP API.
 * Uses sessionStorage (with fallback to memory) to persist state during demo interactions.
 */

import { mockTankers } from '../data/mockTankers.js';
import { mockRequests } from '../data/mockRequests.js';
import { mockBookings } from '../data/mockBookings.js';
import { mockReports } from '../data/mockReports.js';
import {
  TankerStatus,
  BookingStatus,
  RequestStatus,
  ShortageReportStatus,
} from '../../../../shared/types.js';

const STORAGE_KEY = 'watersaathi_mock_state_v1';

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371.0;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // storage unavailable or restricted
  }
  return {
    tankers: JSON.parse(JSON.stringify(mockTankers)),
    requests: JSON.parse(JSON.stringify(mockRequests)),
    bookings: JSON.parse(JSON.stringify(mockBookings)),
    reports: JSON.parse(JSON.stringify(mockReports)),
  };
}

let state = loadInitialState();

function persistState() {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
    sessionStorage.setItem(STORAGE_KEY, serialized);
  } catch (e) {
    // ignore
  }
}

export const mockApi = {
  reset() {
    state = {
      tankers: JSON.parse(JSON.stringify(mockTankers)),
      requests: JSON.parse(JSON.stringify(mockRequests)),
      bookings: JSON.parse(JSON.stringify(mockBookings)),
      reports: JSON.parse(JSON.stringify(mockReports)),
    };
    persistState();
    return true;
  },

  async getTankers({ lat, lng } = {}) {
    await new Promise(r => setTimeout(r, 40));
    let tankers = state.tankers.map(t => {
      const copy = { ...t };
      if (lat !== undefined && lng !== undefined && copy.latitude !== undefined && copy.longitude !== undefined) {
        copy.distanceKm = calculateDistanceKm(Number(lat), Number(lng), copy.latitude, copy.longitude);
      }
      return copy;
    });
    if (lat !== undefined && lng !== undefined) {
      tankers.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    }
    return { tankers };
  },

  async getTanker(tankerId) {
    await new Promise(r => setTimeout(r, 30));
    const tanker = state.tankers.find(t => t.tankerId === tankerId);
    if (!tanker) throw new Error(`Tanker ${tankerId} not found`);
    return { tanker: { ...tanker } };
  },

  async updateTankerLocation(tankerId, { latitude, longitude, locationSource = 'SIMULATED' }) {
    await new Promise(r => setTimeout(r, 30));
    const index = state.tankers.findIndex(t => t.tankerId === tankerId);
    if (index === -1) throw new Error(`Tanker ${tankerId} not found`);

    state.tankers[index] = {
      ...state.tankers[index],
      latitude: Number(latitude),
      longitude: Number(longitude),
      locationSource,
      lastLocationUpdate: new Date().toISOString(),
    };
    persistState();
    return { ...state.tankers[index] };
  },

  async updateTankerStatus(tankerId, status) {
    await new Promise(r => setTimeout(r, 30));
    const index = state.tankers.findIndex(t => t.tankerId === tankerId);
    if (index === -1) throw new Error(`Tanker ${tankerId} not found`);

    if (!Object.values(TankerStatus).includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    state.tankers[index] = {
      ...state.tankers[index],
      status,
      lastLocationUpdate: new Date().toISOString(),
    };
    persistState();
    return { tanker: { ...state.tankers[index] } };
  },

  async getBookings() {
    await new Promise(r => setTimeout(r, 40));
    return { bookings: [...state.bookings] };
  },

  async getBooking(bookingId) {
    await new Promise(r => setTimeout(r, 30));
    const booking = state.bookings.find(b => b.bookingId === bookingId);
    if (!booking) throw new Error(`Booking ${bookingId} not found`);
    return { booking: { ...booking } };
  },

  async acceptBooking(bookingId) {
    await new Promise(r => setTimeout(r, 50));
    const bookingIndex = state.bookings.findIndex(b => b.bookingId === bookingId);
    if (bookingIndex === -1) throw new Error(`Booking ${bookingId} not found`);

    const booking = state.bookings[bookingIndex];
    if (booking.status !== BookingStatus.OPEN && booking.status !== BookingStatus.MATCHED) {
      throw new Error(`Booking in ${booking.status} cannot be accepted.`);
    }

    const tankerIndex = state.tankers.findIndex(t => t.tankerId === booking.tankerId);
    if (tankerIndex === -1) throw new Error('Assigned tanker not found.');

    const tanker = state.tankers[tankerIndex];
    if (tanker.status === TankerStatus.OFFLINE) {
      throw new Error('Assigned tanker is currently OFFLINE.');
    }

    const updatedBooking = {
      ...booking,
      status: BookingStatus.ACCEPTED,
      updatedAt: new Date().toISOString(),
    };
    state.bookings[bookingIndex] = updatedBooking;

    // Transition tanker status to BUSY
    state.tankers[tankerIndex] = {
      ...tanker,
      status: TankerStatus.BUSY,
    };

    // Transition associated requests to ACCEPTED
    for (const reqId of booking.requestIds || []) {
      const rIdx = state.requests.findIndex(r => r.requestId === reqId);
      if (rIdx !== -1) {
        state.requests[rIdx] = {
          ...state.requests[rIdx],
          status: RequestStatus.ACCEPTED,
          bookingId,
        };
      }
    }

    persistState();
    return {
      message: 'Booking accepted successfully.',
      booking: updatedBooking,
      tanker: state.tankers[tankerIndex],
    };
  },

  async rejectBooking(bookingId, reason = 'Operator rejected assignment') {
    await new Promise(r => setTimeout(r, 50));
    const bookingIndex = state.bookings.findIndex(b => b.bookingId === bookingId);
    if (bookingIndex === -1) throw new Error(`Booking ${bookingId} not found`);

    const booking = state.bookings[bookingIndex];
    state.bookings[bookingIndex] = {
      ...booking,
      status: BookingStatus.CANCELLED,
      cancellationReason: reason,
      updatedAt: new Date().toISOString(),
    };

    persistState();
    return {
      message: 'Booking rejected.',
      booking: state.bookings[bookingIndex],
    };
  },

  async updateBookingStatus(bookingId, status) {
    await new Promise(r => setTimeout(r, 50));
    const bookingIndex = state.bookings.findIndex(b => b.bookingId === bookingId);
    if (bookingIndex === -1) throw new Error(`Booking ${bookingId} not found`);

    const booking = state.bookings[bookingIndex];

    // Status transition validation
    const allowed = {
      [BookingStatus.ACCEPTED]: [BookingStatus.EN_ROUTE, BookingStatus.CANCELLED],
      [BookingStatus.EN_ROUTE]: [BookingStatus.DELIVERED, BookingStatus.CANCELLED],
      [BookingStatus.MATCHED]: [BookingStatus.ACCEPTED, BookingStatus.CANCELLED],
      [BookingStatus.OPEN]: [BookingStatus.ACCEPTED, BookingStatus.CANCELLED],
    };

    if (allowed[booking.status] && !allowed[booking.status].includes(status)) {
      throw new Error(`Cannot transition booking from ${booking.status} to ${status}`);
    }

    const updatedBooking = {
      ...booking,
      status,
      updatedAt: new Date().toISOString(),
    };
    state.bookings[bookingIndex] = updatedBooking;

    // Synchronize tanker status
    const tankerIndex = state.tankers.findIndex(t => t.tankerId === booking.tankerId);
    if (tankerIndex !== -1) {
      if (status === BookingStatus.EN_ROUTE) {
        state.tankers[tankerIndex].status = TankerStatus.EN_ROUTE;
      } else if (status === BookingStatus.DELIVERED) {
        state.tankers[tankerIndex].status = TankerStatus.AVAILABLE;
      }
    }

    // Synchronize request statuses
    for (const reqId of booking.requestIds || []) {
      const rIdx = state.requests.findIndex(r => r.requestId === reqId);
      if (rIdx !== -1) {
        state.requests[rIdx] = {
          ...state.requests[rIdx],
          status: status,
        };
      }
    }

    persistState();
    return {
      message: `Booking status updated to ${status}`,
      booking: updatedBooking,
    };
  },

  async getShortageReports() {
    await new Promise(r => setTimeout(r, 40));
    return { reports: [...state.reports] };
  },

  async createShortageReport(payload) {
    await new Promise(r => setTimeout(r, 50));
    const report = {
      reportId: `report-${Date.now()}`,
      reporterId: payload.reporterId || 'resident-anon',
      locality: payload.locality,
      latitude: Number(payload.latitude),
      longitude: Number(payload.longitude),
      description: payload.description,
      reportedAt: new Date().toISOString(),
      verificationStatus: ShortageReportStatus.UNVERIFIED,
    };
    state.reports.unshift(report);
    persistState();
    return { ...report };
  },

  async updateReportStatus(reportId, verificationStatus) {
    await new Promise(r => setTimeout(r, 40));
    const idx = state.reports.findIndex(r => r.reportId === reportId);
    if (idx === -1) throw new Error(`Report ${reportId} not found`);

    if (!Object.values(ShortageReportStatus).includes(verificationStatus)) {
      throw new Error(`Invalid report verification status: ${verificationStatus}`);
    }

    state.reports[idx] = {
      ...state.reports[idx],
      verificationStatus,
      updatedAt: new Date().toISOString(),
    };
    persistState();
    return { report: state.reports[idx] };
  },

  async getRequests() {
    await new Promise(r => setTimeout(r, 30));
    return { requests: [...state.requests] };
  },

  async getRequest(requestId) {
    await new Promise(r => setTimeout(r, 30));
    const req = state.requests.find(r => r.requestId === requestId);
    if (!req) throw new Error(`Request ${requestId} not found`);
    return { ...req };
  },

  async createRequest(payload) {
    await new Promise(r => setTimeout(r, 50));
    const qty = Number(payload.quantityLitres);
    if (!Number.isInteger(qty) || qty < 100 || qty > 25000) {
      throw new Error('Quantity must be between 100 and 25,000 litres.');
    }
    const requestId = `request-${Date.now()}`;
    const quotedPrice = Math.round((qty / 1000) * 500);
    const quotedPricePaise = quotedPrice * 100;
    const targetTankerId = payload.tankerId || (state.tankers.find(t => t.status === TankerStatus.AVAILABLE)?.tankerId || 'tanker-001');
    const bookingId = `book-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const req = {
      requestId,
      bookingId,
      tankerId: targetTankerId,
      requesterId: payload.requesterId || 'resident-demo',
      locality: payload.locality || 'Cidco Sector N-5',
      quantityLitres: qty,
      latitude: Number(payload.latitude),
      longitude: Number(payload.longitude),
      deliveryWindowStart: payload.deliveryWindowStart,
      waterType: payload.waterType || 'NON_DRINKING',
      status: RequestStatus.OPEN,
      quotedPrice,
      quotedPricePaise,
      createdAt: new Date().toISOString(),
    };

    const booking = {
      bookingId,
      tankerId: targetTankerId,
      requestIds: [requestId],
      quotedPrice,
      finalPrice: quotedPrice,
      totalQuantityLitres: qty,
      deliveryWindowStart: payload.deliveryWindowStart || new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      status: BookingStatus.OPEN,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    state.requests.unshift(req);
    state.bookings.unshift(booking);
    persistState();
    return { ...req };
  },

  async joinPool(requestId) {
    await new Promise(r => setTimeout(r, 60));
    const req = state.requests.find(r => r.requestId === requestId);
    if (!req) throw new Error('Request not found');

    const others = state.requests.filter(r => r.requestId !== requestId && r.status === RequestStatus.OPEN);
    if (others.length === 0) {
      return {
        eligible: false,
        message: 'No compatible nearby water requests currently open for pooling in your delivery window.',
      };
    }

    const matched = others[0];
    const combinedQuantity = req.quantityLitres + matched.quantityLitres;
    const candidateBookingId = `book-pool-${Date.now()}`;
    const standardPrice = Math.round((req.quantityLitres / 1000) * 500);
    const quotedPrice = Math.round((req.quantityLitres / 1000) * 475);
    const savingsInr = standardPrice - quotedPrice;
    const tankerId = req.tankerId || matched.tankerId || 'tanker-001';

    // Remove solo bookings for both requests if they exist
    state.bookings = state.bookings.filter(b => b.bookingId !== req.bookingId && b.bookingId !== matched.bookingId);

    const candidateBooking = {
      bookingId: candidateBookingId,
      tankerId,
      requestIds: [req.requestId, matched.requestId],
      quotedPrice: Math.round((combinedQuantity / 1000) * 475),
      finalPrice: Math.round((combinedQuantity / 1000) * 475),
      totalQuantityLitres: combinedQuantity,
      deliveryWindowStart: req.deliveryWindowStart,
      status: BookingStatus.MATCHED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.bookings.unshift(candidateBooking);
    req.status = RequestStatus.MATCHED;
    req.bookingId = candidateBookingId;
    matched.status = RequestStatus.MATCHED;
    matched.bookingId = candidateBookingId;
    persistState();

    return {
      eligible: true,
      candidateBookingId,
      combinedQuantityLitres: combinedQuantity,
      quotedPrice,
      savingsInr,
      matchedRequestsCount: 2,
      candidateTankerName: 'Samarth Water Carrier 01',
      message: 'A compatible neighborhood delivery was found and matched.',
    };
  },

  async revertToSoloBooking(requestId) {
    await new Promise(r => setTimeout(r, 40));
    const req = state.requests.find(r => r.requestId === requestId);
    if (!req) return null;

    // Check if part of a pool
    const poolIndex = state.bookings.findIndex(b => b.requestIds?.includes(requestId) && b.status === BookingStatus.MATCHED);
    if (poolIndex !== -1) {
      const poolBooking = state.bookings[poolIndex];
      state.bookings.splice(poolIndex, 1);

      // Revert other requests in the pool back to solo open bookings
      const otherIds = (poolBooking.requestIds || []).filter(id => id !== requestId);
      for (const otherId of otherIds) {
        const otherReq = state.requests.find(r => r.requestId === otherId);
        if (otherReq) {
          otherReq.status = RequestStatus.OPEN;
          const otherBId = `book-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          otherReq.bookingId = otherBId;
          state.bookings.unshift({
            bookingId: otherBId,
            tankerId: otherReq.tankerId || poolBooking.tankerId || 'tanker-001',
            requestIds: [otherId],
            quotedPrice: otherReq.quotedPrice,
            finalPrice: otherReq.quotedPrice,
            totalQuantityLitres: otherReq.quantityLitres,
            deliveryWindowStart: otherReq.deliveryWindowStart,
            status: BookingStatus.OPEN,
            createdAt: otherReq.createdAt,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }

    // Ensure req has a solo OPEN booking
    req.status = RequestStatus.OPEN;
    const soloBookingId = `book-${Date.now()}`;
    req.bookingId = soloBookingId;
    const soloBooking = {
      bookingId: soloBookingId,
      tankerId: req.tankerId || 'tanker-001',
      requestIds: [req.requestId],
      quotedPrice: req.quotedPrice,
      finalPrice: req.quotedPrice,
      totalQuantityLitres: req.quantityLitres,
      deliveryWindowStart: req.deliveryWindowStart,
      status: BookingStatus.OPEN,
      createdAt: req.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.bookings.unshift(soloBooking);
    persistState();
    return { booking: soloBooking, request: req };
  },
};
