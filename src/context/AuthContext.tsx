import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";

type User = {
  id: string;
  email: string;
} | null;

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User|null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // Obtener usuario al cargar
    supabase.auth.getUser().then(({ data, error }) => {
      console.log("AuthContext - getUser:", { data, error });
      if (data?.user) {
        console.log("AuthContext - setting user:", data.user);
        setUser({ id: data.user.id, email: data.user.email ?? "" });
      } else {
        console.log("AuthContext - no user found");
        setUser(null);
      }
      setLoading(false);
    });

    // Suscribirnos a cambios de sesión
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("AuthContext - auth state change:", { event, session });
      if (session?.user) {
        console.log("AuthContext - auth state change - setting user:", session.user);
        setUser({ id: session.user.id, email: session.user.email ?? "" });
      } else {
        console.log("AuthContext - auth state change - clearing user");
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log("AuthContext - login attempt:", { email });
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      console.log("AuthContext - login response:", { data, error });
      if (error) {
        console.error("AuthContext - login error:", error);
        throw error;
      }
      console.log("AuthContext - login successful");
      // No seteamos el usuario aquí, el listener onAuthStateChange lo hará
    } catch (error) {
      console.error("AuthContext - login exception:", error);
      throw error;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};