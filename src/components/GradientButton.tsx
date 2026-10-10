import type { ButtonHTMLAttributes } from 'react'

export function GradientButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`gradient-link gradient-button ${className}`} {...props} />
}
