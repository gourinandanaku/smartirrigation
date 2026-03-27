import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { MarketplaceProvider } from './state/MarketplaceProvider'
import AppLayout from './components/layout/AppLayout'
import MarketplacePage from './pages/MarketplacePage'
import CropDetailsPage from './pages/CropDetailsPage'
import CartPage from './pages/CartPage'
import FarmerDashboardPage from './pages/FarmerDashboardPage'
import OrdersPage from './pages/OrdersPage'
import AdminDashboardPage from './pages/AdminDashboardPage'

export default function App() {
  return (
    <MarketplaceProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<MarketplacePage />} />
            <Route path="/crops/:id" element={<CropDetailsPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/farmer" element={<FarmerDashboardPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MarketplaceProvider>
  )
}
