import React from 'react'

export function Card(props: { children: React.ReactNode; className?: string }) {
  const base = 'rounded border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950'
  const padding = props.className?.includes('p-0') ? '' : 'p-4'
  return (
    <div
      className={[base, padding, props.className ?? ''].filter(Boolean).join(' ')}
    >
      {props.children}
    </div>
  )
}

