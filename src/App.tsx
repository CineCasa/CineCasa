import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "./components/AuthProvider";
import DeviceAccessManager from "./components/DeviceAccessManager";
import KeyboardNavigation from "./components/KeyboardNavigation";
import MobileBottomNav from "./components/MobileBottomNav";
import PremiumNavbar from "./components/PremiumNavbar";
import { PlayerProvider, usePlayer } from "./contexts/PlayerContext";
import VideoJSPlayer from "./components/VideoJSPlayer";
import PremiumHome from "./pages/PremiumHome";
import PremiumCatalog from "./pages/PremiumCatalog";
import FilmesESeries from "./pages/FilmesESeries";
import FilmesPorCategoria from "./pages/FilmesPorCategoria";
import FilmesCategorias from "./pages/FilmesCategorias";
import Favorites from "./pages/Favorites";
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
import NotificationProvider from "./components/NotificationProvider";
import { NotificationContainer } from "./components/MovieNotifications";
import { NotificationsPage } from "./components/NotificationsPage";
import PublicNotifications from "./pages/PublicNotifications";
import { NewContentNotificationToast } from "./components/NewContentNotificationToast";
import { NotificationPermissionPrompt } from "./components/NotificationPermissionPrompt";
import { PWAInstallButton } from "./components/PWAInstallButton";
import { PWAImmediateInstall } from "./components/PWAImmediateInstall";

const queryClient = new QueryClient();

const AppRoutes = () => {
  return (
    <Routes>
      {/* Todas as rotas são públicas - sem login necessário */}
      <Route path="/novidades" element={<PublicNotifications />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/filmes-categorias" element={<FilmesCategorias />} />
      <Route path="/filmes" element={<FilmesESeries />} />
      <Route path="/filmes/:categoria" element={<FilmesPorCategoria />} />
      <Route path="/series" element={<PremiumCatalog contentType="series" />} />
      <Route path="/series-categorias" element={<SeriesPorCategoria />} />
      <Route path="/details/:type/:id" element={<Details />} />
      <Route path="/movie-details/:id" element={<MovieDetails />} />
      <Route path="/series-details/:id" element={<SeriesDetails />} />
      <Route path="/content/:id" element={<Content />} />
      <Route path="/favorites" element={<Favorites />} />
      <Route path="/image-cleanup" element={<ImageCleanup />} />
      <Route path="/settings/notifications" element={<NotificationSettings />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/search" element={<AdvancedSearch />} />
      <Route path="/profiles" element={<Profiles />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/" element={<PremiumHome />} />
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
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <DeviceAccessManager>
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
          </DeviceAccessManager>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
