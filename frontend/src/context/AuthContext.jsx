import { createContext, useCallback, useContext, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return (await api.get('/auth/me')).user;
      } catch (err) {
        if (err.code === 'ACCOUNT_BANNED') {
          toast.error('Tài khoản của bạn đã bị khóa');
          return null;
        }
        throw err;
      }
    },
    staleTime: 60_000,
  });

  const setUser = useCallback(
    (user) => {
      qc.setQueryData(['me'], user);
      qc.invalidateQueries({ queryKey: ['cart'] });
    },
    [qc],
  );

  const login = useCallback(
    async (email, password) => {
      const { user } = await api.post('/auth/login', { email, password });
      setUser(user);
      return user;
    },
    [setUser],
  );

  const logout = useCallback(async () => {
    await api.post('/auth/logout');
    qc.setQueryData(['me'], null);
    qc.removeQueries({ queryKey: ['orders'] });
    qc.removeQueries({ queryKey: ['admin'] });
    qc.invalidateQueries({ queryKey: ['cart'] });
    toast.success('Đã đăng xuất');
  }, [qc]);

  const value = useMemo(
    () => ({ user: data ?? null, isLoading, isAdmin: data?.role === 'admin', login, logout, setUser }),
    [data, isLoading, login, logout, setUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
