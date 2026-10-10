import type { ReactNode } from 'react'

type StatusMessageProps = {
  title: string
  children: ReactNode
  tone?: 'info' | 'error'
}

export function StatusMessage({ title, children, tone = 'info' }: StatusMessageProps) {
  return (
    <section className={`status-message status-${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      <h2>{title}</h2>
      <p>{children}</p>
    </section>
  )
}
