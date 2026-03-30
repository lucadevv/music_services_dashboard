import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './presentation/context/AuthContext';
import { AuthGuard } from './presentation/features/auth/AuthGuard';
import LoginPage from './presentation/features/auth/LoginPage';
import AdminLayout from './presentation/layouts/AdminLayout';
import DashboardStats from './presentation/features/system-stats/DashboardStats';
import ApiKeysView from './presentation/features/api-keys/ApiKeysView';
import BrowserView from './presentation/features/browser-accounts/BrowserView';
import CacheView from './presentation/features/cache/CacheView';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AuthGuard><AdminLayout /></AuthGuard>}>
            <Route path="/" element={<DashboardStats />} />
            <Route path="/api-keys" element={<ApiKeysView />} />
            <Route path="/browser" element={<BrowserView />} />
            <Route path="/cache" element={<CacheView />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
