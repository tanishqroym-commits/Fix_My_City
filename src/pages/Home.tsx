import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import UserTopTracker from "@/components/UserTopTracker";
import StatsSection from "@/components/StatsSection";
import { Activity, CheckCircle2, Clock, MapPin } from "lucide-react";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthProvider";
import { Card } from "@/components/ui/card";

const LatestReports = () => {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('reports')
        .select('id, category, description, status, created_at, address')
        .order('created_at', { ascending: false })
        .limit(6);
      setItems(data || []);
    };
    load();
    const ch = supabase
      .channel('latest-reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {items.map((r, index) => (
        <Card key={r.id} className={`p-4 shadow-civic card-hover stagger-item`} style={{ animationDelay: `${index * 0.1}s` }}>
          <div className="flex justify-between mb-1">
            <div className="font-medium">{r.category}</div>
            <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</div>
          </div>
          <div className="text-sm line-clamp-2 mb-2">{r.description}</div>
          <div className="text-xs text-muted-foreground line-clamp-1">{r.address}</div>
        </Card>
      ))}
      {items.length === 0 && (
        <div className="text-sm text-muted-foreground">No reports yet.</div>
      )}
    </div>
  );
};

const Home = () => {
  const { user } = useAuth();
  const [myReports, setMyReports] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!user) { setMyReports([]); return; }
      const { data } = await supabase.from('reports').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5);
      setMyReports(data || []);
    };
    load();
  }, [user?.id]);

  const steps = [
    { key: 'submitted', label: 'Report Received' },
    { key: 'admin_received', label: 'Admin Received' },
    { key: 'assigned_agent', label: 'Issue Received by Agent' },
    { key: 'resolved', label: 'Issue Solved' },
  ];

  return (
    <div className="min-h-screen bg-background fade-in">
      <Header />
      <main>
        {user && <UserTopTracker />}
        <HeroSection />
        {/* Colorful separator */}
        <div className="h-1 bg-gradient-to-r from-primary via-secondary to-status-resolved opacity-60" />
        {/* Feature KPIs */}
        <StatsSection />
        {/* Latest Activity Panel */}
        <section className="bg-gradient-subtle/40">
          <div className="container mx-auto px-4 py-10">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 shadow-civic card-hover stagger-item">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Fast Response</h3>
                </div>
                <p className="text-sm text-muted-foreground">Average first response time</p>
                <div className="text-3xl font-bold mt-2">2.3 days</div>
              </Card>
              <Card className="p-6 shadow-civic card-hover stagger-item">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-status-resolved" />
                  <h3 className="font-semibold">This Month</h3>
                </div>
                <p className="text-sm text-muted-foreground">Issues resolved</p>
                <div className="text-3xl font-bold mt-2">128</div>
              </Card>
              <Card className="p-6 shadow-civic card-hover stagger-item">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="h-5 w-5 text-secondary" />
                  <h3 className="font-semibold">Active Areas</h3>
                </div>
                <p className="text-sm text-muted-foreground">Neighborhoods with reports</p>
                <div className="text-3xl font-bold mt-2">23</div>
              </Card>
            </div>
          </div>
        </section>
        {/* Personal area */}
        {user && (
          <div className="container mx-auto px-4 py-8">
            <h2 className="text-xl font-semibold mb-3">Your recent reports</h2>
            <div className="grid gap-4">
              {myReports.map((r, index) => (
                <Card key={r.id} className={`p-4 shadow-civic card-hover stagger-item`} style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="flex justify-between mb-2">
                    <div className="font-medium">{r.title || r.category}</div>
                    <div className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-sm mb-3">{r.description}</div>
                  <div className="flex items-center gap-2">
                    {steps.map((s, i) => {
                      const active =
                        (s.key === 'submitted' && r.status) ||
                        (s.key === 'admin_received' && (r.status === 'admin_received' || r.status === 'assigned_agent' || r.status === 'agent_received' || r.status === 'in_progress' || r.status === 'resolved')) ||
                        (s.key === 'assigned_agent' && (r.status === 'assigned_agent' || r.status === 'agent_received' || r.status === 'in_progress' || r.status === 'resolved')) ||
                        (s.key === 'resolved' && r.status === 'resolved');
                      return (
                        <div key={s.key} className={`flex items-center ${i<steps.length-1? 'flex-1':''}`}>
                          <div className={`h-2 w-2 rounded-full ${active? 'bg-primary':'bg-muted'}`} />
                          <span className={`ml-2 text-xs ${active? 'text-foreground font-medium':'text-muted-foreground'}`}>{s.label}</span>
                          {i<steps.length-1 && <div className={`mx-3 h-[1px] flex-1 ${active? 'bg-primary':'bg-muted'}`} />}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Latest Reports Feed (public) */}
        <section className="bg-gradient-to-br from-blue-50 via-white to-green-50 py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6 text-center text-primary drop-shadow">Latest Community Reports</h2>
            <LatestReports />
          </div>
        </section>

        {/* Community Impact / Testimonials */}
        <section className="bg-gradient-to-r from-primary/10 via-white to-secondary/10 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8 text-center text-foreground">What Citizens Are Saying</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300">
                <div className="text-4xl mb-2">🌟</div>
                <p className="text-lg font-medium mb-2">“Reporting a pothole was so easy, and it was fixed in 2 days!”</p>
                {/* Name removed as requested */}
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300">
                <div className="text-4xl mb-2">🚦</div>
                <p className="text-lg font-medium mb-2">“I love tracking my reports and seeing real progress.”</p>
                {/* Name removed as requested */}
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300">
                <div className="text-4xl mb-2">💡</div>
                <p className="text-lg font-medium mb-2">“Streetlight issues are resolved faster than ever!”</p>
                {/* Name removed as requested */}
              </div>
            </div>
          </div>
        </section>

        {/* Call-to-action Banner */}
        <section className="bg-gradient-to-r from-primary to-secondary py-10 mt-8">
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-white text-2xl font-bold mb-2 md:mb-0">Ready to make a difference in your city?</div>
            <a href="/report" className="bg-white text-primary font-semibold px-6 py-3 rounded-lg shadow hover:bg-primary hover:text-white transition-colors">Report an Issue Now</a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Home;