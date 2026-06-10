export interface Serializable {
  serialize(): string;
  deserialize(data: string): void | boolean;
}

export function serializeMap<K, V>(map: Map<K, V>): [K, V][] {
  return Array.from(map.entries());
}

export function deserializeMap<K, V>(entries: [K, V][]): Map<K, V> {
  return new Map(entries);
}

export function serializeSet<T>(set: Set<T>): T[] {
  return Array.from(set);
}

export function deserializeSet<T>(array: T[]): Set<T> {
  return new Set(array);
}

export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

export function safeJsonStringify<T>(value: T, fallback: string = '{}'): string {
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}
