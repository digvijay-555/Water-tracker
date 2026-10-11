import React from 'react';

export function WaterTypeBadge({ waterType }) {
  const isDrinking = waterType === 'DRINKING';
  const isNonDrinking = waterType === 'NON_DRINKING';

  return (
    <span
      className={`water-type-badge ${isDrinking ? 'drinking' : 'non-drinking'}`}
      title={
        isDrinking
          ? 'Operator-declared drinking utility water. Not independent potability test.'
          : 'Non-drinking / Utility water (washing, construction, sanitation).'
      }
    >
      <span className="badge-icon">{isDrinking ? '💧' : '🪣'}</span>
      <span>{isDrinking ? 'Drinking Utility' : isNonDrinking ? 'Non-Drinking Utility' : 'Unspecified'}</span>
    </span>
  );
}

export default WaterTypeBadge;
