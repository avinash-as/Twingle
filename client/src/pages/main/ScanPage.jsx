import { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MapPin, Users, RefreshCw, Sparkles, Search, Wifi, UserCheck, Share2, QrCode, Clock, Bell, Filter, Map, SlidersHorizontal, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useScanner } from '../../hooks/useScanner';
import { useConnections } from '../../hooks/useConnections';
import { useBackgroundLocation } from '../../hooks/useBackgroundLocation';
import RadarScanner from '../../components/scanner/RadarScanner';
import NearbyUsersList from '../../components/scanner/NearbyUsersList';
import ProfilePreview from '../../components/profile/ProfilePreview';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ScanPage = () => {
  const { user, updateUser } = useAuth();
  const { location, error: locationError, loading: locationLoading, getCurrentLocation } = useGeolocation();
  const { scanning, nearbyUsers, scanCount, startScan, stopScan, scanError, scanProgress, scanComplete } = useScanner();
  const { pendingRequests, sendConnectionRequest } = useConnections();
  const { isTracking: bgTracking, startTracking: startBgTracking, isSupported: bgSupported } = useBackgroundLocation();
  const navigate = useNavigate();

  const [selectedUser, setSelectedUser] = useState(null);
  const [connectingId, setConnectingId] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showMapView, setShowMapView] = useState(false);
  const [filters, setFilters] = useState(() => {
    try {
      const cached = localStorage.getItem('twingle_scan_filters');
      return cached ? JSON.parse(cached) : { gender: '', ageMin: '', ageMax: '', interests: [] };
    } catch {
      return { gender: '', ageMin: '', ageMax: '', interests: [] };
    }
  });

  const availableInterests = ['Music', 'Sports', 'Travel', 'Food', 'Movies', 'Books', 'Gaming', 'Fitness', 'Art', 'Cooking'];

  const handleScan = useCallback(async () => {
    if (!location) {
      try {
        await getCurrentLocation();
      } catch {
        return;
      }
    }
    if (location) {
      setShowResults(false);
      await startScan(location, filters);
      // Also start background tracking if supported and not already tracking
      if (bgSupported && !scanning) {
        startBgTracking();
      }
      // Results will be shown automatically when scan completes
    }
  }, [location, getCurrentLocation, startScan, filters, bgSupported, startBgTracking, scanning]);

  const handleConnect = async (userId) => {
    setConnectingId(userId);
    try {
      await sendConnectionRequest(userId);
      const user = nearbyUsers.find(u => u.id === userId);
      if (user) {
        setSelectedUser(user);
        setShowProfile(true);
      }
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setConnectingId(null);
    }
  };

  const handleCloseProfile = () => {
    setShowProfile(false);
    setSelectedUser(null);
  };

  const handleProfileConnect = async () => {
    if (selectedUser) {
      await handleConnect(selectedUser.id);
    }
  };

  const handleToggleFilters = () => setShowFilters(!showFilters);
  const handleToggleMapView = () => setShowMapView(!showMapView);
  const handleToggleInterest = (interest) => {
    setFilters(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }));
  };
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };
  const handleResetFilters = () => {
    setFilters({ gender: '', ageMin: '', ageMax: '', interests: [] });
    setShowFilters(false);
  };
  const handleApplyFilters = () => {
    setShowFilters(false);
    if (location) {
      startScan(location, filters);
    }
  };

  useEffect(() => {
    if (user?.isDiscoverable !== false) {
      updateUser({ isDiscoverable: true });
    }
  }, []);

  useEffect(() => {
    if (!scanning && scanComplete && nearbyUsers.length > 0) {
      setShowResults(true);
    }
  }, [scanning, scanComplete, nearbyUsers.length]);

  // Persist filters
  useEffect(() => {
    try {
      localStorage.setItem('twingle_scan_filters', JSON.stringify(filters));
    } catch {}
  }, [filters]);

  if (locationError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center bg-[#0B0B12]">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100/50 dark:bg-red-900/20 flex items-center justify-center animate-float">
          <MapPin className="w-12 h-12 text-red-500 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Location Access Needed</h2>
        <p className="text-neutral-500 mb-8 max-w-xs leading-relaxed">
          Twingle needs your location to find people nearby. Please enable location access in your browser settings.
        </p>
        <Button variant="primary" onClick={getCurrentLocation} size="lg" loading={locationLoading} fullWidth>
          <RefreshCw className="w-5 h-5 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (scanError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center bg-[#0B0B12]">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100/50 dark:bg-red-900/20 flex items-center justify-center animate-float">
          <Search className="w-12 h-12 text-red-500 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Scan Failed</h2>
        <p className="text-neutral-500 mb-8 max-w-xs leading-relaxed">
          {scanError}
        </p>
        <Button variant="primary" onClick={handleScan} size="lg" loading={scanning} fullWidth>
          <RefreshCw className="w-5 h-5 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0B0B12]">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 space-y-8 bg-mesh">
        <div className="text-center w-full max-w-md animate-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 text-primary-400 text-sm font-medium mb-4 animate-in animate-in-delayed">
            <Search className="w-4 h-4" />
            Nearby Discovery
          </div>
          <h1 className="text-5xl font-extrabold text-white tracking-tight gradient-text mb-3">
            Twingle
          </h1>
          <p className="text-lg text-neutral-500">
            Find people nearby instantly
          </p>
        </div>

        <div className="w-full max-w-md animate-in animate-in-delayed">
          <RadarScanner
            scanning={scanning}
            nearbyUsers={nearbyUsers}
            scanCount={scanCount}
            scanProgress={scanProgress}
          />
        </div>

        <div className="w-full max-w-md animate-in">
          <Button
            variant="primary"
            className="w-full"
            size="xl"
            onClick={handleScan}
            disabled={scanning || locationLoading}
            loading={locationLoading}
            fullWidth
          >
            {scanning ? (
              <>
                <span className="flex items-center gap-2">
                  <Search className="w-6 h-6 animate-spin" />
                  Scanning... {Math.round(scanProgress)}%
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                SCAN
              </>
            )}
          </Button>
          
          {scanning && (
            <div className="mt-4 w-full max-w-md mx-auto">
              <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-100"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
              <p className="text-center text-xs text-neutral-500 mt-2">
                Scanning for nearby users... {Math.round(scanProgress)}%
              </p>
            </div>
          )}
          
          {!scanning && !locationLoading && (
            <p className="text-center text-sm text-neutral-500 mt-4">
              Tap to discover nearby users
            </p>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleFilters}
            className={`flex items-center gap-2 ${showFilters ? 'bg-primary-500/20 text-primary-400 border-primary-500/30' : 'bg-neutral-800/50 text-neutral-500 hover:bg-neutral-800'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {filters.gender || filters.ageMin || filters.ageMax || filters.interests.length > 0 && (
              <Badge variant="primary">{filters.interests.length + (filters.gender ? 1 : 0) + (filters.ageMin ? 1 : 0) + (filters.ageMax ? 1 : 0)}</Badge>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleMapView}
            className="bg-neutral-800/50 text-neutral-500 hover:bg-neutral-800"
          >
            <Map className="w-4 h-4" />
            <span>Map</span>
          </Button>
        </div>

        {pendingRequests.length > 0 && (
          <NavLink
            to="/chats"
            className="fixed bottom-28 right-4 z-30 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-full shadow-lg animate-float animate-in"
          >
            <Users className="w-5 h-5" />
            <Badge variant="danger" className="ml-1">
              {pendingRequests.length}
            </Badge>
            <span className="text-sm font-medium hidden sm:inline">Requests</span>
          </NavLink>
        )}

        {bgSupported && !bgTracking && (
          <div className="fixed bottom-14 right-4 z-30 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-400 text-white rounded-full shadow-lg animate-float animate-in" onClick={startBgTracking}>
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">Background Scan</span>
          </div>
        )}
        {bgSupported && bgTracking && (
          <div className="fixed bottom-14 right-4 z-30 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full shadow-lg animate-pulse animate-in">
            <Clock className="w-5 h-5 animate-pulse" />
            <span className="text-sm font-medium">Background Active</span>
          </div>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in" onClick={setShowFilters(false)}>
          <div className="w-full max-w-md bg-[#0B0B12] rounded-2xl border border-neutral-700 p-6 animate-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Discovery Filters</h3>
              <button
                onClick={setShowFilters(false)}
                className="p-1 text-neutral-400 hover:text-white"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-neutral-300 mb-3">Gender</h4>
                <div className="flex gap-2">
                  {['male', 'female', 'other', 'prefer_not_to_say'].map(g => (
                    <button
                      key={g}
                      onClick={() => handleFilterChange('gender', g === filters.gender ? '' : g)}
                      className={`px-3 py-2 rounded-lg text-sm transition-all ${
                        filters.gender === g
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-neutral-300 mb-3">Age Range</h4>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.ageMin || ''}
                      onChange={(e) => handleFilterChange('ageMin', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.ageMax || ''}
                      onChange={(e) => handleFilterChange('ageMax', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-neutral-300 mb-3">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {availableInterests.map(interest => (
                    <button
                      key={interest}
                      onClick={() => handleToggleInterest(interest)}
                      className={`px-3 py-2 rounded-lg text-sm transition-all ${
                        filters.interests.includes(interest)
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" size="sm" onClick={handleResetFilters} className="flex-1">
                  Reset
                </Button>
                <Button variant="primary" size="sm" onClick={handleApplyFilters} className="flex-1">
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {nearbyUsers.length > 0 && !scanning && showResults && (
        <div className="px-4 pb-10 animate-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-400" />
              Nearby <span className="text-primary-400">({scanCount})</span>
            </h2>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMapView(!showMapView)}
                className={`flex items-center gap-2 ${showMapView ? 'bg-primary-500/20 text-primary-400 border-primary-500/30' : 'bg-neutral-800/50 text-neutral-500'}`}
              >
                <Map className="w-4 h-4" />
                {showMapView ? 'List View' : 'Map View'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleScan}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Rescan
              </Button>
            </div>
          </div>

          {showMapView ? (
            <div className="h-[400px] w-full rounded-2xl bg-neutral-800/50 border border-neutral-700 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center text-neutral-500 text-sm">
                Map view coming soon - Leaflet/Mapbox integration
              </div>
              <NearbyUsersList
                users={nearbyUsers}
                onConnect={handleConnect}
                connectingId={connectingId}
              />
            </div>
          ) : (
            <NearbyUsersList
              users={nearbyUsers}
              onConnect={handleConnect}
              connectingId={connectingId}
            />
          )}
        </div>
      )}

      {showProfile && selectedUser && (
        <ProfilePreview
          user={selectedUser}
          onClose={handleCloseProfile}
          onConnect={handleProfileConnect}
          connecting={connectingId === selectedUser.id}
        />
      )}
    </div>
  );
};

export default ScanPage;