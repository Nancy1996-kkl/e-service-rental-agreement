import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

// Edha component-la irundhaalum: const { user, login, logout } = useAuth();
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
