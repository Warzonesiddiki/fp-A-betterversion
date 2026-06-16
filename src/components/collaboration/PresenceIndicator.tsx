// =============================================================================
// Presence Indicator Component
// Shows avatars of users currently viewing/editing a resource
// =============================================================================

import { useState } from 'react';

import { useResourcePresence, usePresenceEvents } from '@/hooks/usePresence';
import { LiveRegion } from '@/components/ui/LiveRegion';
import type { UserPresence, PresenceChange } from '@/services/RealtimeCollaborationManager';

interface PresenceIndicatorProps {
  /** The resource type being viewed (e.g., 'budget', 'forecast') */
  resourceType: string;
  /** The resource ID being viewed */
  resourceId: string | null;
  /** Max avatars to show before "+N" (default: 5) */
  maxVisible?: number;
  /** Size of avatar circles in px (default: 28) */
  size?: number;
  /** Optional className for the container */
  className?: string;
}

/**
 * Displays a row of avatar circles showing who is currently viewing a resource.
 * Overlapping circles with color borders and initials.
 */
export function PresenceIndicator({
  resourceType,
  resourceId,
  maxVisible = 5,
  size = 28,
  className = '',
}: PresenceIndicatorProps) {
  const viewers = useResourcePresence(resourceType, resourceId);
  // Hermes H3 MEDIUM #3: announce presence changes via LiveRegion (aria-live)
  const [announcement, setAnnouncement] = useState<string>('');
  usePresenceEvents((change: PresenceChange) => {
    if (
      change.user.activeResourceType === resourceType &&
      change.user.activeResourceId === resourceId
    ) {
      const verb =
        change.type === 'join' ? 'joined' : change.type === 'leave' ? 'left' : 'updated status';
      setAnnouncement(
        `${change.user.userName} ${verb} ${change.user.activeResourceType ?? resourceType}`
      );
    }
  });

  if (viewers.length === 0) return null;

  const visible = viewers.slice(0, maxVisible);
  const overflow = viewers.length - maxVisible;

  return (
    <div
      className={`flex items-center ${className}`}
      role="status"
      aria-label={`${viewers.length} user${viewers.length > 1 ? 's' : ''} viewing this resource`}
      aria-live="polite"
    >
      <LiveRegion message={announcement} politeness="polite" />
      <div className="flex -space-x-2">
        {visible.map((user) => (
          <AvatarBubble key={user.userId} user={user} size={size} />
        ))}
        {overflow > 0 && (
          <div
            className="flex items-center justify-center rounded-full bg-[var(--bg-elevated)] text-xs font-medium text-[var(--text-secondary)] border-2 border-[var(--bg-root)]"
            style={{ width: size, height: size, fontSize: size * 0.36 }}
            title={`${overflow} more user${overflow > 1 ? 's' : ''}`}
          >
            +{overflow}
          </div>
        )}
      </div>
    </div>
  );
}

interface AvatarBubbleProps {
  user: UserPresence;
  size: number;
}

function AvatarBubble({ user, size }: AvatarBubbleProps) {
  const borderColor = user.status === 'idle' ? 'border-yellow-400' : 'border-green-400';

  return (
    <div
      className={`relative flex items-center justify-center rounded-full border-2 ${borderColor} bg-[var(--bg-elevated)]`}
      style={{ width: size, height: size }}
      title={`${user.userName} — ${user.status}`}
    >
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.userName}
          className="rounded-full object-cover"
          style={{ width: size - 4, height: size - 4 }}
        />
      ) : (
        <span
          className="font-semibold text-[var(--text-primary)]"
          style={{ fontSize: size * 0.36 }}
        >
          {user.userInitials}
        </span>
      )}
      <span
        className={`absolute bottom-0 right-0 rounded-full border border-[var(--bg-elevated)] ${
          user.status === 'online'
            ? 'bg-green-500'
            : user.status === 'idle'
              ? 'bg-yellow-500'
              : 'bg-gray-400'
        }`}
        style={{ width: size * 0.28, height: size * 0.28 }}
      />
    </div>
  );
}

/**
 * Compact version: shows just the count and a single "active" indicator dot.
 */
export function PresenceCount({
  resourceType,
  resourceId,
  className = '',
}: {
  resourceType: string;
  resourceId: string | null;
  className?: string;
}) {
  const viewers = useResourcePresence(resourceType, resourceId);

  if (viewers.length === 0) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs text-[var(--text-muted)] ${className}`}
      role="status"
      aria-label={`${viewers.length} user${viewers.length > 1 ? 's' : ''} viewing`}
    >
      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
      {viewers.length} active
    </span>
  );
}

/**
 * Cell-level lock indicator. Shows when another user is editing a specific cell.
 */
export function CellLockIndicator({
  cellId: _cellId,
  className: _className,
}: {
  cellId: string;
  className?: string;
}) {
  // We need the raw hook here for cell-level granularity
  return null; // Placeholder — implemented in usePresence hook integration
}

/**
 * Cell overlay that shows another user's avatar and a colored border
 * when they are editing a cell.
 */
export function CellPresenceOverlay({
  resourceType,
  resourceId,
  cellId,
}: {
  resourceType: string;
  resourceId: string;
  cellId: string;
}) {
  const viewers = useResourcePresence(resourceType, resourceId);
  const cellEditors = viewers.filter((u) => u.activeCellId === cellId);

  if (cellEditors.length === 0) return null;

  const editor = cellEditors[0]!;
  const color = editor!.cursorColor;

  return (
    <div
      className="absolute inset-0 pointer-events-none rounded"
      style={{ border: `2px solid ${color}`, zIndex: 10 }}
      aria-hidden="true"
    >
      <span
        className="absolute -top-5 left-0 text-[10px] px-1 py-0.5 rounded text-white"
        style={{ backgroundColor: color }}
        aria-live="polite"
        aria-label={`${editor.userName} is editing this cell`}
      >
        {editor.userInitials}
      </span>
    </div>
  );
}
