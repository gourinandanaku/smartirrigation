import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import SensorDashboard from './pages/SensorDashboard'
import Irrigation from './pages/Irrigation'
import DiseaseDetection from './pages/DiseaseDetection'
import CropDetails from './pages/CropDetails'
import FarmPlots from './pages/FarmPlots'
import History from './pages/History'
import { MarketplaceProvider } from './marketplace/state/MarketplaceProvider'
import AppLayout from './marketplace/components/layout/AppLayout'
import MarketplacePage from './marketplace/pages/MarketplacePage'
import CropDetailsPage from './marketplace/pages/CropDetailsPage'
import CartPage from './marketplace/pages/CartPage'
import FarmerDashboardPage from './marketplace/pages/FarmerDashboardPage'
import OrdersPage from './marketplace/pages/OrdersPage'
import AdminDashboardPage from './marketplace/pages/AdminDashboardPage'

function App() {
  return (
    <MarketplaceProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="sensors" element={<SensorDashboard />} />
          <Route path="irrigation" element={<Irrigation />} />
          <Route path="disease" element={<DiseaseDetection />} />
          <Route path="crops" element={<CropDetails />} />
          <Route path="plots" element={<FarmPlots />} />
          <Route path="history" element={<History />} />
        </Route>

        <Route path="/marketplace" element={<AppLayout />}>
          <Route index element={<MarketplacePage />} />
          <Route path="crops/:id" element={<CropDetailsPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="farmer" element={<FarmerDashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="admin" element={<AdminDashboardPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MarketplaceProvider>
  )
}

export default App
