export { RestApiClient } from './RestApiClient';
export type {
  RestApiClientOptions,
  AuthConfig,
  OAuth2Config,
  ApiKeyConfig,
  BasicAuthConfig,
  BearerAuthConfig,
  ApiResponse,
  RequestOptions,
  OAuth2Tokens,
  RestApiEvent,
  RestApiEventListener,
} from './types';
export { ApiError } from './types';

// PATCH 9 — REST_API_CLIENT v0.3 (Hephaestus, 2026-06-16)
// GHOST-SHA detection (NEVER-AGAIN RULE #53)
export { GhostShaValidator, GHOST_SHA_VALIDATOR_CONSTANTS } from './GhostShaValidator';
export type {
  GhostShaClassification,
  GhostShaValidationResult,
  GhostShaScanOptions,
  GhostShaScanResult,
  GhostShaBulkValidationResult,
} from './GhostShaValidator';
