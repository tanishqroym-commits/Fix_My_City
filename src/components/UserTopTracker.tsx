import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ReportTracker from "@/components/ReportTracker";
import { useAuth } from "@/context/AuthProvider";

const STATUS_STEPS = [
  { key: "submitted", label: "Submitted" },
  { key: "admin_received", label: "Admin Received" },
  { key: "assigned_agent", label: "Assigned to Agent" },
  { key: "agent_received", label: "Issue Received" },
  { key: "resolved", label: "Issue Solved" },
];

const UserTopTracker = () => {
  const { user } = useAuth();
  const [latest, setLatest] = useState<any | null>(null);

  useEffect(() => {
    if (!user) { setLatest(null); return; }
    const load = async () => {
      const { data } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      setLatest(data && data[0] ? data[0] : null);
    };
    load();
    const ch = supabase
      .channel("user-top-tracker")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  if (!user || !latest) return null;
  return (
    <div className="container mx-auto px-4 pt-6 pb-2">
      <div className="bg-white rounded shadow p-4 mb-4">
        <div className="font-semibold mb-2">Track your latest report</div>
        <ReportTracker status={latest.status} steps={STATUS_STEPS} />
        <div className="text-xs text-muted-foreground mt-2">{latest.category} - {new Date(latest.created_at).toLocaleString()}</div>
      </div>
    </div>
  );
};

export default UserTopTracker;
