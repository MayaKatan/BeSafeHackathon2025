/// <reference types="vite/client" />

interface ImportMetaEnv {
  VITE_SERVER_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
