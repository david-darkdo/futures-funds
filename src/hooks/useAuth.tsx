import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "admin" | "user";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function withTimeout<T>(promiseLike: PromiseLike<T>, ms: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const promise = Promise.resolve(promiseLike);

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  }) as Promise<T>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Cache which userId the current `role` belongs to, so we only fetch once per session/user.
  const roleUserIdRef = useRef<string | null>(null);

  const fetchUserRole = async (userId: string): Promise<UserRole> => {
    try {
      const res = await withTimeout(
        Promise.resolve(
          supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle()
        ),
        8000,
        "fetchUserRole"
      );

      if (res.error) {
        console.log("[Auth] Role query error, defaulting to user:", res.error.message);
        return "user";
      }

      if (res.data?.role) {
        const fetchedRole = res.data.role as UserRole;
        console.log("[Auth] Fetched role for user:", userId, "->", fetchedRole);
        return fetchedRole;
      }

      console.log("[Auth] No role row found, treating as unauthorized (user)");
      return "user";
    } catch (err) {
      console.error("[Auth] Error fetching role (timeout or other):", err);
      return "user";
    }
  };

  useEffect(() => {
    let isMounted = true;

    const setLoadingSafe = (value: boolean) => {
      if (!isMounted) return;
      console.log("[Auth] loading ->", value);
      setLoading(value);
    };

    const resolveRoleForUser = async (userId: string) => {
      console.log("[Auth] Resolving role for user:", userId);
      const userRole = await fetchUserRole(userId);

      if (!isMounted) return;
      roleUserIdRef.current = userId;
      setRole(userRole);
      console.log("[Auth] Role set ->", userRole);
    };

    const initializeAuth = async () => {
      setLoadingSafe(true);
      console.log("[Auth] initializeAuth start");

      try {
        const {
          data: { session: existingSession },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        setSession(existingSession);
        setUser(existingSession?.user ?? null);

        if (existingSession?.user) {
          await resolveRoleForUser(existingSession.user.id);
        } else {
          roleUserIdRef.current = null;
          setRole(null);
        }
      } catch (error) {
        console.error("[Auth] Initialization error:", error);
      } finally {
        setLoadingSafe(false);
        console.log("[Auth] initializeAuth done");
      }
    };

    // Listener MUST be synchronous; role fetching is deferred to avoid auth deadlocks.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("[Auth] Auth state changed:", event);

      if (!isMounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (!newSession?.user) {
        roleUserIdRef.current = null;
        setRole(null);
        setLoadingSafe(false);
        return;
      }

      const userId = newSession.user.id;

      // Only fetch if we don't already have a cached role for this user.
      if (roleUserIdRef.current === userId) {
        setLoadingSafe(false);
        return;
      }

      setLoadingSafe(true);
      setTimeout(() => {
        resolveRoleForUser(userId)
          .catch((e) => console.error("[Auth] resolveRoleForUser failed:", e))
          .finally(() => setLoadingSafe(false));
      }, 0);
    });

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
