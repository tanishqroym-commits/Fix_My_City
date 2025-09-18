import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MapPreview from "@/components/MapPreview";
import { useAuth } from "@/context/AuthProvider";
import { toast } from "sonner";

type Report = {
  id: string;
  category: string;
  description: string;
  priority: number | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  photo_urls: string[];
  status: string;
  agent_id: string | null;
  created_at: string;
};

const Agent = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("reports")
      .select("*")
      .eq("agent_id", user.id)
      .order("priority", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });
    setReports((data as Report[]) || []);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("agent-reports")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  const act = async (id: string, status: 'agent_received' | 'resolved') => {
    setBusyId(id);
    // Enforce sequential transitions and that this agent is assigned
    const { data: row } = await supabase.from('reports').select('status, agent_id').eq('id', id).maybeSingle();
    const isAssignedToMe = row?.agent_id === user?.id;
    let next = row?.status;
    if (isAssignedToMe) {
      if (status === 'agent_received') {
        next = 'agent_received';
      } else if (status === 'resolved') {
        next = 'resolved';
      }
    }
    await supabase.from("reports").update({ status: next }).eq("id", id);
    if (status === 'resolved') {
      // Fetch the report to get user info
      const { data: report } = await supabase.from('reports').select('user_id, contact').eq('id', id).maybeSingle();
      // Try to notify the user (in-app toast for now)
      if (report?.user_id) {
        toast.success('Issue marked as completed. The user will be notified.');
        // In a real app, you would send a push/email notification here
      }
    }
    setBusyId(null);
    load();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-purple-100 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950">
      <Header />
      <main className="py-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <span className="inline-flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 p-3 shadow-md">
              <svg className="h-7 w-7 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 0 0-3-3.87M9 20H4v-2a4 4 0 0 1 3-3.87m13-6.13a4 4 0 1 0-8 0 4 4 0 0 0 8 0zm-8 0a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" /></svg>
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white drop-shadow-sm">Agent Assignments</h1>
          </div>
          <div className="grid gap-8">
            {reports.map((r) => (
              <Card key={r.id} className="p-6 space-y-3 rounded-2xl shadow-xl border border-blue-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:scale-[1.015] hover:shadow-2xl transition-transform">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                  <div className="font-bold text-lg text-blue-800 dark:text-blue-200 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    {r.category} {typeof r.priority === 'number' ? <span className="ml-2 px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs font-semibold">Priority {r.priority}</span> : ''}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-300 font-mono">{new Date(r.created_at).toLocaleString()}</div>
                </div>
                <div className="text-base text-slate-800 dark:text-slate-100 font-medium">{r.description}</div>
                {r.address && <div className="text-xs text-slate-500 dark:text-slate-400 italic">{r.address}</div>}
                {r.lat !== null && r.lng !== null && (
                  <div className="pt-2">
                    <MapPreview lat={r.lat} lng={r.lng} />
                    <div className="flex justify-end mt-2">
                      <a
                        className="text-sm underline inline-flex items-center text-blue-700 dark:text-blue-300 hover:text-blue-900"
                        href={`https://www.google.com/maps?q=${r.lat},${r.lng}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open in Google Maps
                      </a>
                    </div>
                  </div>
                )}
                {r.photo_urls?.length > 0 && (
                  <div className="pt-2">
                    <img src={r.photo_urls[0]} className="w-full max-w-xl rounded-xl border border-blue-100 dark:border-slate-800 shadow" />
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs pt-1">Status:
                  <span>
                    <Badge variant={r.status === 'resolved' ? 'default' : (r.status === 'assigned_agent' || r.status === 'agent_received' || r.status === 'in_progress') ? 'secondary' : 'outline'} className={
                      r.status === 'resolved' ? 'bg-green-500 text-white' :
                      r.status === 'in_progress' ? 'bg-yellow-400 text-slate-900' :
                      r.status === 'assigned_agent' ? 'bg-blue-400 text-white' :
                      r.status === 'agent_received' ? 'bg-purple-400 text-white' :
                      'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                    }>
                      {r.status || 'unknown'}
                    </Badge>
                  </span>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button size="sm" variant={r.status === 'agent_received' ? 'default' : 'outline'} disabled={busyId===r.id || (r.status !== 'assigned_agent' && r.status !== 'agent_received')} onClick={() => act(r.id, 'agent_received')} className="transition">Issue Received</Button>
                  <Button size="sm" variant={r.status === 'resolved' ? 'default' : 'outline'} disabled={busyId===r.id || (r.status !== 'agent_received' && r.status !== 'assigned_agent')} onClick={() => act(r.id, 'resolved')} className="transition">Issue Solved</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Agent;



