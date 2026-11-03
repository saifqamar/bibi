import Link from "next/link";
import type { PublicSeries } from "@/lib/api";
import { seriesPath } from "@/lib/slug";
import { AiBadge } from "./AiBadge";

export function SeriesCard({ series }: { series: PublicSeries }) {
  return (
    <Link
      href={seriesPath(series)}
      className="group flex w-44 shrink-0 flex-col gap-2 rounded-xl focus-visible:outline-2 focus-visible:outline-primary"
    >
      <div className="aspect-square overflow-hidden rounded-xl bg-border">
        {series.cover_url ? (
          // Covers are signed API URLs; Next's image optimiser would cache them past expiry.
          <img
            src={series.cover_url}
            alt=""
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : null}
      </div>
      <span className="line-clamp-2 font-semibold">{series.title}</span>
      <AiBadge />
    </Link>
  );
}
