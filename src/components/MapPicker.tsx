import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, Crosshair, Search } from "lucide-react";

// Fix default marker icons path in Leaflet when bundling
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon as any;

type LocationValue = { lat: number; lng: number; address: string } | null;

type MapPickerProps = {
  value: LocationValue;
  onChange: (loc: LocationValue) => void;
  className?: string;
  height?: number;
  hideMap?: boolean;
};

const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
    const json = await resp.json();
    return json?.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
};

const searchAddress = async (q: string): Promise<Array<{ label: string; lat: number; lng: number }>> => {
  if (!q || q.length < 3) return [];
  const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}`);
  const json = await resp.json();
  return (json || []).slice(0, 5).map((r: any) => ({ label: r.display_name as string, lat: parseFloat(r.lat), lng: parseFloat(r.lon) }));
};

const ClickHandler = ({ onPick }: { onPick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (e) => {
      onPick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
};

export const MapPicker = ({ value, onChange, className, height = 280, hideMap = false }: MapPickerProps) => {
  const [center, setCenter] = useState<LatLngExpression>(() => [value?.lat || 20.5937, value?.lng || 78.9629]); // Default to India center
  const [search, setSearch] = useState(value?.address || "");
  const [results, setResults] = useState<Array<{ label: string; lat: number; lng: number }>>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    setSearch(value?.address || "");
  }, [value?.address]);

  const pickLocation = useCallback(async (lat: number, lng: number) => {
    const address = await reverseGeocode(lat, lng);
    onChange({ lat, lng, address });
    setCenter([lat, lng]);
  }, [onChange]);

  const handleGeolocate = async () => {
    setLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });
      const { latitude, longitude } = pos.coords;
      await pickLocation(latitude, longitude);
    } catch (e) {
      // ignore
    } finally {
      setLocating(false);
    }
  };

  const onSearchChange = (v: string) => {
    setSearch(v);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!v || v.length < 3) {
      setResults([]);
      return;
    }
    setSearching(true);
    debounceRef.current = window.setTimeout(async () => {
      const r = await searchAddress(v);
      setResults(r);
      setSearching(false);
    }, 400);
  };

  const onSelectResult = async (r: { label: string; lat: number; lng: number }) => {
    onChange({ lat: r.lat, lng: r.lng, address: r.label });
    setCenter([r.lat, r.lng]);
    setResults([]);
  };

  const hasValue = useMemo(() => Boolean(value && typeof value.lat === 'number' && typeof value.lng === 'number'), [value]);

  return (
    <div className={className}>
      <div className="flex gap-2 mb-2">
        <div className="relative flex-1">
          <Input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search address or place" className="pr-8" />
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {searching && <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
          {results.length > 0 && (
            <div className="absolute z-[1000] mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow">
              {results.map((r, i) => (
                <button key={i} type="button" onClick={() => onSelectResult(r)} className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground">
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button type="button" variant="outline" onClick={handleGeolocate} disabled={locating}>
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
        </Button>
      </div>
      {!hideMap && (
        <div className="rounded-lg overflow-hidden border">
          <MapContainer center={center} zoom={hasValue ? 16 : 5} style={{ height }} scrollWheelZoom={true} className="w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
            <ClickHandler onPick={pickLocation} />
            {hasValue && value && (
              <Marker position={[value.lat, value.lng]} />
            )}
          </MapContainer>
        </div>
      )}
      {value && (
        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
          <MapPin className="h-3 w-3" />
          <span>{value.address || `${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}`}</span>
        </div>
      )}
    </div>
  );
};

export default MapPicker;



