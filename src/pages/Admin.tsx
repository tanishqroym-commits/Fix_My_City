import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useState as useReactState } from "react";
import MapPreview from "@/components/MapPreview";
import { Home, ExternalLink, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthProvider";

type Report = {
  id: string;
  category: string;
  title?: string | null;
  description: string;
  contact: string | null;
  priority: number | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  photo_urls: string[];
  status: string;
  agent_id?: string | null;
  created_at: string;
};

const Admin = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  // const [openId, setOpenId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [agents, setAgents] = useState<Array<{ id: string; email: string }>>([]);
  const [pickerOpenFor, setPickerOpenFor] = useState<string | null>(null);
  const [agentOpenCounts, setAgentOpenCounts] = useState<Record<string, number>>({});
  const [pickerQuery, setPickerQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");

  // Cheap filter: case-insensitive substring match
  const matchesQuery = (q: string, text: string) => {
    if (!q) return true;
    const needle = q.toLowerCase();
    const hay = (text || "").toLowerCase();
    return hay.includes(needle);
  };

  // Debounce the query to avoid filtering on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(pickerQuery.trim()), 200);
    return () => clearTimeout(t);
  }, [pickerQuery]);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("category", { ascending: true })
        .order("priority", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });
      if (!error && data) {
        // Hide assigned_agent reports after 1 hour
        const now = Date.now();
        const filtered = (data as Report[]).filter(r => {
          if (r.status !== 'assigned_agent') return true;
          // If assigned_agent, check if assigned more than 1 hour ago
          const assignedTime = new Date(r.created_at).getTime();
          return (now - assignedTime) < 60 * 60 * 1000;
        });
        setReports(filtered);
      }
    };
    load();
  const loadAgents = async () => {
    // Fetch agent ids and emails from profiles
    const { data: ag, error: agError } = await supabase.from('profiles').select('id, role, email').eq('role','agent');
    if (agError) {
      setAgents([]);
      return;
    }
    
    // Prepare list with emails from profiles (AGENTS ONLY)
    const listFromProfiles: Array<{ id: string; email: string | undefined }> = (ag as any[])?.map(r => ({ id: r.id, email: r.email })) || [];
    
    // Include current user if they are an agent (even if not in profiles table yet)
    // Do NOT include the current user unless they are an agent (already returned above).

    // If any email missing, best-effort fill via admin API; otherwise keep as is
    const needsLookup = listFromProfiles.some(a => !a.email);
    if (needsLookup) {
      try {
        const { data: allUsers } = await supabase.auth.admin.listUsers();
        const map = new Map<string, string>();
  (allUsers?.users as any[])?.forEach(u => { if (u.email) map.set(u.id, u.email); });
        listFromProfiles.forEach(a => { if (!a.email) a.email = map.get(a.id); });
      } catch {}
    }

    // Finalize: fallback to truncated id when email remains missing
    const agentsWithEmails = listFromProfiles.map(a => ({ id: a.id, email: a.email || `User ${a.id.slice(0,8)}...` }));

    setAgents(agentsWithEmails);
    
    if (agentsWithEmails.length) {
      const { data: rep } = await supabase
        .from('reports')
        .select('agent_id, status')
        .not('agent_id', 'is', null);
      const counts: Record<string, number> = {};
      (rep || []).forEach((row: any) => {
        if (row.status !== 'resolved' && row.agent_id) {
          counts[row.agent_id] = (counts[row.agent_id] || 0) + 1;
        }
      });
      setAgentOpenCounts(counts);
    }
  };
    loadAgents();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    // Fetch current to enforce sequential transitions
    const { data: currentRow } = await supabase.from('reports').select('status').eq('id', id).maybeSingle();
    const current = (currentRow?.status as string) || 'submitted';
    const order = ['submitted', 'admin_received', 'assigned_agent', 'agent_received', 'resolved'];
    const canTransition = order.indexOf(status) <= order.indexOf(current) + 1; // only next or same
    const safeStatus = canTransition ? status : current;
    const { error } = await supabase.from("reports").update({ status: safeStatus }).eq("id", id);
    if (!error) {
      setReports(prev => prev.map(r => r.id === id ? { ...r, status: safeStatus } : r));
    }
    setUpdatingId(null);
  };

  const setPriority = async (id: string, p: number | null) => {
    await supabase.from('reports').update({ priority: p }).eq('id', id);
    setReports(prev => prev.map(r => r.id === id ? { ...r, priority: p } : r));
  };

  const assignAgent = async (id: string, agentId: string | null) => {
    // Update agent assignment; set status to 'assigned_agent' only if at least 'admin_received'
    const { data: currentRow } = await supabase.from('reports').select('status').eq('id', id).maybeSingle();
    const current = (currentRow?.status as string) || 'submitted';
    const nextStatus = agentId ? (current === 'submitted' ? 'admin_received' : 'assigned_agent') : 'submitted';
    await supabase.from('reports').update({ agent_id: agentId, status: nextStatus }).eq('id', id);
    setReports(prev => prev.map(r => r.id === id ? { ...r, agent_id: agentId || null, status: nextStatus } : r));
  };

  const grouped = useMemo(() => {
    const map = new Map<string, Report[]>();
    for (const r of reports) {
      const key = r.category || 'Uncategorized';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    // Remove 'graffiti' category from admin view
    return Array.from(map.entries()).filter(([cat]) => cat.toLowerCase() !== 'graffiti');
  }, [reports]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-purple-100 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950">
      <Header />
      <main className="py-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 p-3 shadow-md">
                <Users className="h-7 w-7 text-blue-600 dark:text-blue-300" />
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white drop-shadow-sm">Admin Reports</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => navigate('/admin/users')} className="shadow">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/')} className="shadow">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </div>
          </div>
          <div className="grid gap-8">
            <Accordion type="single" collapsible className="w-full">
              {grouped.map(([cat, items]) => {
                // Collect unique issue descriptions for this category
                const uniqueDescriptions = Array.from(new Set(items.map(r => r.description.trim())));
                return (
                  <AccordionItem key={cat} value={cat}>
                    <AccordionTrigger className="text-left text-xl font-bold text-blue-700 dark:text-blue-200 bg-blue-50/60 dark:bg-blue-900/40 rounded-lg px-4 py-2 shadow-sm hover:bg-blue-100/80 dark:hover:bg-blue-800/60 transition">{cat} <span className="ml-2 text-base font-normal text-slate-500 dark:text-slate-300">({items.length})</span></AccordionTrigger>
                    <AccordionContent>
                      {/* Summary of issue types for this category */}
                      <div className="mb-4">
                        <div className="font-semibold text-blue-700 dark:text-blue-200 text-base mb-1">Reported Issue Types:</div>
                        {uniqueDescriptions.length === 0 ? (
                          <div className="text-slate-400 text-sm italic">No issues reported in this category.</div>
                        ) : (
                          <ul className="list-disc pl-6 space-y-1">
                            {uniqueDescriptions.slice(0, 10).map((desc, i) => (
                              <li key={i} className="text-slate-700 dark:text-slate-200 text-sm">{desc}</li>
                            ))}
                            {uniqueDescriptions.length > 10 && (
                              <li className="text-slate-400 text-xs italic">...and {uniqueDescriptions.length - 10} more</li>
                            )}
                          </ul>
                        )}
                      </div>
                      <div className="space-y-6">
                        {items.map((r) => (
                          <Card key={r.id} className="p-6 space-y-3 rounded-2xl shadow-xl border border-blue-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:scale-[1.015] hover:shadow-2xl transition-transform">
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                              <div className="font-bold text-lg text-blue-800 dark:text-blue-200 flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                {r.category}
                              </div>
                              <div className="text-sm text-slate-500 dark:text-slate-300 font-mono">{new Date(r.created_at).toLocaleString()}</div>
                            </div>
                            <div className="text-base text-slate-800 dark:text-slate-100 font-medium">{r.description}</div>
                            {r.address && <div className="text-xs text-slate-500 dark:text-slate-400 italic">{r.address}</div>}
                            {r.lat !== null && r.lng !== null && (
                              <div className="pt-2">
                                <MapPreview lat={r.lat} lng={r.lng} />
                                <div className="flex justify-end mt-2">
                                  <a className="text-sm underline inline-flex items-center text-blue-700 dark:text-blue-300 hover:text-blue-900" href={`https://www.google.com/maps?q=${r.lat},${r.lng}`} target="_blank" rel="noreferrer">
                                    Open in Google Maps <ExternalLink className="h-3 w-3 ml-1" />
                                  </a>
                                </div>
                              </div>
                            )}
                            {r.photo_urls?.length > 0 && (
                              <div className="pt-2">
                                <img src={r.photo_urls[0]} className="w-full max-w-2xl rounded-xl border border-blue-100 dark:border-slate-800 shadow" />
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs pt-1">Status:
                              <span>
                                <Badge variant={r.status === 'resolved' ? 'default' : r.status === 'assigned_agent' || r.status === 'agent_received' || r.status === 'in_progress' ? 'secondary' : 'outline'} className={
                                  r.status === 'resolved' ? 'bg-green-500 text-white' :
                                  r.status === 'in_progress' ? 'bg-yellow-400 text-slate-900' :
                                  r.status === 'assigned_agent' ? 'bg-blue-400 text-white' :
                                  r.status === 'admin_received' ? 'bg-purple-400 text-white' :
                                  'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                                }>
                                  {r.status || 'unknown'}
                                </Badge>
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 pt-2">
                              <Button size="sm" variant={r.status === 'admin_received' ? 'default' : 'outline'} disabled={updatingId===r.id} onClick={() => updateStatus(r.id, 'admin_received')} className="transition">Admin Received</Button>
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-slate-500 dark:text-slate-400">Priority</label>
                                <input type="number" className="w-20 px-2 py-1 border border-blue-200 dark:border-slate-700 rounded bg-blue-50/40 dark:bg-slate-800/40 focus:ring-2 focus:ring-blue-400 transition" value={r.priority ?? ''} onChange={(e)=> setPriority(r.id, e.target.value === '' ? null : Number(e.target.value))} />
                              </div>
                              <div className="flex items-center gap-2 min-w-[260px]">
                                <label className="text-xs text-slate-500 dark:text-slate-400">Assign Agent</label>
                                <Button variant="outline" size="sm" onClick={() => setPickerOpenFor(r.id)} className="transition">
                                  {agents.find(a => a.id === r.agent_id)?.email || 'Select agent'}
                                </Button>
                                <CommandDialog open={pickerOpenFor === r.id} onOpenChange={(o)=> { setPickerOpenFor(o ? r.id : null); setPickerQuery(""); setDebouncedQuery(""); }}>
                                  <CommandInput placeholder="Search agents..." onValueChange={(v)=> setPickerQuery(v)} />
                                  <CommandList>
                                    <CommandEmpty>No agents found.</CommandEmpty>
                                    <CommandGroup heading="Agents">
                                      <CommandItem onSelect={() => { assignAgent(r.id, null); setPickerOpenFor(null); }}>Unassigned</CommandItem>
                                      {agents
                                        .filter(a => matchesQuery(debouncedQuery, a.email || '') || matchesQuery(debouncedQuery, a.id))
                                        .sort((a, b) => {
                                          if (debouncedQuery) return 0;
                                          const ca = agentOpenCounts[a.id] ?? 0;
                                          const cb = agentOpenCounts[b.id] ?? 0;
                                          return ca - cb;
                                        })
                                        .slice(0, 50)
                                        .map((a) => (
                                          <CommandItem key={a.id} onSelect={() => { assignAgent(r.id, a.id); setPickerOpenFor(null); }}>
                                            <div className="flex items-center justify-between w-full">
                                              <div className="flex flex-col">
                                                <span className="font-medium">{a.email}</span>
                                                {a.email !== a.id && (
                                                  <span className="text-xs text-slate-400 dark:text-slate-500">ID: {a.id.slice(0, 8)}...</span>
                                                )}
                                              </div>
                                              <Badge variant="secondary">{agentOpenCounts[a.id] ?? 0} open</Badge>
                                            </div>
                                          </CommandItem>
                                        ))}
                                    </CommandGroup>
                                  </CommandList>
                                </CommandDialog>
                              </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button size="sm" variant={r.status === 'submitted' ? 'default' : 'outline'} disabled={updatingId===r.id} onClick={() => updateStatus(r.id, 'submitted')} className="transition">Submitted</Button>
                              <Button size="sm" variant={r.status === 'in_progress' ? 'default' : 'outline'} disabled={updatingId===r.id} onClick={() => updateStatus(r.id, 'in_progress')} className="transition">In Progress</Button>
                              <Button size="sm" variant={r.status === 'resolved' ? 'default' : 'outline'} disabled={updatingId===r.id} onClick={() => updateStatus(r.id, 'resolved')} className="transition">Resolved</Button>

                            </div>
                          </Card>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
