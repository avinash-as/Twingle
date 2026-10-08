import { MapPin, Users, MessageSquare, Sparkles } from 'lucide-react';

export default function EmptyState({ icon: Icon = MapPin, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center animate-in">
      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-900/10 flex items-center justify-center animate-float">
        <Icon className="w-12 h-12 text-primary-500 dark:text-primary-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-neutral-500 mb-8 max-w-xs leading-relaxed">{description}</p>
      {action && (
        <div className="flex items-center justify-center gap-2 text-sm text-primary-400">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>{action}</span>
        </div>
      )}
    </div>
  );
}