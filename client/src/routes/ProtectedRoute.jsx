import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import Loader from '../components/common/Loader.jsx';

// Login pannavanga mattum ulla pogalaam. Illana Login page-ku anuppum,
// login aana apram thirumba andha page-ke varum (from).
// role="admin" kudutha admin mattum.
export function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader text="Checking your session..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

// Already login-la irukkavanga Login/Register page-ku vandha → Dashboard-ku anuppum
export function GuestRoute() {
  const { user, loading } = useAuth();

  if (loading) return <Loader text="Loading..." />;
  if (user) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
