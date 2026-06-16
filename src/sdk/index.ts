/**
 * FpaClient SDK — barrel export.
 *
 * Public surface of the SDK. Anything not exported from here is internal
 * and may change without notice.
 *
 * @module sdk
 */

// ─── Main client ─────────────────────────────────────────────────────────────
export { FpaClient } from './FpaClient';

// ─── Connector namespaces ────────────────────────────────────────────────────
export { QboNamespace, XeroNamespace, CustomNamespace, ResourceCollection } from './FpaClient';

// ─── Realtime ────────────────────────────────────────────────────────────────
export { RealtimeChannel } from './realtime/RealtimeChannel';
export type { RealtimeChannelConfig } from './realtime/RealtimeChannel';

// ─── Types ───────────────────────────────────────────────────────────────────
export type {
  AuthConfig,
  CellEditPayload,
  ConnectionState,
  ConnectionStateListener,
  ConnectorId,
  ConnectorOptions,
  FpaClientConfig,
  RealtimeEvent,
  RealtimeEventHandler,
  SdkError,
  SdkResult,
  SdkVersion,
} from './types';

// ─── Constants ───────────────────────────────────────────────────────────────
export {
  DEFAULT_BASE_URL,
  DEFAULT_REALTIME_PATH,
  DEFAULT_RETRY_COUNT,
  DEFAULT_TIMEOUT_MS,
  SDK_VERSION,
} from './types';
