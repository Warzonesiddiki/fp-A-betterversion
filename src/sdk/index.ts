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

// ─── Errors ──────────────────────────────────────────────────────────────────
export { ApiNotConfiguredError } from './types';

// ─── Constants ───────────────────────────────────────────────────────────────
// NOTE (W6-P0-13 api-origin-truth): no DEFAULT_BASE_URL is exported — the REST
// origin resolves from VITE_API_URL and unset environments fail fast with
// ApiNotConfiguredError instead of defaulting to a host.
export {
  DEFAULT_REALTIME_PATH,
  DEFAULT_RETRY_COUNT,
  DEFAULT_TIMEOUT_MS,
  SDK_VERSION,
} from './types';
