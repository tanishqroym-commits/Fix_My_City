import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/';
  const [mode, setMode] = useState<'user'|'admin'|'agent'>('user');
  const [email, setEmail] = useState(() => localStorage.getItem("lastEmail") || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast({ title: "Login failed", description: error.message, variant: "destructive" });
    toast({ title: "Logged in" });
    // If admin mode selected, but user is not admin, inform and go home
    const uid = data.user?.id;
    if (uid) {
      // Ensure profile exists and keep email + last_login up to date
      try {
        await supabase
          .from('profiles')
          .upsert(
            { id: uid, role: 'user', email, last_login: new Date().toISOString() },
            { onConflict: 'id' }
          );
      } catch {}
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', uid).maybeSingle();
      const r = (prof?.role as string) || 'user';
      if (mode === 'admin' && r !== 'admin') {
        toast({ title: 'Admin access required', description: 'Your account is not an admin', variant: 'destructive' });
      }
      if (mode === 'agent' && r !== 'agent' && r !== 'admin') {
        toast({ title: 'Agent access required', description: 'Your account is not an agent', variant: 'destructive' });
      }
      const dest = r === 'admin' ? '/admin' : r === 'agent' ? '/agent' : next;
      navigate(dest, { replace: true });
    } else {
      navigate(next, { replace: true });
    }
  };

  const signUp = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return toast({
        title: "Invalid email",
        description: "Enter a valid email address",
        variant: "destructive",
      });
    }
  
    if (!password || password.length < 6) {
      return toast({
        title: "Weak password",
        description: "Use at least 6 characters",
        variant: "destructive",
      });
    }
  
    setLoading(true);
    const redirectTo = `${window.location.origin}/`;
  
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    });
  
    setLoading(false);
  
    if (error) {
      return toast({
        title: `Signup failed (${error.status || ""})`,
        description: error.message,
        variant: "destructive",
      });
    }
  
    // Best-effort create profile row if trigger not configured
    const userId = data.user?.id;
    if (userId) {
      const { error: insertError } = await supabase
        .from("profiles")
        .upsert(
          { id: userId, role: "user", email, last_login: new Date().toISOString() },
          { onConflict: 'id' }
        );
  
      if (insertError) {
        console.error("Profile insert error:", insertError);
        // optional: show toast if you want
      }
  
      toast({ title: "Account created" });
      navigate(next, { replace: true });
    } else {
      toast({ title: "Check your email to confirm" });
    }
  };
  
  const magicLink = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return toast({ title: "Invalid email", description: "Enter a valid email address", variant: "destructive" });
    }
    setLoading(true);
    const redirectTo = `${window.location.origin}/`;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
    setLoading(false);
    if (error) return toast({ title: `Magic link failed (${error.status || ''})`, description: error.message, variant: "destructive" });
    toast({ title: "Magic link sent", description: "Check your email" });
  };
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
  
    if (error) {
      console.error("Logout error:", error.message);
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Logged out successfully" });
      window.location.href = "/login"; // redirect after logout
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-green-100 flex flex-col" aria-busy={loading}>
      {loading && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-primary/70 animate-pulse z-50" />
      )}
      <Header />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md mx-auto">
          <Card className="p-8 shadow-2xl border-0 bg-white/90 backdrop-blur-lg animate-fade-in-up">
            <div className="flex flex-col items-center mb-6">
              <img src="/pic.png" alt="Fix My City" className="h-14 w-14 rounded-full shadow-lg mb-2" />
              <h1 className="text-3xl font-bold text-primary mb-1 tracking-tight">Welcome Back!</h1>
              <p className="text-base text-muted-foreground text-center">Login or sign up to report and track city issues.<br/>Admins and agents use your assigned credentials.</p>
            </div>
            <div className="flex gap-2 justify-center mb-4">
              <Button type="button" size="sm" variant={mode==='user'?'default':'outline'} onClick={()=>setMode('user')}>User</Button>
              <Button type="button" size="sm" variant={mode==='admin'?'default':'outline'} onClick={()=>setMode('admin')}>Admin</Button>
              <Button type="button" size="sm" variant={mode==='agent'?'default':'outline'} onClick={()=>setMode('agent')}>Agent</Button>
            </div>
            <Input className="mb-3" placeholder="Email" value={email} onChange={(e) => { setEmail(e.target.value); try { localStorage.setItem("lastEmail", e.target.value); } catch {} }} />
            <Input className="mb-3" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <div className="flex gap-3 flex-wrap justify-center mb-2">
              <Button onClick={signIn} disabled={loading} className="w-full md:w-auto">Login</Button>
              <Button variant="outline" onClick={signUp} disabled={loading} className="w-full md:w-auto">Sign up</Button>
              <Button variant="ghost" onClick={magicLink} disabled={loading} className="w-full md:w-auto">Email magic link</Button>
            </div>
            <div className="text-xs text-muted-foreground text-center mt-4">By continuing, you agree to our <a href="/about" className="underline hover:text-primary">community guidelines</a>.</div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
