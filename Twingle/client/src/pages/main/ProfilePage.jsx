import { useState, useEffect } from 'react';
import { Camera, User, Edit2, LogOut, Moon, Sun, Bell, Shield, Globe, MapPin, ToggleLeft, ToggleRight, Check, QrCode, Share2, Heart, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import Header from '../../components/common/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/ui/Badge';

const ProfilePage = () => {
  const { user, updateUser, logout } = useAuth();
  const { emit, isConnected } = useSocket();
  
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
  });
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showQrCode, setShowQrCode] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({ name: user.name || '', bio: user.bio || '' });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        const data = await response.json();
        updateUser(data);
        setEditMode(false);
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDiscoverableToggle = async () => {
    const newValue = !user?.isDiscoverable;
    emit('set_discoverable', newValue);
    updateUser({ isDiscoverable: newValue });
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleShareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: `${user?.name}'s Twingle Profile`,
        text: `Connect with me on Twingle!`,
        url: window.location.origin,
      });
    } else {
      navigator.clipboard.writeText(window.location.origin);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      <Header 
        title="Profile" 
        showBack={false}
        actions={
          <>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleShareProfile}
              className="hidden sm:flex"
            >
              <Share2 className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowQrCode(!showQrCode)}
              className="hidden sm:flex"
            >
              <QrCode className="w-5 h-5" />
            </Button>
          </>
        }
      />
      
      <div className="flex-1 overflow-auto">
        {/* Background accent */}
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-br from-primary-500/10 via-transparent to-transparent dark:from-primary-500/5" />
        
        <div className="relative px-4 py-6 space-y-6">
          {/* Profile Header Card */}
          <Card className="card-elevated overflow-hidden animate-in">
            <CardContent className="p-0">
              <div className="relative">
                {/* Cover */}
                <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-600" />
                
                <div className="p-6 pt-20 pb-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                      <Avatar
                        src={avatarPreview || user?.avatar}
                        name={user?.name}
                        size="4xl"
                        className="ring-4 ring-white dark:ring-dark-900 shadow-2xl"
                      />
                      {editMode && (
                        <label className="absolute bottom-2 right-2 p-3 bg-primary-600 text-white rounded-full shadow-lg cursor-pointer hover:bg-primary-700 transition-all hover:scale-105">
                          <Camera className="w-5 h-5" />
                          <input type="file" accept="image/*" onChange={handleAvatarChange} className="sr-only" />
                        </label>
                      )}
                    </div>
                    
                    <div>
                      {editMode ? (
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Your name"
                          className="w-72 text-center text-2xl font-bold bg-transparent border-none focus:ring-0 px-0"
                          maxLength={50}
                        />
                      ) : (
                        <h2 className="text-3xl font-extrabold text-dark-900 dark:text-dark-100">{user?.name}</h2>
                      )}
                      
                      {user?.email && !editMode && (
                        <p className="text-dark-500 dark:text-dark-400 mt-1">{user.email}</p>
                      )}
                    </div>

                    {user?.bio && !editMode && (
                      <p className="text-dark-600 dark:text-dark-400 max-w-md leading-relaxed">{user.bio}</p>
                    )}

                    {editMode && (
                      <Input
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Tell others about yourself..."
                        className="w-full max-w-md text-center"
                        maxLength={200}
                        multiline
                        rows={2}
                      />
                    )}

                    <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                      <Badge variant={user?.isOnline ? 'success' : 'gray'} className="gap-1.5 text-sm px-3 py-1.5">
                        {user?.isOnline ? (
                          <>
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Online Now
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-dark-400" />
                            Offline
                          </>
                        )}
                      </Badge>
                      
                      <Badge variant={user?.isDiscoverable ? 'info' : 'warning'} className="gap-1.5 text-sm px-3 py-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {user?.isDiscoverable ? 'Discoverable' : 'Hidden'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 animate-in animate-in-delayed">
            <Card className="p-4 text-center card-elevated">
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">0</div>
              <div className="text-xs text-dark-500 dark:text-dark-400 mt-1">Connections</div>
            </Card>
            <Card className="p-4 text-center card-elevated">
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">0</div>
              <div className="text-xs text-dark-500 dark:text-dark-400 mt-1">Messages</div>
            </Card>
            <Card className="p-4 text-center card-elevated">
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {user?.isDiscoverable ? 'On' : 'Off'}
              </div>
              <div className="text-xs text-dark-500 dark:text-dark-400 mt-1">Visibility</div>
            </Card>
          </div>

          {/* Edit Profile */}
          <Card className="card-elevated animate-in">
            <CardHeader className="flex flex-row items-center justify-between border-b border-dark-200 dark:border-dark-700 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <Edit2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-dark-900 dark:text-dark-100">Profile Information</h3>
                  <p className="text-xs text-dark-500 dark:text-dark-400">Manage your public profile</p>
                </div>
              </div>
              <Button
                variant={editMode ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => editMode ? handleSave() : setEditMode(true)}
                loading={saving}
              >
                {editMode ? (saving ? 'Saving...' : 'Save') : 'Edit Profile'}
              </Button>
            </CardHeader>
            <CardContent className="px-6 py-4 space-y-5">
              <Input
                label="Display Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!editMode}
                placeholder="Your name"
                icon={<User className="w-5 h-5" />}
              />
              <Input
                label="Bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!editMode}
                placeholder="Tell others about yourself"
                multiline
                rows={3}
                icon={<Sparkles className="w-5 h-5" />}
              />
              <div className="flex items-center justify-between pt-2 border-t border-dark-200 dark:border-dark-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="font-medium text-dark-900 dark:text-dark-100">Discoverable</p>
                    <p className="text-sm text-dark-500 dark:text-dark-400">Appear in nearby searches</p>
                  </div>
                </div>
                <button
                  onClick={handleDiscoverableToggle}
                  disabled={editMode}
                  className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                    user?.isDiscoverable
                      ? 'bg-primary-600 shadow-lg shadow-primary-500/30'
                      : 'bg-dark-300 dark:bg-dark-600'
                  }`}
                  aria-label={user?.isDiscoverable ? 'Disable discoverability' : 'Enable discoverability'}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-7 h-7 rounded-full bg-white shadow-md transition-transform duration-300 ${
                      user?.isDiscoverable ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  >
                    {user?.isDiscoverable ? <Check className="w-5 h-5 text-primary-600" /> : <ToggleLeft className="w-5 h-5 text-dark-400" />}
                  </span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="card-elevated animate-in">
            <CardHeader className="border-b border-dark-200 dark:border-dark-700 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-dark-100 dark:bg-dark-800 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-dark-600 dark:text-dark-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-dark-900 dark:text-dark-100">Settings</h3>
                  <p className="text-xs text-dark-500 dark:text-dark-400">Preferences & privacy</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 py-4 space-y-4">
              {/* Dark Mode */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                    <Sun className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-dark-900 dark:text-dark-100">Dark Mode</p>
                    <p className="text-sm text-dark-500 dark:text-dark-400">Toggle dark/light theme</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    document.documentElement.classList.toggle('dark');
                    localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
                  }}
                  className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                    document.documentElement.classList.contains('dark')
                      ? 'bg-primary-600 shadow-lg shadow-primary-500/30'
                      : 'bg-dark-300 dark:bg-dark-600'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-7 h-7 rounded-full bg-white shadow-md transition-transform duration-300 ${
                    document.documentElement.classList.contains('dark') ? 'translate-x-6' : 'translate-x-0'
                  }`}>
                    {document.documentElement.classList.contains('dark') ? <Moon className="w-5 h-5 text-primary-600" /> : <Sun className="w-5 h-5 text-yellow-500" />}
                  </span>
                </button>
              </div>

              <div className="border-t border-dark-200 dark:border-dark-700" />

              {/* Notifications */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-dark-900 dark:text-dark-100">Notifications</p>
                    <p className="text-sm text-dark-500 dark:text-dark-400">Push notifications & alerts</p>
                  </div>
                </div>
                <Badge variant="gray" className="text-xs">Coming soon</Badge>
              </div>

              <div className="border-t border-dark-200 dark:border-dark-700" />

              {/* Privacy */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-dark-900 dark:text-dark-100">Privacy & Safety</p>
                    <p className="text-sm text-dark-500 dark:text-dark-400">Manage your data & privacy</p>
                  </div>
                </div>
                <Badge variant="gray" className="text-xs">Coming soon</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Connection Status */}
          <Card className="card-elevated animate-in">
            <CardHeader className="border-b border-dark-200 dark:border-dark-700 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-dark-900 dark:text-dark-100">Connection Status</h3>
                  <p className="text-xs text-dark-500 dark:text-dark-400">Real-time connectivity</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 py-4 space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isConnected ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    {isConnected ? (
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <WifiOff className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-dark-900 dark:text-dark-100">Socket Connection</p>
                    <p className="text-sm text-dark-500 dark:text-dark-400">
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </p>
                  </div>
                </div>
                <Badge variant={isConnected ? 'success' : 'danger'}>
                  {isConnected ? 'Live' : 'Offline'}
                </Badge>
              </div>

              <div className="border-t border-dark-200 dark:border-dark-700" />

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-dark-100 dark:bg-dark-800 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-dark-600 dark:text-dark-400" />
                  </div>
                  <div>
                    <p className="font-medium text-dark-900 dark:text-dark-100">App Version</p>
                    <p className="text-sm text-dark-500 dark:text-dark-400">1.0.0 (MVP)</p>
                  </div>
                </div>
                <Badge variant="info" className="text-xs">Latest</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="card-elevated border-red-200 dark:border-red-900/30 animate-in">
            <CardHeader className="border-b border-dark-200 dark:border-dark-700 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-dark-900 dark:text-dark-100">Danger Zone</h3>
                  <p className="text-xs text-dark-500 dark:text-dark-400">Irreversible actions</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 py-4">
              <Button 
                variant="danger" 
                className="w-full" 
                onClick={handleLogout} 
                size="lg"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowQrCode(false)}>
          <div className="bg-white dark:bg-dark-900 rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-dark-900 dark:text-dark-100">My QR Code</h3>
              <button onClick={() => setShowQrCode(false)} className="p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-800">
                <X className="w-5 h-5 text-dark-500" />
              </button>
            </div>
            <div className="text-center space-y-4">
              <div className="w-48 h-48 mx-auto bg-white dark:bg-dark-800 rounded-xl p-4 flex items-center justify-center">
                <div className="text-center">
                  <QrCode className="w-16 h-16 mx-auto mb-2 text-primary-600 dark:text-primary-400" />
                  <p className="text-xs text-dark-500">QR Code placeholder</p>
                </div>
              </div>
              <p className="text-sm text-dark-600 dark:text-dark-400">Scan to share your profile</p>
              <Button variant="secondary" className="w-full" onClick={() => setShowQrCode(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;