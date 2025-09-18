import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";

interface Report {
  id: string;
  category: string;
  description: string;
  contact: string | null;
  priority: string;
  lat: number | null;
  lng: number | null;
  address: string | null;
  photo_urls: string[];
  status: string;
  created_at: string;
}

const Complaints = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'in_progress' | 'resolved'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
      if (!error && data) setReports(data as Report[]);
    };
    load();
    const channel = supabase
      .channel('admin-reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = reports.filter(r => filter === 'all' ? true : r.status === filter);

  const updateStatus = async (id: string, status: 'submitted' | 'in_progress' | 'resolved') => {
    setUpdatingId(id);
    const { error } = await supabase.from('reports').update({ status }).eq('id', id);
    if (!error) setReports(prev => prev.map(p => p.id === id ? { ...p, status } as Report : p));
    setUpdatingId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-4">Admin - Reports</h1>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded border ${filter==='all'?'bg-primary text-primary-foreground':'bg-background'}`}>All</button>
            <button onClick={() => setFilter('submitted')} className={`px-3 py-1 rounded border ${filter==='submitted'?'bg-primary text-primary-foreground':'bg-background'}`}>Submitted</button>
            <button onClick={() => setFilter('in_progress')} className={`px-3 py-1 rounded border ${filter==='in_progress'?'bg-primary text-primary-foreground':'bg-background'}`}>In Progress</button>
            <button onClick={() => setFilter('resolved')} className={`px-3 py-1 rounded border ${filter==='resolved'?'bg-primary text-primary-foreground':'bg-background'}`}>Resolved</button>
          </div>
          <div className="grid gap-4">
            {filtered.map((r) => (
              <Card key={r.id} className="p-4 space-y-2">
                <div className="flex justify-between">
                  <div className="font-semibold">{r.category}</div>
                  <div className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                </div>
                <div className="text-sm">{r.description}</div>
                {r.address && <div className="text-xs text-muted-foreground">{r.address}</div>}
                {r.photo_urls?.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {r.photo_urls.map((u, i) => (
                      <img key={i} src={u} className="w-full aspect-square object-cover rounded" />
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button className={`px-2 py-1 rounded border ${r.status==='submitted'?'bg-primary text-primary-foreground':'bg-background'}`} disabled={updatingId===r.id} onClick={()=>updateStatus(r.id,'submitted')}>Submitted</button>
                  <button className={`px-2 py-1 rounded border ${r.status==='in_progress'?'bg-primary text-primary-foreground':'bg-background'}`} disabled={updatingId===r.id} onClick={()=>updateStatus(r.id,'in_progress')}>In Progress</button>
                  <button className={`px-2 py-1 rounded border ${r.status==='resolved'?'bg-primary text-primary-foreground':'bg-background'}`} disabled={updatingId===r.id} onClick={()=>updateStatus(r.id,'resolved')}>Resolved</button>
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

export default Complaints;
