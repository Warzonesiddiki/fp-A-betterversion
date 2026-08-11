/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_NIM_API_KEY_1: string;
  readonly VITE_NIM_API_KEY_2: string;
  readonly VITE_NIM_BASE_URL: string;
  readonly VITE_CONTROL_PLANE_URL: string;
  readonly VITE_ENABLE_CONTROL_PLANE: string;
  readonly VITE_BETA_WEB: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
