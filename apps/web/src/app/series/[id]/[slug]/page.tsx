import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { AiBadge } from "@/components/AiBadge";
import { AppHandoff } from "@/components/AppHandoff";
import { SamplePlayer } from "@/components/SamplePlayer";
import { getSeries } from "@/lib/api";
import { formatCount, formatDuration } from "@/lib/format";
import { seriesJsonLd } from "@/lib/seo";
import { seriesPath, slugify } from "@/lib/slug";

export const revalidate = 300;

/** None at build time: each page is rendered on first request, then cached for `revalidate`. */
export async function generateStaticParams() {
  return [];
}

interface Props {
  params: Promise<{ id: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const detail = await getSeries(id);
  if (!detail) return { title: "Series not found", robots: { index: false } };
  const { series } = detail;
  const description =
    series.premise.slice(0, 200) || `${series.title}, an audio drama on Bibi.`;
  const images = series.cover_url
    ? [{ url: series.cover_url, alt: series.title }]
    : [];
  return {
    title: series.title,
    description,
    alternates: { canonical: seriesPath(series) },
    openGraph: {
      type: "music.playlist",
      title: series.title,
      description,
      url: seriesPath(series),
      images,
    },
    twitter: {
      card: images.length ? "summary_large_image" : "summary",
      title: series.title,
      description,
      images,
    },
  };
}

export default async function SeriesPage({ params }: Props) {
  const { id, slug } = await params;
  const detail = await getSeries(id);
  if (!detail) notFound();
  const { series, episodes, has_sample } = detail;
  if (slug !== slugify(series.title)) permanentRedirect(seriesPath(series));

  return (
    <article className="flex flex-col gap-8">
      <script
        type="application/ld+json"
        // JSON.stringify output with "<" escaped is safe inside a script tag.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(seriesJsonLd(detail)).replace(/</g, "\\u003c"),
        }}
      />
      <header className="flex flex-col gap-6 sm:flex-row">
        <div className="aspect-square w-full max-w-64 shrink-0 overflow-hidden rounded-2xl bg-border">
          {series.cover_url ? (
            <img
              src={series.cover_url}
              alt={`Cover of ${series.title}`}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold tracking-tight">{series.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <AiBadge />
            <span>{series.language.toUpperCase()}</span>
            <span aria-hidden>·</span>
            <span>{formatCount(series.play_count)} plays</span>
            <span aria-hidden>·</span>
            <span>
              {episodes.length} {episodes.length === 1 ? "episode" : "episodes"}
            </span>
          </div>
          {series.themes.length > 0 && (
            <ul aria-label="Themes" className="flex flex-wrap gap-2">
              {series.themes.map((theme) => (
                <li
                  key={theme}
                  className="rounded-full border border-border px-2.5 py-0.5 text-xs"
                >
                  {theme}
                </li>
              ))}
            </ul>
          )}
          <p className="max-w-2xl text-lg leading-relaxed">{series.premise}</p>
          <div className="flex flex-col gap-3">
            {has_sample && <SamplePlayer seriesId={series.id} />}
            <AppHandoff seriesId={series.id} />
          </div>
        </div>
      </header>
      <section aria-labelledby="episodes" className="flex flex-col gap-3">
        <h2 id="episodes" className="text-2xl font-semibold">
          Episodes
        </h2>
        <ol className="divide-y divide-border rounded-xl border border-border">
          {episodes.map((episode) => (
            <li
              key={episode.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <span>
                <span className="text-muted">{episode.number}.</span>{" "}
                {episode.title}
              </span>
              <span className="shrink-0 text-sm text-muted">
                {formatDuration(episode.duration_seconds)}
                {episode.is_free ? " · Free" : ""}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
