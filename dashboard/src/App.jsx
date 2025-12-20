import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Visitors from './pages/Visitors';
import VisitorDetail from './pages/VisitorDetail';
import Alerts from './pages/Alerts';
import Activity from './pages/Activity';

// For POC, hardcode the store ID
const STORE_ID = 'cibrau-00';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout storeId={STORE_ID} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard storeId={STORE_ID} />} />
          <Route path="visitors" element={<Visitors storeId={STORE_ID} />} />
          <Route path="visitor/:visitorId" element={<VisitorDetail storeId={STORE_ID} />} />
          <Route path="alerts" element={<Alerts storeId={STORE_ID} />} />
          <Route path="activity" element={<Activity storeId={STORE_ID} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

