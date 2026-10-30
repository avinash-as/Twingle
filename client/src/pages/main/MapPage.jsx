import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, RefreshCw, Eye, EyeOff, Ghost, Users, Navigation } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// Fix default marker icon for bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createProfileIcon = (avatarUrl, name) => {
  const initials = (name || '?').charAt(0).toUpperCase();
  const html = avatarUrl
    ? `<img src="${avatarUrl}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid #6366f1;" />`
    : `<div style="width:40px;height:40px;border-radius:50%;background:#6366f1;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;border:2px solid #6366f1;">${initials}</div>`;
  return L.divIcon({ html, className: 'twingle-marker', iconSize: [40, 40], iconAnchor: [20, 20] });
};

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function MapPage() {
  const { user } = useAuth();
  const { location, getCurrentLocation, loading: locLoading, error: locError } = useGeolocation();
  const [privacy, setPrivacy] = useState(null);
  const [nearby, setNearby] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConsent, setShowConsent] = useState(false);
  const [radius, setRadius] = useState(5000);
  const intervalRef = useRef(null);

  const fetchPrivacy = useCallback(async () => {
    try {
      const res = await api.get('/users/location/privacy');
      setPrivacy(res.data);
      if (!res.data.locationSharing && !res.data.nearbyDiscovery) {
        setShowConsent(true);
      }
    } catch (e) {
      console.error('privacy fetch failed', e);
    }
  }, []);

  const fetchNearby = useCallback(async () => {
    if (!location) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/users/map/nearby', {
        params: { latitude: location.latitude, longitude: location.longitude, radius },
      });
      setNearby(res.data.users || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load nearby users');
    } finally {
      setLoading(false);
    }
  }, [location, radius]);

  useEffect(() => {
    fetchPrivacy();
  }, [fetchPrivacy]);

  useEffect(() => {
    if (location && privacy?.locationSharing) {
      fetchNearby();
      intervalRef.current = setInterval(fetchNearby, 30000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [location, privacy?.locationSharing, fetchNearby]);

  const handleConsent = async (choice) => {
    try {
      if (choice === 'everyone') {
        await api.put('/users/location/sharing', { enabled: true, audience: 'discoverable' });
        await api.put('/users/nearby-discovery', { enabled: true });
      } else if (choice === 'friends') {
        await api.put('/users/location/sharing', { enabled: true, audience: 'friends' });
        await api.put('/users/nearby-discovery', { enabled: true });
      } else {
        await api.put('/users/location/sharing', { enabled: false, audience: 'nobody' });
        await api.put('/users/nearby-discovery', { enabled: false });
      }
      await fetchPrivacy();
      setShowConsent(false);
      if (choice !== 'hide') getCurrentLocation();
    } catch (e) {
      console.error('consent failed', e);
    }
  };

  const toggleSharing = async () => {
    const next = !privacy?.locationSharing;
    await api.put('/users/location/sharing', { enabled: next, audience: next ? privacy?.audience || 'friends' : 'nobody' });
    await fetchPrivacy();
  };

  const toggleGhost = async () => {
    const next = !privacy?.ghostMode;
    await api.put('/users/ghost-mode', { enabled: next });
    await fetchPrivacy();
  };

  if (locLoading && !location) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0B0B12]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const center = location ? [location.latitude, location.longitude] : [20.5937, 78.9629];

  return (
    <div className="flex-1 flex flex-col bg-[#0B0B12] relative">
      {/* Consent modal */}
      {showConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">Share your location?</h2>
            <p className="text-neutral-400 text-sm">
              Twingle can show your approximate location to others on the map. Location sharing is OFF by default.
            </p>
            <div className="space-y-2">
              <Button variant="primary" fullWidth onClick={() => handleConsent('everyone')}>
                Share with everyone nearby
              </Button>
              <Button variant="outline" fullWidth onClick={() => handleConsent('friends')}>
                Share with friends only
              </Button>
              <Button variant="ghost" fullWidth onClick={() => handleConsent('hide')}>
                Hide my location
              </Button>
            </div>
          </Card>
        </div>
      )}

      {locError && (
        <div className="absolute top-20 left-4 right-4 z-[1000]">
          <Card className="p-3 text-sm text-red-400">
            Location error: {locError.message || 'Unable to get location'}. Enable location and tap refresh.
          </Card>
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={getCurrentLocation}>
            <Navigation className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={fetchNearby} loading={loading}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={privacy?.locationSharing ? 'primary' : 'outline'} size="sm" onClick={toggleSharing}>
            {privacy?.locationSharing ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="ml-1 text-xs">{privacy?.locationSharing ? 'Sharing' : 'Hidden'}</span>
          </Button>
          <Button variant={privacy?.ghostMode ? 'primary' : 'outline'} size="sm" onClick={toggleGhost}>
            <Ghost className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative" style={{ minHeight: '400px' }}>
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', minHeight: '400px' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {location && (
            <Marker position={[location.latitude, location.longitude]} icon={createProfileIcon(user?.avatar, user?.name)}>
              <Popup>You are here</Popup>
            </Marker>
          )}
          {nearby.map((u) => (
            <Marker key={u.id} position={[u.latitude, u.longitude]} icon={createProfileIcon(u.avatar, u.name)}>
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-neutral-500">{u.distanceFormatted} away</div>
                  <div className="text-xs">{u.isOnline ? 'Online' : 'Offline'}</div>
                </div>
              </Popup>
            </Marker>
          ))}
          <RecenterMap center={location ? [location.latitude, location.longitude] : null} />
        </MapContainer>
      </div>

      {/* Nearby list */}
      <div className="absolute bottom-4 left-4 right-4 z-[1000] max-h-48 overflow-y-auto">
        <Card className="p-3 space-y-2 bg-[#0B0B12]/90 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4" /> Nearby on map ({nearby.length})
            </span>
            {error && <span className="text-xs text-red-400">{error}</span>}
          </div>
          {nearby.length === 0 ? (
            <p className="text-xs text-neutral-500">No one sharing location nearby.</p>
          ) : (
            nearby.map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <Avatar src={u.avatar} name={u.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{u.name}</div>
                  <div className="text-xs text-neutral-500">{u.distanceFormatted} · {u.isOnline ? 'Online' : 'Offline'}</div>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
