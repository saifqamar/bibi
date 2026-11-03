import { notFound, permanentRedirect } from "next/navigation";
import { getSeries } from "@/lib/api";
import { seriesPath } from "@/lib/slug";

/** `/series/{id}` (e.g. shared from the app) redirects to the canonical URL with the slug. */
export default async function SeriesById({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getSeries(id);
  if (!detail) notFound();
  permanentRedirect(seriesPath(detail.series));
}
