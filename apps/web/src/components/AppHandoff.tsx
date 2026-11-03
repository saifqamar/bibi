import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/config";

/** Opens the series in the app if it is installed; store links otherwise. */
export function AppHandoff({ seriesId }: { seriesId: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href={`bibi://series/${seriesId}`}
        className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-semibold text-primary-foreground"
      >
        Listen in the app
      </a>
      {APP_STORE_URL && (
        <a
          href={APP_STORE_URL}
          className="min-h-11 content-center text-sm underline"
        >
          App Store
        </a>
      )}
      {PLAY_STORE_URL && (
        <a
          href={PLAY_STORE_URL}
          className="min-h-11 content-center text-sm underline"
        >
          Google Play
        </a>
      )}
    </div>
  );
}
