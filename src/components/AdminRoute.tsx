import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading, isAdmin, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Se não estiver logado, redireciona para login
  if (!session || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se não for admin, redireciona para home
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
