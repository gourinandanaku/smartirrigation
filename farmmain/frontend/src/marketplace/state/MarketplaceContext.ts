import { createContext } from 'react'
import type { CartItem, Crop, Order, SessionState, User } from '../data/types'

type FlashType = 'success' | 'error' | 'info'

export type FlashState =
  | {
      type: FlashType
      message: string
    }
  | null

export type MarketplaceContextValue = {
  // session
  session: SessionState
  currentUser: User
  login: (userData: any) => void
  logout: () => void
  setSession: (next: SessionState) => void

  // data
  users: User[]
  crops: Crop[]
  orders: Order[]

  // cart
  cart: CartItem[]
  cartCount: number
  cartSubtotal: number
  addToCart: (cropId: string, quantity?: number) => void
  updateCartItemQuantity: (cropId: string, quantity: number) => void
  removeFromCart: (cropId: string) => void
  clearCart: () => void
  placeOrderFromCart: (paymentMethod: 'COD' | 'ONLINE') => Promise<any>
  cancelOrder: (orderId: string) => Promise<void>

  // farmer/admin mutations
  addCropListing: (input: {
    name: string
    quantityAvailable: number
    pricePerKg: number
    harvestDate: string
    location: string
    imageUrl: string
  }) => void
  updateCropStock: (cropId: string, nextQuantity: number) => void
  deleteCrop: (cropId: string) => void

  // UI
  flash: FlashState
  dismissFlash: () => void
}

export const MarketplaceContext = createContext<MarketplaceContextValue | null>(null)

