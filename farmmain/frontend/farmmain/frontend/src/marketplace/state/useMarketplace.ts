import { useContext } from 'react'
import { MarketplaceContext } from './MarketplaceContext'

export function useMarketplace() {
  const ctx = useContext(MarketplaceContext)
  if (!ctx) throw new Error('useMarketplace must be used within MarketplaceProvider')
  return ctx
}

