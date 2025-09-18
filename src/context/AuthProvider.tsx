import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast as sonnerToast } from "sonner";

type Role = "user" | "admin" | null;

type AuthContextType = {
  session: import("@supabase/supabase-js").Session | null;
  user: import("@supabase/supabase-js").User | null;
  role: Role;
  loading: boolean;
  busy: boolean;
};

const AuthContext = createContext<AuthContextType>({ session: null, user: null, role: null, loading: true, busy: false });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<import("@supabase/supabase-js").Session | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const init = async () => {
      setBusy(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session ?? null);
      // Optimistic: read cached role to avoid blocking UI
      if (session?.user) {
        const cached = localStorage.getItem(`role/${session.user.id}`);
        if (cached) setRole(cached as Role);
        // Refresh in background
        loadRole(session.user.id);
      } else {
        setRole(null);
      }
      setLoading(false);
      setBusy(false);
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setBusy(true);
      setSession(sess ?? null);
      if (sess?.user) {
        const cached = localStorage.getItem(`role/${sess.user.id}`);
        if (cached) setRole(cached as Role);
        loadRole(sess.user.id);
      } else {
        setRole(null);
      }
      setBusy(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Admin realtime listener for new reports + notifications
  useEffect(() => {
    // Only attach when current user is an admin
    if (role !== "admin") return;

    // Best-effort: request Notification permission once when admin session is active
    const requestNotificationPermission = async () => {
      try {
        if (typeof window !== "undefined" && "Notification" in window) {
          if (Notification.permission === "default") {
            await Notification.requestPermission();
          }
        }
      } catch {
        // ignore
      }
    };

    requestNotificationPermission();

    const channel = supabase
      .channel("reports-insert-notify")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reports" },
        (payload) => {
          const newReport = payload?.new as any;
          const category: string = newReport?.category ?? "New Report";
          const description: string = newReport?.description ?? "A new issue was reported";

          const title = `New report: ${category}`;
          const body = description.length > 140 ? `${description.slice(0, 137)}...` : description;

          let nativeShown = false;
          try {
            if (typeof window !== "undefined" && "Notification" in window) {
              if (Notification.permission === "granted") {
                const n = new Notification(title, {
                  body,
                  tag: `report-${newReport?.id ?? Math.random()}`,
                });
                n.onclick = () => {
                  try {
                    window.focus();
                  } catch {}
                  window.location.assign("/complaints");
                };
                nativeShown = true;
              }
            }
          } catch {
            // ignore and fallback to toast
          }

          if (!nativeShown) {
            sonnerToast(title, {
              description: body,
              action: {
                label: "View",
                onClick: () => window.location.assign("/complaints"),
              },
            });
          }
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, [role]);

  const loadRole = async (userId: string) => {
    const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
    if (error) {
      console.error("Failed to fetch role", error);
      setRole(null);
      return;
    }
    const r = (data?.role as Role) ?? "user";
    setRole(r);
    try {
      localStorage.setItem(`role/${userId}`, r || "");
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, role, loading, busy }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);



