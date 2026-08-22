import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '../api/axios';

const AuthContext = createContext(null);

const TOKEN_KEY = 'educonnect_token';
const USER_KEY = 'educonnect_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);

  // On first load, rehydrate the session from localStorage and verify the
  // token is still valid by re-fetching the profile from the API.
  useEffect(() => {
    const bootstrap = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          // ignore malformed cache, we'll refetch below
        }
      }

      try {
        const { data } = await api.get('/auth/me');
        setUser(data.data);
        localStorage.setItem(USER_KEY, JSON.stringify(data.data));
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  const persistSession = useCallback((data, jwt) => {
    localStorage.setItem(TOKEN_KEY, jwt);
    localStorage.setItem(USER_KEY, JSON.stringify(data));
    setToken(jwt);
    setUser(data);
  }, []);

  const login = useCallback(
    async (email, password) => {
      try {
        const { data } = await api.post('/auth/login', { email, password });
        persistSession(data.data, data.token);
        return { success: true, user: data.data };
      } catch (error) {
        return { success: false, message: getErrorMessage(error) };
      }
    },
    [persistSession]
  );

  const register = useCallback(
    async (payload) => {
      try {
        const { data } = await api.post('/auth/register', payload);
        persistSession(data.data, data.token);
        return { success: true, user: data.data };
      } catch (error) {
        return { success: false, message: getErrorMessage(error) };
      }
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      isStaff: user?.role === 'lecturer' || user?.role === 'admin',
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      updateUser,
    }),
    [user, token, isLoading, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
