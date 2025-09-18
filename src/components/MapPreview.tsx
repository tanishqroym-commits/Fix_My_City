// Static map preview to avoid heavy Leaflet rendering in admin lists

type Props = {
  lat: number;
  lng: number;
  height?: number;
};

const MapPreview = ({ lat, lng, height = 180 }: Props) => {
  const zoom = 15;
  const marker = `markers=${lat},${lng}`;
  // Using OSM Static-like approach via mapbox or a fallback placeholder if no static map service is configured.
  // Default to a lightweight tile preview image from Yandex static as a public, no-key option.
  const src = `https://static-maps.yandex.ru/1.x/?ll=${lng},${lat}&z=${zoom}&l=map&size=450,300&pt=${lng},${lat},pm2rdm`;
  return (
    <div className="rounded-lg overflow-hidden border" style={{ height }}>
      <img
        src={src}
        alt={`Map preview at ${lat}, ${lng}`}
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export default MapPreview;



