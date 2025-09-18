import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Camera, MapPin, Send, X, Loader2, Home } from "lucide-react";
import MapPicker from "@/components/MapPicker";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabaseClient";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";

const ReportIssue = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    contact: "",
    priority: "medium"
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [submitting, setSubmitting] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const storageBucket = (import.meta as any).env?.VITE_SUPABASE_BUCKET || "reports";
  const navigate = useNavigate();
  const { user } = useAuth();
  const [latestUnresolved, setLatestUnresolved] = useState<any | null>(null);

  const getLocation = async () => {
    setLocationLoading(true);
    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by this browser");
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      
      const addrResp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
      const addrJson = await addrResp.json();
      const address = addrJson?.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      
      setLocation({ lat: latitude, lng: longitude, address });

      toast({
        title: "Location detected",
        description: "Your current location has been added to the report",
      });
    } catch (error) {
      console.error("Error getting location:", error);
      toast({
        title: "Location access denied",
        description: "Please enable location permissions or enter address manually",
        variant: "destructive"
      });
    } finally {
      setLocationLoading(false);
    }
  };

  // Load latest unresolved report for this user and subscribe to updates
  useEffect(() => {
    const loadLatest = async () => {
      if (!user) { setLatestUnresolved(null); return; }
      const email = (user.email || "").toLowerCase();
      const { data } = await supabase
        .from('reports')
        .select('*')
        .or(`contact.ilike.%${email}%,contact.eq.${email}`)
        .order('created_at', { ascending: false })
        .limit(10);
      const rows = (data as any[]) || [];
      const active = rows.find(r => r.status !== 'resolved') || null;
      setLatestUnresolved(active);
    };
    loadLatest();
    const ch = supabase
      .channel('report-issue-latest')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, loadLatest)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  const statusSteps = useMemo(() => ([
    { key: 'submitted', label: 'Issue Raised' },
    { key: 'admin_received', label: 'Assigned to Admin' },
    { key: 'assigned_agent', label: 'Assigned to Agent' },
    { key: 'agent_received', label: 'Received by Agent' },
    { key: 'resolved', label: 'Issue Solved' },
  ]), []);

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access is not supported");
      }
      // Stop any existing stream before starting a new one
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        const canPlay = new Promise<void>((resolve) => {
          const onReady = () => {
            video.removeEventListener('loadedmetadata', onReady);
            video.removeEventListener('canplay', onReady);
            resolve();
          };
          video.addEventListener('loadedmetadata', onReady, { once: true });
          video.addEventListener('canplay', onReady, { once: true });
        });
        await canPlay;
        await video.play();
      }
    } catch (error) {
      console.error("Error starting camera:", error);
      toast({
        title: "Camera access denied",
        description: "Please enable camera permissions or upload a photo instead",
        variant: "destructive"
      });
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (isCameraOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    // Cleanup when component unmounts
    return () => {
      stopCamera();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraOpen, facingMode]);

  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (!video.videoWidth || !video.videoHeight) {
      // Try to wait a bit if metadata not ready yet
      try { await new Promise(r => setTimeout(r, 200)); } catch {}
    }
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPhotos(prev => [...prev, photoDataUrl]);
    toast({
      title: "Photo captured",
      description: "Photo added to your report",
    });
  };

  const switchCamera = () => {
    setFacingMode(prev => (prev === "environment" ? "user" : "environment"));
  };

  

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const dataUrlToBlob = (dataUrl: string): Blob => {
    const [meta, content] = dataUrl.split(',');
    const isBase64 = /;base64$/.test(meta) || /;base64/.test(meta);
    const byteString = isBase64 ? atob(content) : decodeURI(content);
    const mimeMatch = meta.match(/data:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const intArray = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      intArray[i] = byteString.charCodeAt(i);
    }
    return new Blob([intArray], { type: mimeType });
  };

  const uploadPhotosToStorage = async (): Promise<string[]> => {
    const bucket = storageBucket; // Must exist in Supabase Storage
    const urls: string[] = [];
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const blob = dataUrlToBlob(photo);
      const timestamp = Date.now();
      const path = `${timestamp}-${i}.jpg`;
      const { error: uploadError } = await supabase
        .storage
        .from(bucket)
        .upload(path, blob, { contentType: blob.type, upsert: false });
      if (uploadError) {
        console.error('Failed to upload photo', uploadError);
        throw uploadError;
      }
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.description) {
      toast({
        title: "Missing information",
        description: "Please fill in the category and description",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const photoUrls = photos.length ? await uploadPhotosToStorage() : [];
      const baseRow: any = {
        category: formData.category,
        description: formData.description,
        // Default contact to logged-in user's email so it shows under My Reports
        contact: formData.contact || user?.email || null,
        priority: formData.priority,
        lat: location ? location.lat : null,
        lng: location ? location.lng : null,
        address: location ? location.address : null,
        photo_urls: photoUrls,
        status: 'submitted',
        created_at: new Date().toISOString(),
      };
      const includeExtended = (import.meta as any).env?.VITE_ENABLE_EXTENDED_REPORT_COLUMNS === '1';
      if (includeExtended) {
        baseRow.user_id = user?.id || null;
      }
      const { error } = await supabase.from('reports').insert(baseRow);
      if (error) throw error;
      toast({
        title: "Report submitted successfully!",
        description: "We'll review your report and update you on progress",
      });
      // Reset form
      setFormData({ category: "", description: "", contact: "", priority: "medium" });
      setPhotos([]);
      setLocation(null);
      navigate('/my-reports');
    } catch (error: any) {
      console.error('Error submitting report', error);
      toast({
        title: "Submission failed",
        description: (error?.message as string) || "Please try again. If the problem persists, contact support.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-purple-100 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950">
      <Header />
      <main className="py-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="max-w-3xl mx-auto">
            {latestUnresolved && (
              <Card className="p-6 mb-8 rounded-2xl shadow-xl border border-blue-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-300 mb-2">Your latest issue status</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {statusSteps.map((s, i) => {
                        const idx = statusSteps.findIndex(st => st.key === (latestUnresolved?.status || 'submitted'));
                        const active = idx >= i;
                        return (
                          <div key={s.key} className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${active ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`} title={s.label} />
                            <span className={`text-[11px] ${active ? 'text-blue-800 dark:text-blue-200 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>{s.label}</span>
                            {i < statusSteps.length - 1 && (
                              <div className={`h-[1px] w-6 ${i < idx ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <Badge variant={latestUnresolved.status === 'resolved' ? 'default' : (latestUnresolved.status === 'assigned_agent' || latestUnresolved.status === 'agent_received') ? 'secondary' : 'outline'} className={
                    latestUnresolved.status === 'resolved' ? 'bg-green-500 text-white' :
                    latestUnresolved.status === 'assigned_agent' ? 'bg-blue-400 text-white' :
                    latestUnresolved.status === 'agent_received' ? 'bg-purple-400 text-white' :
                    'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                  }>
                    {latestUnresolved.status}
                  </Badge>
                </div>
              </Card>
            )}
            <div className="text-center mb-10">
              <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white mb-2 drop-shadow-sm">
                Report an Issue
              </h1>
              <p className="text-lg text-slate-500 dark:text-slate-300 max-w-2xl mx-auto">
                Help us improve your community. Submit a detailed report and we'll make sure it reaches the right department.
              </p>
            </div>

            <Card className="p-10 rounded-2xl shadow-2xl bg-white/90 dark:bg-slate-900/90 border-0 relative overflow-hidden group transition-transform duration-300 hover:scale-[1.015]">
              {/* Animated gradient border */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl z-0 border-4 border-transparent group-hover:border-blue-400 group-focus-within:border-blue-500 animate-border-glow" style={{boxShadow: '0 0 0 4px rgba(59,130,246,0.15), 0 8px 32px 0 rgba(31,41,55,0.10)'}} />
              <form onSubmit={handleSubmit} className="relative z-10">
                <div className="grid lg:grid-cols-2 gap-10">
                  {/* Form Section */}
                  <div className="space-y-8">
                    <div className="transition-transform duration-300 group-hover:scale-105">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Issue Category *
                      </label>
                      <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger className="focus:ring-2 focus:ring-blue-400 transition-all" >
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pothole">Potholes & Road Issues</SelectItem>
                          <SelectItem value="streetlight">Street Lighting</SelectItem>
                          <SelectItem value="trash">Waste Management</SelectItem>
                          <SelectItem value="traffic">Traffic Signals</SelectItem>
                          <SelectItem value="water">Water & Drainage</SelectItem>
                          <SelectItem value="sidewalk">Sidewalks & Walkways</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    
                    <div className="transition-transform duration-300 group-hover:scale-105">
                      <label className="block text-sm font-medium text-foreground mb-2">Location</label>
                      <div className="space-y-3">
                        <MapPicker value={location} onChange={setLocation} hideMap={!showMap} />
                        <div className="flex justify-between">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setShowMap(!showMap)}
                            className="transition-transform duration-200 hover:scale-105"
                          >
                            <MapPin className="h-4 w-4 mr-2" />
                            {showMap ? 'Hide Map' : 'Show Map'}
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={getLocation} disabled={locationLoading} className="transition-transform duration-200 hover:scale-105">
                            {locationLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
                            Use Current Location
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="transition-transform duration-300 group-hover:scale-105">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Description *
                      </label>
                      <Textarea 
                        placeholder="Describe the issue in detail..."
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="resize-none focus:ring-2 focus:ring-blue-400 transition-all"
                      />
                    </div>
                    
                    <div className="transition-transform duration-300 group-hover:scale-105">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Your Contact (Optional)
                      </label>
                      <Input 
                        placeholder="Email or phone for updates"
                        value={formData.contact}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                        className="focus:ring-2 focus:ring-blue-400 transition-all"
                      />
                    </div>
                  </div>
                  
                  {/* Photo Capture Section */}
                  <div className="space-y-8">
                    <div className="transition-transform duration-300 group-hover:scale-105">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Add Photos
                      </label>
                      <div className="border-2 border-dashed border-blue-200 dark:border-blue-900 rounded-xl p-8 text-center hover:border-blue-400 transition-all animate-fade-in">
                        <div className="space-y-4">
                          <div className="bg-blue-100/60 dark:bg-blue-900/40 rounded-lg p-4 w-16 h-16 mx-auto flex items-center justify-center animate-bounce-slow">
                            <Camera className="h-8 w-8 text-blue-500 dark:text-blue-300" />
                          </div>
                          <div>
                            <p className="font-semibold text-blue-800 dark:text-blue-200">Capture photos</p>
                            <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">
                              Photos help us understand and resolve issues faster
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button type="button" variant="civic" size="sm" onClick={() => setIsCameraOpen(true)} className="transition-transform duration-200 hover:scale-105">
                              <Camera className="h-4 w-4 mr-2" />
                              Take Photo
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Photo Preview */}
                    {photos.length > 0 && (
                      <div className="animate-fade-in">
                        <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-3">
                          Uploaded Photos ({photos.length})
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {photos.map((photo, index) => (
                            <div key={index} className="relative group transition-transform duration-200 hover:scale-105">
                              <img 
                                src={photo} 
                                alt={`Issue photo ${index + 1}`}
                                className="w-full aspect-square object-cover rounded-xl border border-blue-100 dark:border-blue-900 shadow"
                              />
                              <button
                                type="button"
                                onClick={() => removePhoto(index)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Camera Dialog */}
                    <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
                      <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                          <DialogTitle>Camera</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="relative w-full overflow-hidden rounded-lg bg-black">
                            <video
                              ref={videoRef}
                              playsInline
                              muted
                              autoPlay
                              className="w-full h-64 object-contain bg-black"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <Button type="button" variant="outline" onClick={switchCamera}>
                              Switch Camera
                            </Button>
                            <div className="flex items-center gap-2">
                              <Button type="button" variant="secondary" onClick={() => setIsCameraOpen(false)}>
                                Done
                              </Button>
                              <Button type="button" variant="civic" onClick={handleCapture}>
                                Capture
                              </Button>
                            </div>
                          </div>
                        </div>
                        <DialogFooter />
                      </DialogContent>
                    </Dialog>
                    
                    {/* Priority Level */}
                    <div className="transition-transform duration-300 group-hover:scale-105">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Priority Level
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button 
                          type="button"
                          variant={formData.priority === "low" ? "default" : "outline"}
                          size="sm" 
                          onClick={() => setFormData(prev => ({ ...prev, priority: "low" }))}
                          className="text-green-700 border-green-300 focus:ring-2 focus:ring-green-400 transition-all"
                        >
                          Low
                        </Button>
                        <Button 
                          type="button"
                          variant={formData.priority === "medium" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, priority: "medium" }))}
                          className="text-yellow-700 border-yellow-300 focus:ring-2 focus:ring-yellow-400 transition-all"
                        >
                          Medium
                        </Button>
                        <Button 
                          type="button"
                          variant={formData.priority === "high" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, priority: "high" }))}
                          className="text-red-700 border-red-300 focus:ring-2 focus:ring-red-400 transition-all animate-pulse"
                        >
                          Urgent
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 mt-4">
                      <Button type="button" variant="outline" onClick={() => navigate('/')} className="transition-transform duration-200 hover:scale-105"> 
                        <Home className="h-5 w-5 mr-2" /> Home
                      </Button>
                      <Button type="submit" variant="hero" size="lg" className="flex-1 transition-transform duration-200 hover:scale-105" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5 mr-2" />
                          Submit Report
                        </>
                      )}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReportIssue;