import { MapPin, Phone, Mail, Shield, FileText } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-primary rounded-lg p-2">
                <MapPin className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Fix My City</h3>
                <p className="text-sm text-muted-foreground">Report. Track. Improve.</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              Empowering communities to create better cities through transparent, 
              efficient issue reporting and resolution.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="/report" className="text-muted-foreground hover:text-primary transition-smooth text-sm">
                  Report Issue
                </a>
              </li>
              <li>
                <a href="/dashboard" className="text-muted-foreground hover:text-primary transition-smooth text-sm">
                  View Dashboard
                </a>
              </li>
              <li>
                <a href="/my-reports" className="text-muted-foreground hover:text-primary transition-smooth text-sm">
                  My Reports
                </a>
              </li>
              <li>
                <a href="/about" className="text-muted-foreground hover:text-primary transition-smooth text-sm">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#stats" className="text-muted-foreground hover:text-primary transition-smooth text-sm">
                  Community Stats
                </a>
              </li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-primary" />

              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground text-sm">help@fixmycity.gov</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground text-sm">City Hall, Main Street</span>
              </li>
            </ul>
          </div>
          
          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal & Privacy</h4>
            <ul className="space-y-2">
              <li>
                <a href="#privacy" className="text-muted-foreground hover:text-primary transition-smooth text-sm flex items-center space-x-2">
                  <Shield className="h-3 w-3" />
                  <span>Privacy Policy</span>
                </a>
              </li>
              <li>
                <a href="#terms" className="text-muted-foreground hover:text-primary transition-smooth text-sm flex items-center space-x-2">
                  <FileText className="h-3 w-3" />
                  <span>Terms of Service</span>
                </a>
              </li>
              <li>
                <a href="#accessibility" className="text-muted-foreground hover:text-primary transition-smooth text-sm">
                  Accessibility
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Removed bottom copyright and transparency texts as requested */}
      </div>
    </footer>
  );
};

export default Footer;