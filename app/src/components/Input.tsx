import React, { forwardRef } from 'react'
import './Input.css'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const wrapperClasses = [
      'input-wrapper',
      fullWidth && 'input-wrapper--full-width',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    const inputClasses = [
      'input',
      leftIcon && 'input--with-left-icon',
      rightIcon && 'input--with-right-icon',
      error && 'input--error',
      disabled && 'input--disabled',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div className={wrapperClasses}>
        {label && (
          <label className="input-label">
            {label}
            {props.required && <span className="input-label__required">*</span>}
          </label>
        )}
        <div className="input-container">
          {leftIcon && <span className="input-icon input-icon--left">{leftIcon}</span>}
          <input ref={ref} className={inputClasses} disabled={disabled} {...props} />
          {rightIcon && <span className="input-icon input-icon--right">{rightIcon}</span>}
        </div>
        {(error || helperText) && (
          <div className={error ? 'input-error' : 'input-helper'}>{error || helperText}</div>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'