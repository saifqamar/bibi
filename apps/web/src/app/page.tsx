import Link from "next/link";
import { SeriesCard } from "@/components/SeriesCard";
import { getShelves } from "@/lib/api";

export const revalidate = 300;

export default async function Home() {
  const shelves = await getShelves().catch(() => []);
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold tracking-tight">
          Stories worth staying up for
        </h1>
        <p className="max-w-2xl text-lg text-muted">
          Bibi is an app for serialised audio stories and dramas. Listen to a
          sample here, then carry on in the app — at home, on the road, or
          offline.
        </p>
      </section>
      {shelves.length === 0 ? (
        <p className="text-muted">New stories are on their way.</p>
      ) : (
        shelves.map((shelf) => (
          <section
            key={shelf.id}
            aria-labelledby={`shelf-${shelf.id}`}
            className="flex flex-col gap-3"
          >
            <div className="flex items-baseline justify-between">
              <h2 id={`shelf-${shelf.id}`} className="text-2xl font-semibold">
                {shelf.title}
              </h2>
              <Link
                href={`/shelves/${shelf.id}`}
                className="text-sm text-primary"
              >
                See all
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {shelf.series.map((series) => (
                <SeriesCard key={series.id} series={series} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
