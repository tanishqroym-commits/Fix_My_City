import { Button } from "@/components/ui/button";
import { Camera, MapPin, Clock, CheckCircle } from "lucide-react";
import heroImage from "@/assets/civic-hero-image.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[600px] bg-gradient-subtle overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero opacity-5 pointer-events-none"></div>
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight slide-in-left">
                Make Your City
                <span className="rainbow bounce-in"> Better</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed slide-in-left" style={{ animationDelay: '0.3s' }}>
                Report issues, track progress, and help build a more responsive community. 
                From potholes to broken streetlights - your voice matters.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="lg" className="flex items-center gap-2 btn-hover pulse-glow bounce-in" asChild style={{ animationDelay: '0.6s' }}>
                <a href="/report">
                  <Camera className="h-5 w-5" />
                  Report an Issue
                </a>
              </Button>
              <Button variant="outline" size="lg" className="btn-hover bounce-in" asChild style={{ animationDelay: '0.8s' }}>
                <a href="/dashboard">View Dashboard</a>
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center space-y-2 stagger-item feature-card cursor-pointer group p-4 rounded-xl" onClick={() => window.location.href = '/report'}>
                <div className="bg-primary/10 rounded-lg p-3 w-12 h-12 mx-auto flex items-center justify-center float group-hover:scale-105 transition-transform duration-500 group-hover:bg-primary/20">
                  <Camera className="h-6 w-6 text-primary group-hover:pulse-soft" />
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors group-hover:scale-105">Snap & Send</h3>
                <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Quick photo reporting</p>
              </div>
              <div className="text-center space-y-2 stagger-item feature-card cursor-pointer group p-4 rounded-xl" onClick={() => window.location.href = '/report'}>
                <div className="bg-secondary/10 rounded-lg p-3 w-12 h-12 mx-auto flex items-center justify-center float-delayed group-hover:scale-105 transition-transform duration-500 group-hover:bg-secondary/20">
                  <MapPin className="h-6 w-6 text-secondary group-hover:bounce-soft" />
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-secondary transition-colors group-hover:scale-105">Auto-Location</h3>
                <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Precise positioning</p>
              </div>
              <div className="text-center space-y-2 stagger-item feature-card cursor-pointer group p-4 rounded-xl" onClick={() => window.location.href = '/my-reports'}>
                <div className="bg-status-resolved/10 rounded-lg p-3 w-12 h-12 mx-auto flex items-center justify-center float group-hover:scale-105 transition-transform duration-500 group-hover:bg-status-resolved/20" style={{ animationDelay: '1s' }}>
                  <CheckCircle className="h-6 w-6 text-status-resolved group-hover:spin-slow" />
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-status-resolved transition-colors group-hover:scale-105">Track Progress</h3>
                <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Real-time updates</p>
              </div>
            </div>
          </div>
          
          <div className="relative slide-in-right">
            <div className="absolute -inset-4 bg-gradient-primary opacity-20 rounded-2xl blur-2xl pointer-events-none glow"></div>
            <img 
              src={(import.meta as any).env?.VITE_HERO_IMAGE || heroImage}
              alt="Citizens reporting civic issues" 
              className="relative w-full h-[400px] object-cover rounded-2xl shadow-civic float"
            />
            <div className="absolute -bottom-6 -left-6 bg-card border border-border rounded-lg p-4 shadow-lg gradient-border bounce-in" style={{ animationDelay: '1.2s' }}>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-status-in-progress rotate-scale" />
                <div>
                  <p className="font-semibold text-sm">Average Response</p>
                  <p className="text-2xl font-bold text-primary shimmer">2.3 days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;