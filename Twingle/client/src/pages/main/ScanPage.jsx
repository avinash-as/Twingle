import { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MapPin, Users, RefreshCw, Sparkles, Search, Wifi, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useScanner } from '../../hooks/useScanner';
import { useConnections } from '../../hooks/useConnections';
import RadarScanner from '../../components/scanner/RadarScanner';
import NearbyUsersList from '../../components/scanner/NearbyUsersList';
import ProfilePreview from '../../components/profile/ProfilePreview';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Header from '../../components/common/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ScanPage = () => {
  const { user, updateUser } = useAuth();
  const { location, error: locationError, loading: locationLoading, getCurrentLocation } = useGeolocation();
  const { scanning, nearbyUsers, scanCount, startScan, stopScan } = useScanner();
  const { pendingRequests, sendConnectionRequest } = useConnections();
  const navigate = useNavigate();

  const [selectedUser, setSelectedUser] = useState(null);
  const [connectingId, setConnectingId] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showResults, setShowResults] = useState(false);

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
      await startScan(location);
      setTimeout(() => setShowResults(true), 300);
    }
  }, [location, getCurrentLocation, startScan]);

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

  useEffect(() => {
    if (user?.isDiscoverable !== false) {
      updateUser({ isDiscoverable: true });
    }
  }, [user, updateUser]);

  if (locationError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center bg-background">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center animate-float">
          <MapPin className="w-12 h-12 text-red-500 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-dark-900 dark:text-dark-100 mb-2">Location Access Needed</h2>
        <p className="text-dark-500 dark:text-dark-400 mb-8 max-w-xs">
          Twingle needs your location to find people nearby. Please enable location access in your browser settings.
        </p>
        <Button variant="primary" onClick={getCurrentLocation} size="lg" loading={locationLoading}>
          <RefreshCw className="w-5 h-5 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      <Header title="Twingle" showBack={false} />
      
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 space-y-10 bg-grid">
        {/* App Title */}
        <div className="text-center w-full max-w-md animate-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-4 animate-in animate-in-delayed">
            <Search className="w-4 h-4" />
            Nearby Discovery
          </div>
          <h1 className="text-5xl font-extrabold text-dark-900 dark:text-dark-100 tracking-tight gradient-text mb-3">
            Twingle
          </h1>
          <p className="text-lg text-dark-500 dark:text-dark-400">
            Find people nearby instantly
          </p>
        </div>

        {/* Scanner */}
        <div className="w-full max-w-md animate-in animate-in-delayed">
          <RadarScanner
            scanning={scanning}
            nearbyUsers={nearbyUsers}
            scanCount={scanCount}
          />
        </div>

        {/* Scan Button */}
        <div className="w-full max-w-md animate-in">
          <Button
            variant="primary"
            className="w-full"
            size="xl"
            onClick={handleScan}
            disabled={scanning || locationLoading}
            loading={locationLoading}
          >
            {scanning ? (
              <>
                <span className="flex items-center gap-2">
                  <Search className="w-6 h-6 animate-spin" />
                  Scanning...
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                SCAN
              </>
            )}
          </Button>
          
          <p className="text-center text-sm text-dark-500 dark:text-dark-400 mt-4">
            Tap to discover nearby users
          </p>
        </div>

        {/* Pending requests badge */}
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
      </div>

      {/* Results */}
      {nearbyUsers.length > 0 && !scanning && showResults && (
        <div className="px-4 pb-10 animate-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-dark-900 dark:text-dark-100 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-500" />
              Nearby <span className="text-primary-600 dark:text-primary-400">({scanCount})</span>
            </h2>
            <Button variant="outline" size="sm" onClick={handleScan}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Rescan
            </Button>
          </div>
          <NearbyUsersList
            users={nearbyUsers}
            onConnect={handleConnect}
            connectingId={connectingId}
          />
        </div>
      )}

      {/* Profile Preview Modal */}
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