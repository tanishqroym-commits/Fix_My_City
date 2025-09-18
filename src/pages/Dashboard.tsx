import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MapPreview from "@/components/MapPreview";
import { ExternalLink } from "lucide-react";
import Header from "@/components/Header";
import UserSubmissions from "@/components/UserSubmissions";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type DbReport = {
  id: string;
  category: string;
  description: string;
  address: string | null;
  photo_urls: string[] | null;
  status: string;
  priority: string;
  created_at: string;
};

const Dashboard = () => {
  const [reports, setReports] = useState<DbReport[]>([]);
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("reports")
        .select("id, category, description, address, photo_urls, status, priority, created_at, lat, lng")
        .order("created_at", { ascending: false });
      setReports((data as DbReport[]) || []);
    };
    load();
    const channel = supabase
      .channel('reports-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-purple-100 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950">
      <Header />
      <main className="py-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <span className="inline-flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 p-3 shadow-md">
              <svg className="h-7 w-7 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 0 0-3-3.87M9 20H4v-2a4 4 0 0 1 3-3.87m13-6.13a4 4 0 1 0-8 0 4 4 0 0 0 8 0zm-8 0a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" /></svg>
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white drop-shadow-sm">Community Dashboard</h1>
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
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );

};
export default Dashboard;