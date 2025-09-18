import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReportTracker from "@/components/ReportTracker";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthProvider";
import MapPreview from "@/components/MapPreview";

type Report = {
  id: string;
  category: string;
  description: string;
  contact: string | null;
  priority: number | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  photo_urls: string[];
  status: string;
  user_id?: string | null;
  created_at: string;
};

const STATUS_STEPS: Array<{ key: string; label: string }> = [
  { key: "submitted", label: "Submitted" },
  { key: "admin_received", label: "Admin Received" },
  { key: "assigned_agent", label: "Assigned to Agent" },
  { key: "agent_received", label: "Issue Received" },
  { key: "resolved", label: "Issue Solved" },
];

const statusToBadge: Record<string, { label: string; variant: "default" | "secondary" | "outline" } > = {
  submitted: { label: "Submitted", variant: "secondary" },
  admin_received: { label: "Received", variant: "secondary" },
  assigned_agent: { label: "Assigned", variant: "secondary" },
  agent_received: { label: "In Progress", variant: "default" },
  resolved: { label: "Resolved", variant: "default" },
};

const MyReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);

  const load = async () => {
    if (!user) return;

    const email = (user.email || "").toLowerCase();
    // Try several strategies to link reports to the current user
    const queries: Array<Promise<any>> = [];
    // 1) Contact email exact or ilike
    queries.push(
      supabase.from('reports')
        .select('*')
        .or(`contact.ilike.%${email}%,contact.eq.${email}`)
        .then()
    );
    // 2) user_id if column exists in the schema
    queries.push(
      supabase.from('reports')
        .select('*')
        .eq('user_id', user.id)
        .then()
    );

    // Execute all and merge unique results
    const results = await Promise.allSettled(queries);
    const rows: Report[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled' && Array.isArray((r.value as any).data)) {
        for (const row of (r.value as any).data as Report[]) {
          if (!rows.find(x => x.id === row.id)) rows.push(row);
        }
      }
    }
  // Show all reports for the user, sorted by most recent
  rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  setReports(rows);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("my-reports")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-background fade-in">
      <Header />
      <main className="py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-4">My Reports</h1>
          <div className="grid gap-4">
            {reports.map((r, index) => (
              <Card key={r.id} className={`p-4 space-y-2 card-hover stagger-item`} style={{ animationDelay: `${index * 0.1}s` }}>
                {/* Progress tracker (vertical) */}
                <div className="pb-2">
                  <ReportTracker status={r.status} steps={STATUS_STEPS} />
                </div>
                <div className="flex justify-between">
                  <div className="font-semibold">
                    {r.category}
                    {typeof r.priority === 'number' ? ` (Priority ${r.priority})` : ''}
                  </div>
                  <div className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                </div>
                <div className="text-sm">{r.description}</div>
                {r.address && <div className="text-xs text-muted-foreground">{r.address}</div>}
                {r.lat !== null && r.lng !== null && (
                  <div className="pt-2"><MapPreview lat={r.lat} lng={r.lng} /></div>
                )}
                {r.photo_urls?.length > 0 && (
                  <img src={r.photo_urls[0]} className="w-full max-w-xl rounded" />
                )}
                <div className="pt-2">
                  <Badge variant={statusToBadge[r.status]?.variant || "outline"}>
                    {statusToBadge[r.status]?.label || r.status || "Unknown"}
                  </Badge>
                </div>
              </Card>
            ))}
            {reports.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No reports yet. Create one from the Report page.
                <br />
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs">Debug info (click to expand)</summary>
                  <div className="mt-2 text-xs text-muted-foreground">
                    User ID: {user?.id}<br />
                    User Email: {user?.email}<br />
                    Check browser console for query details.
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyReports;


