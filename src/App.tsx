import { useState, useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import LoadingScreen from "./components/LoadingScreen";
import SplashScreen from "./components/SplashScreen";
import DeviceAccessManager from "./components/DeviceAccessManager";
import KeyboardNavigation from "./components/KeyboardNavigation";
import { SpatialNavigationProvider } from "./components/SpatialNavigationProvider";
import MobileBottomNav from "./components/MobileBottomNav";
import PremiumNavbar from "./components/PremiumNavbar";
import TVNavbar from "./components/TVNavbar";
import ScrollToTop from "./components/ScrollToTop";
import { PlayerProvider, usePlayer } from "./contexts/PlayerContext";
import YouTubePlayer from "./components/YouTubePlayer";
import VideoJSPlayer from "./components/VideoJSPlayer";
import PremiumHome from "./pages/PremiumHome";
import Filmes from "./pages/Filmes";
import Series from "./pages/Series";
import FilmesPorCategoria from "./pages/FilmesPorCategoria";
import FilmesCategorias from "./pages/FilmesCategorias";
import Favorites from "./pages/Favorites";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Content from "./pages/Content";
import DetailsNew from "./pages/DetailsNew";
import MovieDetails from "./pages/MovieDetails";
import ImageCleanup from "./pages/ImageCleanup";
import NotificationSettings from "./pages/NotificationSettings";
import Search from "./pages/Search";
import Profiles from "./pages/Profiles";
import Profile from "./pages/Profile";
import DeviceManagement from "./pages/DeviceManagement";
import Subscription from "./pages/Subscription";
import { NotificationProvider } from "@/hooks/useNotifications.tsx";
import { NotificationContainer } from "./components/MovieNotifications";
import { NotificationsPage } from "./components/NotificationsPage";
import PublicNotifications from "./pages/PublicNotifications";
import { NotificationPermissionPrompt } from "@/components/NotificationPermissionPrompt";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { useGlobalBackHandler } from "./hooks/useGlobalBackHandler";
import { useGlobalTVNavigation } from "./hooks/useGlobalTVNavigation";
import { ExitConfirmationModal } from "./components/ExitConfirmationModal";
import { useProjectionMode } from "./hooks/useProjectionMode";
import { useAutoCacheCleanup } from "@/hooks/useAutoCacheCleanup";
import { useMobileViewportHeight } from "@/hooks/useMobileViewportHeight";
import { AppLoadingProvider, useAppLoading } from "@/contexts/AppLoadingContext";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { setAuthReady } = useAppLoading();
  const location = useLocation();
  const userId = user?.id;

  useEffect(() => {
    if (!authLoading) {
      setAuthReady(true);
    }
  }, [authLoading, setAuthReady]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#00d9ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const userId = user?.id;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#00d9ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Carregando...</p>
        </div>
      </div>
    );
  }

  if (userId) {
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/novidades" element={<PublicNotifications />} />

        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/filmes-categorias" element={<ProtectedRoute><FilmesCategorias /></ProtectedRoute>} />
        <Route path="/filmes" element={<ProtectedRoute><Filmes /></ProtectedRoute>} />
        <Route path="/series" element={<ProtectedRoute><Series /></ProtectedRoute>} />
        <Route path="/filmes-todos" element={<ProtectedRoute><FilmesPorCategoria /></ProtectedRoute>} />
        <Route path="/filmes/:categoria" element={<ProtectedRoute><FilmesPorCategoria /></ProtectedRoute>} />
        <Route path="/categoria/:categoria" element={<ProtectedRoute><FilmesPorCategoria /></ProtectedRoute>} />
        <Route path="/details/:type/:id" element={<ProtectedRoute><DetailsNew /></ProtectedRoute>} />
        <Route path="/movie-details/:id" element={<ProtectedRoute><MovieDetails /></ProtectedRoute>} />
        <Route path="/content/:id" element={<ProtectedRoute><Content /></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
        <Route path="/image-cleanup" element={<ProtectedRoute><ImageCleanup /></ProtectedRoute>} />
        <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
        <Route path="/profiles" element={<ProtectedRoute><Profiles /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/devices" element={<ProtectedRoute><DeviceManagement /></ProtectedRoute>} />
        <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><PremiumHome /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

const PlayerContainer = () => {
  const { isPlayerOpen, currentItem, closePlayer } = usePlayer();

  if (!isPlayerOpen || !currentItem) return null;

  const videoUrl = currentItem.videoUrl || '';
  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');

  if (isYouTube) {
    return (
      <YouTubePlayer
        url={videoUrl}
        title={currentItem.title}
        poster={currentItem.poster}
        onClose={closePlayer}
        contentId={currentItem.id}
        contentType={currentItem.type}
        episodeId={currentItem.episodeId}
        seasonNumber={currentItem.seasonNumber}
        episodeNumber={currentItem.episodeNumber}
        resumeFrom={currentItem.resumeFrom}
      />
    );
  }

  return (
    <VideoJSPlayer
      url={videoUrl}
      title={currentItem.title}
      poster={currentItem.poster}
      onClose={closePlayer}
      contentId={currentItem.id}
      contentType={currentItem.type}
      episodeId={currentItem.episodeId}
      seasonNumber={currentItem.seasonNumber}
      episodeNumber={currentItem.episodeNumber}
      resumeFrom={currentItem.resumeFrom}
    />
  );
};

const AppContent = () => {
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const location = useLocation();
  const { isPlayerOpen, closePlayer } = usePlayer();
  const { user } = useAuth();
  const previousUserIdRef = useRef<string | undefined>(undefined);
  const hasShownSplashRef = useRef(false);

  const { isProjectionMode, isLargeScreen } = useProjectionMode();

  const isLoginPage = location.pathname === "/login";
  const isSeriesDetailsPage = location.pathname.startsWith("/series-details/");
  const isMovieDetailsPage = location.pathname.startsWith("/movie-details/");
  const isContentPage = location.pathname.startsWith("/content/");
  const isDetailsPage = location.pathname.startsWith("/details/");
  const isPlayerPage = isSeriesDetailsPage || isMovieDetailsPage || isContentPage || isDetailsPage || isPlayerOpen;

  // Mostrar splash apenas uma vez por sessão após login
  useEffect(() => {
    const currentUserId = user?.id;
    const wasLoggedOut = !previousUserIdRef.current && !!currentUserId;

    if (wasLoggedOut && !hasShownSplashRef.current && location.pathname !== '/login') {
      setShowSplash(true);
      hasShownSplashRef.current = true;
    }

    previousUserIdRef.current = currentUserId;
  }, [user?.id, location.pathname]);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const { showExitConfirmation, confirmExit, cancelExit } = useGlobalBackHandler({
    isPlayerOpen,
    onClosePlayer: closePlayer,
    onExitApp: () => {
      window.location.href = '/login';
    },
  });

  useGlobalTVNavigation();
  useAutoCacheCleanup();
  useMobileViewportHeight();

  const showNavbars = !isLoginPage && !isPlayerPage;

  return (
    <>
      {showSplash && (
        <SplashScreen
          onComplete={handleSplashComplete}
          minDuration={2500}
        />
      )}
      <div className={`min-h-screen bg-black ${showNavbars ? 'pb-14 md:pb-0' : ''}`}>
        <NotificationProvider>
          <NotificationContainer />
          {showNotificationPrompt && (
            <NotificationPermissionPrompt onClose={() => setShowNotificationPrompt(false)} />
          )}
          <KeyboardNavigation>
            {showNavbars && (
              <div className="hidden md:block">
                <TVNavbar />
              </div>
            )}
            <SpatialNavigationProvider>
              <AppRoutes />
            </SpatialNavigationProvider>
          </KeyboardNavigation>
          <PlayerContainer />
        </NotificationProvider>
        {showNavbars && <MobileBottomNav />}
        <PWAInstallPrompt />
        <ExitConfirmationModal
          isOpen={showExitConfirmation}
          onConfirm={confirmExit}
          onCancel={cancelExit}
        />
      </div>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppLoadingProvider>
          <AuthProvider>
            <DeviceAccessManager>
              <BrowserRouter>
                <PlayerProvider>
                  <AppContent />
                </PlayerProvider>
              </BrowserRouter>
            </DeviceAccessManager>
          </AuthProvider>
        </AppLoadingProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
