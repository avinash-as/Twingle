import { formatDistanceToNow } from 'date-fns';
import { CheckCheck, MoreVertical, MessageCircle, Reply, Edit, X } from 'lucide-react';
import { useState, useCallback } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];

const ReactionButton = ({ emoji, count, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${
      isSelected
        ? 'bg-primary-500 text-white shadow-sm'
        : 'bg-neutral-800/50 text-neutral-300 hover:bg-neutral-700 hover:text-white'
    }`}
  >
    <span>{emoji}</span>
    {count > 0 && <span className="font-medium">{count}</span>}
  </button>
);

const ReplyPreview = ({ message, onReply }) => (
  <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-neutral-800/50 border border-neutral-700/50 mb-2 cursor-pointer" onClick={() => onReply(message)}>
    <div className="flex-shrink-0 w-1 h-4 bg-primary-500 rounded-r" />
    <div className="flex-1">
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium text-primary-400">{message.sender?.name || 'User'}</span>
        <Reply className="w-3 h-3 text-primary-400" />
      </div>
      <p className="text-xs text-neutral-400 truncate">{message.content || message.mediaType}</p>
    </div>
  </div>
);

export default function MessageBubble({ message, isOwn, user, onReply }) {
  const { user: currentUser } = useAuth();
  const [reactionMenuOpen, setReactionMenuOpen] = useState(false);
  const [messageMenuOpen, setMessageMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || '');

  const isMessageSender = message.sender?._id === currentUser?._id || message.sender === currentUser?._id;

  const getReactionCount = (emoji) =>
    message.reactions?.filter((r) => r.emoji === emoji).length || 0;

  const isReacted = (emoji) =>
    message.reactions?.some(
      (r) => r.emoji === emoji && r.userId === currentUser?._id
    ) || false;

  const addReaction = useCallback(async (emoji) => {
    try {
      await api.post(`/messages/${message._id}/reaction`, { emoji });
      setReactionMenuOpen(false);
    } catch (err) {
      console.error('Reaction error:', err);
    }
  }, [message._id]);

  const editMessage = useCallback(async () => {
    try {
      const response = await api.put(`/messages/${message._id}`, {
        content: editContent,
      });
      setEditing(false);
      return response.data;
    } catch (err) {
      console.error('Edit error:', err);
      setError('Failed to edit message');
    }
  }, [message._id, editContent]);

  const deleteMessage = useCallback(async () => {
    if (!confirm('Delete this message?')) return;
    try {
      await api.delete(`/messages/${message._id}`);
      setMessageMenuOpen(false);
    } catch (err) {
      console.error('Delete error:', err);
    }
  }, [message._id]);

  const [error, setError] = useState(null);

  const isDeleted = message.isDeleted;
  const isMedia = message.messageType && message.messageType !== 'text';

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-in`}>
      <div className={`max-w-[75%] ${isOwn ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
        {!isOwn && !isDeleted && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-primary-400">{user?.name || 'User'}</span>
          </div>
        )}
        {!isDeleted && message.replyTo && (
          <ReplyPreview message={message.replyTo} onReply={onReply} />
        )}
        {!isDeleted && (
          <div
            className={`relative rounded-2xl px-4 py-2.5 ${
              isOwn
                ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-tr-md'
                : 'bg-neutral-800/50 text-white rounded-tl-md'
            }`}
          >
            {isMedia && message.mediaUrl && message.messageType === 'image' && (
              <img
                src={message.mediaUrl}
                alt="Message image"
                className="w-full max-h-48 object-cover rounded-lg mb-2"
              />
            )}
            {isMedia && message.mediaUrl && message.messageType === 'voice' && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
                <span className="text-xs text-primary-200">Voice Message</span>
              </div>
            )}
            {(!isMedia || message.messageType === 'text') && (
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            )}
            <div className={`flex items-center gap-1.5 mt-1.5 text-xs ${isOwn ? 'text-primary-100' : 'text-neutral-500'}`}>
              <span>{formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}</span>
              {isOwn && message.isRead && (
                <CheckCheck className="w-3.5 h-3.5 text-green-400" />
              )}
              {isOwn && !message.isRead && (
                <CheckCheck className="w-3.5 h-3.5" />
              )}
            </div>

            {/* Reactions */}
            {message.reactions && message.reactions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {[
                  ...new Set(message.reactions.map((r) => r.emoji)),
                ].map((emoji) => {
                  const count = getReactionCount(emoji);
                  const selected = isReacted(emoji);
                  return (
                    <ReactionButton
                      key={emoji}
                      emoji={emoji}
                      count={count}
                      isSelected={selected}
                      onClick={() => addReaction(emoji)}
                    />
                  );
                })}
              </div>
            )}

            {/* Add Reaction Button */}
            {!isOwn && !editing && (
              <button
                onClick={() => setReactionMenuOpen(!reactionMenuOpen)}
                className="mt-1.5 text-xs text-primary-400 hover:text-primary-300"
              >
                <MessageCircle className="w-3 h-3 mr-1" /> Add Reaction
              </button>
            )}

            {/* Reaction Menu */}
            {reactionMenuOpen && !isOwn && (
              <div className="absolute -top-10 left-0 flex flex-wrap gap-1 bg-neutral-800 p-2 rounded-lg border border-neutral-700 shadow-xl z-10">
                {EMOJI_REACTIONS.map((emoji) => (
                  <ReactionButton
                    key={emoji}
                    emoji={emoji}
                    count={getReactionCount(emoji)}
                    isSelected={isReacted(emoji)}
                    onClick={() => addReaction(emoji)}
                  />
                ))}
              </div>
            )}

            {/* Edit Message */}
            {editing && (
              <div className="mt-2">
                <input
                  type="text"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-primary-500 text-sm"
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={editMessage}
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {isDeleted && (
          <div className="text-xs text-neutral-500 italic mt-1">
            This message was deleted
          </div>
        )}

        {/* Message Actions Menu */}
        {isOwn && !isDeleted && !editing && (
          <div className="relative">
            <button
              onClick={() => setMessageMenuOpen(!messageMenuOpen)}
              className="ml-2 p-1 text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {messageMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-neutral-900 rounded-lg border border-neutral-700 shadow-xl z-10">
                <button
                  onClick={() => {
                    setEditing(true);
                    setMessageMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
                >
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </button>
                <button
                  onClick={deleteMessage}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
                >
                  <X className="w-4 h-4 mr-2" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}