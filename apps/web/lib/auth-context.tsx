"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export interface User {
  id: string;
  email: string;
  nickname: string;
  isAdmin: boolean;
}

export interface Session {
  user: User;
}

interface AuthContextType {
  session: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");

  const fetchSession = async () => {
    try {
      const response = await fetch("/api/auth/session");
      const data = await response.json();

      if (data.user) {
        setSession(data);
        setStatus("authenticated");
      } else {
        setSession(null);
        setStatus("unauthenticated");
      }
    } catch (error) {
      console.error("Session fetch error:", error);
      setSession(null);
      setStatus("unauthenticated");
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSession({ user: data.user });
        setStatus("authenticated");
        return { success: true };
      } else {
        return { success: false, error: data.error || "Login failed" };
      }
    } catch (error) {
      return { success: false, error: "An error occurred during login" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      setSession(null);
      setStatus("unauthenticated");
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear local state even if API call fails
      setSession(null);
      setStatus("unauthenticated");
    }
  };

  const refresh = async () => {
    await fetchSession();
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const contextValue: AuthContextType = {
    session,
    status,
    login,
    logout,
    refresh,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Compatibility hooks for easier migration
export function useSession() {
  const { session, status } = useAuth();
  return {
    data: session,
    status:
      status === "loading"
        ? "loading"
        : status === "authenticated"
          ? "authenticated"
          : "unauthenticated",
  };
}

export async function signIn(
  provider: string,
  options?: { email: string; password: string; redirect?: boolean }
) {
  if (provider === "credentials" && options) {
    const authContext = useAuth();
    return authContext.login(options.email, options.password);
  }
  throw new Error("Unsupported sign in method");
}

export async function signOut(options?: { redirect?: boolean }) {
  const authContext = useAuth();
  return authContext.logout();
}
