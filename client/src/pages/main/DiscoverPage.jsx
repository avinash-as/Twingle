import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Heart, X, Star, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useConnections } from '../../context/ConnectionsContext';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function DiscoverPage() {
  const { user } = useAuth();
  const { location, getCurrentLocation } = useGeolocation();
  const { sendConnectionRequest } = useConnections();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [direction, setDirection] = useState(0);
  const [history, setHistory] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ maxDistance: 25000, ageMin: '', ageMax: '', interests: [], onlineOnly: false, gender: '' });

  const fetchNearby = useCallback(async (loc) => {
    if (!loc) return;
    setLoading(true);
    try {
      await api.post('/users/location', { latitude: loc.latitude, longitude: loc.longitude });
      const params = {
        latitude: loc.latitude,
        longitude: loc.longitude,
        maxDistance: filters.maxDistance,
      };
      if (filters.ageMin) params.ageMin = filters.ageMin;
      if (filters.ageMax) params.ageMax = filters.ageMax;
      if (filters.gender) params.gender = filters.gender;
      if (filters.interests.length) params.interests = filters.interests.join(',');
      const res = await api.get('/users/nearby', { params });
      let list = res.data?.users || [];
      if (filters.onlineOnly) list = list.filter((u) => u.isOnline);
      console.log('Discover nearby count:', list.length, 'location:', loc);
      setUsers(list);
      setIndex(0);
      setHistory([]);
    } catch (e) {
      console.error('discover fetch failed', e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (location) fetchNearby(location);
    else getCurrentLocation().then(fetchNearby).catch(() => setLoading(false));
  }, [location, getCurrentLocation, fetchNearby]);

  const current = users[index];

  const handleSwipe = async (dir) => {
    if (!current) return;
    setHistory((h) => [...h, current]);
    setDirection(dir);
    if (dir === 1) {
      try {
        await sendConnectionRequest(current.id);
      } catch (e) {
        console.error('connect failed', e);
      }
    }
    setTimeout(() => {
      setIndex((i) => i + 1);
      setDirection(0);
    }, 250);
  };

  const handleRewind = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setUsers((u) => [prev, ...u.slice(index)]);
    setIndex(0);
  };

  const handleSuperLike = async () => {
    if (!current) return;
    setHistory((h) => [...h, current]);
    try {
      await sendConnectionRequest(current.id);
    } catch (e) {
      console.error('superlike failed', e);
    }
    setTimeout(() => {
      setIndex((i) => i + 1);
      setDirection(0);
    }, 250);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#08090A]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!users.length || index >= users.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#08090A] px-6 text-center">
        <div className="w-24 h-24 rounded-full bg-primary-500/10 flex items-center justify-center mb-6">
          <Heart className="w-12 h-12 text-primary-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No more profiles nearby</h2>
        <p className="text-neutral-500 mb-6">Try again later or widen your search.</p>
        <Button variant="primary" onClick={() => location && fetchNearby(location)}>
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#08090A] overflow-hidden h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-bold text-white">Discover</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
            Filters
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/scan')}>
            Scan
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="px-4 pb-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            {[5000, 10000, 25000].map((d) => (
              <button
                key={d}
                onClick={() => setFilters((f) => ({ ...f, maxDistance: d }))}
                className={`px-3 py-1 rounded-full text-xs ${filters.maxDistance === d ? 'bg-primary-500 text-white' : 'bg-neutral-800 text-neutral-300'}`}
              >
                {d >= 1000 ? `${d / 1000} km` : `${d} m`}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min age"
              value={filters.ageMin}
              onChange={(e) => setFilters((f) => ({ ...f, ageMin: e.target.value }))}
              className="w-20 px-2 py-1 rounded bg-neutral-900 border border-neutral-700 text-white text-xs"
            />
            <input
              type="number"
              placeholder="Max age"
              value={filters.ageMax}
              onChange={(e) => setFilters((f) => ({ ...f, ageMax: e.target.value }))}
              className="w-20 px-2 py-1 rounded bg-neutral-900 border border-neutral-700 text-white text-xs"
            />
            <button
              onClick={() => setFilters((f) => ({ ...f, onlineOnly: !f.onlineOnly }))}
              className={`px-3 py-1 rounded-full text-xs ${filters.onlineOnly ? 'bg-green-500 text-white' : 'bg-neutral-800 text-neutral-300'}`}
            >
              Online only
            </button>
          </div>
          <Button variant="primary" size="sm" onClick={() => location && fetchNearby(location)}>
            Apply
          </Button>
        </div>
      )}

      {/* Card stack */}
      <div className="flex-1 flex items-center justify-center px-4 relative">
        <AnimatePresence>
          {current && (
            <motion.div
              key={current.id}
              className="absolute w-full max-w-sm"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ x: direction * 300, opacity: 0, rotate: direction * 15 }}
              transition={{ duration: 0.25 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(e, info) => {
                if (info.offset.x > 100) handleSwipe(1);
                else if (info.offset.x < -100) handleSwipe(-1);
              }}
            >
              <Card className="overflow-hidden shadow-2xl">
                <div className="relative h-64 bg-neutral-800">
                  {current.avatar ? (
                    <img src={current.avatar} alt={current.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-600 to-accent-500">
                      <span className="text-6xl font-bold text-white">{current.name?.charAt(0)}</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-white">{current.name}</h2>
                      {current.isOnline && <Badge variant="success" size="sm" dot pulse>Online</Badge>}
                    </div>
                    <div className="flex items-center gap-2 text-white/80 text-sm mt-1">
                      <MapPin className="w-4 h-4" />
                      <span>{current.distanceFormatted} away</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {current.bio && <p className="text-neutral-300 text-sm">{current.bio}</p>}
                  {current.interests?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {current.interests.slice(0, 5).map((i) => (
                        <span key={i} className="px-2 py-1 rounded-full text-xs bg-primary-500/20 text-primary-400 border border-primary-500/30">
                          #{i}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 gap-2">
                    <Button variant="outline" size="sm" onClick={handleRewind} disabled={!history.length}>
                      Rewind
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleSwipe(-1)}>
                      <X className="w-5 h-5" />
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSuperLike}>
                      <Star className="w-5 h-5" />
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => handleSwipe(1)}>
                      <Heart className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setSelected(null)}>
          <Card className="w-full max-w-md p-6 space-y-4 animate-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{selected.name}</h2>
              <button onClick={() => setSelected(null)} className="text-neutral-400 hover:text-white">
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
            <p className="text-neutral-400 text-sm">{selected.bio || 'No bio yet.'}</p>
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <MapPin className="w-4 h-4" />
              <span>{selected.distanceFormatted} away</span>
            </div>
            {selected.interests?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selected.interests.map((i) => (
                  <span key={i} className="px-2 py-1 rounded-full text-xs bg-primary-500/20 text-primary-400 border border-primary-500/30">
                    #{i}
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" fullWidth onClick={() => { setSelected(null); navigate(`/chat/${selected.id}`); }}>
                Message
              </Button>
              <Button variant="primary" fullWidth onClick={() => { sendConnectionRequest(selected.id); setSelected(null); }}>
                Connect
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
