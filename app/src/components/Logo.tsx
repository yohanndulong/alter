import React from 'react'

interface LogoProps {
  size?: number
  variant?: 'full' | 'icon'
  className?: string
}

export const Logo: React.FC<LogoProps> = ({ size = 40, variant = 'full', className = '' }) => {
  if (variant === 'icon') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#9333EA', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#C026D3', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#EC4899', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="logoGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#EC4899', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#C026D3', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#9333EA', stopOpacity: 1 }} />
          </linearGradient>
          <radialGradient id="glowGradient">
            <stop offset="0%" style={{ stopColor: '#EC4899', stopOpacity: 0.3 }} />
            <stop offset="100%" style={{ stopColor: '#EC4899', stopOpacity: 0 }} />
          </radialGradient>
        </defs>

        {/* Glow effect behind the kiss */}
        <circle cx="28" cy="16" r="12" fill="url(#glowGradient)" />

        {/* Left person silhouette forming left stroke of A */}
        {/* Head */}
        <ellipse cx="20" cy="14" rx="5.5" ry="6" fill="url(#logoGradient)" />

        {/* Neck and shoulders */}
        <path
          d="M 20 20 Q 19 22 18 24"
          stroke="url(#logoGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Body forming left side of A */}
        <path
          d="M 18 24 Q 16 28 14 34 L 12 42 Q 11 46 12 50"
          stroke="url(#logoGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Right person silhouette forming right stroke of A */}
        {/* Head */}
        <ellipse cx="36" cy="14" rx="5.5" ry="6" fill="url(#logoGradient2)" />

        {/* Neck and shoulders */}
        <path
          d="M 36 20 Q 37 22 38 24"
          stroke="url(#logoGradient2)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Body forming right side of A */}
        <path
          d="M 38 24 Q 40 28 42 34 L 44 42 Q 45 46 44 50"
          stroke="url(#logoGradient2)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* The kiss - two faces leaning toward each other at the top */}
        <path
          d="M 24 14 Q 26 13 28 13 Q 30 13 32 14"
          stroke="#EC4899"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />

        {/* Arms embracing forming the crossbar of A */}
        <path
          d="M 16 30 Q 20 32 28 32 Q 36 32 40 30"
          stroke="#EC4899"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Heart where they embrace */}
        <path
          d="M 28 28 C 26.5 25.5 24 25.5 23 27 C 22 28.5 23 30.5 25 32 L 28 34.5 L 31 32 C 33 30.5 34 28.5 33 27 C 32 25.5 29.5 25.5 28 28 Z"
          fill="#EC4899"
        />

        {/* Sparkles around the heart */}
        <circle cx="20" cy="28" r="1.5" fill="#EC4899" opacity="0.6" />
        <circle cx="36" cy="28" r="1.5" fill="#9333EA" opacity="0.6" />
        <circle cx="28" cy="22" r="1" fill="#C026D3" opacity="0.7" />
      </svg>
    )
  }

  return (
    <div className={`logo-container ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoGradientFull" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#9333EA', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#C026D3', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#EC4899', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="logoGradientFull2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#EC4899', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#C026D3', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#9333EA', stopOpacity: 1 }} />
          </linearGradient>
          <radialGradient id="glowGradientFull">
            <stop offset="0%" style={{ stopColor: '#EC4899', stopOpacity: 0.3 }} />
            <stop offset="100%" style={{ stopColor: '#EC4899', stopOpacity: 0 }} />
          </radialGradient>
        </defs>

        <circle cx="28" cy="16" r="12" fill="url(#glowGradientFull)" />

        {/* Left person */}
        <ellipse cx="20" cy="14" rx="5.5" ry="6" fill="url(#logoGradientFull)" />
        <path
          d="M 20 20 Q 19 22 18 24"
          stroke="url(#logoGradientFull)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 18 24 Q 16 28 14 34 L 12 42 Q 11 46 12 50"
          stroke="url(#logoGradientFull)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Right person */}
        <ellipse cx="36" cy="14" rx="5.5" ry="6" fill="url(#logoGradientFull2)" />
        <path
          d="M 36 20 Q 37 22 38 24"
          stroke="url(#logoGradientFull2)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 38 24 Q 40 28 42 34 L 44 42 Q 45 46 44 50"
          stroke="url(#logoGradientFull2)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Kiss */}
        <path
          d="M 24 14 Q 26 13 28 13 Q 30 13 32 14"
          stroke="#EC4899"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />

        {/* Arms embracing */}
        <path
          d="M 16 30 Q 20 32 28 32 Q 36 32 40 30"
          stroke="#EC4899"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Heart */}
        <path
          d="M 28 28 C 26.5 25.5 24 25.5 23 27 C 22 28.5 23 30.5 25 32 L 28 34.5 L 31 32 C 33 30.5 34 28.5 33 27 C 32 25.5 29.5 25.5 28 28 Z"
          fill="#EC4899"
        />

        {/* Sparkles */}
        <circle cx="20" cy="28" r="1.5" fill="#EC4899" opacity="0.6" />
        <circle cx="36" cy="28" r="1.5" fill="#9333EA" opacity="0.6" />
        <circle cx="28" cy="22" r="1" fill="#C026D3" opacity="0.7" />
      </svg>
      <span
        style={{
          fontSize: size * 0.6,
          fontWeight: 700,
          background: 'linear-gradient(135deg, #9333EA, #C026D3, #EC4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.02em',
        }}
      >
        Alter
      </span>
    </div>
  )
}
