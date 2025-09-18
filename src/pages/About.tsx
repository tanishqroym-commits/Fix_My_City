import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Users, MapPin, Clock, Camera, Bell, Shield, Smartphone } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const About = () => {
  const features = [
    {
      icon: Camera,
      title: "Photo Reporting",
      description: "Capture issues instantly with your device's camera for faster resolution"
    },
    {
      icon: MapPin,
      title: "GPS Location",
      description: "Automatic location detection ensures accurate issue positioning"
    },
    {
      icon: Bell,
      title: "Real-time Updates",
      description: "Get notified when your reports are reviewed and resolved"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is protected with enterprise-grade security"
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Join thousands of citizens making their community better"
    },
    {
      icon: Smartphone,
      title: "Mobile First",
      description: "Designed for mobile devices with offline capabilities"
    }
  ];

  const steps = [
    {
      step: "1",
      title: "Identify Issue",
      description: "Spot a problem in your community - pothole, broken streetlight, or any civic issue"
    },
    {
      step: "2", 
      title: "Report & Capture",
      description: "Use your phone to take a photo and let us detect your location automatically"
    },
    {
      step: "3",
      title: "Track Progress", 
      description: "Follow your report's status from submission to resolution"
    },
    {
      step: "4",
      title: "See Results",
      description: "Watch as your community improves through collective action"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="py-16 bg-gradient-subtle">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              About Fix My City
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              We're building stronger communities by connecting citizens with local government through 
              transparent, efficient issue reporting and resolution.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-foreground">
                  Our Mission
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Every citizen deserves a voice in their community's development. CivicConnect 
                  empowers residents to report issues quickly and track their resolution transparently, 
                  while helping municipal teams prioritize and respond more effectively.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-status-resolved flex-shrink-0" />
                    <span className="text-foreground">Faster issue resolution through better reporting</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-status-resolved flex-shrink-0" />
                    <span className="text-foreground">Increased transparency in government response</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-status-resolved flex-shrink-0" />
                    <span className="text-foreground">Stronger community engagement and participation</span>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-hero rounded-2xl p-8 text-center text-primary-foreground">
                <div className="space-y-6">
                  <Clock className="h-16 w-16 mx-auto opacity-80" />
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Average Response Time</h3>
                    <p className="text-4xl font-bold">2.3 Days</p>
                    <p className="opacity-80">Down from 7+ days before CivicConnect</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                How It Works
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Reporting civic issues has never been easier. Follow these simple steps to make a difference.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <Card key={index} className="p-6 text-center relative">
                  <div className="bg-gradient-primary rounded-full w-12 h-12 flex items-center justify-center text-primary-foreground font-bold text-lg mx-auto mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {step.description}
                  </p>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-px bg-border"></div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Platform Features
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Built with modern technology to provide the best experience for both citizens and municipal teams.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="p-6 text-center hover:shadow-lg transition-smooth">
                  <div className="bg-primary/10 rounded-lg p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-hero text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Make a Difference?
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Join thousands of engaged citizens using CivicConnect to improve their communities every day.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg">
                Report Your First Issue
              </Button>
              <Button variant="outline" size="lg" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                View Community Dashboard
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;