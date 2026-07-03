import { createContext, useContext, useState, useEffect } from "react";
import type { User, Seller, AuthResponse } from "@shared/schema";

type AuthContextType = {
  user: User | null;
  seller: Seller | null;
  token: string | null;
  login: (data: AuthResponse) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSeller: boolean;
  isCustomer: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const storedSeller = localStorage.getItem("seller");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      if (storedSeller) {
        setSeller(JSON.parse(storedSeller));
      }
    }
  }, []);

  const login = (data: AuthResponse) => {
    setToken(data.token);
    setUser(data.user);
    if (data.seller) {
      setSeller(data.seller);
    }
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    if (data.seller) {
      localStorage.setItem("seller", JSON.stringify(data.seller));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setSeller(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("seller");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        seller,
        token,
        login,
        logout,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === "admin",
        isSeller: user?.role === "seller",
        isCustomer: user?.role === "customer",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}










