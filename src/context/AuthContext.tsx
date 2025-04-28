"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  id: string;
  email: string;
  role: string;
  name: string;
}

interface AuthContextType {
  user: DecodedToken | null;
  login: (token: string) => void;
  logout: () => void;
  checkAuthStatus: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<DecodedToken | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
    setLoading(false);
  }, []);

  const checkAuthStatus = () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode<DecodedToken>(token);
          setUser(decoded);
        } catch (error) {
          localStorage.removeItem("token");
          setUser(null);
        }
      } else {
        setUser(null);
      }
    }
  };

  const login = (token: string) => {
    localStorage.setItem("token", token);
    const decoded = jwtDecode<DecodedToken>(token);
    setUser(decoded);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, checkAuthStatus, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
