import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Components
import ErrorBoundary from '@/components/ErrorBoundary';
import { AuthProvider } from '@/components/AuthProvider';
import { PlayerProvider } from '@/contexts/PlayerContext';

// Analytics
import { initPerformanceMonitoring } from '@/services/analytics';

// Pages
import Login from '@/pages/Login';
import PremiumHome from '@/pages/PremiumHome';
import DetailsNew from '@/pages/DetailsNew';
import Search from '@/pages/Search';
import Favorites from '@/pages/Favorites';
import Watchlist from '@/pages/Watchlist';
import Filmes from '@/pages/Filmes';
import Series from '@/pages/Series';
import Profile from '@/pages/Profile';
import Admin from '@/pages/Admin';
import TermosDeUso from '@/pages/TermosDeUso';
import WatchTogether from '@/pages/WatchTogether';
import DeviceManagement from '@/pages/DeviceManagement';
import NotificationCenter from '@/pages/NotificationCenter';
import PremiumNavbar from '@/components/PremiumNavbar';
import MobileBottomNav from '@/components/MobileBottomNav';

// v4 features
import { useDynamicHome } from '@/hooks/useDynamicHome';
import { HotReloadManager } from '@/components/HotReloadManager';

function AppContent() {
  useEffect(() => {
    initPerformanceMonitoring();
  }, []);

  return (
    <Router>
      <Toaster position="top-right" richColors />
      <HotReloadManager />
      <Routes>
        {/* Público */}
        <Route path="/login" element={<Login />} />
        <Route path="/termos" element={<TermosDeUso />} />

        {/* App privado */}
        <Route
          path="/*"
          element={
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#070A10' }}>
              <PremiumNavbar />
              <main style={{ flex: 1, paddingBottom: 80 }}>
                <Routes>
                  <Route path="/" element={<PremiumHome />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/filmes" element={<Filmes />} />
                  <Route path="/series" element={<Series />} />
                  <Route path="/details/:type/:id" element={<DetailsNew />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/watchlist" element={<Watchlist />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/profile/:id" element={<Profile />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/devices" element={<DeviceManagement />} />
                  <Route path="/notifications" element={<NotificationCenter />} />
                  <Route path="/assistir-juntos/:roomId" element={<WatchTogether />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </main>
              <MobileBottomNav />
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PlayerProvider>
          <AppContent />
        </PlayerProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
