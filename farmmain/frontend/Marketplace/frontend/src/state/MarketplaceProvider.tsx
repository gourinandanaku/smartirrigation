import React, { useEffect, useMemo, useState } from 'react'
import { mockCrops, mockOrders, mockSession, mockUsers } from '../data/mockData'
import type { CartItem, Crop, Order, SessionState, User } from '../data/types'
import { MarketplaceContext, type FlashState, type MarketplaceContextValue } from './MarketplaceContext'
import { getCrops, addCrop, deleteCrop as apiDeleteCrop, updateCrop as apiUpdateCrop } from '../services/api'

type FlashType = NonNullable<FlashState>['type']

const LS = {
  crops: 'sf_marketplace_crops_v1',
  orders: 'sf_marketplace_orders_v1',
  cart: 'sf_marketplace_cart_v1',
  session: 'sf_marketplace_session_v1',
}

function safeParseJSON<T>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function computeCartSubtotal(crops: Crop[], cart: CartItem[]) {
  const byId = new Map(crops.map((c) => [c.id, c]))
  let total = 0
  for (const item of cart) {
    const crop = byId.get(item.cropId)
    if (!crop) continue
    total += crop.pricePerKg * item.quantity
  }
  return total
}

function roundMoney(n: number) {
  return Math.round(n * 100) / 100
}

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const [users] = useState<User[]>(mockUsers)

  const [crops, setCrops] = useState<Crop[]>(() => {
    const fromLS = safeParseJSON<Crop[]>(localStorage.getItem(LS.crops))
    return fromLS && Array.isArray(fromLS) && fromLS.length ? fromLS : mockCrops
  })

  const [orders, setOrders] = useState<Order[]>(() => {
    const fromLS = safeParseJSON<Order[]>(localStorage.getItem(LS.orders))
    return fromLS && Array.isArray(fromLS) ? fromLS : mockOrders
  })

  const [cart, setCart] = useState<CartItem[]>(() => {
    const fromLS = safeParseJSON<CartItem[]>(localStorage.getItem(LS.cart))
    return fromLS && Array.isArray(fromLS) ? fromLS : []
  })

  const [session, setSession] = useState<SessionState>(() => {
    const fromLS = safeParseJSON<SessionState>(localStorage.getItem(LS.session))
    return fromLS?.userId ? fromLS : mockSession
  })

  const [flash, setFlash] = useState<FlashState>(null)

  useEffect(() => {
    getCrops()
      .then((res: any) => {
        const data = res.data || res;
        const mappedCrops = data.map((c: any) => ({
          id: c._id,
          name: c.name,
          pricePerKg: c.price,
          quantityAvailable: c.quantity,
          harvestDate: c.estimatedHarvestTime ? new Date(c.estimatedHarvestTime).toISOString().split('T')[0] : '',
          location: c.location || 'Unknown',
          farmerId: c.farmerId,
          imageUrl: c.imageUrl
        }))
        if (mappedCrops.length > 0) {
          setCrops(mappedCrops)
        }
      })
      .catch((err) => console.error("Failed to load crops from API", err))
  }, [])

  // persist
  useEffect(() => {
    localStorage.setItem(LS.crops, JSON.stringify(crops))
  }, [crops])

  useEffect(() => {
    localStorage.setItem(LS.orders, JSON.stringify(orders))
  }, [orders])

  useEffect(() => {
    localStorage.setItem(LS.cart, JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    localStorage.setItem(LS.session, JSON.stringify(session))
  }, [session])

  const currentUser = useMemo(() => {
    const u = users.find((x) => x.id === session.userId)
    if (u) return u
    const fallback = users.find((x) => x.role === session.role) ?? users[0]
    return fallback
  }, [session.role, session.userId, users])

  const cartCount = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart])
  const cartSubtotal = useMemo(() => computeCartSubtotal(crops, cart), [crops, cart])

  function dismissFlash() {
    setFlash(null)
  }

  function pushFlash(message: string, type: FlashType) {
    setFlash({ message, type })
    window.setTimeout(() => setFlash((cur) => (cur ? null : cur)), 3500)
  }

  function addToCart(cropId: string, quantity = 1) {
    if (quantity <= 0) return
    const crop = crops.find((c) => c.id === cropId)
    if (!crop) return
    if (crop.quantityAvailable <= 0) {
      pushFlash('This crop is currently out of stock.', 'error')
      return
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.cropId === cropId)
      const existingQty = existing?.quantity ?? 0
      const nextQty = Math.min(crop.quantityAvailable, existingQty + quantity)

      if (existing) {
        return prev.map((i) => (i.cropId === cropId ? { ...i, quantity: nextQty } : i))
      }
      return [...prev, { cropId, quantity: nextQty }]
    })

    pushFlash('Added to cart.', 'success')
  }

  function updateCartItemQuantity(cropId: string, quantity: number) {
    const crop = crops.find((c) => c.id === cropId)
    if (!crop) return
    const nextQty = Math.max(0, Math.min(crop.quantityAvailable, quantity))

    setCart((prev) => {
      if (nextQty === 0) return prev.filter((i) => i.cropId !== cropId)
      const exists = prev.some((i) => i.cropId === cropId)
      if (!exists) return [...prev, { cropId, quantity: nextQty }]
      return prev.map((i) => (i.cropId === cropId ? { ...i, quantity: nextQty } : i))
    })
  }

  function removeFromCart(cropId: string) {
    setCart((prev) => prev.filter((i) => i.cropId !== cropId))
    pushFlash('Removed from cart.', 'info')
  }

  function clearCart() {
    setCart([])
  }

  function placeOrderFromCart() {
    if (cart.length === 0) {
      pushFlash('Your cart is empty.', 'error')
      return
    }

    if (currentUser.role !== 'buyer') {
      pushFlash('Only buyers can place orders.', 'error')
      return
    }

    // Validate stock
    for (const item of cart) {
      const crop = crops.find((c) => c.id === item.cropId)
      if (!crop) {
        pushFlash('One item in your cart no longer exists.', 'error')
        return
      }
      if (item.quantity <= 0 || item.quantity > crop.quantityAvailable) {
        pushFlash(`Not enough stock for "${crop.name}".`, 'error')
        return
      }
    }

    const now = new Date().toISOString()
    const ordersToAdd: Order[] = []
    const nextCrops = crops.map((c) => ({ ...c }))

    const cropIndex = new Map(nextCrops.map((c, idx) => [c.id, idx]))

    for (const item of cart) {
      const crop = crops.find((c) => c.id === item.cropId)!
      const idx = cropIndex.get(item.cropId)
      if (idx === undefined) continue

      const totalPrice = roundMoney(crop.pricePerKg * item.quantity)
      ordersToAdd.push({
        id: makeId('ord'),
        buyerId: currentUser.id,
        farmerId: crop.farmerId,
        cropId: crop.id,
        cropName: crop.name,
        farmerName: users.find((u) => u.id === crop.farmerId)?.name ?? 'Farmer',
        quantity: item.quantity,
        unitPrice: crop.pricePerKg,
        totalPrice,
        status: 'Placed',
        createdAt: now,
      })

      nextCrops[idx].quantityAvailable -= item.quantity
    }

    setOrders((prev) => [...ordersToAdd, ...prev])
    setCrops(nextCrops)
    setCart([])
    pushFlash(`Order placed successfully (${ordersToAdd.length} item${ordersToAdd.length === 1 ? '' : 's'}).`, 'success')
  }

  async function addCropListing(input: {
    name: string
    quantityAvailable: number
    pricePerKg: number
    harvestDate: string
    location: string
    imageUrl: string
  }) {
    if (currentUser.role !== 'farmer') {
      pushFlash('Only farmers can add crop listings.', 'error')
      return
    }

    const name = input.name.trim()
    const location = input.location.trim()
    if (!name || !location) {
      pushFlash('Please provide crop name and location.', 'error')
      return
    }

    const apiData = {
      name,
      price: roundMoney(input.pricePerKg),
      quantity: Math.max(0, Math.floor(input.quantityAvailable)),
      dateOfPlanting: new Date().toISOString(),
      estimatedHarvestTime: input.harvestDate,
      location,
      farmerId: currentUser.id,
      imageUrl: input.imageUrl
    };

    try {
      const addedAny = await addCrop(apiData);
      const added = addedAny.data || addedAny;
      const next: Crop = {
        id: added._id || makeId('crop'),
        name: added.name,
        pricePerKg: added.price,
        quantityAvailable: added.quantity,
        harvestDate: added.estimatedHarvestTime ? new Date(added.estimatedHarvestTime).toISOString().split('T')[0] : input.harvestDate,
        location: added.location || location,
        farmerId: added.farmerId,
        imageUrl: added.imageUrl,
      };

      setCrops((prev) => [next, ...prev])
      pushFlash('Crop listing added.', 'success')
    } catch (err) {
      console.error(err)
      pushFlash('Failed to add crop to database.', 'error')
    }
  }

  async function updateCropStock(cropId: string, nextQuantity: number) {
    const crop = crops.find((c) => c.id === cropId)
    if (!crop) return

    const isOwnerFarmer = currentUser.role === 'farmer' && crop.farmerId === currentUser.id
    const isAdmin = currentUser.role === 'admin'
    if (!isOwnerFarmer && !isAdmin) {
      pushFlash('Not authorized to update stock for this crop.', 'error')
      return
    }

    try {
      await apiUpdateCrop(cropId, { quantity: Math.max(0, Math.floor(nextQuantity)) })
      setCrops((prev) =>
        prev.map((c) => (c.id === cropId ? { ...c, quantityAvailable: Math.max(0, Math.floor(nextQuantity)) } : c)),
      )
      pushFlash('Stock updated.', 'success')
    } catch (err) {
      console.error(err)
      pushFlash('Failed to update stock in database.', 'error')
    }
  }

  async function deleteCrop(cropId: string) {
    const crop = crops.find((c) => c.id === cropId)
    if (!crop) return

    const isOwnerFarmer = currentUser.role === 'farmer' && crop.farmerId === currentUser.id
    const isAdmin = currentUser.role === 'admin'
    if (!isOwnerFarmer && !isAdmin) {
      pushFlash('Not authorized to delete this crop.', 'error')
      return
    }

    try {
      await apiDeleteCrop(cropId)
      setCrops((prev) => prev.filter((c) => c.id !== cropId))
      setCart((prev) => prev.filter((i) => i.cropId !== cropId))
      pushFlash('Crop listing deleted.', 'info')
    } catch (err) {
      console.error(err)
      pushFlash('Failed to delete crop from database.', 'error')
    }
  }

  const value: MarketplaceContextValue = {
    session,
    currentUser,
    setSession: (next) => setSession(next),
    users,
    crops,
    orders,
    cart,
    cartCount,
    cartSubtotal,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    placeOrderFromCart,
    addCropListing,
    updateCropStock,
    deleteCrop,
    flash,
    dismissFlash,
  }

  return <MarketplaceContext.Provider value={value}>{children}</MarketplaceContext.Provider>
}

