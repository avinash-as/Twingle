import { useState, useEffect } from 'react';
import { Camera, MapPin, Calendar, Bell, Shield, Moon, LogOut, Edit, QrCode, Share2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function ProfilePage() {
  const { user, updateUser, logout, isAuthenticated } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    isDiscoverable: true,
  });
  const [saving, setSaving] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        isDiscoverable: user.isDiscoverable !== false,
      });
    }
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
            <Avatar src={user?.avatar} name={user?.name} size="2xl" status={user?.isOnline ? 'online' : 'offline'} />
            <div className="mt-4 flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
              {user?.isOnline && (
                <Badge variant="success" size="sm" dot pulse>
                  Online
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
                <label className="block text-sm font-medium text-neutral-300 mb-2">Bio</label>
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
            </Card>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setEditing(false)} fullWidth>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={saving} fullWidth>
                Save Changes
              </Button>
            </div>
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

            <Button variant="danger" onClick={handleLogout} fullWidth className="mt-4">
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Button>
          </>
        )}

        {showQR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in" onClick={() => setShowQR(false)}>
            <Card className="w-full max-w-sm p-8 text-center animate-in" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <Avatar src={user?.avatar} name={user?.name} size="2xl" />
              <h3 className="text-xl font-bold text-white mt-4">{user?.name}</h3>
              <p className="text-neutral-500 mb-6">Scan to add me on Twingle</p>
              <div className="w-48 h-48 mx-auto bg-white rounded-xl p-4">
                <div className="w-full h-full bg-neutral-200 rounded-lg flex items-center justify-center">
                  <span className="text-neutral-500 text-sm">QR Code Placeholder</span>
                </div>
              </div>
              <p className="text-xs text-neutral-500 mt-4">QR code generation would be implemented here</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}