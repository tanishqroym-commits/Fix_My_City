import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthProvider";

export const ProtectedRoute = ({ children, requireRole }: { children: React.ReactNode; requireRole?: "admin" | "user" | "agent" }) => {
  const { session, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!session) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (requireRole) {
    if (requireRole === 'admin' && role !== 'admin') return <Navigate to="/" replace />;
    if (requireRole === 'agent' && role !== 'agent' && role !== 'admin') return <Navigate to="/" replace />;
    if (requireRole === 'user' && !(role === 'user' || role === 'admin' || role === 'agent')) return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};



