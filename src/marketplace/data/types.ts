export type UserRole = 'buyer' | 'farmer' | 'admin'

export interface User {
  id: string
  name: string
  role: UserRole
}

export interface Crop {
  id: string
  name: string
  pricePerKg: number
  quantityAvailable: number
  harvestDate: string // YYYY-MM-DD
  location: string
  farmerId: string
  imageUrl: string
}

export interface CartItem {
  cropId: string
  quantity: number
}

export type OrderStatus = 'Placed' | 'Processing' | 'Delivered' | 'Cancelled'

export interface Order {
  id: string
  buyerId: string
  farmerId: string
  cropId: string
  cropName: string
  farmerName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  status: OrderStatus
  createdAt: string // ISO
}

export interface SessionState {
  role: UserRole
  userId: string
}

