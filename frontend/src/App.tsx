import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import SensorDashboard from './pages/SensorDashboard'
import Irrigation from './pages/Irrigation'
import DiseaseDetection from './pages/DiseaseDetection'
import CropDetails from './pages/CropDetails'
import FarmPlots from './pages/FarmPlots'
import History from './pages/History'
import Marketplace from './pages/Marketplace'
import MarketplaceList from './pages/MarketplaceList'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="sensors" element={<SensorDashboard />} />
        <Route path="irrigation" element={<Irrigation />} />
        <Route path="disease" element={<DiseaseDetection />} />
        <Route path="crops" element={<CropDetails />} />
        <Route path="plots" element={<FarmPlots />} />
        <Route path="history" element={<History />} />
        <Route path="marketplace" element={<Marketplace />} />
        <Route path="marketplace/list" element={<MarketplaceList />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
