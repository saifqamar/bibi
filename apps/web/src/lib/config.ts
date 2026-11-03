/** Server-side base URL of the Bibi API (never sent to the browser). */
export const API_URL = process.env.BIBI_API_URL ?? "http://localhost:8000";
/** Public URL of this website, for canonical links, the sitemap and Open Graph. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001"
).replace(/\/$/, "");
export const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL ?? "";
export const PLAY_STORE_URL = process.env.NEXT_PUBLIC_PLAY_STORE_URL ?? "";
/** Pages are regenerated at most this often; unpublished series disappear within it. */
export const REVALIDATE_SECONDS = 300;
