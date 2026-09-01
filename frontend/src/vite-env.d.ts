/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION?: string;
  readonly VITE_API_ORIGIN?: string;
  readonly VITE_MSW?: string;
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.png" {
  const src: string;
  export default src;
}
