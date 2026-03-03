import React, { useId } from 'react';

export default function BrandLogo({
  size = 34,
  withText = true,
  className = '',
  textClassName = '',
  tone = 'brand',
}) {
  const uid = useId().replace(/:/g, '');
  const gradId = `wertechLogoGrad-${uid}`;

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-label="Wertech logo">
        <defs>
          <linearGradient id={gradId} x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F45B69" />
            <stop offset="0.52" stopColor="#FF7A1A" />
            <stop offset="1" stopColor="#859A73" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="44" height="44" rx="14" fill={`url(#${gradId})`} />
        <path
          d="M11 14l6.2 20h4.6L24 25l2.2 9h4.6L37 14h-4.4l-3.1 11.5L26.7 14h-5.5l-2.8 11.5L15.3 14H11z"
          fill="white"
          fillOpacity="0.96"
        />
      </svg>
      {withText && (
        <span
          className={`font-black tracking-tight italic ${
            tone === 'light' ? 'text-white' : 'text-gradient'
          } ${textClassName}`}
        >
          WERTECH
        </span>
      )}
    </div>
  );
}
