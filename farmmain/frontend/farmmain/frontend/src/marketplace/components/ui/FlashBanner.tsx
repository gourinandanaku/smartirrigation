import type { FlashState } from '../../state/MarketplaceContext'

export default function FlashBanner({
  flash,
  onDismiss,
}: {
  flash: FlashState
  onDismiss: () => void
}) {
  if (!flash) return null

  const className =
    flash.type === 'success'
      ? 'flash flash--success'
      : flash.type === 'error'
        ? 'flash flash--error'
        : 'flash flash--info'

  return (
    <div className={className} role={flash.type === 'error' ? 'alert' : 'status'}>
      <div className="flash__message">{flash.message}</div>
      <button className="flash__close" onClick={onDismiss} aria-label="Dismiss message">
        Close
      </button>
    </div>
  )
}

