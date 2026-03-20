import { Link } from '@tanstack/react-router'
import { Card } from './Card'

export function AuctionCard(props: { auction: any }) {
  const { auction } = props
  const endLabel =
    auction?.end_time ? new Date(auction.end_time).toLocaleString() : '—'
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
          className="block aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-gray-800"
        >
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
          className="flex aspect-[4/3] w-full items-center justify-center bg-gray-100 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400"
        >
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
          Ends: <span className="font-medium">{endLabel}</span>
        </div>
      </div>
    </Card>
  )
}

