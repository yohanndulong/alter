import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Logo } from './Logo'
import { Badge } from './Badge'
import { useUnreadCount } from '@/hooks'
import './BottomNav.css'

export const BottomNav: React.FC = () => {
  const location = useLocation()
  const { t } = useTranslation()
  const { unreadCount } = useUnreadCount()

  const navItems = [
    {
      path: '/alter-chat',
      icon: <Logo variant="icon" size={24} />,
      label: t('nav.alter'),
    },
    {
      path: '/discover',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
      label: t('nav.discover'),
    },
    {
      path: '/matches',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      label: t('nav.matches'),
    },
    {
      path: '/profile',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      label: t('nav.profile'),
    },
  ]

  // Don't show navigation on login, verify-code or onboarding pages
  if (location.pathname === '/login' || location.pathname === '/verify-code' || location.pathname === '/onboarding') {
    return null
  }

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`
          }
        >
          <div className="bottom-nav__icon">
            {item.icon}
            {item.path === '/matches' && (
              <Badge count={unreadCount} position="top-right" size="sm" variant="error" />
            )}
          </div>
        </NavLink>
      ))}
    </nav>
  )
}
