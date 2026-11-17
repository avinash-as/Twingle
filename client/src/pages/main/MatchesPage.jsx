import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, UserX } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function MatchesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/connected');
      setMatches(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('matches fetch failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handleUnmatch = async (userId) => {
    if (!window.confirm('Unmatch this user?')) return;
    try {
      await api.post('/users/block', { userId });
      setMatches((prev) => prev.filter((m) => m.id !== userId));
    } catch (e) {
      console.error('unmatch failed', e);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0B0B12]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!matches.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0B0B12] px-6 text-center">
        <div className="w-24 h-24 rounded-full bg-primary-500/10 flex items-center justify-center mb-6">
          <HeartIcon />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No matches yet</h2>
        <p className="text-neutral-500 mb-6">Start discovering to find your matches.</p>
        <Button variant="primary" onClick={() => navigate('/discover')}>
          Discover People
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0B0B12]">
      <div className="px-4 py-3">
        <h1 className="text-xl font-bold text-white">Matches</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-3">
        {matches.map((m) => (
          <Card key={m.id} className="p-4 flex items-center gap-4">
            <Avatar src={m.avatar} name={m.name} size="lg" status={m.isOnline ? 'online' : 'offline'} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white truncate">{m.name}</h3>
                {m.isOnline && <Badge variant="success" size="sm" dot pulse>Online</Badge>}
              </div>
              <p className="text-xs text-neutral-500">
                {m.lastSeen ? `Last seen ${new Date(m.lastSeen).toLocaleDateString()}` : 'Matched'}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="primary" size="sm" onClick={() => navigate(`/chat/${m.id}`)}>
                <MessageSquare className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleUnmatch(m.id)}>
                <UserX className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function HeartIcon() {
  return <svg className="w-12 h-12 text-primary-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>;
}
