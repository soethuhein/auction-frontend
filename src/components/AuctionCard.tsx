import { Link } from '@tanstack/react-router'
import { Card } from './Card'

function getStatusBadge(statusRaw: unknown): {
  label: string
  className: string
  icon: JSX.Element
} {
  const status = typeof statusRaw === 'string' ? statusRaw.toLowerCase() : ''

  if (status === 'active') {
    return {
      label: 'Live',
      className: 'bg-red-600/95 text-white',
      icon: <span className="h-2 w-2 rounded-full bg-white animate-pulse" aria-hidden="true" />,
    }
  }

  if (status === 'scheduled') {
    return {
      label: 'Scheduled',
      className: 'bg-blue-600/95 text-white',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      ),
    }
  }

  if (status === 'draft') {
    return {
      label: 'Draft',
      className: 'bg-amber-500/95 text-white',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      ),
    }
  }

  return {
    label: status ? status[0].toUpperCase() + status.slice(1) : 'Unknown',
    className: 'bg-gray-800/90 text-white',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8h.01" />
        <path d="M11 12h1v4h1" />
      </svg>
    ),
  }
}

export function AuctionCard(props: { auction: any }) {
  const { auction } = props
  const startLabel =
    auction?.start_time ? new Date(auction.start_time).toLocaleString() : '—'
  const endLabel =
    auction?.end_time ? new Date(auction.end_time).toLocaleString() : '—'
  const isScheduled = auction?.status === 'scheduled'
  const badge = getStatusBadge(auction?.status)
  const price = auction?.current_price ?? auction?.starting_price
  const images = auction?.item?.images
  const firstImage = Array.isArray(images) && images.length > 0 ? images[0] : null
  const imageUrl = firstImage?.image_url ?? null
  const imageAlt = firstImage?.alt_text ?? auction?.item?.title ?? 'Item'

  return (
    <Card className="flex flex-col gap-3 overflow-hidden p-0">
      {imageUrl ? (
        <Link
          to="/auctions/$auctionId"
          params={{ auctionId: auction.id }}
          className="relative block aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-gray-800"
        >
          <span
            className={`absolute right-2 top-2 z-10 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold shadow-sm ${badge.className}`}
          >
            {badge.icon}
            <span>{badge.label}</span>
          </span>
          <img
            src={imageUrl}
            alt={imageAlt}
            className="h-full w-full object-cover"
          />
        </Link>
      ) : (
        <Link
          to="/auctions/$auctionId"
          params={{ auctionId: auction.id }}
          className="relative flex aspect-[4/3] w-full items-center justify-center bg-gray-100 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400"
        >
          <span
            className={`absolute right-2 top-2 z-10 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold shadow-sm ${badge.className}`}
          >
            {badge.icon}
            <span>{badge.label}</span>
          </span>
          No image
        </Link>
      )}

      <div className="flex flex-col gap-3 px-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
              {auction?.status ?? '—'}
            </div>
            <div className="truncate text-lg font-semibold">
              <Link
                to="/auctions/$auctionId"
                params={{ auctionId: auction.id }}
                className="hover:underline"
              >
                {auction?.item?.title ?? 'Untitled'}
              </Link>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400">Price</div>
            <div className="text-base font-semibold">{price}</div>
          </div>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-300">
          {isScheduled ? 'Start at' : 'Ends'}:{' '}
          <span className="font-medium">{isScheduled ? startLabel : endLabel}</span>
        </div>
      </div>
    </Card>
  )
}

