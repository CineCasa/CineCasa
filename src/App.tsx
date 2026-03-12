import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./components/AuthProvider";
import { AuthProvider } from "./components/AuthProvider";
import DeviceAccessManager from "./components/DeviceAccessManager";
import NavigationManager from "./components/NavigationManager";
import KeyboardNavigation from "./components/KeyboardNavigation";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import Index from "./pages/Index";
import Cinema from "./pages/Cinema";
import Series from "./pages/Series";
import Favorites from "./pages/Favorites";
import Login from "./pages/Login";
import Plans from "./pages/Plans";
import Admin from "./pages/Admin";
import Content from "./pages/Content";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const HomeRedirect = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const AppRoutes = () => {
  const location = useLocation();
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00A8E1] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <Routes location={location}>
          {/* Rotas públicas - não requerem login */}
          <Route path="/plans" element={<Plans />} />
          <Route path="/login" element={<Login />} />

          {/* Rotas protegidas */}
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="/cinema" element={<ProtectedRoute><Cinema /></ProtectedRoute>} />
          <Route path="/series" element={<ProtectedRoute><Series /></ProtectedRoute>} />
          <Route path="/content/:id" element={<ProtectedRoute><Content /></ProtectedRoute>} />
          <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const InitialRedirect = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <DeviceAccessManager>
            <NavigationManager>
              <AnimatePresence mode="wait">
                {loading && (
                  <div className="fixed inset-0 bg-gradient-to-br from-black via-[#0f171e] to-black flex items-center justify-center z-50">
                    <div className="text-center">
                      <div className="mb-8 relative">
                        <img 
                          src="/cinecasa-logo.png" 
                          alt="CineCasa" 
                          className="w-32 h-32 mx-auto animate-pulse"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/favicon.ico";
                            target.className = "w-16 h-16 mx-auto mb-4";
                          }}
                        />
                        <div className="absolute inset-0 bg-[#00A8E1]/20 rounded-full blur-3xl animate-pulse"></div>
                      </div>
                      
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-[#00A8E1] border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <div className="absolute inset-0 border-4 border-[#00A8E1]/30 border-t-transparent rounded-full animate-spin animation-delay-150"></div>
                        <div className="absolute inset-0 border-4 border-[#00A8E1]/20 border-t-transparent rounded-full animate-spin animation-delay-300"></div>
                      </div>
                      
                      <div className="mt-6 space-y-2">
                        <p className="text-white/80 font-semibold text-lg">Carregando CineCasa</p>
                        <p className="text-[#00A8E1]/60 text-sm">Preparando sua experiência...</p>
                      </div>
                      
                      <div className="mt-8 flex justify-center space-x-2">
                        <div className="w-2 h-2 bg-[#00A8E1] rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-[#00A8E1] rounded-full animate-bounce animation-delay-100"></div>
                        <div className="w-2 h-2 bg-[#00A8E1] rounded-full animate-bounce animation-delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
                {!loading && (
                  <BrowserRouter>
                    <KeyboardNavigation>
                      <AppRoutes />
                      <PWAInstallPrompt />
                    </KeyboardNavigation>
                  </BrowserRouter>
                )}
              </AnimatePresence>
            </NavigationManager>
          </DeviceAccessManager>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
