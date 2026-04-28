import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from "react";
import { supabase, supabaseWithRetry } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { deviceService } from "@/services/DeviceService";

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
  const isFetchingProfile = useRef(false); // Proteção contra loop

  const fetchProfile = async (userId: string) => {
    if (isFetchingProfile.current) return; // Evitar chamadas duplicadas
    isFetchingProfile.current = true;
    console.log('[AuthProvider] Iniciando fetchProfile para userId:', userId);
    try {
      console.log('[AuthProvider] Buscando perfil no Supabase...');
      
      // Adicionar timeout para evitar que a query fique travada (aumentado para 10s)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile query timeout')), 10000)
      );
      
      const queryPromise = supabase
        .from("profiles" as any)
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;
      console.log('[AuthProvider] Query completada. Error:', error?.code || 'none', 'Data:', data ? 'existe' : 'null');
      
      if (error) {
        console.error('[AuthProvider] Erro ao buscar perfil:', error);
        if (error.code === "PGRST116") {
          console.log('[AuthProvider] Perfil não encontrado (PGRST116)');
        }
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
        console.log('[AuthProvider] Usuário inativo, fazendo logout');
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      console.log('[AuthProvider] Perfil carregado com sucesso');
      
      setProfile(profileData || null);
    } catch (e) {
      console.error('[AuthProvider] Profile fetch error:', e);
    } finally {
      console.log('[AuthProvider] fetchProfile finally - setLoading(false)');
      setLoading(false);
      isFetchingProfile.current = false;
    }
  };

  useEffect(() => {
    console.log('[AuthProvider] useEffect iniciado');
    
    // Safety timeout - force loading to false after 3 seconds (mais agressivo para mobile)
    const safetyTimeout = setTimeout(() => {
      console.log('[AuthProvider] Safety timeout ativado - forçando loading false');
      setLoading(false);
    }, 3000);
    
    // Get initial session com retry e timeout
    const initSession = async () => {
      console.log('[AuthProvider] initSession iniciado');
      try {
        // Chamada direta sem retry - o timeout está no client.ts (30s)
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('[AuthProvider] getSession completado. Session:', session ? 'existe' : 'null', 'Error:', error?.message || 'none');
        
        if (error) {
          console.error("Error getting session:", error);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('[AuthProvider] Usuário encontrado na sessão, chamando fetchProfile');
          // Registrar dispositivo em paralelo (não bloqueante)
          deviceService.registerDevice(session.user.id).catch(err => {
            console.warn('[AuthProvider] Erro ao registrar dispositivo:', err);
          });
          await fetchProfile(session.user.id);
        } else {
          console.log('[AuthProvider] Sem usuário na sessão, setLoading(false)');
          setLoading(false);
        }
      } catch (e: any) {
        console.error('[AuthProvider] Session init error:', e.message || e);
        // Em caso de erro/timeout, limpar estado e permitir acesso à tela de login
        setSession(null);
        setUser(null);
        setLoading(false);
      } finally {
        clearTimeout(safetyTimeout);
      }
    };
    
    initSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthProvider] Auth state changed:', event);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        if (session?.user) {
          console.log('[AuthProvider] Evento', event, '- chamando fetchProfile');
          // Registrar/atualizar dispositivo em eventos de autenticação
          deviceService.registerDevice(session.user.id).catch(err => {
            console.warn('[AuthProvider] Erro ao registrar dispositivo:', err);
          });
          await fetchProfile(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('[AuthProvider] SIGNED_OUT - limpando estado');
        setProfile(null);
        setIsApproved(false);
        setApprovalError(null);
        setLoading(false);
      }
    });

    return () => {
      console.log('[AuthProvider] Cleanup - unsubscribe');
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isAdmin = profile?.is_admin || false;
  const plan = profile?.plan || "none";
  
  // Memoizar user para estabilizar referência - só muda quando ID mudar
  // Isso previne loops em hooks que usam user como dependência
  const stableUser = useMemo(() => {
    if (!user) return null;
    // Retornar o próprio user - o useMemo garante que só recalcula quando user.id mudar
    return user;
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{ 
      session, 
      user: stableUser, 
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
