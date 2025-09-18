import { Button } from "@/components/ui/button";
import { MapPin, Phone } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const { session, role } = useAuth();
  const { toast } = useToast();
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = () => {
    if (loggingOut) return;
    setLoggingOut(true);
    // Fast, optimistic client-side logout
    try {
      // Fire-and-forget local sign out to clear tokens quickly
      void supabase.auth.signOut({ scope: 'local' });
    } catch {}
    // Immediate navigation so the user isn't waiting on network
    window.location.replace('/login');
  };

  return (
    <header className="bg-background border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">

              <div>
                <a href="/" className="text-xl font-bold text-foreground hover:text-primary transition-smooth">
                  Fix My City
                </a>
                <p className="text-sm text-muted-foreground">Report. Track. Improve.</p>
              </div>
            </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="/report" className="text-foreground hover:text-primary transition-smooth">
              Report Issue
            </a>
            <a href="/dashboard" className="text-foreground hover:text-primary transition-smooth">
              Dashboard
            </a>
            <a href="/about" className="text-foreground hover:text-primary transition-smooth">
              About
            </a>
            {session && role === 'user' && (
              <a href="/my-reports" className="text-foreground hover:text-primary transition-smooth">
                My Reports
              </a>
            )}
            {session && role === 'admin' && (
              <a href="/admin" className="text-foreground hover:text-primary transition-smooth">
                Admin - Reports
              </a>
            )}
            {role === 'agent' && (
              <a href="/agent" className="text-foreground hover:text-primary transition-smooth">
                Agent - My Assignments
              </a>
            )}
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
            </div>
          </nav>
          
          <div className="flex items-center space-x-3">
            {!session ? (
              <Button variant="outline" size="sm" asChild>
                <a href="/login">Login</a>
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={logout} disabled={loggingOut}>
                  {loggingOut ? 'Logging out...' : 'Logout'}
                </Button>
              </>
            )}
            <Button variant="hero" size="sm" asChild>
              <a href="/report">Report Issue</a>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;