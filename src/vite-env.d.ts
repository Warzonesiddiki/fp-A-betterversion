/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_NIM_API_KEY_1: string;
  readonly VITE_NIM_API_KEY_2: string;
  readonly VITE_NIM_BASE_URL: string;
  readonly VITE_CONTROL_PLANE_URL: string;
  readonly VITE_ENABLE_CONTROL_PLANE: string;
  /** W0.9 LLM egress kill switch — outbound model traffic is blocked unless "true" at build. */
  readonly VITE_LLM_EGRESS_ENABLED: string;
  /** W0.9 comma-separated endpoint host allowlist (denylist wins). */
  readonly VITE_LLM_EGRESS_ALLOWED_HOSTS: string;
  /** W0.9 comma-separated endpoint host denylist, overrides the allowlist. */
  readonly VITE_LLM_EGRESS_DENIED_HOSTS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
