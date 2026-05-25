import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((data) => {
    if (data?.token) {
      localStorage.setItem('token', data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    }
    setUser({
      _id: data._id,
      name: data.name,
      email: data.email,
      role: data.role,
      profilePic: data.profilePic || '',
      authProvider: data.authProvider || 'local',
      hasPassword: Boolean(data.hasPassword),
    });
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const { data } = await api.get('/auth/me');
    setUser({
      _id: data._id,
      name: data.name,
      email: data.email,
      role: data.role,
      profilePic: data.profilePic || '',
      authProvider: data.authProvider || 'local',
      hasPassword: Boolean(data.hasPassword),
    });
    return data;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api
        .get('/auth/me')
        .then(({ data }) => {
          setUser({
            _id: data._id,
            name: data.name,
            email: data.email,
            role: data.role,
            profilePic: data.profilePic || '',
            authProvider: data.authProvider || 'local',
            hasPassword: Boolean(data.hasPassword),
          });
        })
        .catch(() => {
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    applySession(data);
    return data;
  };

  const loginWithGoogle = async (credential) => {
    const { data } = await api.post('/auth/google', { credential });
    applySession(data);
    return data;
  };

  const register = async ({ name, email, password, role = 'staff', profilePicFile }) => {
    const fd = new FormData();
    fd.append('name', name);
    fd.append('email', email);
    fd.append('password', password);
    fd.append('role', role);
    if (profilePicFile) fd.append('profilePic', profilePicFile);
    const { data } = await api.post('/auth/register', fd);
    applySession(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const deleteAccount = async (payload) => {
    await api.post('/auth/delete-account', payload);
    logout();
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, loginWithGoogle, register, logout, refreshUser, deleteAccount }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
