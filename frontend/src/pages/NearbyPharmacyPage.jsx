import { useState } from 'react';
import { Crosshair, ExternalLink, MapPin, Phone, Search } from 'lucide-react';
import { getNearbyPharmacies } from '../services/api';
import useAsync, { errorMessage } from '../hooks/useAsync';
import PageShell from '../components/dashboard/PageShell';
import PageHeader from '../components/dashboard/PageHeader';
import DashPanel from '../components/dashboard/DashPanel';
import Button from '../components/ui/Button';

function metres(m) {
  if (m == null) return '—';
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

const NearbyPharmacyPage = () => {
  const [pos, setPos] = useState(null);
  const [radius, setRadius] = useState(2000);
  const [locating, setLocating] = useState(false);
  const [geoErr, setGeoErr] = useState('');
  const { data, loading: searching, error, reload: search } = useAsync(
    async () => {
      if (!pos) return null;
      const res = await getNearbyPharmacies({ lat: pos.lat, lng: pos.lng, radius });
      return { results: res?.results || [], center: res?.center || pos };
    },
    [pos, radius],
  );
  const loading = locating || (Boolean(pos) && searching);
  const results = (!error && data?.results) || [];
  const center = data?.center || null;
  const err = geoErr || (error ? errorMessage(error, 'Lookup failed') : '');

  const locate = () => {
    setGeoErr('');
    if (!navigator.geolocation) {
      setGeoErr("Your browser doesn't support geolocation.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        setLocating(false);
      },
      (e) => {
        setLocating(false);
        setGeoErr(e.message || 'Could not access location.');
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const mapEmbed = center
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${center.lng - 0.02},${center.lat - 0.015},${center.lng + 0.02},${center.lat + 0.015}&layer=mapnik&marker=${center.lat},${center.lng}`
    : '';

  return (
    <PageShell className="max-w-6xl">
      <PageHeader
        title="Nearby pharmacies"
        subtitle="OpenStreetMap listings near you — open directions in Google Maps."
        icon={MapPin}
      />

      <DashPanel bodyClassName="flex flex-col sm:flex-row gap-4 sm:items-end">
        <Button type="button" variant="primary" onClick={locate} className="gap-2 shrink-0">
          <Crosshair size={16} />
          {pos ? 'Update location' : 'Use my location'}
        </Button>
        <div className="flex flex-col">
          <label className="dash-form-label mb-1">Radius</label>
          <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="dash-input py-2.5">
            <option value={1000}>1 km</option>
            <option value={2000}>2 km</option>
            <option value={5000}>5 km</option>
            <option value={10000}>10 km</option>
          </select>
        </div>
        {pos && (
          <Button type="button" variant="outline" onClick={search} disabled={loading} className="gap-2">
            <Search size={16} />
            {loading ? 'Searching…' : 'Refresh'}
          </Button>
        )}
      </DashPanel>

      {err && (
        <div className="rounded-xl dash-alert-error px-4 py-3 text-sm">
          {err}
        </div>
      )}

      {center && mapEmbed && (
        <DashPanel noPadding bodyClassName="p-0 overflow-hidden">
          <iframe
            title="Nearby pharmacies map"
            width="100%"
            height="320"
            frameBorder="0"
            scrolling="no"
            src={mapEmbed}
            style={{ border: 0 }}
          />
        </DashPanel>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((p) => (
          <div key={p.id} className="dash-surface rounded-2xl shadow-sm p-5 flex flex-col hover-lift">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold dash-text">{p.name}</h3>
                <p className="text-xs dash-muted mt-0.5">{metres(p.distance_m)} away</p>
              </div>
              <a
                href={p.directions_url}
                target="_blank"
                rel="noreferrer noopener"
                className="bg-brand-gradient hover:opacity-90 text-white text-[12px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
              >
                <MapPin size={12} /> Directions
              </a>
            </div>
            {p.address && (
              <p className="text-sm dash-muted mt-2 flex items-start gap-1.5">
                <MapPin size={14} className="opacity-60 mt-0.5 shrink-0" />
                <span>{p.address}</span>
              </p>
            )}
            {p.phone && (
              <p className="text-sm dash-muted mt-1 flex items-center gap-1.5">
                <Phone size={14} className="opacity-60" />
                <a href={`tel:${p.phone}`} className="hover:underline dash-text">
                  {p.phone}
                </a>
              </p>
            )}
            {p.opening_hours && (
              <p className="text-xs dash-muted mt-2">Hours: {p.opening_hours}</p>
            )}
            <a
              href={p.osm_url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-xs text-teal hover:underline mt-3 flex items-center gap-1"
            >
              View on OpenStreetMap <ExternalLink size={12} />
            </a>
          </div>
        ))}
      </div>

      {!loading && pos && results.length === 0 && (
        <div className="text-center text-sm dash-muted py-12 dash-inset-dashed">
          No pharmacies returned in this radius. Try increasing the radius.
        </div>
      )}

      {!pos && (
        <div className="text-center text-sm dash-muted py-12 dash-inset-dashed">
          Enable location to find pharmacies nearby.
        </div>
      )}
    </PageShell>
  );
};

export default NearbyPharmacyPage;
