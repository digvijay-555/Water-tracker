import React from 'react';

export function VerificationBadge({ status }) {
  const isVerified = status === 'VERIFIED';

  return (
    <span
      className={`verification-badge ${isVerified ? 'verified' : 'unverified'}`}
      title={
        isVerified
          ? 'Registered operator with submitted business documentation.'
          : 'Self-registered listing without completed document verification.'
      }
    >
      <span className="badge-icon">{isVerified ? '🛡️' : '⚠️'}</span>
      <span>{isVerified ? 'Verified Operator' : 'Unverified Listing'}</span>
    </span>
  );
}

export default VerificationBadge;
