import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "../types";
import { api } from "../services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  quickSwitchRole: (role: UserRole) => Promise<void>;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("jalrakshak_token"));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem("jalrakshak_token");
      if (storedToken) {
        try {
          const me = await api.auth.me();
          setUser(me);
        } catch {
          // invalid or expired token
          localStorage.removeItem("jalrakshak_token");
          setToken(null);
          setUser(null);
        }
      } else {
        // Automatically log in as Admin for instant out-of-the-box demonstration review
        try {
          const res = await api.auth.login({ username: "admin", password: "admin123" });
          localStorage.setItem("jalrakshak_token", res.access_token);
          setToken(res.access_token);
          setUser(res.user);
        } catch {
          // backend may not be up yet
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login({ username, password });
      localStorage.setItem("jalrakshak_token", res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("jalrakshak_token");
    setToken(null);
    setUser(null);
  };

  const quickSwitchRole = async (role: UserRole) => {
    let username = "admin";
    let password = "admin123";
    if (role === "Field Officer") {
      username = "officer";
      password = "officer123";
    } else if (role === "Community Viewer") {
      username = "viewer";
      password = "viewer123";
    }
    await login(username, password);
  };

  const hasRole = (allowedRoles: UserRole[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        quickSwitchRole,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
