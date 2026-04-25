import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import LoadingScreen from "./components/LoadingScreen";
import DeviceAccessManager from "./components/DeviceAccessManager";
import KeyboardNavigation from "./components/KeyboardNavigation";
import { SpatialNavigationProvider } from "./components/SpatialNavigationProvider";
import MobileBottomNav from "./components/MobileBottomNav";
import PremiumNavbar from "./components/PremiumNavbar";
import { PlayerProvider, usePlayer } from "./contexts/PlayerContext";
import VideoJSPlayer from "./components/VideoJSPlayer";
import PremiumHome from "./pages/PremiumHome";
import Series from "./pages/Series";
import FilmesPorCategoria from "./pages/FilmesPorCategoria";
import FilmesCategorias from "./pages/FilmesCategorias";
import Cinema from "./pages/Cinema";
import Favorites from "./pages/Favorites";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Content from "./pages/Content";
import Details from "./pages/Details";
import SeriesDetails from "./pages/SeriesDetails";
import MovieDetails from "./pages/MovieDetails";
import ImageCleanup from "./pages/ImageCleanup";
import NotificationSettings from "./pages/NotificationSettings";
import Search from "./pages/Search";
import Profiles from "./pages/Profiles";
import Profile from "./pages/Profile";
import { NotificationProvider } from "@/hooks/useNotifications.tsx";
import { NotificationContainer } from "./components/MovieNotifications";
import { NotificationsPage } from "./components/NotificationsPage";
import PublicNotifications from "./pages/PublicNotifications";
import { NewContentNotificationToast } from "./components/NewContentNotificationToast";
import { NotificationPermissionPrompt } from "@/components/NotificationPermissionPrompt";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { useGlobalBackHandler } from "./hooks/useGlobalBackHandler";
import { ExitConfirmationModal } from "./components/ExitConfirmationModal";
import { useSilentUpdate } from "@/hooks/useSilentUpdate";
import { useForceUpdate } from "@/hooks/useForceUpdate";
import { useAutoCacheCleanup } from "@/hooks/useAutoCacheCleanup";
import { useAutoUpdate } from "@/hooks/useAutoUpdate";
import { useMobileViewportHeight } from "@/hooks/useMobileViewportHeight";
import { AppLoadingProvider, useAppLoading } from "@/contexts/AppLoadingContext";

const queryClient = new QueryClient();

// Componente para proteger rotas - redireciona para login se não autenticado
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { allCriticalReady, setAuthReady } = useAppLoading();
  const location = useLocation();

  // Notificar quando auth estiver pronto
  useEffect(() => {
    if (!authLoading && user) {
      setAuthReady(true);
    }
  }, [authLoading, user, setAuthReady]);

  console.log('[ProtectedRoute] authLoading:', authLoading, 'user:', !!user, 'allCriticalReady:', allCriticalReady);

  // Aguardar autenticação E conteúdo crítico (imagens do hero, primeiro row)
  if (authLoading || (user && !allCriticalReady)) {
    console.log('[ProtectedRoute] Exibindo LoadingScreen - aguardando auth e conteúdo crítico');
    return (
      <LoadingScreen 
        isLoading={true} 
        duration={8}
        onComplete={() => console.log('[ProtectedRoute] Loading completo')}
      />
    );
  }

  if (!user) {
    console.log('[ProtectedRoute] Sem usuário, redirecionando para login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('[ProtectedRoute] Tudo pronto - renderizando children');
  return <>{children}</>;
};

// Componente para redirecionar usuário logado da página de login para home
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  // Aguardar o carregamento da autenticação - mostra LoadingScreen com logo e progress bar
  if (loading) {
    return (
      <LoadingScreen 
        isLoading={true} 
        duration={3}
        onComplete={() => console.log('[PublicRoute] Loading completo')}
      />
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
      <Route path="/cinema" element={<ProtectedRoute><Cinema /></ProtectedRoute>} />
            <Route path="/filmes/:categoria" element={<ProtectedRoute><FilmesPorCategoria /></ProtectedRoute>} />
      <Route path="/series" element={<ProtectedRoute><Series /></ProtectedRoute>} />
            <Route path="/details/:type/:id" element={<ProtectedRoute><Details /></ProtectedRoute>} />
      <Route path="/movie-details/:id" element={<ProtectedRoute><MovieDetails /></ProtectedRoute>} />
      <Route path="/series-details/:id" element={<ProtectedRoute><SeriesDetails /></ProtectedRoute>} />
      <Route path="/content/:id" element={<ProtectedRoute><Content /></ProtectedRoute>} />
      <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
      <Route path="/image-cleanup" element={<ProtectedRoute><ImageCleanup /></ProtectedRoute>} />
      <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
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
  const { isPlayerOpen, closePlayer } = usePlayer();
  const { user } = useAuth();
  const isLoginPage = location.pathname === "/login";
  const isSeriesDetailsPage = location.pathname.startsWith("/series-details/");
  const isMovieDetailsPage = location.pathname.startsWith("/movie-details/");
  const isContentPage = location.pathname.startsWith("/content/");
  const isDetailsPage = location.pathname.startsWith("/details/");
  const isPlayerPage = isSeriesDetailsPage || isMovieDetailsPage || isContentPage || isDetailsPage || isPlayerOpen;
  const isLoggedIn = !!user;
  
  // Global Back Handler - navegação TV/Controle Remoto
  const { showExitConfirmation, confirmExit, cancelExit } = useGlobalBackHandler({
    isPlayerOpen,
    onClosePlayer: closePlayer,
    onExitApp: () => {
      // Tentar fechar o app ou redirecionar para uma página de agradecimento
      window.location.href = '/logout';
    },
  });
  
  // Inicializar limpeza automática de cache - garante atualizações sempre
  useAutoCacheCleanup();

  // Inicializar sistema de force update automático
  useForceUpdate();

  // Hook para corrigir viewport em dispositivos móveis
  useMobileViewportHeight();

  // Auto-update com versionamento - verifica a cada 30 segundos
  useAutoUpdate(30000);

  // Atualização silenciosa do PWA - verifica a cada 5 minutos
  useSilentUpdate({
    checkInterval: 5 * 60 * 1000, // 5 minutos
    onUpdateAvailable: () => {
      console.log('[App] Nova versão disponível - atualizará silenciosamente');
    }
  });
  
  console.log('[AppContent] pathname:', location.pathname, 'isLoginPage:', isLoginPage, 'isPlayerOpen:', isPlayerOpen);

  // Quando player está aberto ou em páginas de detalhes, esconder ambas as barras de navegação
  const showNavbars = !isLoginPage && !isPlayerPage;

  return (
    <div className={`min-h-screen bg-black ${showNavbars ? 'pb-14 md:pb-0' : ''}`}>
      <NotificationProvider>
        <NotificationContainer />
        {/* NewContentNotificationToast desabilitado - notificações de conteúdo desativadas */}
        {showNotificationPrompt && (
          <NotificationPermissionPrompt onClose={() => setShowNotificationPrompt(false)} />
        )}
        <KeyboardNavigation>
          {showNavbars && <PremiumNavbar />}
          <SpatialNavigationProvider>
            <AppRoutes />
          </SpatialNavigationProvider>
        </KeyboardNavigation>
        <PlayerContainer />
      </NotificationProvider>
      {showNavbars && <MobileBottomNav />}
      <PWAInstallPrompt />
      
      {/* Modal de Confirmação de Saída - Global Back Handler */}
      <ExitConfirmationModal
        isOpen={showExitConfirmation}
        onConfirm={confirmExit}
        onCancel={cancelExit}
      />
    </div>
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
