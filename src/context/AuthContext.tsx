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
    const initAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (data?.user) {
          setUser({ id: data.user.id, email: data.user.email ?? "" });
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();

    // Suscribirnos a cambios de sesión
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? "" });
      } else {
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
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      if (error) {
        throw error;
      }
      // No seteamos el usuario aquí, el listener onAuthStateChange lo hará
    } catch (error) {
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