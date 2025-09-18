import { Card } from "@/components/ui/card";
import { TrendingUp, Users, CheckCircle, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const StatsSection = () => {
  const [reportsTotal, setReportsTotal] = useState(0);
  const [activeCitizens, setActiveCitizens] = useState(0);
  const [resolvedTotal, setResolvedTotal] = useState(0);
  const [avgResponse, setAvgResponse] = useState<string | number>(0);
  const [anim, setAnim] = useState({ reports: 0, citizens: 0, resolved: 0 });

  useEffect(() => {
    const load = async () => {
      // Total reports
      const totalRes = await supabase.from('reports').select('*', { count: 'exact', head: true });
      const rTotal = totalRes.count || 0;
      setReportsTotal(rTotal);

      // Resolved reports
      const resolvedRes = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'resolved');
      const rResolved = resolvedRes.count || 0;
      setResolvedTotal(rResolved);

      // Active citizens = total people who signed up (count of profiles)
      const { count: profilesCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      const rCitizens = profilesCount || 0;
      setActiveCitizens(rCitizens);

      // Animate counters to target values
      const duration = 600; // ms
      const steps = 24;
      let i = 0;
      const start = { reports: 0, citizens: 0, resolved: 0 };
      const end = { reports: rTotal, citizens: rCitizens, resolved: rResolved };
      const tick = () => {
        i++;
        const t = Math.min(1, i / steps);
        setAnim({
          reports: Math.round(start.reports + (end.reports - start.reports) * t),
          citizens: Math.round(start.citizens + (end.citizens - start.citizens) * t),
          resolved: Math.round(start.resolved + (end.resolved - start.resolved) * t),
        });
        if (t < 1) setTimeout(tick, duration / steps);
      };
      tick();

      // Avg response time: needs created_at and resolved_at; show 0/— until we track it
      setAvgResponse(0);
    };
    load();

    const channel = supabase
      .channel('stats-reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        load();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const stats = [
    {
      title: "Reports Submitted",
      value: anim.reports.toLocaleString(),
      change: "+0%",
      trend: "up",
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Active Citizens",
      value: anim.citizens.toLocaleString(),
      change: "+0%",
      trend: "up",
      icon: Users,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Issues Resolved",
      value: anim.resolved.toLocaleString(),
      change: "+0%",
      trend: "up",
      icon: CheckCircle,
      color: "text-status-resolved",
      bgColor: "bg-status-resolved/10",
    },
    {
      title: "Avg. Response Time",
      value: typeof avgResponse === 'number' ? `${avgResponse} days` : avgResponse,
      change: "0%",
      trend: "down",
      icon: AlertTriangle,
      color: "text-status-pending",
      bgColor: "bg-status-pending/10",
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-background via-background to-primary/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4 bounce-in">
            Making a <span className="rainbow">Real Impact</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto fade-in" style={{ animationDelay: '0.3s' }}>
            See how our community is working together to improve city services and quality of life
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className={`p-6 border border-border shadow-sm card-hover stagger-item ${index % 2 === 0 ? 'slide-in-left' : 'slide-in-right'}`} style={{ animationDelay: `${index * 0.2}s` }}>
              <div className="flex items-center justify-between mb-4">
                <div className={`rounded-lg p-2 ${stat.bgColor} float`} style={{ animationDelay: `${index * 0.3}s` }}>
                  <stat.icon className={`h-6 w-6 ${stat.color} rotate-scale`} />
                </div>
                <span className={`text-sm font-medium ${
                  stat.trend === 'up' ? 'text-status-resolved' : 'text-status-urgent'
                } shimmer`}>
                  {stat.change}
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-1 rainbow">
                  {stat.value}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {stat.title}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;