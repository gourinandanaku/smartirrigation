import React, { useEffect, useMemo, useState } from 'react'
import type { CartItem, Crop, Order, SessionState, User } from '../data/types'
import { MarketplaceContext, type FlashState, type MarketplaceContextValue } from './MarketplaceContext'
import { getCrops, addCrop, deleteCrop as apiDeleteCrop, updateCrop as apiUpdateCrop, placeOrder as apiPlaceOrder, getOrders } from '../services/api'

type FlashType = NonNullable<FlashState>['type']

const LS = {
  cart: 'sf_marketplace_cart_v1',
  user: 'sf_user',
  token: 'sf_token'
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
  const [users] = useState<User[]>([])

  const [crops, setCrops] = useState<Crop[]>([])

  const [orders, setOrders] = useState<Order[]>([])

  const [cart, setCart] = useState<CartItem[]>(() => {
    const fromLS = safeParseJSON<CartItem[]>(localStorage.getItem(LS.cart))
    return fromLS && Array.isArray(fromLS) ? fromLS : []
  })

  const [session, setSession] = useState<SessionState>(() => {
    const userJson = localStorage.getItem(LS.user)
    if (userJson) {
        try {
            const u = JSON.parse(userJson)
            return { role: u.role, userId: u._id || u.id }
        } catch (e) {
            console.error('Error parsing session from LS', e);
        }
    }
    return { role: 'buyer', userId: 'guest' }
  })

  function login(u: any) {
    if (u && u.role) {
        setSession({ role: u.role, userId: u._id || u.id });
    }
  }

  function logout() {
    localStorage.removeItem(LS.user);
    localStorage.removeItem(LS.token);
    setSession({ role: 'buyer', userId: 'guest' });
  }

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

    getOrders()
      .then((res: any) => {
        const data = res.data || res;
        const mappedOrders: Order[] = [];
        for (const order of data) {
          if (!order.items) continue;
          for (const item of order.items) {
            const crop = item.cropId;
            if (!crop) continue;
            const farmerName = users.find((u) => u.id === crop.farmerId)?.name || 'Demo Farmer';
            mappedOrders.push({
              id: order._id + '_' + crop._id,
              buyerId: order.buyerId,
              farmerId: crop.farmerId,
              cropId: crop._id,
              cropName: crop.name,
              farmerName: farmerName,
              quantity: item.quantity,
              unitPrice: crop.price,
              totalPrice: crop.price * item.quantity,
              status: order.orderStatus === 'placed' ? 'Placed' : (order.orderStatus === 'confirmed' ? 'Processing' : (order.orderStatus === 'cancelled' ? 'Cancelled' : 'Delivered')),
              createdAt: order.createdAt
            });
          }
        }
        setOrders(mappedOrders);
      })
      .catch((err) => console.error("Failed to load orders from API", err))
  }, [])

  // persist
  useEffect(() => {
    localStorage.setItem(LS.cart, JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    // Session is now controlled by Login/Logout pages
  }, [session])

  const currentUser = useMemo(() => {
    const userJson = localStorage.getItem(LS.user);
    if (userJson) {
        try {
            const u = JSON.parse(userJson);
            return { 
              id: u._id || u.id, 
              name: u.name, 
              role: u.role 
            } as User;
        } catch (e) {
            console.error('Error parsing User for memo', e);
        }
    }
    return {
      id: session.userId,
      name: session.role.charAt(0).toUpperCase() + session.role.slice(1),
      role: session.role
    } as User;
  }, [session.role, session.userId])

  const cartCount = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart])
  const cartSubtotal = useMemo(() => computeCartSubtotal(crops, cart), [crops, cart])

  function dismissFlash() {
    setFlash(null)
  }

  function pushFlash(message: string, type: FlashType) {
    setFlash({ message, type })
    window.setTimeout(() => setFlash(null), 3500)
  }

  function addToCart(cropId: string, quantity = 1) {
    if (currentUser.id === 'guest') {
        window.location.href = '/login';
        return;
    }
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

  async function placeOrderFromCart(paymentMethod: 'COD' | 'ONLINE') {
    if (cart.length === 0) {
      pushFlash('Your cart is empty.', 'error')
      return Promise.reject('Empty cart')
    }
    if (currentUser.role !== 'buyer') {
      pushFlash('Only buyers can place orders.', 'error')
      return Promise.reject('Not a buyer')
    }

    try {
      const items = cart.map(c => ({ cropId: c.cropId, quantity: c.quantity }));
      const payload = {
        buyerId: currentUser.id,
        paymentMethod,
        items
      };
      
      const res = await apiPlaceOrder(payload);
      
      // On success, clear cart and refresh crops for stock matching
      setCart([]);
      
      const order = res.data || res;
      
      // Map the newly placed order to append to the orders state
      if (order && order.items) {
        const mappedOrders: Order[] = [];
        for (const item of order.items) {
          // Find crop details in current state
          const cropInfo = crops.find(c => c.id === item.cropId);
          if (cropInfo) {
            const farmerName = users.find((u) => u.id === cropInfo.farmerId)?.name || 'Demo Farmer';
            mappedOrders.push({
              id: order._id + '_' + cropInfo.id,
              buyerId: order.buyerId,
              farmerId: cropInfo.farmerId,
              cropId: cropInfo.id,
              cropName: cropInfo.name,
              farmerName: farmerName,
              quantity: item.quantity,
              unitPrice: cropInfo.pricePerKg,
              totalPrice: cropInfo.pricePerKg * item.quantity,
              status: 'Placed',
              createdAt: order.createdAt || new Date().toISOString()
            });
          }
        }
        setOrders(prev => [...mappedOrders, ...prev]);
        
        // Update stock locally for UI immediate feedback
        setCrops(prev => prev.map(c => {
          const boughtItem = order.items.find((i: any) => i.cropId === c.id);
          if (boughtItem) {
            return { ...c, quantityAvailable: Math.max(0, c.quantityAvailable - boughtItem.quantity) };
          }
          return c;
        }));
      }
      pushFlash(`Order successfully placed! Payment Status: ${order.paymentStatus}`, 'success')
      return order;
    } catch(err: any) {
      console.error(err);
      pushFlash('Failed to place order. Check stock availability.', 'error')
      return Promise.reject(err);
    }
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
      login,
      logout,
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

