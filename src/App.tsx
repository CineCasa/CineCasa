import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthProvider";
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
import Login from "./pages/Login";
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

// Componente para proteger rotas - redireciona para login se não autenticado
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Aguardar o carregamento da autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }
  
  if (!user) {
    // Redireciona para login, salvando a rota atual para redirecionar de volta após login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

// Componente para redirecionar usuário logado da página de login para home
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  // Aguardar o carregamento da autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }
  
  if (user) {
    // Se já está logado, redireciona para home
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const location = useLocation();
  const { user } = useAuth();
  console.log('[AppRoutes] Rota atual:', location.pathname, 'Usuário logado:', !!user);
  
  return (
    <Routes>
      {/* Rota pública - Login (redireciona para home se já logado) */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      
      {/* Rota pública - Novidades (acessível sem login) */}
      <Route path="/novidades" element={<PublicNotifications />} />
      
      {/* Rotas protegidas - Requerem autenticação */}
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
      
      {/* Home - Protegida, redireciona para login se não autenticado */}
      <Route path="/" element={<ProtectedRoute><PremiumHome /></ProtectedRoute>} />
      
      {/* Rota padrão - redireciona para login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
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

const AppContent = () => {
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const { user } = useAuth();
  const isLoggedIn = !!user;
  
  console.log('[AppContent] pathname:', location.pathname, 'isLoginPage:', isLoginPage);

  return (
    <div className={`min-h-screen bg-black ${isLoginPage ? '' : 'pb-14 md:pb-0'}`}>
      <NotificationProvider>
        <NotificationContainer />
        <NewContentNotificationToast />
        {showNotificationPrompt && (
          <NotificationPermissionPrompt onClose={() => setShowNotificationPrompt(false)} />
        )}
        <PlayerProvider>
          <KeyboardNavigation>
            {!isLoginPage && <PremiumNavbar />}
            <AppRoutes />
          </KeyboardNavigation>
          <PlayerContainer />
          {isLoggedIn && <PWAInstallButton />}
          {isLoggedIn && <PWAImmediateInstall />}
        </PlayerProvider>
      </NotificationProvider>
      {!isLoginPage && <MobileBottomNav />}
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <DeviceAccessManager>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </DeviceAccessManager>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
