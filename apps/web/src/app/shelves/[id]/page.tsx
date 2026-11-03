import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeriesCard } from "@/components/SeriesCard";
import { getShelf } from "@/lib/api";

export const revalidate = 300;

/** None at build time: each page is rendered on first request, then cached for `revalidate`. */
export async function generateStaticParams() {
  return [];
}

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const shelf = await getShelf((await params).id);
  if (!shelf) return { title: "Shelf not found", robots: { index: false } };
  return {
    title: shelf.title,
    description: `${shelf.title}: audio stories on Bibi.`,
    alternates: { canonical: `/shelves/${shelf.id}` },
  };
}

export default async function ShelfPage({ params }: Props) {
  const shelf = await getShelf((await params).id);
  if (!shelf) notFound();
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">{shelf.title}</h1>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-6">
        {shelf.series.map((series) => (
          <SeriesCard key={series.id} series={series} />
        ))}
      </div>
    </section>
  );
}
