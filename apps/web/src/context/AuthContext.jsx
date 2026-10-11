import React, { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'watertracker_auth_user_v1';
const REGISTERED_USERS_KEY = 'watertracker_registered_users_v1';

export const DEMO_ACCOUNTS = {
  resident: {
    id: 'resident-demo-1',
    name: 'Priya Sharma',
    role: 'resident',
    email: 'priya.sharma@example.com',
    locality: 'Cidco Sector N-5, Sambhajinagar',
    phone: '+91 98230 45678',
    avatarText: 'PS',
    tagline: 'Household Consumer',
  },
  operator: {
    id: 'operator-001',
    name: 'Rajesh Patil',
    role: 'operator',
    email: 'rajesh.patil@samarthwater.in',
    agency: 'Samarth Water Carriers',
    tankerId: 'tanker-001',
    phone: '+91 98220 12345',
    avatarText: 'RP',
    tagline: 'Fleet Operator & Driver',
  },
  admin: {
    id: 'admin-001',
    name: 'Dr. Amit Deshmukh',
    role: 'admin',
    email: 'admin@csn-waterboard.gov.in',
    department: 'Municipal Water Board Officer',
    phone: '+91 94220 98765',
    avatarText: 'AD',
    tagline: 'Municipal Administrator',
  },
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // LocalStorage unavailable
    }
    return null;
  });

  const [registeredUsers, setRegisteredUsers] = useState(() => {
    try {
      const saved = localStorage.getItem(REGISTERED_USERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      // ignore
    }
  }, [currentUser]);

  const loginWithDemo = (role) => {
    const account = DEMO_ACCOUNTS[role] || DEMO_ACCOUNTS.resident;
    setCurrentUser(account);
    return account;
  };

  const login = async (emailOrPhone, password, targetRole) => {
    await new Promise((r) => setTimeout(r, 150));
    const trimmedInput = emailOrPhone.trim().toLowerCase();

    // Check matching demo accounts first
    for (const roleKey of Object.keys(DEMO_ACCOUNTS)) {
      const demo = DEMO_ACCOUNTS[roleKey];
      if (
        (demo.email.toLowerCase() === trimmedInput || demo.phone.includes(trimmedInput)) &&
        (!targetRole || demo.role === targetRole)
      ) {
        setCurrentUser(demo);
        return demo;
      }
    }

    // Check custom registered users
    const matched = registeredUsers.find(
      (u) =>
        (u.email.toLowerCase() === trimmedInput || u.phone?.includes(trimmedInput)) &&
        (!targetRole || u.role === targetRole)
    );

    if (matched) {
      if (matched.password && matched.password !== password) {
        throw new Error('Incorrect password. Please verify your credentials.');
      }
      setCurrentUser(matched);
      return matched;
    }

    // If targetRole provided, generate account on the fly for ease of use
    const createdUser = {
      id: `user-${Date.now()}`,
      name: emailOrPhone.split('@')[0] || 'Water Tracker User',
      email: trimmedInput.includes('@') ? trimmedInput : `${trimmedInput}@watertracker.in`,
      role: targetRole || 'resident',
      locality: 'Chhatrapati Sambhajinagar',
      phone: trimmedInput.includes('@') ? '+91 98000 00000' : trimmedInput,
      avatarText: (emailOrPhone[0] || 'U').toUpperCase(),
      tagline: targetRole === 'operator' ? 'Registered Operator' : targetRole === 'admin' ? 'City Admin' : 'Resident',
    };

    setCurrentUser(createdUser);
    return createdUser;
  };

  const register = async ({ name, email, phone, role, password, locality, vehicleNumber }) => {
    await new Promise((r) => setTimeout(r, 200));

    const newUser = {
      id: `${role}-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || '',
      role: role || 'resident',
      locality: locality || 'Cidco Sector N-5',
      vehicleNumber: vehicleNumber || '',
      password,
      avatarText: name.trim().split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U',
      tagline: role === 'operator' ? `Driver: ${vehicleNumber || 'MH-20'}` : role === 'admin' ? 'Municipal Officer' : locality,
      createdAt: new Date().toISOString(),
    };

    const updated = [newUser, ...registeredUsers];
    setRegisteredUsers(updated);
    try {
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(updated));
    } catch (e) {
      // ignore
    }

    setCurrentUser(newUser);
    return newUser;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchRole = (newRole) => {
    if (DEMO_ACCOUNTS[newRole]) {
      setCurrentUser(DEMO_ACCOUNTS[newRole]);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || null,
        isAuthenticated: Boolean(currentUser),
        login,
        loginWithDemo,
        register,
        logout,
        switchRole,
      }}
    >
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
