/**
 * Utility function to combine class names
 */
export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format time in seconds to a human-readable string
 */
export function formatTime(seconds?: number): string {
  if (seconds === undefined || seconds === null) return '—';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.round(seconds / 60);
  return `${mins} min${mins !== 1 ? 's' : ''}`;
}

/**
 * Derive initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}
