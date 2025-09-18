import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, MapPin, Send, Upload } from "lucide-react";

const ReportIssueSection = () => {
  return (
    <section id="reports" className="py-16 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Report an Issue
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Help us improve your community. Submit a report and we'll make sure it reaches the right department.
            </p>
          </div>
          
          <Card className="p-8 shadow-lg border border-border">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Form Section */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Issue Category
                  </label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pothole">Potholes & Road Issues</SelectItem>
                      <SelectItem value="streetlight">Street Lighting</SelectItem>
                      <SelectItem value="trash">Waste Management</SelectItem>
                      <SelectItem value="graffiti">Graffiti & Vandalism</SelectItem>
                      <SelectItem value="traffic">Traffic Signals</SelectItem>
                      <SelectItem value="park">Parks & Recreation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <Input 
                      placeholder="Enter address or let us detect your location"
                      className="pr-10"
                    />
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    >
                      <MapPin className="h-4 w-4 text-primary" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>
                  <Textarea 
                    placeholder="Describe the issue in detail..."
                    rows={4}
                    className="resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Your Contact (Optional)
                  </label>
                  <Input placeholder="Email or phone for updates" />
                </div>
                
                <Button variant="hero" size="lg" className="w-full">
                  <Send className="h-5 w-5 mr-2" />
                  Submit Report
                </Button>
              </div>
              
              {/* Photo Upload Section */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Add Photos
                  </label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-smooth">
                    <div className="space-y-4">
                      <div className="bg-primary/10 rounded-lg p-4 w-16 h-16 mx-auto flex items-center justify-center">
                        <Camera className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Take or upload photos</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Photos help us understand and resolve issues faster
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button variant="civic" size="sm">
                          <Camera className="h-4 w-4 mr-2" />
                          Take Photo
                        </Button>
                        <Button variant="outline" size="sm">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Preview uploaded photos */}
                <div className="hidden">
                  <p className="text-sm font-medium text-foreground mb-3">Uploaded Photos</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="aspect-square bg-muted rounded-lg"></div>
                    <div className="aspect-square bg-muted rounded-lg"></div>
                  </div>
                </div>
                
                {/* Priority Level */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Priority Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" className="text-status-resolved border-status-resolved/30">
                      Low
                    </Button>
                    <Button variant="outline" size="sm" className="text-status-pending border-status-pending/30">
                      Medium
                    </Button>
                    <Button variant="outline" size="sm" className="text-status-urgent border-status-urgent/30">
                      Urgent
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ReportIssueSection;