import { useState, useEffect } from 'react';
import { Camera, MapPin, Calendar, Bell, Shield, Moon, LogOut, Edit, QrCode, Share2, X, Wifi, Clock, Bell as BellIcon, CheckCircle, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useBackgroundLocation } from '../../hooks/useBackgroundLocation';
import api from '../../utils/api';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export default function ProfilePage() {
  const { user, updateUser, logout, isAuthenticated } = useAuth();
  const { isTracking: bgTracking, error: bgError, startTracking: startBgTracking, stopTracking: stopBgTracking, isSupported: bgSupported } = useBackgroundLocation();
  const { isSubscribed: pushSubscribed, isLoading: pushLoading, error: pushError, subscribe: subscribePush, unsubscribe: unsubscribePush, sendTest: sendTestPush, isSupported: pushSupported } = usePushNotifications();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    isDiscoverable: true,
    gender: '',
    age: '',
    interests: [],
    genderPreference: 'any',
    agePreferenceMin: '18',
    agePreferenceMax: '120',
  });
  const [saving, setSaving] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [locationPrivacy, setLocationPrivacy] = useState({ locationSharing: false, audience: 'friends', nearbyDiscovery: false, ghostMode: false });

  const availableInterests = ['Music', 'Sports', 'Travel', 'Food', 'Movies', 'Books', 'Gaming', 'Fitness', 'Art', 'Cooking'];

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        isDiscoverable: user.isDiscoverable !== false,
        gender: user.gender || '',
        age: user.age || '',
        interests: user.interests || [],
        genderPreference: user.genderPreference || 'any',
        agePreferenceMin: user.agePreferenceMin || '18',
        agePreferenceMax: user.agePreferenceMax || '120',
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchPrivacy = async () => {
      try {
        const res = await api.get('/users/location/privacy');
        setLocationPrivacy(res.data);
      } catch (e) {
        console.error('privacy fetch failed', e);
      }
    };
    if (user) fetchPrivacy();
  }, [user]);
  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUser(formData);
      setEditing(false);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0B0B12]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0B0B12]">
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500" />
        <div className="absolute bottom-0 left-0 right-0 -translate-y-1/2 px-4">
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <Avatar src={user?.avatar} name={user?.name} size="2xl" status={user?.isOnline ? 'online' : 'offline'} />
              {user?.isVerified && (
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full border-2 border-[#0B0B12] flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
              {user?.isOnline && (
                <Badge variant="success" size="sm" dot pulse>
                  Online
                </Badge>
              )}
              {user?.isVerified && (
                <Badge variant="primary" size="sm" className="gap-1">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
              {user?.verificationBadge && user?.verificationBadge !== 'none' && (
                <Badge variant="secondary" size="sm" className="gap-1">
                  {user.verificationBadge.charAt(0).toUpperCase() + user.verificationBadge.slice(1)} Verified
                </Badge>
              )}
            </div>
            <p className="text-neutral-400 mt-1">Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-8 space-y-6">
        {editing ? (
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Edit Profile
              </h3>
              <Input
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
                maxLength={50}
                required
              />
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-2">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell people about yourself..."
                  maxLength={200}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-neutral-900/50 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
                />
                <p className="text-xs text-neutral-500 mt-1 text-right">{formData.bio.length}/200</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-neutral-500" />
                  <div>
                    <p className="font-medium text-white">Discoverable</p>
                    <p className="text-xs text-neutral-500">Allow others to find you nearby</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDiscoverable}
                    onChange={(e) => setFormData({ ...formData, isDiscoverable: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
              <div className="space-y-4 mt-4 pt-4 border-t border-neutral-800">
                <h4 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">Discovery Settings</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500"
                    >
                      <option value="">Not specified</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Age</label>
                    <input
                      type="number"
                      value={formData.age || ''}
                      onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || '' })}
                      placeholder="Age"
                      className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500"
                      min={18} max={120}
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Interests</label>
                  <div className="flex flex-wrap gap-2">
                    {availableInterests.map(interest => (
                      <button
                        key={interest}
                        onClick={() => {
                          const isSelected = formData.interests.includes(interest);
                          setFormData({
                            ...formData,
                            interests: isSelected
                              ? formData.interests.filter(i => i !== interest)
                              : [...formData.interests, interest],
                          });
                        }}
                        className={`px-3 py-2 rounded-lg text-xs transition-all ${formData.interests.includes(interest) ? 'bg-primary-500 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Age Preference Min</label>
                    <input
                      type="number"
                      value={formData.agePreferenceMin || 18}
                      onChange={(e) => setFormData({ ...formData, agePreferenceMin: parseInt(e.target.value) || 18 })}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500"
                      min={18} max={120}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Age Preference Max</label>
                    <input
                      type="number"
                      value={formData.agePreferenceMax || 120}
                      onChange={(e) => setFormData({ ...formData, agePreferenceMax: parseInt(e.target.value) || 120 })}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500"
                      min={18} max={120}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Gender Preference</label>
                  <select
                    value={formData.genderPreference}
                    onChange={(e) => setFormData({ ...formData, genderPreference: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500"
                  >
                    <option value="any">Anyone</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setEditing(false)} fullWidth>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" loading={saving} fullWidth>
                  Save Changes
                </Button>
              </div>
            </Card>
          </form>
        ) : (
          <>
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  About
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
              {user?.bio ? (
                <p className="text-neutral-300">{user.bio}</p>
              ) : (
                <p className="text-neutral-500 italic">No bio yet. Tap edit to add one.</p>
              )}
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Photos
              </h3>
              <div className="flex flex-wrap gap-2">
                {user?.photos && user.photos.length > 0 ? (
                  user.photos.map((photo, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={photo}
                        alt={`Photo ${idx + 1}`}
                        className="w-24 h-24 rounded-xl object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 text-white" />
                          <span className="text-xs text-white font-medium">Replace</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed border-neutral-700 bg-neutral-900/50 text-neutral-400">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <p className="text-xs">No photos yet</p>
                  </div>
                )}
              </div>
              <div className="pt-2">
                <p className="text-xs text-neutral-500">
                  Add up to 6 photos to your profile
                </p>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Preferences
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-neutral-500" />
                  <div>
                    <p className="font-medium text-white">Discoverable</p>
                    <p className="text-xs text-neutral-500">Allow others to find you nearby</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={user?.isDiscoverable !== false}
                    onChange={(e) => setFormData({ ...formData, isDiscoverable: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-neutral-500" />
                  <div>
                    <p className="font-medium text-white">Dark Mode</p>
                    <p className="text-xs text-neutral-500">Use dark theme</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={true}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Share Profile
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => setShowQR(true)}>
                  <QrCode className="w-5 h-5 mr-2" />
                  Show QR Code
                </Button>
                <Button variant="outline">
                  <Share2 className="w-5 h-5 mr-2" />
                  Share Link
                </Button>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Wifi className="w-5 h-5" />
                Background Discovery
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 p-3 rounded-xl ${bgTracking ? 'bg-green-500/20 text-green-400' : 'bg-neutral-700/50 text-neutral-400'}`}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Background Discovery</p>
                    <p className="text-xs text-neutral-500">
                      {bgTracking ? 'Discoverable even when app is closed' : 'Only discoverable when app is open'}
                    </p>
                  </div>
                </div>
                {bgError && (
                  <span className="text-sm text-red-400">{bgError}</span>
                )}
                {!bgSupported && (
                  <span className="text-sm text-red-400">Not supported in this browser</span>
                )}
                {bgSupported && (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bgTracking}
                      onChange={async (e) => {
                        if (e.target.checked) {
                          await startBgTracking();
                        } else {
                          stopBgTracking();
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                )}
              </div>
              {!bgTracking && bgSupported && (
                <p className="text-xs text-neutral-500 mt-2">
                  Enable to be discovered by nearby users even when Twingle is not open.
                </p>
              )}
              {bgTracking && (
                <p className="text-xs text-green-400 mt-2">
                  Background tracking is active. Your location will be shared periodically.
                </p>
              )}
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <BellIcon className="w-5 h-5" />
                Push Notifications
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 p-3 rounded-xl ${pushSubscribed ? 'bg-purple-500/20 text-purple-400' : 'bg-neutral-700/50 text-neutral-400'}`}>
                    <BellIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Push Notifications</p>
                    <p className="text-xs text-neutral-500">
                      {pushSubscribed ? 'Receive notifications even when app is closed' : 'Enable to get notified about new messages and connection requests'}
                    </p>
                  </div>
                </div>
                {pushError && (
                  <span className="text-sm text-red-400">{pushError}</span>
                )}
                {!pushSupported && (
                  <span className="text-sm text-red-400">Not supported in this browser</span>
                )}
                {pushSupported && (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pushSubscribed}
                      onChange={async (e) => {
                        if (e.target.checked) {
                          await subscribePush();
                        } else {
                          await unsubscribePush();
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                )}
              </div>
              {!pushSubscribed && pushSupported && (
                <p className="text-xs text-neutral-500 mt-2">
                  Get notified about new connection requests and messages even when Twingle is not open.
                </p>
              )}
              {pushSubscribed && pushSupported && (
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" onClick={sendTestPush} loading={pushLoading}>
                    Test Notification
                  </Button>
                </div>
              )}
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Location Privacy
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Location Sharing</p>
                  <p className="text-xs text-neutral-500">Share your approximate location on the map</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={locationPrivacy.locationSharing}
                    onChange={async (e) => {
                      const enabled = e.target.checked;
                      await api.put('/users/location/sharing', { enabled, audience: enabled ? (locationPrivacy.audience || 'friends') : 'nobody' });
                      setLocationPrivacy((p) => ({ ...p, locationSharing: enabled }));
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Nearby Discovery</p>
                  <p className="text-xs text-neutral-500">Allow others to find you nearby</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={locationPrivacy.nearbyDiscovery}
                    onChange={async (e) => {
                      const enabled = e.target.checked;
                      await api.put('/users/nearby-discovery', { enabled });
                      setLocationPrivacy((p) => ({ ...p, nearbyDiscovery: enabled }));
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Ghost Mode</p>
                  <p className="text-xs text-neutral-500">Hide your location from everyone</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={locationPrivacy.ghostMode}
                    onChange={async (e) => {
                      const enabled = e.target.checked;
                      await api.put('/users/ghost-mode', { enabled });
                      setLocationPrivacy((p) => ({ ...p, ghostMode: enabled, locationSharing: enabled ? false : p.locationSharing, nearbyDiscovery: enabled ? false : p.nearbyDiscovery }));
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
            </Card>

            <Button variant="danger" onClick={handleLogout} fullWidth className="mt-4">
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Button>
          </>
        )}
      </div>

      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in" onClick={() => setShowQR(false)}>
          <Card className="w-full max-w-sm p-8 text-center animate-in" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <Avatar src={user?.avatar} name={user?.name} size="2xl" />
            <h3 className="text-xl font-bold text-white mt-4">{user?.name}</h3>
            <p className="text-neutral-500 mb-6">Scan to add me on Twingle</p>
            <div className="w-48 h-48 mx-auto bg-neutral-200 rounded-xl p-4">
              <div className="w-full h-full bg-neutral-200 rounded-lg flex items-center justify-center">
                <span className="text-neutral-500 text-sm">QR Code Placeholder</span>
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-4">QR code generation would be implemented here</p>
          </Card>
        </div>
      )}
    </div>
  );
}