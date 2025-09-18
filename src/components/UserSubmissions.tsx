import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthProvider";
import { Card } from "@/components/ui/card";

const UserSubmissions = () => {
  const { user, role } = useAuth();
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    if (!user || role !== 'user') { setReports([]); return; }
    const load = async () => {
      const { data } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setReports(data || []);
    };
    load();
    const ch = supabase
      .channel("user-dashboard-reports")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, role]);

  if (!user || role !== 'user') return null;
  if (!reports.length) return null;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold mb-3">Your Previous Submissions</h2>
      <div className="grid gap-4">
        {reports.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex justify-between mb-1">
              <div className="font-medium">{r.category}</div>
              <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
            </div>
            <div className="text-sm mb-2">{r.description}</div>
            {r.address && <div className="text-xs text-muted-foreground">{r.address}</div>}
            {r.photo_urls?.length > 0 && (
              <img src={r.photo_urls[0]} className="w-full max-w-xs rounded mt-2" />
            )}
            <div className="text-xs mt-2">Status: <span className="font-semibold">{r.status}</span></div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserSubmissions;
