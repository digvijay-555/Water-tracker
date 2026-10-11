import React from 'react';

const STATUS_LABELS = {
  AVAILABLE: 'Available',
  BUSY: 'Busy / Loading',
  EN_ROUTE: 'En Route',
  DELIVERED: 'Delivered',
  OFFLINE: 'Offline',
  OPEN: 'Open Request',
  MATCHED: 'Pool Matched',
  ACCEPTED: 'Accepted',
  CANCELLED: 'Cancelled',
  UNDER_REVIEW: 'Under Review',
  VERIFIED: 'Verified',
  UNVERIFIED: 'Unverified',
  REJECTED: 'Rejected',
};

export function StatusBadge({ status, size = 'sm' }) {
  const normStatus = (status || '').toUpperCase();
  const label = STATUS_LABELS[normStatus] || status || 'Unknown';
  const slug = normStatus.toLowerCase();

  return (
    <span className={`status-badge status-${slug} status-size-${size}`}>
      <span className="status-dot" aria-hidden="true" />
      <span className="status-label-text">{label}</span>
    </span>
  );
}

export default StatusBadge;
