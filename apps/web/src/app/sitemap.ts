import type { MetadataRoute } from "next";
import { getSitemap } from "@/lib/api";
import { SITE_URL } from "@/lib/config";
import { seriesPath } from "@/lib/slug";

export const revalidate = 300;

/** Only published series; an unpublished one drops out at the next revalidation. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getSitemap().catch(() => []);
  return [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    ...entries.map((entry) => ({
      url: `${SITE_URL}${seriesPath({ id: entry.id, title: entry.title })}`,
      lastModified: entry.updated_at ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
