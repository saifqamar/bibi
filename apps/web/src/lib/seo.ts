import type { PublicSeriesDetail } from "./api";
import { SITE_URL } from "./config";
import { isoDuration } from "./format";
import { seriesPath } from "./slug";

/** schema.org structured data for a series page. */
export function seriesJsonLd({ series, episodes }: PublicSeriesDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "PodcastSeries",
    name: series.title,
    description: series.premise,
    url: `${SITE_URL}${seriesPath(series)}`,
    inLanguage: series.language,
    keywords: series.themes.join(", "),
    ...(series.cover_url ? { image: series.cover_url } : {}),
    ...(series.published_at ? { datePublished: series.published_at } : {}),
    creativeWorkStatus: "Published",
    // Disclosed in structured data too, not only on the page.
    abstract: "Written with AI assistance and shaped by a human writer.",
    hasPart: episodes.map((episode) => ({
      "@type": "PodcastEpisode",
      episodeNumber: episode.number,
      name: episode.title,
      timeRequired: isoDuration(episode.duration_seconds),
    })),
  };
}
