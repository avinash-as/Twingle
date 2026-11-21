import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radar, MessageSquare, Map, Users, Bell, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../utils/api';

export default function HomePage() {
  const { user } = useAuth();
  const { location, getCurrentLocation } = useGeolocation();
  const navigate = useNavigate();
  const [nearbyCount, setNearbyCount] = useState(0);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNearby = useCallback(async (loc) => {
    if (!loc) return;
    try {
      const res = await api.get('/users/nearby', {
        params: { latitude: loc.latitude, longitude: loc.longitude, maxDistance: 5000 },
      });
      const list = res.data?.users || [];
      setNearbyCount(list.length);
      setRecent(list.slice(0, 5));
    } catch (e) {
      console.error('home nearby fetch failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (location) fetchNearby(location);
    else getCurrentLocation().then(fetchNearby).catch(() => setLoading(false));
  }, [location, getCurrentLocation, fetchNearby]);

  return (
    <div className="flex-1 bg-[#08090A] px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar src={user?.avatar} name={user?.name} size="md" status={user?.isOnline ? 'online' : 'offline'} />
          <div>
            <p className="text-xs text-neutral-500">Welcome back</p>
            <h1 className="text-lg font-semibold text-white">{user?.name || 'Twingle'}</h1>
          </div>
        </div>
        <button className="relative p-2 rounded-full hover:bg-neutral-800/50">
          <Bell className="w-6 h-6 text-neutral-300" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full" />
        </button>
      </div>

      {/* Scan CTA */}
      <Card className="p-6 text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center shadow-lg">
          <Radar className="w-10 h-10 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Discover nearby</h2>
          <p className="text-neutral-500 text-sm mt-1">
            {loading ? 'Finding people near you…' : `${nearbyCount} people nearby`}
          </p>
        </div>
        <Button variant="primary" size="lg" fullWidth onClick={() => navigate('/scan')}>
          <Sparkles className="w-5 h-5" /> Scan Nearby
        </Button>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 flex items-center gap-3 cursor-pointer hover:border-primary-500/30" onClick={() => navigate('/chats')}>
          <MessageSquare className="w-6 h-6 text-primary-400" />
          <div>
            <p className="text-white font-medium">Chats</p>
            <p className="text-xs text-neutral-500">Open conversations</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3 cursor-pointer hover:border-primary-500/30" onClick={() => navigate('/map')}>
          <Map className="w-6 h-6 text-accent-400" />
          <div>
            <p className="text-white font-medium">Map</p>
            <p className="text-xs text-neutral-500">Explore nearby</p>
          </div>
        </Card>
      </div>

      {/* Recently discovered */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Recently discovered</h3>
          <button className="text-sm text-primary-400" onClick={() => navigate('/discover')}>See all</button>
        </div>
        {loading ? (
          <LoadingSpinner size="md" />
        ) : recent.length === 0 ? (
          <p className="text-neutral-500 text-sm">No one nearby yet. Try scanning.</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recent.map((u) => (
              <Card key={u.id} className="min-w-[120px] p-3 flex flex-col items-center gap-2">
                <Avatar src={u.avatar} name={u.name} size="lg" status={u.isOnline ? 'online' : 'offline'} />
                <p className="text-sm text-white truncate w-full text-center">{u.name}</p>
                <Badge variant="secondary" size="sm">{u.distanceFormatted || `${u.distance}m`}</Badge>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}