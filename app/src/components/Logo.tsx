import React from 'react'

interface LogoProps {
  size?: number
  variant?: 'full' | 'icon'
  className?: string
}

export const Logo: React.FC<LogoProps> = ({ size = 48, variant = 'full', className = '' }) => {
  if (variant === 'icon') {
    return (
      <svg
        width={size}
        height={size * 0.86}
        viewBox="0 0 145 125"
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
        </defs>

        {/* Têtes (cercles en haut) - Très écartées et plus grandes */}
        <circle cx="50" cy="20" r="15" fill="url(#logoGradient)" />
        <circle cx="95" cy="20" r="15" fill="url(#logoGradient)" />

        {/* Cœur entre les deux têtes - Centré, espacé, remonté et agrandi */}
        <path
          d="M 72.5 2 C 76.5 2 80 5 80 8.5 C 80 13 75 17 69 20 C 63 17 58 13 58 8.5 C 58 5 61.5 2 65.5 2 C 69.5 2 69 5 69 8.5 C 69 5 71.5 2 72.5 2 Z"
          fill="url(#logoGradient)"
          transform="translate(3.5, -4)"
        />

        {/* Jambes - S'écartent puis verticales - Très écartées et épaisses */}
        <path
          d="M 50 35 Q 35 65 35 115"
          stroke="url(#logoGradient)"
          strokeWidth="18"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 95 35 Q 110 65 110 115"
          stroke="url(#logoGradient)"
          strokeWidth="18"
          fill="none"
          strokeLinecap="round"
        />

        {/* Bras formant un câlin - Très écartés et épais */}
        <path
          d="M 35 60 Q 72.5 55 110 60"
          stroke="url(#logoGradient)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 35 67 Q 72.5 72 110 67"
          stroke="url(#logoGradient)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  return (
    <div className={`logo-container ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <svg
        width={size}
        height={size * 0.86}
        viewBox="0 0 145 125"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoGradientFull" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#9333EA', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#C026D3', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#EC4899', stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        {/* Têtes (cercles en haut) - Très écartées et plus grandes */}
        <circle cx="50" cy="20" r="15" fill="url(#logoGradientFull)" />
        <circle cx="95" cy="20" r="15" fill="url(#logoGradientFull)" />

        {/* Cœur entre les deux têtes - Centré, espacé, remonté et agrandi */}
        <path
          d="M 72.5 2 C 76.5 2 80 5 80 8.5 C 80 13 75 17 69 20 C 63 17 58 13 58 8.5 C 58 5 61.5 2 65.5 2 C 69.5 2 69 5 69 8.5 C 69 5 71.5 2 72.5 2 Z"
          fill="url(#logoGradientFull)"
          transform="translate(3.5, -4)"
        />

        {/* Jambes - S'écartent puis verticales - Très écartées et épaisses */}
        <path
          d="M 50 35 Q 35 65 35 115"
          stroke="url(#logoGradientFull)"
          strokeWidth="18"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 95 35 Q 110 65 110 115"
          stroke="url(#logoGradientFull)"
          strokeWidth="18"
          fill="none"
          strokeLinecap="round"
        />

        {/* Bras formant un câlin - Très écartés et épais */}
        <path
          d="M 35 60 Q 72.5 55 110 60"
          stroke="url(#logoGradientFull)"
          strokeWidth="11"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 35 67 Q 72.5 72 110 67"
          stroke="url(#logoGradientFull)"
          strokeWidth="11"
          fill="none"
          strokeLinecap="round"
        />
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
