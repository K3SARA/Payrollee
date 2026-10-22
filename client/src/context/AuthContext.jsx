import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch, API_BASE } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('payrolleey_token') || null);
  const [loading, setLoading] = useState(true);
  const [demoAccounts, setDemoAccounts] = useState([]);
  const [adminOriginated, setAdminOriginated] = useState(
    sessionStorage.getItem('payrolleey_admin_originated') === 'true'
  );

  // Fetch demo accounts
  useEffect(() => {
    async function loadDemoAccounts() {
      try {
        const res = await fetch(`${API_BASE}/auth/demo-accounts`);
        const data = await res.json();
        if (data.success) {
          setDemoAccounts(data.accounts);
        }
      } catch (err) {
        console.error('Failed to load demo accounts', err);
      }
    }
    loadDemoAccounts();
  }, []);

  // Validate token and load user profile on mount
  useEffect(() => {
    async function checkAuth() {
      const storedToken = localStorage.getItem('payrolleey_token');
      if (!storedToken) {
        try {
          await loginWithCredentials('admin@payrolleey.lk', 'password123');
        } catch (e) {
          setLoading(false);
        }
        return;
      }

      try {
        const res = await apiFetch('/auth/me');
        if (res.success) {
          setUser(res.user);
          setToken(storedToken);
        }
      } catch (err) {
        console.warn('Stored token invalid, resetting session', err);
        localStorage.removeItem('payrolleey_token');
        sessionStorage.removeItem('payrolleey_admin_originated');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  async function loginWithCredentials(email, password = 'password123') {
    setLoading(true);
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (res.success && res.token) {
        localStorage.setItem('payrolleey_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return res.user;
      }
    } finally {
      setLoading(false);
    }
  }

  /**
   * Switch Persona handler enforcing RBAC:
   * Admins can switch to any other persona (staff or admin).
   * Regular staff CANNOT switch to the Admin role!
   */
  async function switchPersona(targetEmail) {
    const targetAccount = demoAccounts.find(a => a.email.toLowerCase() === targetEmail.toLowerCase());
    const isTargetAdmin = targetAccount?.role === 'HR_ADMIN';
    const isCurrentAdmin = user?.role === 'HR_ADMIN';

    // Staff cannot switch to admin role
    if (!isCurrentAdmin && !adminOriginated && isTargetAdmin) {
      alert('Access Denied: Staff accounts cannot switch to Administrator role.');
      return;
    }

    // If an Admin is switching to staff, remember that this was initiated by an Admin
    if (isCurrentAdmin && !isTargetAdmin) {
      sessionStorage.setItem('payrolleey_admin_originated', 'true');
      setAdminOriginated(true);
    } else if (isTargetAdmin) {
      sessionStorage.removeItem('payrolleey_admin_originated');
      setAdminOriginated(false);
    }

    return await loginWithCredentials(targetEmail, 'password123');
  }

  function logout() {
    localStorage.removeItem('payrolleey_token');
    sessionStorage.removeItem('payrolleey_admin_originated');
    setAdminOriginated(false);
    setToken(null);
    setUser(null);
  }

  const value = {
    user,
    token,
    role: user?.role || null,
    profile: user?.profile || null,
    isAdmin: user?.role === 'HR_ADMIN',
    adminOriginated,
    loading,
    demoAccounts,
    loginWithCredentials,
    switchPersona,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
