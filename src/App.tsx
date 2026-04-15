import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./components/AuthProvider";
import { AuthProvider } from "./components/AuthProvider";
import LoadingScreen from "./components/LoadingScreen";
import StreamingNavbar from "./components/StreamingNavbar";
import StreamingCard from "./components/StreamingCard";
import DeviceAccessManager from "./components/DeviceAccessManager";
import KeyboardNavigation from "./components/KeyboardNavigation";
import MobileBottomNav from "./components/MobileBottomNav";
import PremiumNavbar from "./components/PremiumNavbar";
import { PlayerProvider, usePlayer } from "./contexts/PlayerContext";
import VideoJSPlayer from "./components/VideoJSPlayer";
import Index from "./pages/Index";
import PremiumHome from "./pages/PremiumHome";
import PremiumCatalog from "./pages/PremiumCatalog";
import FilmesESeries from "./pages/FilmesESeries";
import FilmesPorCategoria from "./pages/FilmesPorCategoria";
import FilmesCategorias from "./pages/FilmesCategorias";
import Favorites from "./pages/Favorites";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Admin from "./pages/Admin";
import Content from "./pages/Content";
import Details from "./pages/Details";
import SeriesDetails from "./pages/SeriesDetails";
import MovieDetails from "./pages/MovieDetails";
import SeriesPorCategoria from "./pages/SeriesPorCategoria";
import ImageCleanup from "./pages/ImageCleanup";
import NotificationSettings from "./pages/NotificationSettings";
import AdvancedSearch from "./pages/AdvancedSearch";
import Profiles from "./pages/Profiles";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import NotificationProvider from "./components/NotificationProvider";
import { NotificationContainer } from "./components/MovieNotifications";
import { NotificationsPage } from "./components/NotificationsPage";
import PublicNotifications from "./pages/PublicNotifications";
import { NewContentNotificationToast } from "./components/NewContentNotificationToast";
import { NotificationPermissionPrompt } from "./components/NotificationPermissionPrompt";
import { PWAInstallButton } from "./components/PWAInstallButton";
import { PWAImmediateInstall } from "./components/PWAImmediateInstall";

const queryClient = new QueryClient();

const HomeRedirect = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const AppRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  // Comentado para permitir navegação direta às páginas
  // useEffect(() => {
  //   if (location.pathname !== "/") {
  //     navigate("/", { replace: true });
  //   }
  // }, []);

  if (loading) {
    return <LoadingScreen isLoading={true} />;
  }

  return (
    <Routes location={location}>
      {/* Rotas públicas - não requerem login */}
      {/* <Route path="/login" element={<Login />} /> */}
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/novidades" element={<PublicNotifications />} />

      {/* Rotas protegidas */}
      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      <Route path="/filmes-categorias" element={<ProtectedRoute><FilmesCategorias /></ProtectedRoute>} />
      <Route path="/filmes" element={<ProtectedRoute><FilmesESeries /></ProtectedRoute>} />
      <Route path="/filmes/:categoria" element={<ProtectedRoute><FilmesPorCategoria /></ProtectedRoute>} />
      <Route path="/series" element={<ProtectedRoute><PremiumCatalog contentType="series" /></ProtectedRoute>} />
      <Route path="/series-categorias" element={<ProtectedRoute><SeriesPorCategoria /></ProtectedRoute>} />
      <Route path="/details/:type/:id" element={<ProtectedRoute><Details /></ProtectedRoute>} />
      <Route path="/movie-details/:id" element={<ProtectedRoute><MovieDetails /></ProtectedRoute>} />
      <Route path="/series-details/:id" element={<ProtectedRoute><SeriesDetails /></ProtectedRoute>} />
      <Route path="/content/:id" element={<ProtectedRoute><Content /></ProtectedRoute>} />
      <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
      <Route path="/image-cleanup" element={<ProtectedRoute><ImageCleanup /></ProtectedRoute>} />
      <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><AdvancedSearch /></ProtectedRoute>} />
      <Route path="/profiles" element={<ProtectedRoute><Profiles /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/" element={<ProtectedRoute><PremiumHome /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const PlayerContainer = () => {
  const { isPlayerOpen, currentItem, closePlayer } = usePlayer();
  
  if (!isPlayerOpen || !currentItem) return null;
  
  return (
    <VideoJSPlayer
      url={currentItem.videoUrl || ''}
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

const App = () => {
  const [loading, setLoading] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  const handleLoadingComplete = () => {
    setLoading(false);
    setTimeout(() => setShowContent(true), 100);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <DeviceAccessManager>
            <AnimatePresence mode="wait">
                {loading && (
                  <LoadingScreen 
                    isLoading={true} 
                    onComplete={handleLoadingComplete}
                    duration={5}
                  />
                )}
              </AnimatePresence>
              {!loading && (
                <BrowserRouter>
                  <div className="min-h-screen bg-black pb-14 md:pb-0">
                    <NotificationProvider>
                      <NotificationContainer />
                      <NewContentNotificationToast />
                      {showNotificationPrompt && (
                        <NotificationPermissionPrompt onClose={() => setShowNotificationPrompt(false)} />
                      )}
                      <PlayerProvider>
                        <KeyboardNavigation>
                          <PremiumNavbar />
                          <AppRoutes />
                        </KeyboardNavigation>
                        <PlayerContainer />
                        <PWAInstallButton />
                        <PWAImmediateInstall />
                      </PlayerProvider>
                    </NotificationProvider>
                    <MobileBottomNav />
                  </div>
                </BrowserRouter>
              )}
          </DeviceAccessManager>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
