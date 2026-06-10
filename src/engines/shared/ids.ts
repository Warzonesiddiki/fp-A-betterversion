export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function generateTimestampedId(prefix: string = 'ts'): string {
  return `${prefix}-${Date.now()}`;
}

export function generateSequentialId(prefix: string, counter: number): string {
  return `${prefix}-${counter.toString().padStart(6, '0')}`;
}

export function parseId(id: string): { prefix: string; timestamp: number; random: string } | null {
  const parts = id.split('-');
  if (parts.length < 3) return null;
  const timestamp = parseInt(parts[1]!, 10);
  if (isNaN(timestamp)) return null;
  return { prefix: parts[0]!, timestamp, random: parts[2]! };
}
