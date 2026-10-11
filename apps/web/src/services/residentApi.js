/**
 * WaterSaathi - Resident API Service Layer (Person 1 Ownership)
 * 
 * Provides clean abstractions for the resident discovery, booking, pooling,
 * and tracking workflows. Backed by apiClient (mock or live backend).
 */

import { apiClient } from './apiClient.js';
import { mockApi } from './mockApi.js';

export const residentApi = {
  isMockMode() {
    return typeof apiClient.isMockMode === 'function' ? apiClient.isMockMode() : Boolean(apiClient.isMockMode);
  },

  /**
   * Fetches nearby available water tankers for given geographical coordinates.
   */
  async getNearbyTankers(latitude = 19.8762, longitude = 75.3433) {
    const data = await apiClient.getTankers({ lat: latitude, lng: longitude });
    const list = data?.tankers || [];
    return list.filter(t => t.status !== 'OFFLINE');
  },

  /**
   * Submits a new water delivery request.
   */
  async submitWaterRequest({
    requesterId = 'resident-demo',
    quantityLitres,
    latitude,
    longitude,
    deliveryWindowStart,
    waterType = 'NON_DRINKING',
    address = '',
    locality = '',
    tankerId = null,
  }) {
    const qty = Number(quantityLitres);
    if (!Number.isInteger(qty) || qty < 100 || qty > 25000) {
      throw new Error('Quantity must be between 100 and 25,000 litres.');
    }
    return apiClient.createRequest({
      requesterId,
      quantityLitres: qty,
      latitude: Number(latitude),
      longitude: Number(longitude),
      deliveryWindowStart,
      waterType,
      address,
      locality,
      tankerId,
    });
  },

  async revertToSoloBooking(requestId) {
    if (typeof apiClient.revertToSoloBooking === 'function') {
      return apiClient.revertToSoloBooking(requestId);
    }
    return mockApi.revertToSoloBooking(requestId);
  },

  async createWaterRequest(payload) {
    return this.submitWaterRequest(payload);
  },

  /**
   * Fetches details and status for an existing water request and its linked booking.
   */
  async getRequestDetails(requestId) {
    return apiClient.getRequest(requestId);
  },

  async getRequest(requestId) {
    return this.getRequestDetails(requestId);
  },

  /**
   * Checks for nearby compatible water requests and evaluates community demand pooling.
   */
  async joinOrCheckPool(requestId) {
    return apiClient.joinPool(requestId);
  },

  async joinPool(requestId) {
    return this.joinOrCheckPool(requestId);
  },

  /**
   * Fetches bookings associated with the current resident.
   */
  async getResidentBookings() {
    const data = await apiClient.getBookings();
    return data?.bookings || [];
  },

  /**
   * Creates a community water shortage report.
   */
  async reportWaterShortage(payload) {
    return apiClient.createShortageReport(payload);
  },

  /**
   * Resets mock data to initial demo state.
   */
  resetDemoData() {
    return apiClient.resetDemo();
  },
};

export default residentApi;
