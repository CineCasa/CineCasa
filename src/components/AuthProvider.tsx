import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null;
  signOut: () => Promise<void>;
  loading: boolean;
  isAdmin: boolean;
  plan: string;
  isApproved: boolean;
  approvalError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles" as any)
        .select("*")
        .eq("id", userId)
        .single();
      
      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error);
      }
      
      const profileData = data as any;
      
      // Verificar se o usuário está aprovado ou é admin
      if (profileData) {
        const approved = profileData.approved === true || profileData.is_admin === true;
        setIsApproved(approved);
        
        if (!approved && !profileData.is_admin) {
          setApprovalError("Sua conta está aguardando aprovação do administrador.");
          // Não fazer logout automático, apenas marcar como não aprovado
        }
      } else {
        // Perfil não existe, criar como não aprovado
        setIsApproved(false);
        setApprovalError("Sua conta está aguardando aprovação do administrador.");
      }
      
      // Verificar se o usuário está ativo
      if (profileData && !profileData.is_active && !profileData.is_admin) {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      
      setProfile(profileData || null);
    } catch (e) {
      console.error("Profile fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get initial session
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.error("Session init error:", e);
        setLoading(false);
      }
    };
    
    initSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setIsApproved(false);
        setApprovalError(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isAdmin = profile?.is_admin || false;
  const plan = profile?.plan || "none";

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      profile, 
      signOut, 
      loading, 
      isAdmin, 
      plan,
      isApproved,
      approvalError 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
