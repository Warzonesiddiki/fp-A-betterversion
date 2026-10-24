import { cn } from '@/utils/cn';

interface CommentIndicatorProps {
  count: number;
  hasUnresolved?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Small triangle indicator in the top-right corner of a grid cell
 * to show that comments exist. Renders as a colored triangle with
 * an optional count badge on hover.
 */
export function CommentIndicator({
  count,
  hasUnresolved = false,
  onClick,
  className,
}: CommentIndicatorProps) {
  if (count === 0) return null;

  const color = hasUnresolved ? 'var(--accent-primary)' : 'var(--color-success)';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cn(
        'group absolute right-0 top-0 z-10',
        'flex h-0 w-0 cursor-pointer items-center justify-center',
        className
      )}
      title={`${count} comment${count !== 1 ? 's' : ''}${hasUnresolved ? ' (unresolved)' : ''}`}
      aria-label={`${count} comment${count !== 1 ? 's' : ''} on this cell`}
    >
      {/* Triangle via CSS borders */}
      <span
        className="absolute right-0 top-0 h-0 w-0"
        style={{
          borderStyle: 'solid',
          borderWidth: '0 20px 20px 0',
          borderColor: `transparent ${color} transparent transparent`,
        }}
      />
      {/* Count on hover */}
      <span
        className={cn(
          'absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center',
          'rounded-full text-[10px] font-bold text-white',
          'opacity-0 transition-opacity group-hover:opacity-100'
        )}
        style={{ backgroundColor: color }}
      >
        {count > 9 ? '9+' : count}
      </span>
    </button>
  );
}
